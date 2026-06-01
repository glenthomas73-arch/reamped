// ReAmped Auth Middleware
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
          const { userId } = jwt.verify(token, process.env.JWT_SECRET);
          const { rows } = await db.query('SELECT id, email, tier FROM users WHERE id=$1', [userId]);
          if (!rows.length) return res.status(401).json({ error: 'User not found' });
          req.user = rows[0];
          next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const optionalAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    try {
          const { userId } = jwt.verify(token, process.env.JWT_SECRET);
          const { rows } = await db.query('SELECT id, email, tier FROM users WHERE id=$1', [userId]);
          if (rows.length) req.user = rows[0];
    } catch {}
    next();
};

const requirePro = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.tier !== 'pro') return res.status(403).json({ error: 'Pro subscription required' });
    next();
};

module.exports = { authenticate, optionalAuth, requirePro };
