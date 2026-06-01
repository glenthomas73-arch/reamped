// ReAmped Reverb API Aggregation Worker
const axios = require('axios');
const { Pool } = require('pg');
const { scoreListings } = require('../services/scorer');
const { normalizeCondition, normalizeCategory } = require('../utils/normalizers');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const REVERB_API = 'https://api.reverb.com/api';

const CATEGORIES = [
    { slug: 'electric-guitars', name: 'guitar' },
    { slug: 'effects-and-pedals', name: 'pedal' },
    { slug: 'guitar-amplifiers', name: 'amp' },
    { slug: 'bass-guitars', name: 'bass' },
    { slug: 'keyboards-and-synths', name: 'keys' },
    { slug: 'drums-and-percussion', name: 'drum' },
    { slug: 'recording-equipment', name: 'recording' },
    { slug: 'acoustic-guitars', name: 'acoustic-guitar' },
  ];

async function fetchPage(categorySlug, page = 1) {
    const { data } = await axios.get(`${REVERB_API}/listings`, {
          params: { category: categorySlug, condition: 'all', per_page: 50, page, sort: 'published_at|desc' },
          headers: {
                  'Authorization': `Bearer ${process.env.REVERB_API_TOKEN}`,
                  'Accept': 'application/hal+json',
                  'Accept-Version': '3.0',
                },
          timeout: 15000,
        });
    return data;
  }

function normalize(listing, categoryName) {
    return {
          external_id: String(listing.id),
          platform: 'reverb',
          title: listing.title,
          price: parseFloat(listing.price?.amount || 0),
          currency: listing.price?.currency || 'USD',
          condition: normalizeCondition(listing.condition?.display_name),
          category: categoryName,
          brand: listing.make || null,
          model: listing.model || null,
          location_city: listing.shipping?.local?.region_name || null,
          location_country: listing.shipping?.local?.country_code || 'US',
          shipping_available: listing.shipping?.shippable || false,
          shipping_cost: listing.shipping?.rates?.[0]?.rate?.amount ? parseFloat(listing.shipping.rates[0].rate.amount) : null,
          listing_url: listing._links?.web?.href || null,
          affiliate_url: listing._links?.web?.href ? `${listing._links.web.href}?utm_source=reamped` : null,
          image_urls: listing.photos?.slice(0, 5).map(p => p.full) || [],
          seller_name: listing.seller?.name || null,
          seller_rating: listing.seller?.positive_feedback_percent ? listing.seller.positive_feedback_percent / 100 : null,
          seller_reviews: listing.seller?.feedback_count || 0,
          listed_at: listing.published_at || null,
        };
  }

async function upsert(listings) {
    for (const l of listings) {
          await db.query(`
                               INSERT INTO listings (external_id, platform, title, price, currency, condition, category,
                                                             brand, model, location_city, location_country, shipping_available, shipping_cost,
                                                             listing_url, affiliate_url, image_urls, seller_name, seller_rating, seller_reviews, listed_at)
                               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                               ON CONFLICT (platform, external_id) DO UPDATE SET price=$4, updated_at=NOW(), is_active=TRUE
                             `, [l.external_id, l.platform, l.title, l.price, l.currency, l.condition, l.category,
                                         l.brand, l.model, l.location_city, l.location_country, l.shipping_available, l.shipping_cost,
                                         l.listing_url, l.affiliate_url, JSON.stringify(l.image_urls), l.seller_name, l.seller_rating,
                                         l.seller_reviews, l.listed_at]);
        }
  }

async function runReverbFetcher() {
    logger.info('Starting Reverb fetch cycle...');
    let total = 0;
    for (const cat of CATEGORIES) {
          try {
                  for (let page = 1; page <= 3; page++) {
                            const data = await fetchPage(cat.slug, page);
                            const listings = (data.listings || []).map(l => normalize(l, cat.name));
                            if (!listings.length) break;
                            await upsert(listings);
                            await scoreListings('reverb', listings.map(l => l.external_id));
                            total += listings.length;
                            logger.info(`Reverb [${cat.name}] p${page}: ${listings.length} listings`);
                            if (!data._links?.next) break;
                            await new Promise(r => setTimeout(r, 1000));
                          }
                } catch (err) { logger.error(`Reverb [${cat.slug}] error: ${err.message}`); }
          await new Promise(r => setTimeout(r, 2000));
        }
    await db.query(`UPDATE listings SET is_active=FALSE WHERE platform='reverb' AND updated_at < NOW()-INTERVAL '24 hours'`);
    logger.info(`Reverb complete. Total: ${total}`);
    return total;
  }

module.exports = { runReverbFetcher };
