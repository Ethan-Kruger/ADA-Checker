// Directly queries Stripe for the user's active subscription and syncs to Supabase.
// Called by the client after a successful checkout — no webhook dependency.
const stripe   = require('../_lib/stripe');
const supabase = require('../_lib/supabase');
const { requireAuth }  = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');

function planFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)        return 'pro';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'enterprise';
  return null;
}

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get the user's Stripe customer ID from Supabase
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, plan')
    .eq('user_id', payload.sub)
    .single();

  if (!sub?.stripe_customer_id) {
    // No customer on file — plan hasn't changed
    return res.status(200).json({ plan: sub?.plan || 'free' });
  }

  // Query Stripe directly for active subscriptions on this customer
  let subscriptions;
  try {
    subscriptions = await stripe.subscriptions.list({
      customer: sub.stripe_customer_id,
      status:   'active',
      limit:    5,
    });
  } catch (err) {
    console.error('Stripe list subscriptions error:', err.message);
    return res.status(500).json({ error: 'Failed to query Stripe' });
  }

  if (!subscriptions.data.length) {
    return res.status(200).json({ plan: 'free' });
  }

  // Find highest plan across all active subscriptions
  let resolvedPlan = 'free';
  for (const s of subscriptions.data) {
    const priceId = s.items?.data?.[0]?.price?.id;
    const p = planFromPriceId(priceId);
    if (p === 'enterprise') { resolvedPlan = 'enterprise'; break; }
    if (p === 'pro')          resolvedPlan = 'pro';
  }

  // Sync the resolved plan back to Supabase so future /api/auth/me calls are correct
  if (resolvedPlan !== 'free') {
    const activeSub = subscriptions.data[0];
    await supabase
      .from('subscriptions')
      .update({
        plan:                   resolvedPlan,
        status:                 'active',
        stripe_subscription_id: activeSub.id,
        current_period_end:     new Date(activeSub.current_period_end * 1000).toISOString(),
      })
      .eq('user_id', payload.sub);
  }

  return res.status(200).json({ plan: resolvedPlan });
};
