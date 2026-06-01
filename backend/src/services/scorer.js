const { Pool } = require('pg');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Condition quality scores (0-100)
const CONDITION_SCORES = {
    mint: 100,
    excellent: 82,
    good: 62,
    fair: 38,
    poor: 18,
    new: 100,
};

/**
 * Calculate a value score (0-100) for listings.
 *
 * Weights:
 *   40% - Price competitiveness vs comparable listings
 *   25% - Item condition
 *   20% - Seller trust (rating + review count)
 *   10% - Listing freshness (recency)
 *    5% - Shipping score (free/cheap = better)
 */
async function scoreListings(platform, externalIds) {
    if (!externalIds || !externalIds.length) return;

  // Fetch the listings to score
  const { rows: listings } = await db.query(
        `SELECT id, brand, model, condition, price, shipping_cost,
                    seller_rating, seller_reviews, listed_at, fetched_at
                         FROM listings
                              WHERE platform = $1 AND external_id = ANY($2::text[])`,
        [platform, externalIds]
      );

  for (const listing of listings) {
        try {
                const score = await calculateScore(listing);
                await db.query(
                          `UPDATE listings
                                   SET value_score = $1,
                                                price_score = $2,
                                                             condition_score = $3,
                                                                          trust_score = $4,
                                                                                       updated_at = NOW()
                                                                                                WHERE id = $5`,
                          [score.total, score.price, score.condition, score.trust, listing.id]
                        );
        } catch (err) {
                logger.error(`Scoring error for listing ${listing.id}:`, err.message);
        }
  }
}

async function calculateScore(listing) {
    // 1. CONDITION SCORE (25% weight)
  const conditionScore = CONDITION_SCORES[listing.condition] || 50;

  // 2. PRICE SCORE (40% weight)
  // Compare against similar listings (same brand+model+condition) from last 90 days
  const priceScore = await getPriceScore(listing);

  // 3. TRUST SCORE (20% weight)
  const trustScore = calculateTrustScore(listing.seller_rating, listing.seller_reviews);

  // 4. FRESHNESS SCORE (10% weight)
  const freshnessScore = calculateFreshnessScore(listing.listed_at || listing.fetched_at);

  // 5. SHIPPING SCORE (5% weight)
  const shippingScore = calculateShippingScore(listing.shipping_cost);

  // Weighted total
  const total = (
        priceScore * 0.40 +
        conditionScore * 0.25 +
        trustScore * 0.20 +
        freshnessScore * 0.10 +
        shippingScore * 0.05
      );

  return {
        total: Math.round(Math.min(100, Math.max(0, total)) * 100) / 100,
        price: Math.round(priceScore * 100) / 100,
        condition: conditionScore,
        trust: Math.round(trustScore * 100) / 100,
  };
}

/**
 * Compare listing price against historical comparable prices.
 * Returns 0-100 (100 = cheapest in the market, 0 = most expensive)
 */
async function getPriceScore(listing) {
    if (!listing.brand || !listing.model) {
          return 50; // Default if no brand/model to compare
    }

  const { rows } = await db.query(
        `SELECT price FROM listings
             WHERE brand ILIKE $1
                    AND model ILIKE $2
                           AND condition = $3
                                  AND is_active = TRUE
                                         AND fetched_at > NOW() - INTERVAL '90 days'
                                                AND id != $4
                                                     LIMIT 100`,
        [listing.brand, listing.model, listing.condition, listing.id]
      );

  if (rows.length < 3) {
        return 55; // Not enough data for comparison, assume slightly above average
  }

  const prices = rows.map(r => parseFloat(r.price)).sort((a, b) => a - b);
    const thisPrice = parseFloat(listing.price);

  // Find percentile rank (lower price = higher score)
  const rank = prices.filter(p => p >= thisPrice).length;
    const percentile = (rank / prices.length) * 100;

  return Math.min(100, Math.max(0, percentile));
}

/**
 * Trust score based on seller rating and number of reviews
 */
function calculateTrustScore(rating, reviewCount) {
    if (!rating) return 50;

  // Base score from rating (0-1 scale -> 0-100)
  const ratingScore = rating * 100;

  // Confidence modifier based on review count
  // With few reviews, regress toward 60 (neutral)
  const confidence = Math.min(1, reviewCount / 25);
    const adjusted = (ratingScore * confidence) + (60 * (1 - confidence));

  return Math.min(100, Math.max(0, adjusted));
}

/**
 * Freshness score - newer listings score higher (less likely to be sold)
 */
function calculateFreshnessScore(listedAt) {
    if (!listedAt) return 50;

  const ageMs = Date.now() - new Date(listedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours < 1) return 100;
    if (ageHours < 6) return 92;
    if (ageHours < 24) return 80;
    if (ageHours < 72) return 65;
    if (ageHours < 168) return 50; // 1 week
  if (ageHours < 720) return 35; // 1 month
  return 15;
}

/**
 * Shipping score - free/cheap shipping is better
 */
function calculateShippingScore(shippingCost) {
    if (shippingCost === null || shippingCost === undefined) return 50;
    if (shippingCost === 0) return 100;
    if (shippingCost <= 10) return 80;
    if (shippingCost <= 25) return 60;
    if (shippingCost <= 50) return 40;
    return 20;
}

module.exports = { scoreListings, calculateScore };
