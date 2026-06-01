// ReAmped Subscription Routes (Stripe)
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticate } = require('../middleware/auth');

// POST /api/subscriptions/create-checkout
router.post('/create-checkout', authenticate, async (req, res) => {
  const db = req.app.locals.db;
    try {
        let customerId = req.user.stripe_customer_id;
            if (!customerId) {
                  const customer = await stripe.customers.create({ email: req.user.email, metadata: { userId: req.user.id } });
                        customerId = customer.id;
                              await db.query('UPDATE users SET stripe_customer_id=$1 WHERE id=$2', [customerId, req.user.id]);
                                  }
                                      const session = await stripe.checkout.sessions.create({
                                            customer: customerId,
                                                  mode: 'subscription',
                                                        payment_method_types: ['card'],
                                                              line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
                                                                    success_url: `${process.env.APP_URL}/pricing?success=true`,
                                                                          cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
                                                                              });
                                                                                  res.json({ url: session.url });
                                                                                    } catch (err) { res.status(500).json({ error: err.message }); }
                                                                                    });

                                                                                    // POST /api/subscriptions/webhook (Stripe webhook)
                                                                                    router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
                                                                                      const db = req.app.locals.db;
                                                                                        const sig = req.headers['stripe-signature'];
                                                                                          try {
                                                                                              const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
                                                                                                  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
                                                                                                        const sub = event.data.object;
                                                                                                              const status = sub.status === 'active' ? 'pro' : 'free';
                                                                                                                    await db.query(
                                                                                                                            'UPDATE users SET tier=$1, stripe_subscription_id=$2, subscription_ends_at=$3 WHERE stripe_customer_id=$4',
                                                                                                                                    [status, sub.id, new Date(sub.current_period_end * 1000), sub.customer]
                                                                                                                                          );
                                                                                                                                              }
                                                                                                                                                  if (event.type === 'customer.subscription.deleted') {
                                                                                                                                                        const sub = event.data.object;
                                                                                                                                                              await db.query('UPDATE users SET tier=$1 WHERE stripe_customer_id=$2', ['free', sub.customer]);
                                                                                                                                                                  }
                                                                                                                                                                      res.json({ received: true });
                                                                                                                                                                        } catch (err) { res.status(400).send(`Webhook Error: ${err.message}`); }
                                                                                                                                                                        });
                                                                                                                                                                        
                                                                                                                                                                        module.exports = router;
