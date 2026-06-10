// ReAmped Subscription Routes (Stripe)
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticate } = require('../middleware/auth');

// ─── POST /api/subscriptions/create-checkout ─────────────────────────────────
// Creates a Stripe Checkout session for monthly or annual Pro subscription.
// Body: { plan: 'monthly' | 'annual' }
router.post('/create-checkout', authenticate, async (req, res) => {
    const db = req.app.locals.db;
    const plan = req.body.plan === 'annual' ? 'annual' : 'monthly';
    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
          : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

              if (!priceId) return res.status(500).json({ error: `Stripe price ID for ${plan} plan is not configured` });

              try {
                    let customerId = req.user.stripe_customer_id;
                    if (!customerId) {
                            const customer = await stripe.customers.create({
                                      email: req.user.email,
                                      metadata: { userId: req.user.id },
                            });
                            customerId = customer.id;
                            await db.query('UPDATE users SET stripe_customer_id=$1 WHERE id=$2', [customerId, req.user.id]);
                    }

      const session = await stripe.checkout.sessions.create({
              customer: customerId,
              mode: 'subscription',
              payment_method_types: ['card'],
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: `${process.env.APP_URL}/pricing?success=true&plan=${plan}`,
              cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
              metadata: { userId: req.user.id, plan },
      });

      res.json({ url: session.url });
              } catch (err) {
                    res.status(500).json({ error: err.message });
              }
});

// ─── POST /api/subscriptions/cancel ──────────────────────────────────────────
// Cancels the user's subscription at period end (does not revoke immediately).
router.post('/cancel', authenticate, async (req, res) => {
    const db = req.app.locals.db;
    try {
          const { rows } = await db.query('SELECT stripe_subscription_id FROM users WHERE id=$1', [req.user.id]);
          const subId = rows[0]?.stripe_subscription_id;
          if (!subId) return res.status(400).json({ error: 'No active subscription found' });

      const sub = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
          res.json({
                  message: 'Subscription will be cancelled at end of billing period',
                  cancel_at: new Date(sub.cancel_at * 1000).toISOString(),
          });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/subscriptions/status ───────────────────────────────────────────
// Returns the current user's subscription status.
router.get('/status', authenticate, async (req, res) => {
    const db = req.app.locals.db;
    try {
          const { rows } = await db.query(
                  'SELECT tier, stripe_subscription_id, subscription_ends_at FROM users WHERE id=$1',
                  [req.user.id]
                );
          const user = rows[0];
          if (!user) return res.status(404).json({ error: 'User not found' });

      let stripeDetails = null;
          if (user.stripe_subscription_id) {
                  try {
                            const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
                            stripeDetails = {
                                        status: sub.status,
                                        cancel_at_period_end: sub.cancel_at_period_end,
                                        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                                        plan: sub.items.data[0]?.price?.id === process.env.STRIPE_PRO_ANNUAL_PRICE_ID ? 'annual' : 'monthly',
                            };
                  } catch (_) { /* subscription may have been deleted */ }
          }

      res.json({ tier: user.tier, subscription_ends_at: user.subscription_ends_at, ...stripeDetails });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/subscriptions/webhook ─────────────────────────────────────────
// NOTE: This route receives raw body (configured in server.js before express.json()).
router.post('/webhook', async (req, res) => {
    const db = req.app.locals.db;
    const sig = req.headers['stripe-signature'];
    let event;

              try {
                    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
              } catch (err) {
                    return res.status(400).send(`Webhook Error: ${err.message}`);
              }

              try {
                    switch (event.type) {
                      case 'customer.subscription.created':
                      case 'customer.subscription.updated': {
                                const sub = event.data.object;
                                const tier = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free';
                                await db.query(
                                            `UPDATE users SET tier=$1, stripe_subscription_id=$2, subscription_ends_at=$3 WHERE stripe_customer_id=$4`,
                                            [tier, sub.id, new Date(sub.current_period_end * 1000), sub.customer]
                                          );
                                break;
                      }
                      case 'customer.subscription.deleted': {
                                const sub = event.data.object;
                                await db.query(
                                            `UPDATE users SET tier='free', stripe_subscription_id=NULL WHERE stripe_customer_id=$1`,
                                            [sub.customer]
                                          );
                                break;
                      }
                      case 'invoice.payment_failed': {
                                // Optionally send a dunning email — for now just log
                                const invoice = event.data.object;
                                console.warn(`Payment failed for customer ${invoice.customer}, invoice ${invoice.id}`);
                                break;
                      }
                      default:
                                // Unhandled event type — ignore
                        break;
                    }
                    res.json({ received: true });
              } catch (err) {
                    console.error('Webhook handler error:', err);
                    res.status(500).json({ error: 'Webhook handler error' });
              }
});

module.exports = router;
