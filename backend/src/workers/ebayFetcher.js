// ReAmped eBay Browse API Worker
const axios = require('axios');
const { Pool } = require('pg');
const { scoreListings } = require('../services/scorer');
const { normalizeCondition } = require('../utils/normalizers');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Toggle between sandbox and production via EBAY_ENV env var
const EBAY_BASE = process.env.EBAY_ENV === 'production'
  ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com';

const CATEGORIES = [
  { id: '33034', name: 'guitar' }, { id: '33035', name: 'bass' },
  { id: '33036', name: 'amp' }, { id: '38071', name: 'pedal' },
  { id: '16220', name: 'keys' }, { id: '12061', name: 'drum' },
  ];

async function getToken() {
    const creds = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
    const { data } = await axios.post(`${EBAY_BASE}/identity/v1/oauth2/token`,
                                          'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
                                      { headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
                                        );
    logger.info(`eBay token acquired (${process.env.EBAY_ENV || 'sandbox'} env)`);
    return data.access_token;
}

async function fetchCategory(token, catId, offset = 0) {
    const { data } = await axios.get(`${EBAY_BASE}/buy/browse/v1/item_summary/search`, {
          params: { category_ids: catId, filter: 'conditionIds:{1000|3000|4000|5000|6000}', sort: 'newlyListed', limit: 50, offset },
          headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', Accept: 'application/json' },
          timeout: 15000,
    });
    return data;
}

function normalize(item, catName) {
    const price = item.price ? parseFloat(item.price.value) : null;
    const shipping = item.shippingOptions?.[0]?.shippingCost?.value
      ? parseFloat(item.shippingOptions[0].shippingCost.value)
          : null;
    return {
          external_id: item.itemId,
          platform: 'ebay',
          title: item.title,
          price,
          currency: item.price?.currency || 'USD',
          condition: normalizeCondition(item.conditionId),
          category: catName,
          brand: item.brand || null,
          model: null,
          location_city: item.itemLocation?.city || null,
          location_country: item.itemLocation?.country || 'US',
          shipping_available: true,
          shipping_cost: shipping,
          listing_url: item.itemWebUrl || null,
          affiliate_url: item.itemWebUrl ? `${item.itemWebUrl}&utm_source=reamped` : null,
          image_urls: item.image ? [item.image.imageUrl] : [],
          seller_name: item.seller?.username || null,
          seller_rating: item.seller?.feedbackPercentage ? parseFloat(item.seller.feedbackPercentage) : null,
          seller_reviews: item.seller?.feedbackScore || null,
          listed_at: item.itemCreationDate || null,
    };
}

async function upsert(listings) {
    for (const l of listings) {
          await db.query(
                  `INSERT INTO listings (external_id, platform, title, price, currency, condition, category,
                          brand, location_city, location_country, shipping_available, shipping_cost,
                                  listing_url, affiliate_url, image_urls, seller_name, seller_rating, seller_reviews, listed_at)
                                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                                                ON CONFLICT (platform, external_id) DO UPDATE SET price=$4, updated_at=NOW(), is_active=TRUE`,
                  [l.external_id, l.platform, l.title, l.price, l.currency, l.condition, l.category,
                          l.brand, l.location_city, l.location_country, l.shipping_available, l.shipping_cost,
                          l.listing_url, l.affiliate_url, JSON.stringify(l.image_urls),
                          l.seller_name, l.seller_rating, l.seller_reviews, l.listed_at]
                );
    }
}

async function runEbayFetcher() {
    logger.info(`Starting eBay fetch cycle... (${process.env.EBAY_ENV || 'sandbox'})`);
    const token = await getToken();
    let total = 0;
    for (const cat of CATEGORIES) {
          try {
                  const data = await fetchCategory(token, cat.id);
                  const listings = (data.itemSummaries || []).map(item => normalize(item, cat.name));
                  if (listings.length) {
                            await upsert(listings);
                            await scoreListings('ebay', listings.map(l => l.external_id));
                            total += listings.length;
                  }
                  logger.info(`eBay [${cat.name}]: ${listings.length} listings`);
          } catch (err) {
                  logger.error(`eBay [${cat.name}] error: ${err.message}`);
          }
          await new Promise(r => setTimeout(r, 2000));
    }
    await db.query(`UPDATE listings SET is_active=FALSE WHERE platform='ebay' AND updated_at < NOW()-INTERVAL '24 hours'`);
    logger.info(`eBay complete. Total: ${total}`);
    return total;
}

runEbayFetcher();
module.exports = { runEbayFetcher };
