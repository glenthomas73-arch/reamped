const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/search
 *
 * Query params:
 *   q          - search query (string)
 *   category   - gear category
 *   brand      - brand filter
 *   condition  - condition filter (mint/excellent/good/fair/poor)
 *   min_price  - minimum price
 *   max_price  - maximum price
 *   platforms  - comma-separated list (reverb,ebay,guitarcenter)
 *   sort       - value_score|price_asc|price_desc|newest (default: value_score)
 *   page       - page number (default: 1)
 *   limit      - results per page (default: 24, max: 48)
 */
router.get('/', optionalAuth, async (req, res) => {
    const db = req.app.locals.db;

             try {
                   const {
                           q = '',
                           category,
                           brand,
                           condition,
                           min_price,
                           max_price,
                           platforms,
                           sort = 'value_score',
                           page = 1,
                           limit = 24,
                   } = req.query;

      const pageNum = Math.max(1, parseInt(page) || 1);
                   const limitNum = Math.min(48, Math.max(1, parseInt(limit) || 24));
                   const offset = (pageNum - 1) * limitNum;

      // Build WHERE clauses
      const conditions = ['is_active = TRUE'];
                   const params = [];
                   let paramIdx = 1;

      // Full-text search
      if (q && q.trim()) {
              conditions.push(
                        `to_tsvector('english', title || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model, ''))
                                 @@ plainto_tsquery('english', $${paramIdx})`
                      );
              params.push(q.trim());
              paramIdx++;
      }

      if (category) {
              conditions.push(`category = $${paramIdx}`);
              params.push(category.toLowerCase());
              paramIdx++;
      }

      if (brand) {
              conditions.push(`brand ILIKE $${paramIdx}`);
              params.push(`%${brand}%`);
              paramIdx++;
      }

      if (condition) {
              const validConditions = ['mint', 'excellent', 'good', 'fair', 'poor', 'new'];
              const condList = condition.split(',').filter(c => validConditions.includes(c));
              if (condList.length) {
                        conditions.push(`condition = ANY($${paramIdx}::text[])`);
                        params.push(condList);
                        paramIdx++;
              }
      }

      if (min_price) {
              conditions.push(`price >= $${paramIdx}`);
              params.push(parseFloat(min_price));
              paramIdx++;
      }

      if (max_price) {
              conditions.push(`price <= $${paramIdx}`);
              params.push(parseFloat(max_price));
              paramIdx++;
      }

      if (platforms) {
              const validPlatforms = ['reverb', 'ebay', 'guitarcenter', 'sweetwater'];
              const platList = platforms.split(',').filter(p => validPlatforms.includes(p));
              if (platList.length) {
                        conditions.push(`platform = ANY($${paramIdx}::text[])`);
                        params.push(platList);
                        paramIdx++;
              }
      }

      // Sort order
      const sortMap = {
              value_score: 'value_score DESC NULLS LAST',
              price_asc: 'price ASC',
              price_desc: 'price DESC',
              newest: 'listed_at DESC NULLS LAST',
      };
                   const orderBy = sortMap[sort] || sortMap.value_score;

      const whereClause = conditions.join(' AND ');

      // Main query
      const query = `
            SELECT
                    id, platform, title, price, currency, condition, category,
                            brand, model, location_city, location_country,
                                    shipping_available, shipping_cost,
                                            affiliate_url, listing_url,
                                                    image_urls, seller_name, seller_rating, seller_reviews,
                                                            value_score, price_score, condition_score, trust_score,
                                                                    listed_at, fetched_at
                                                                          FROM listings
                                                                                WHERE ${whereClause}
                                                                                      ORDER BY ${orderBy}
                                                                                            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
                                                                                                `;

      params.push(limitNum, offset);

      // Count query for pagination
      const countQuery = `SELECT COUNT(*) FROM listings WHERE ${whereClause}`;
                   const countParams = params.slice(0, -2);

      const [results, countResult] = await Promise.all([
              db.query(query, params),
              db.query(countQuery, countParams),
            ]);

      const total = parseInt(countResult.rows[0].count);
                   const totalPages = Math.ceil(total / limitNum);

      res.json({
              data: results.rows,
              pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        totalPages,
                        hasNext: pageNum < totalPages,
                        hasPrev: pageNum > 1,
              },
              query: { q, category, brand, condition, min_price, max_price, platforms, sort },
      });

             } catch (err) {
                   console.error('Search error:', err);
                   res.status(500).json({ error: 'Search failed', message: err.message });
             }
});

/**
 * GET /api/search/suggestions
 * Autocomplete suggestions for brands/models
 */
router.get('/suggestions', async (req, res) => {
    const db = req.app.locals.db;
    const { q = '', category } = req.query;

             if (!q || q.length < 2) {
                   return res.json({ brands: [], models: [] });
             }

             try {
                   const brandQuery = db.query(
                           `SELECT DISTINCT brand, COUNT(*) as count
                                  FROM listings
                                         WHERE brand ILIKE $1 AND is_active = TRUE
                                                ${category ? 'AND category = $2' : ''}
                                                       GROUP BY brand
                                                              ORDER BY count DESC
                                                                     LIMIT 8`,
                           category ? [`${q}%`, category] : [`${q}%`]
                         );

      const modelQuery = db.query(
              `SELECT DISTINCT model, brand, COUNT(*) as count
                     FROM listings
                            WHERE model ILIKE $1 AND is_active = TRUE
                                   ${category ? 'AND category = $2' : ''}
                                          GROUP BY model, brand
                                                 ORDER BY count DESC
                                                        LIMIT 8`,
              category ? [`${q}%`, category] : [`${q}%`]
            );

      const [brands, models] = await Promise.all([brandQuery, modelQuery]);

      res.json({
              brands: brands.rows.map(r => ({ brand: r.brand, count: parseInt(r.count) })),
              models: models.rows.map(r => ({ model: r.model, brand: r.brand, count: parseInt(r.count) })),
      });
             } catch (err) {
                   res.status(500).json({ error: 'Suggestions failed' });
             }
});

/**
 * GET /api/search/listing/:id
 * Single listing detail + affiliate click tracking
 */
router.get('/listing/:id', optionalAuth, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

             try {
                   const { rows } = await db.query(
                           'SELECT * FROM listings WHERE id = $1 AND is_active = TRUE',
                           [id]
                         );

      if (!rows.length) {
              return res.status(404).json({ error: 'Listing not found' });
      }

      // Track affiliate click
      await db.query(
              `INSERT INTO affiliate_clicks (user_id, listing_id, platform, session_id)
                     VALUES ($1, $2, $3, $4)`,
              [req.user?.id || null, id, rows[0].platform, req.headers['x-session-id'] || null]
            );

      res.json(rows[0]);
             } catch (err) {
                   res.status(500).json({ error: 'Failed to fetch listing' });
             }
});

module.exports = router;
