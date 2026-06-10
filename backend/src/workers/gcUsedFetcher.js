// ReAmped Guitar Center Used Fetcher
// Guitar Center exposes a public search API used by their website.
// We query it category by category, normalize to the ReAmped schema, and upsert into listings.
const axios = require('axios');
const { Pool } = require('pg');
const { scoreListings } = require('../services/scorer');
const { normalizeCondition, cleanText, parsePrice } = require('../utils/normalizers');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// GC Used search endpoint (reverse-engineered from guitarcenter.com network traffic)
const GC_SEARCH_URL = 'https://www.guitarcenter.com/search/api/2.0/json';
const GC_AFFILIATE_TAG = process.env.GC_AFFILIATE_ID || '';

// Category search terms that GC's API responds well to
const CATEGORIES = [
  { query: 'used electric guitar',  name: 'guitar' },
  { query: 'used bass guitar',      name: 'bass' },
  { query: 'used guitar amplifier', name: 'amp' },
  { query: 'used effects pedal',    name: 'pedal' },
  { query: 'used keyboard synth',   name: 'keys' },
  { query: 'used drum kit',         name: 'drum' },
  { query: 'used acoustic guitar',  name: 'acoustic-guitar' },
  { query: 'used recording gear',   name: 'recording' },
  ];

async function fetchPage(query, page = 1) {
    const { data } = await axios.get(GC_SEARCH_URL, {
          params: {
                  q: query,
                  prefn1: 'condition',
                  prefv1: 'Used',
                  sz: 48,
                  start: (page - 1) * 48,
                  format: 'ajax',
          },
          headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; ReAmped/1.0; +https://reamped.app)',
                  Accept: 'application/json',
                  Referer: 'https://www.guitarcenter.com/Used/',
          },
          timeout: 20000,
    });
    return data;
}

function normalize(product, catName) {
    const id = product.id || product.productId || null;
    if (!id) return null;

  const title = cleanText(product.productName || product.name);
    const price = parsePrice(product.price?.sales?.value || product.price?.list?.value);
    const brand = product.brand?.name || product.brandName || null;
    const model = cleanText(product.name || null);

  // GC condition strings: "Excellent", "Good", "Fair", "Poor"
  const rawCondition = product.condition || product.usedCondition || 'good';
    const condition = normalizeCondition(rawCondition);

  const baseUrl = product.selectedProductUrl
      ? `https://www.guitarcenter.com${product.selectedProductUrl}`
        : `https://www.guitarcenter.com/search#q=${encodeURIComponent(title)}&prefn1=condition&prefv1=Used`;

  const affiliateUrl = GC_AFFILIATE_TAG
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}source=4WWRWXGP&utm_source=reamped&utm_medium=affiliate`
        : baseUrl;

  const images = [];
    if (product.images?.large) images.push(product.images.large);
    else if (product.image) images.push(typeof product.image === 'string' ? product.image : product.image.url);

  return {
        external_id: String(id),
        platform: 'guitarcenter',
        title,
        price,
        currency: 'USD',
        condition,
        category: catName,
        brand,
        model,
        location_city: null,
        location_country: 'US',
        shipping_available: true,
        shipping_cost: 0, // GC offers free shipping on used gear
        listing_url: baseUrl,
        affiliate_url: affiliateUrl,
        image_urls: images,
        seller_name: 'Guitar Center',
        seller_rating: 4.2,  // GC corporate seller, fixed trust score
        seller_reviews: null,
        listed_at: product.availability?.preOrderAvailability || null,
  };
}

async function upsert(listings) {
    for (const l of listings) {
          if (!l) continue;
          await db.query(
                  `INSERT INTO listings (external_id, platform, title, price, currency, condition, category,
                            brand, model, location_city, location_country, shipping_available, shipping_cost,
                                      listing_url, affiliate_url, image_urls, seller_name, seller_rating, seller_reviews, listed_at)
                                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                                                    ON CONFLICT (platform, external_id) DO UPDATE SET
                                                             price=$4, condition=$6, affiliate_url=$15, image_urls=$16,
                                                                      updated_at=NOW(), is_active=TRUE`,
                  [l.external_id, l.platform, l.title, l.price, l.currency, l.condition, l.category,
                          l.brand, l.model, l.location_city, l.location_country, l.shipping_available, l.shipping_cost,
                          l.listing_url, l.affiliate_url, JSON.stringify(l.image_urls),
                          l.seller_name, l.seller_rating, l.seller_reviews, l.listed_at]
                );
    }
}

async function runGcUsedFetcher() {
    logger.info('Starting Guitar Center Used fetch cycle...');
    let total = 0;

  for (const cat of CATEGORIES) {
        try {
                for (let page = 1; page <= 3; page++) {
                          const data = await fetchPage(cat.query, page);

                  // GC API wraps results under different keys depending on version
                  const products = data?.hits?.hits?.map(h => h._source)
                            || data?.products?.hits
                            || data?.productSearch?.products
                            || [];

                  if (!products.length) break;

                  const listings = products.map(p => normalize(p, cat.name)).filter(Boolean);
                          if (!listings.length) break;

                  await upsert(listings);
                          await scoreListings('guitarcenter', listings.map(l => l.external_id));
                          total += listings.length;
                          logger.info(`GC Used [${cat.name}] page ${page}: ${listings.length} listings`);

                  // Respect rate limiting — GC will 429 if hammered
                  await new Promise(r => setTimeout(r, 3000));
                }
        } catch (err) {
                logger.error(`GC Used [${cat.name}] error: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 4000));
  }

  await db.query(`UPDATE listings SET is_active=FALSE WHERE platform='guitarcenter' AND updated_at < NOW()-INTERVAL '48 hours'`);
    logger.info(`GC Used fetch complete. Total upserted: ${total}`);
    return total;
}

module.exports = { runGcUsedFetcher };
