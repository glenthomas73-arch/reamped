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
  { id: '33036', name: 'amp' },    { id: '38071', name: 'pedal' },
  { id: '16220', name: 'keys' },   { id: '12061', name: 'drum' },
  ];

// Token cache — reuse until 5 min before expiry
let _tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
    const now = Date.now();
    if (_tokenCache.token && now < _tokenCache.expiresAt) return _tokenCache.token;
    const creds = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
    const { data } = await axios.post(
          `${EBAY_BASE}/identity/v1/oauth2/token`,
          'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      { headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
        );
    _tokenCache = { token: data.access_token, expiresAt: now + (data.expires_in - 300) * 1000 };
    logger.info(`eBay OAuth token acquired (${process.env.EBAY_ENV || 'sandbox'})`);
    return data.access_token;
}

async function fetchCategory(token, catId, offset = 0) {
    const { data } = await axios.get(`${EBAY_BASE}/buy/browse/v1/item_summary/search`, {
          params: {
                  category_ids: catId,
                  filter: 'conditionIds:{1000|1500|2500|3000|4000|5000|6000}',
                  sort: 'newlyListed',
                  limit: 50,
                  offset,
          },
          headers: {
                  Authorization: `Bearer ${token}`,
                  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                  Accept: 'application/json',
          },
          timeout: 15000,
    });
    return data;
}

/** Best-effort brand extraction from title when eBay doesn't provide it */
function extractBrand(title) {
    if (!title) return null;
    const known = ['Fender','Gibson','Marshall','Boss','Electro-Harmonix','MXR','TC Electronic',
                       'Roland','Korg','Yamaha','Taylor','Martin','PRS','Ibanez','Epiphone','Squier','Orange',
                       'Vox','Line 6','Strymon','Eventide','Walrus Audio','JHS','Earthquaker'];
    const t = title.toLowerCase();
    for (const b of known) { if (t.includes(b.toLowerCase())) return b; }
    return null;
}

function normalize(item, catName) {
    const price = item.price ? parseFloat(item.price.value) : null;
    const rawShipping = item.shippingOptions?.[0]?.shippingCost?.value;
    const isFreeShipping = item.shippingOptions?.[0]?.shippingCostType === 'FREE';
    const shipping = isFreeShipping ? 0 : (rawShipping ? parseFloat(rawShipping) : null);
    const baseUrl = item.itemWebUrl || null;
    const campaignId = process.env.EBAY_CAMPAIGN_ID || '';
    const affiliateUrl = baseUrl
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&toolid=10001&customid=reamped`
          : null;
    return {
          external_id: item.itemId,
          platform: 'ebay',
          title: item.title,
          price,
          currency: item.price?.currency || 'USD',
          condition: normalizeCondition(item.conditionId),
          category: catName,
          brand: item.brand || extractBrand(item.title),
          model: null,
          location_city: item.itemLocation?.city || null,
          location_country: item.itemLocation?.country || 'US',
          shipping_available: true,
          shipping_cost: shipping,
          listing_url: baseUrl,
          affiliate_url: affiliateUrl,
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
                                                    ON CONFLICT (platform, external_id) DO UPDATE SET
                                                             price=$4, shipping_cost=$12, affiliate_url=$14, image_urls=$15,
                                                                      seller_rating=$17, seller_reviews=$18, updated_at=NOW(), is_active=TRUE`,
                  [l.external_id, l.platform, l.title, l.price, l.currency, l.condition, l.category,
                          l.brand, l.location_city, l.location_country, l.shipping_available, l.shipping_cost,
                          l.listing_url, l.affiliate_url, JSON.stringify(l.image_urls),
                          l.seller_name, l.seller_rating, l.seller_reviews, l.listed_at]
                );
    }
}

async function runEbayFetcher() {
    logger.info(`Starting eBay fetch cycle... (${process.env.EBAY_ENV || 'sandbox'})`);
    let token;
    try {
          token = await getToken();
    } catch (err) {
          logger.error(`eBay auth failed: ${err.message}`);
          return 0;
    }

  let total = 0;
    for (const cat of CATEGORIES) {
          try {
                  for (let page = 0; page < 2; page++) {
                            const data = await fetchCategory(token, cat.id, page * 50);
                            const items = data.itemSummaries || [];
                            if (!items.length) break;
                            const listings = items.map(item => normalize(item, cat.name));
                            await upsert(listings);
                            await scoreListings('ebay', listings.map(l => l.external_id));
                            total += listings.length;
                            logger.info(`eBay [${cat.name}] page ${page + 1}: ${listings.length} listings`);
                            if (!data.next) break;
                            await new Promise(r => setTimeout(r, 1500));
                  }
          } catch (err) {
                  logger.error(`eBay [${cat.name}] error: ${err.message}`);
          }
          await new Promise(r => setTimeout(r, 2000));
    }

  await db.query(`UPDATE listings SET is_active=FALSE WHERE platform='ebay' AND updated_at < NOW()-INTERVAL '24 hours'`);
    logger.info(`eBay fetch complete. Total upserted: ${total}`);
    return total;
}

module.exports = { runEbayFetcher };
