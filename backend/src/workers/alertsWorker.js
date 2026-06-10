// ReAmped Price Alerts Worker
// Runs on a schedule (every 30 min). Checks all active Pro user alerts against
// newly-ingested listings and sends email notifications for matches.
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Email transport ─────────────────────────────────────────────────────────
// Supports SMTP (production) or Ethereal (dev/test when SMTP_HOST is unset)
async function getTransport() {
    if (process.env.SMTP_HOST) {
          return nodemailer.createTransport({
                  host: process.env.SMTP_HOST,
                  port: parseInt(process.env.SMTP_PORT || '587'),
                  secure: process.env.SMTP_SECURE === 'true',
                  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });
    }
    // Fallback: Ethereal test account (logs preview URL)
  const testAccount = await nodemailer.createTestAccount();
    logger.warn('SMTP_HOST not set — using Ethereal test account for email');
    return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
    });
}

// ─── Match a listing against an alert ────────────────────────────────────────
function matchesAlert(listing, alert) {
    // Price check
  if (alert.max_price && parseFloat(listing.price) > parseFloat(alert.max_price)) return false;

  // Condition check (ordered: mint > excellent > good > fair > poor)
  const ORDER = { mint: 5, excellent: 4, good: 3, fair: 2, poor: 1, new: 5 };
    if (alert.condition_min) {
          const listingRank = ORDER[listing.condition] || 0;
          const minRank = ORDER[alert.condition_min] || 0;
          if (listingRank < minRank) return false;
    }

  // Platform check
  if (alert.platforms && alert.platforms.length > 0) {
        if (!alert.platforms.includes(listing.platform)) return false;
  }

  // Keyword / brand / model check
  const haystack = `${listing.title} ${listing.brand || ''} ${listing.model || ''}`.toLowerCase();
    if (alert.search_query && !haystack.includes(alert.search_query.toLowerCase())) return false;
    if (alert.brand && !(listing.brand || '').toLowerCase().includes(alert.brand.toLowerCase())) return false;
    if (alert.model && !haystack.includes(alert.model.toLowerCase())) return false;

  return true;
}

// ─── Build alert email ────────────────────────────────────────────────────────
function buildEmail(user, alert, matches) {
    const appUrl = process.env.APP_URL || 'https://reamped.app';
    const itemLines = matches.slice(0, 5).map(l => {
          const score = l.value_score ? ` · Score ${l.value_score}/100` : '';
          const ship = l.shipping_cost === 0 ? ' · Free shipping' : l.shipping_cost ? ` · +$${l.shipping_cost} shipping` : '';
          return `  • ${l.title} — $${l.price}${score}${ship}\n    ${l.affiliate_url || l.listing_url}`;
    }).join('\n\n');

  const moreText = matches.length > 5 ? `\n\n...and ${matches.length - 5} more results.` : '';
    const subject = `ReAmped Alert: ${matches.length} new deal${matches.length > 1 ? 's' : ''} for "${alert.search_query || alert.brand || alert.model}"`;

  const text = `Hi ${user.display_name || 'there'},\n\nWe found ${matches.length} new listing${matches.length > 1 ? 's' : ''} matching your alert:\n\n${itemLines}${moreText}\n\nSearch all matches:\n${appUrl}/search?q=${encodeURIComponent(alert.search_query || '')}&max_price=${alert.max_price || ''}\n\n— ReAmped\n\nManage your alerts: ${appUrl}/alerts\nUnsubscribe: ${appUrl}/alerts`;

  return { subject, text };
}

// ─── Main worker ──────────────────────────────────────────────────────────────
async function runAlertsWorker() {
    logger.info('Starting price alerts worker...');
    let transport;
    try {
          transport = await getTransport();
    } catch (err) {
          logger.error(`Alerts worker: failed to create email transport: ${err.message}`);
          return;
    }

  // Fetch all active alerts for Pro users
  const { rows: alerts } = await db.query(`
      SELECT pa.*, u.email, u.display_name
          FROM price_alerts pa
              JOIN users u ON u.id = pa.user_id
                  WHERE pa.is_active = TRUE
                        AND u.tier = 'pro'
                              AND (u.subscription_ends_at IS NULL OR u.subscription_ends_at > NOW())
                                `);

  if (!alerts.length) {
        logger.info('Alerts worker: no active alerts found');
        return;
  }

  logger.info(`Alerts worker: checking ${alerts.length} alerts`);
    let notificationsSent = 0;

  for (const alert of alerts) {
        try {
                // Find listings added/updated since the alert was last triggered (or in last 30 min)
          const since = alert.last_triggered || new Date(Date.now() - 30 * 60 * 1000);

          // Build dynamic query based on alert criteria
          const params = [since];
                let whereExtra = '';
                let idx = 2;

          if (alert.platforms && alert.platforms.length > 0) {
                    whereExtra += ` AND platform = ANY($${idx}::text[])`;
                    params.push(alert.platforms);
                    idx++;
          }
                if (alert.max_price) {
                          whereExtra += ` AND price <= $${idx}`;
                          params.push(parseFloat(alert.max_price));
                          idx++;
                }
                if (alert.search_query) {
                          whereExtra += ` AND to_tsvector('english', title || ' ' || COALESCE(brand,'') || ' ' || COALESCE(model,'')) @@ plainto_tsquery('english', $${idx})`;
                          params.push(alert.search_query);
                          idx++;
                }

          const { rows: candidates } = await db.query(
                    `SELECT * FROM listings
                             WHERE is_active = TRUE
                                        AND fetched_at >= $1
                                                   ${whereExtra}
                                                            ORDER BY value_score DESC NULLS LAST
                                                                     LIMIT 100`,
                    params
                  );

          // Apply full match filter (condition, brand, model)
          const matches = candidates.filter(l => matchesAlert(l, alert));

          if (!matches.length) continue;

          // Send notification email
          const { subject, text } = buildEmail({ email: alert.email, display_name: alert.display_name }, alert, matches);
                const info = await transport.sendMail({
                          from: `ReAmped <${process.env.EMAIL_FROM || 'alerts@reamped.app'}>`,
                          to: alert.email,
                          subject,
                          text,
                });

          if (nodemailer.getTestMessageUrl(info)) {
                    logger.info(`Alerts worker: test email preview: ${nodemailer.getTestMessageUrl(info)}`);
          }

          // Update last_triggered
          await db.query('UPDATE price_alerts SET last_triggered=NOW() WHERE id=$1', [alert.id]);
                notificationsSent++;
                logger.info(`Alerts worker: sent alert to ${alert.email} (${matches.length} matches for alert ${alert.id})`);

        } catch (err) {
                logger.error(`Alerts worker: error processing alert ${alert.id}: ${err.message}`);
        }
  }

  logger.info(`Alerts worker complete. Notifications sent: ${notificationsSent}`);
}

module.exports = { runAlertsWorker };
