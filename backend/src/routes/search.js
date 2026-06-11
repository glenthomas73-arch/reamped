const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');

// ── Inline value scoring ──────────────────────────────────────────────────────
// Attaches value_grade and price_delta_pct to listings that have enough data.
// We do this in-request for listings that don't yet have a stored value_score.

const CONDITION_SCORES = {
    mint: 100, excellent: 82, good: 62, fair: 38, poor: 18, new: 100,
};

const GRADE_THRESHOLDS = [
    { grade: 'A', min: 80 },
    { grade: 'B', min: 65 },
    { grade: 'C', min: 45 },
    { grade: 'D', min: 25 },
    { grade: 'F', min: 0 },
];

function scoreToGrade(score) {
    for (const { grade, min } of GRADE_THRESHOLDS) {
        if (score >= min) return grade;
    }
    return 'F';
}

/**
 * Enrich result rows with value_grade and price_delta_pct.
 * Uses stored value_score when available; otherwise falls back to condition-only grade.
 * For price_delta_pct, calculates against avg_market_price when present.
 */
async function enrichListings(db, rows) {
    if (!rows.length) return rows;

    // Collect IDs needing avg price lookup (where price_delta_pct is null)
    const needsPriceLookup = rows.filter(r => r.price_delta_pct == null && r.price != null && r.brand && r.model);

    // Batch: for each unique brand+model combo, fetch avg market price
    const priceLookupMap = {};
    if (needsPriceLookup.length) {
        const combos = [...new Map(needsPriceLookup.map(r => [
            `${r.brand}|${r.model}`, { brand: r.brand, model: r.model }
        ])).values()];

        await Promise.all(combos.map(async ({ brand, model }) => {
            try {
                const { rows: priceRows } = await db.query(
                    `SELECT AVG(price) as avg_price, COUNT(*) as cnt
                     FROM listings
                     WHERE brand ILIKE $1 AND model ILIKE $2
                       AND is_active = TRUE
                       AND fetched_at > NOW() - INTERVAL '90 days'
                     LIMIT 1`,
                    [brand, model]
                );
                if (priceRows[0]?.cnt >= 3) {
                    priceLookupMap[`${brand}|${model}`] = parseFloat(priceRows[0].avg_price);
                }
            } catch {
                // ignore price lookup errors
            }
        }));
    }

    return rows.map(r => {
        // value_grade: use stored score or compute from condition
        let valueGrade = r.value_grade;
        let priceDeltaPct = r.price_delta_pct != null ? parseFloat(r.price_delta_pct) : null;
        let avgPrice = r.avg_price != null ? parseFloat(r.avg_price) : null;

        if (!valueGrade) {
            // Compute inline score
            const condScore = CONDITION_SCORES[r.condition] || 50;
            let score = condScore;

            // Boost/penalise by price vs market avg
            const key = `${r.brand}|${r.model}`;
            if (priceLookupMap[key] && r.price) {
                avgPrice = priceLookupMap[key];
                priceDeltaPct = ((parseFloat(r.price) - avgPrice) / avgPrice) * 100;
                // Price score: 0–100, lower price is better
                const pricePct = Math.min(100, Math.max(0, ((avgPrice - parseFloat(r.price)) / avgPrice) * 100 + 50));
                score = condScore * 0.40 + pricePct * 0.60;
            }

            valueGrade = scoreToGrade(score);
        }

        return {
            ...r,
            value_grade: valueGrade,
            price_delta_pct: priceDeltaPct != null ? Math.round(priceDeltaPct * 10) / 10 : null,
            avg_price: avgPrice,
        };
    });
}

/**
 * GET /api/search
 *
 * Query params:
 *   q           - search query (string)
 *   category    - gear category
 *   brand       - brand filter
 *   condition   - condition filter (mint/excellent/good/fair/poor)
 *   min_price   - minimum price
 *   max_price   - maximum price
 *   platforms   - comma-separated list (reverb,ebay,guitarcenter,sweetwater,facebook,gumtree)
 *   sort        - value_score|price_asc|price_desc|newest (default: value_score)
 *   page        - page number (default: 1)
 *   limit       - results per page (default: 24, max: 48)
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
                            page,
                            limit,
                            // ── new search-filter params ──
                            min_year,
                            max_year,
                            finish,
                            country_of_manufacture,
                            location_country,
                            handedness,
                            num_strings,
                            shipping_only,
                            value_grade: grade_filter,
                            min_seller_rating,
                            currency: currency_filter,
                        } = req.query;

                    const pageNum = Math.max(1, parseInt(page, 10) || 1);
                    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 24));
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

        // Year range
        if (min_year) {
            conditions.push(`(year_min IS NULL OR year_min >= $${paramIdx++})`);
            params.push(parseInt(min_year));
        }
        if (max_year) {
            conditions.push(`(year_max IS NULL OR year_max <= $${paramIdx++})`);
            params.push(parseInt(max_year));
        }

        // Finish / colour
        if (finish) {
            conditions.push(`finish ILIKE $${paramIdx++}`);
            params.push(`%${finish}%`);
        }

        // Country of manufacture
        if (country_of_manufacture) {
            conditions.push(`country_of_manufacture ILIKE $${paramIdx++}`);
            params.push(`%${country_of_manufacture}%`);
        }

        // Seller location country
        if (location_country) {
            conditions.push(`location_country ILIKE $${paramIdx++}`);
            params.push(`%${location_country}%`);
        }

        // Handedness
        if (handedness && ['right','left','ambidextrous'].includes(handedness)) {
            conditions.push(`(handedness = $${paramIdx++} OR handedness IS NULL)`);
            params.push(handedness);
        }

        // Number of strings
        if (num_strings) {
            conditions.push(`num_strings = $${paramIdx++}`);
            params.push(parseInt(num_strings));
        }

        // Shipping only
        if (shipping_only === 'true') {
            conditions.push('shipping_available = TRUE');
        }

        // Value grade filter
        if (grade_filter) {
            const validGrades = ['A','B','C','D','F'];
            const gradeList = grade_filter.split(',').filter(g => validGrades.includes(g));
            if (gradeList.length) {
                conditions.push(`value_grade = ANY($${paramIdx++}::text[])`);
                params.push(gradeList);
            }
        }

        // Minimum seller rating
        if (min_seller_rating) {
            conditions.push(`seller_rating >= $${paramIdx++}`);
            params.push(parseFloat(min_seller_rating));
        }

        // Currency filter
        if (currency_filter) {
            conditions.push(`currency = $${paramIdx++}`);
            params.push(currency_filter.toUpperCase());
        }

            }

            if (platforms) {
                // Pro platforms (facebook, gumtree) require auth
                const validPlatforms = ['reverb', 'ebay', 'guitarcenter', 'sweetwater', 'facebook', 'gumtree'];
                const proPlatforms = ['facebook', 'gumtree'];
                let platList = platforms.split(',').filter(p => validPlatforms.includes(p));

                // Gate pro platforms behind Pro subscription
                if (!req.user?.isPro) {
                    platList = platList.filter(p => !proPlatforms.includes(p));
                }

                if (platList.length) {
                    conditions.push(`platform = ANY($${paramIdx}::text[])`);
                    params.push(platList);
                    paramIdx++;
                }
            } else if (!req.user?.isPro) {
                // Default: exclude pro platforms for non-pro users
                conditions.push(`platform NOT IN ('facebook', 'gumtree')`);
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
                        value_grade, price_delta_pct, avg_price,
                        year_min, year_max, finish, country_of_manufacture,
                    handedness, num_strings, features,
                    listed_at, fetched_at
                FROM listings
                WHERE ${whereClause}
                ORDER BY ${orderBy}
                LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
            `;
            params.push(limitNum, offset);

            // Count query
            const countQuery = `SELECT COUNT(*) FROM listings WHERE ${whereClause}`;
            const countParams = params.slice(0, -2);

            const [results, countResult] = await Promise.all([
                db.query(query, params),
                db.query(countQuery, countParams),
            ]);

            const total = parseInt(countResult.rows[0].count, 10);
            const totalPages = Math.ceil(total / limitNum);

            // Enrich with value grades
            const enriched = await enrichListings(db, results.rows);

                    res.json({
                            listings: enriched,
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

            // Enrich with value grade
            const [enriched] = await enrichListings(db, rows);

                    res.json(enriched);
                } catch (err) {
                    res.status(500).json({ error: 'Failed to fetch listing' });
            }
});

/**
 * GET /api/search/:platform/:id
 * Listing by platform + external_id (used by frontend ListingPage route)
 */
router.get('/:platform/:id', optionalAuth, async (req, res) => {
    const db = req.app.locals.db;
    const { platform, id } = req.params;

    try {
        const { rows } = await db.query(
            'SELECT * FROM listings WHERE platform = $1 AND external_id = $2 AND is_active = TRUE',
            [platform, id]
        );

        if (!rows.length) {
            // Fallback: try numeric id
            const fallback = await db.query(
                'SELECT * FROM listings WHERE id = $1 AND is_active = TRUE',
                [id]
            );
            if (!fallback.rows.length) {
                return res.status(404).json({ error: 'Listing not found' });
            }

            // Track and return fallback
            await db.query(
                `INSERT INTO affiliate_clicks (user_id, listing_id, platform, session_id)
                 VALUES ($1, $2, $3, $4)`,
                [req.user?.id || null, fallback.rows[0].id, fallback.rows[0].platform, req.headers['x-session-id'] || null]
            );

            const [enriched] = await enrichListings(db, fallback.rows);
            return res.json(enriched);
        }

        // Track affiliate click
        await db.query(
            `INSERT INTO affiliate_clicks (user_id, listing_id, platform, session_id)
             VALUES ($1, $2, $3, $4)`,
            [req.user?.id || null, rows[0].id, platform, req.headers['x-session-id'] || null]
        );

        const [enriched] = await enrichListings(db, rows);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch listing' });
    }
});

module.exports = router;
