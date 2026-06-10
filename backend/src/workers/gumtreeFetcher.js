// ReAmped Gumtree UK Fetcher (Phase 3)
const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
const { scoreListings } = require('../services/scorer');
const { cleanText, parsePrice } = require('../utils/normalizers');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const GT_BASE = 'https://www.gumtree.com';

const LOCATIONS = [
  { id: 'london', name: 'London' }, { id: 'manchester', name: 'Manchester' },
  { id: 'birmingham', name: 'Birmingham' }, { id: 'glasgow', name: 'Glasgow' },
  { id: 'leeds', name: 'Leeds' }, { id: 'edinburgh', name: 'Edinburgh' },
  { id: 'liverpool', name: 'Liverpool' }, { id: 'bristol', name: 'Bristol' },
];

const CATEGORIES = [
  { slug: 'guitars-basses', category: 'guitar' },
  { slug: 'amplifiers', category: 'amp' },
  { slug: 'effects-pedals', category: 'pedal' },
  { slug: 'keyboards-pianos', category: 'keys' },
  { slug: 'drums-percussion', category: 'drum' },
  { slug: 'acoustic-guitars', category: 'acoustic-guitar' },
  { slug: 'studio-recording-gear', category: 'recording' },
];

async function fetchPage(locationId, slug, page = 1) {
  const { data } = await axios.get(`${GT_BASE}/for-sale/${slug}/${locationId}/page${page}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReAmped/1.0)', Accept: 'text/html', 'Accept-Language': 'en-GB' },
    timeout: 20000,
  });
  return data;
}

function parseListings(html, catName, locName) {
  const $ = cheerio.load(html);
  const out = [];
  $('article.listing-maxi, article[data-q="search-result"]').each((_, el) => {
    try {
      const $e = $(el);
      const href = $e.find('a[href*="/for-sale/"]').first().attr('href') || '';
      const m = href.match(/\/(\d+)$/);
      if (!m) return;
      const title = cleanText($e.find('[data-q="tile-title"], .listing-title, h2').first().text());
      if (!title) return;
      const price = parsePrice($e.find('[data-q="tile-price"], .listing-price').first().text());
      const ct = $e.find('.listing-attribute, [data-q="tile-attribute"]').filter((_, a) => /condition|used|new/i.test($(a).text())).first().text().toLowerCase();
      let cond = 'good';
      if (/^new/i.test(ct)) cond = 'new';
      else if (/like new|excellent/i.test(ct)) cond = 'excellent';
      else if (/fair|poor/i.test(ct)) cond = 'fair';
      const url = href.startsWith('http') ? href : `${GT_BASE}${href}`;
      const img = $e.find('img[src*="gumtreeimages"]').first().attr('src') || null;
      out.push({ external_id: m[1], platform: 'gumtree', title, price, currency: 'GBP', condition: cond,
        category: catName, brand: null, model: null, location_city: locName, location_country: 'GB',
        shipping_available: false, shipping_cost: null, listing_url: url, affiliate_url: url,
        image_urls: img ? [img] : [], seller_name: null, seller_rating: null, seller_reviews: null, listed_at: null });
    } catch (_) {}
  });
  return out;
}

function hasNext(html) {
  const $ = cheerio.load(html);
  return $('[data-q="pagination-next"], a[rel="next"]').length > 0;
}

async function upsert(listings) {
  for (const l of listings) {
    if (!l) continue;
    await db.query(
      `INSERT INTO listings (external_id,platform,title,price,currency,condition,category,brand,model,
         location_city,location_country,shipping_available,shipping_cost,listing_url,affiliate_url,
         image_urls,seller_name,seller_rating,seller_reviews,listed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (platform,external_id) DO UPDATE SET price=$4,condition=$6,image_urls=$16,updated_at=NOW(),is_active=TRUE`,
      [l.external_id,l.platform,l.title,l.price,l.currency,l.condition,l.category,l.brand,l.model,
       l.location_city,l.location_country,l.shipping_available,l.shipping_cost,l.listing_url,l.affiliate_url,
       JSON.stringify(l.image_urls),l.seller_name,l.seller_rating,l.seller_reviews,l.listed_at]
    );
  }
}

async function runGumtreeFetcher() {
  logger.info('Starting Gumtree UK fetch cycle...');
  let total = 0;
  for (const loc of LOCATIONS) {
    for (const { slug, category } of CATEGORIES) {
      try {
        for (let page = 1; page <= 3; page++) {
          const html = await fetchPage(loc.id, slug, page);
          const listings = parseListings(html, category, loc.name);
          if (!listings.length) break;
          await upsert(listings);
          await scoreListings('gumtree', listings.map(l => l.external_id));
          total += listings.length;
          logger.info(`Gumtree [${category}/${loc.id}] p${page}: ${listings.length}`);
          if (!hasNext(html)) break;
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (err) { logger.error(`Gumtree [${category}/${loc.id}] error: ${err.message}`); }
      await new Promise(r => setTimeout(r, 5000));
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  await db.query(`UPDATE listings SET is_active=FALSE WHERE platform='gumtree' AND updated_at < NOW()-INTERVAL '72 hours'`);
  logger.info(`Gumtree complete. Total: ${total}`);
  return total;
}

module.exports = { runGumtreeFetcher };
