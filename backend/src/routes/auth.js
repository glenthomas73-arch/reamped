// ReAmped Auth Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const db = req.app.locals.db;
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
          const hash = await bcrypt.hash(password, 12);
          const { rows } = await db.query(
                  'INSERT INTO users (email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, tier',
                  [email.toLowerCase(), hash, displayName || null]
                );
          const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.status(201).json({ user: rows[0], token });
    } catch (err) {
          if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
          res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    const db = req.app.locals.db;
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
          const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
          if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
          const valid = await bcrypt.compare(password, rows[0].password_hash);
          if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
          const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.json({ user: { id: rows[0].id, email: rows[0].email, tier: rows[0].tier }, token });
    } catch { res.status(500).json({ error: 'Login failed' }); }
});

module.exports = router;
