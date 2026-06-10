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

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true }));

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/search',        require('./routes/search'));
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/alerts',        require('./routes/alerts'));
app.use('/api/watchlist',     require('./routes/watchlist'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
      try { await db.query('SELECT 1'); res.json({ status: 'ok', ts: new Date() }); }
      catch { res.status(503).json({ status: 'error' }); }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

app.listen(PORT, () => console.log(`ReAmped API running on port ${PORT}`));

// ─── Aggregation workers ──────────────────────────────────────────────────────
// Phase 1 — Reverb: every 20 min
cron.schedule('*/20 * * * *', async () => {
      try { await require('./workers/reverbFetcher').runReverbFetcher(); }
      catch (e) { console.error('Reverb worker error:', e.message); }
});

// Phase 1 — eBay: at :05, :30, :55 each hour
cron.schedule('5,30,55 * * * *', async () => {
      try { await require('./workers/ebayFetcher').runEbayFetcher(); }
      catch (e) { console.error('eBay worker error:', e.message); }
});

// Phase 2 — Guitar Center Used: every 60 min at :10
cron.schedule('10 * * * *', async () => {
      try { await require('./workers/gcUsedFetcher').runGcUsedFetcher(); }
      catch (e) { console.error('GC Used worker error:', e.message); }
});

// Phase 2 — Sweetwater Used: every 60 min at :35
cron.schedule('35 * * * *', async () => {
      try { await require('./workers/sweetwaterFetcher').runSweetwaterFetcher(); }
      catch (e) { console.error('Sweetwater worker error:', e.message); }
});

// Phase 2 — Price alerts: every 30 min
cron.schedule('*/30 * * * *', async () => {
      try { await require('./workers/alertsWorker').runAlertsWorker(); }
      catch (e) { console.error('Alerts worker error:', e.message); }
});

// Phase 3 — Facebook Marketplace: every 90 min (heavy rate-limit tolerance needed)
cron.schedule('0 */2 * * *', async () => {
      try { await require('./workers/fbMarketplaceFetcher').runFbMarketplaceFetcher(); }
      catch (e) { console.error('FB Marketplace worker error:', e.message); }
});

// Phase 3 — Gumtree UK: every 2 hours at :45 (HTML scraping, slow cadence)
cron.schedule('45 */2 * * *', async () => {
      try { await require('./workers/gumtreeFetcher').runGumtreeFetcher(); }
      catch (e) { console.error('Gumtree worker error:', e.message); }
});

module.exports = app;
