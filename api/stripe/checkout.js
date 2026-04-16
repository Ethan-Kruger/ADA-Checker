const stripe   = require('../_lib/stripe');
const supabase = require('../_lib/supabase');
const { requireAuth }  = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');

const PRICE_IDS = {
  pro:        process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: 'Unauthorized' });
  }

  const { plan } = req.body || {};
  const priceId  = PRICE_IDS[plan];
  if (!priceId) {
    return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "enterprise"' });
  }

  // Look up or create a Stripe customer for this user
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', payload.sub)
    .single();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', payload.sub)
      .single();

    const customer = await stripe.customers.create({
      email:    user.email,
      metadata: { user_id: payload.sub },
    });
    customerId = customer.id;

    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', payload.sub);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings.html?upgrade=success`,
      cancel_url:  `${appUrl}/pricing.html`,
      metadata:    { user_id: payload.sub, plan },
      subscription_data: {
        metadata: { user_id: payload.sub, plan },
      },
    });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }

  return res.status(200).json({ url: session.url });
};
