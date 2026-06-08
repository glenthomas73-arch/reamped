// ReAmped Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    app.locals.db = db;

    app.use(helmet());
    app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

    app.use('/api/search', require('./routes/search'));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/subscriptions', require('./routes/subscriptions'));
    app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/watchlist', require('./routes/watchlist'));

    app.get('/health', async (req, res) => {
      try { await db.query('SELECT 1'); res.json({ status: 'ok', ts: new Date() }); }
        catch { res.status(503).json({ status: 'error' }); }
        });

        app.use((req, res) => res.status(404).json({ error: 'Not found' }));
        app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

        app.listen(PORT, () => console.log(`ReAmped API running on port ${PORT}`));

        // Aggregation workers (scheduled)
        cron.schedule('*/20 * * * *', async () => {
          try { await require('./workers/reverbFetcher').runReverbFetcher(); } catch(e) { console.error('Reverb worker error:', e); }
          });
          cron.schedule('*/25 * * * *', async () => {
            try { await require('./workers/ebayFetcher').runEbayFetcher(); } catch(e) { console.error('eBay worker error:', e); }
            });

            module.exports = app;
