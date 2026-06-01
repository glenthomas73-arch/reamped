// ReAmped Price Alerts Routes (Pro feature)
const express = require('express');
const router = express.Router();
const { authenticate, requirePro } = require('../middleware/auth');

// GET /api/alerts — list user's alerts
router.get('/', authenticate, async (req, res) => {
    const db = req.app.locals.db;
    const { rows } = await db.query('SELECT * FROM price_alerts WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
});

// POST /api/alerts — create alert (Pro only)
router.post('/', authenticate, requirePro, async (req, res) => {
    const db = req.app.locals.db;
    const { search_query, brand, model, max_price, condition_min, platforms } = req.body;
    const { rows } = await db.query(
          'INSERT INTO price_alerts (user_id, search_query, brand, model, max_price, condition_min, platforms) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          [req.user.id, search_query, brand, model, max_price, condition_min, platforms || ['reverb','ebay']]
        );
    res.status(201).json(rows[0]);
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, async (req, res) => {
    const db = req.app.locals.db;
    await db.query('UPDATE price_alerts SET is_active=FALSE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
});

module.exports = router;
