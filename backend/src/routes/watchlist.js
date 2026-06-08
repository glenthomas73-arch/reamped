// ReAmped Watchlist Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET /api/watchlist — list user's saved listings
router.get('/', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { rows } = await db.query(
            `SELECT l.*, w.added_at
             FROM watchlist w
             JOIN listings l ON l.id = w.listing_id
             WHERE w.user_id = $1
             ORDER BY w.added_at DESC`,
        [req.user.id]
      );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/watchlist — add listing to watchlist
router.post('/', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  const { listing_id } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'listing_id required' });
  try {
    await db.query(
            'INSERT INTO watchlist (user_id, listing_id) VALUES ($1, $2) ON CONFLICT (user_id, listing_id) DO NOTHING',
        [req.user.id, listing_id]
      );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /api/watchlist/:id — remove listing from watchlist
router.delete('/:id', authenticate, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query(
            'DELETE FROM watchlist WHERE listing_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;
