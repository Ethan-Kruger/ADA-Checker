// TEMPORARY debug endpoint — remove after diagnosis
const stripe   = require('../_lib/stripe');
const supabase = require('../_lib/supabase');
const { requireAuth }  = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let payload;
  try { payload = requireAuth(req); }
  catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { data: user } = await supabase.from('users').select('id,email').eq('id', payload.sub).single();
  const { data: sub }  = await supabase.from('subscriptions').select('*').eq('user_id', payload.sub).single();

  // Search Stripe by customer ID first, then by email
  let customersByEmail = [], customerById = null, subscriptionsList = [];
  try {
    if (sub?.stripe_customer_id) {
      customerById = await stripe.customers.retrieve(sub.stripe_customer_id);
    }
    const byEmail = await stripe.customers.list({ email: user?.email, limit: 5 });
    customersByEmail = byEmail.data;

    const cid = sub?.stripe_customer_id || customersByEmail[0]?.id;
    if (cid) {
      const allSubs = await stripe.subscriptions.list({ customer: cid, limit: 10 });
      subscriptionsList = allSubs.data.map(s => ({
        id:      s.id,
        status:  s.status,
        price:   s.items?.data?.[0]?.price?.id,
        product: s.items?.data?.[0]?.price?.product,
      }));
    }
  } catch (e) {
    return res.status(200).json({ error: e.message, supabase_sub: sub });
  }

  return res.status(200).json({
    user_email:           user?.email,
    supabase_sub:         sub,
    stripe_customer_by_id: customerById ? { id: customerById.id, email: customerById.email } : null,
    stripe_customers_by_email: customersByEmail.map(c => ({ id: c.id, email: c.email })),
    stripe_subscriptions: subscriptionsList,
    env_pro_price_id:     process.env.STRIPE_PRO_PRICE_ID || 'NOT SET',
    env_ent_price_id:     process.env.STRIPE_ENTERPRISE_PRICE_ID || 'NOT SET',
  });
};
