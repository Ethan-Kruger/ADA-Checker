const stripe   = require('../_lib/stripe');
const supabase = require('../_lib/supabase');
const { requireAuth } = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');

function planFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)        return 'pro';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'enterprise';
  return null;
}

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: 'Unauthorized' });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('id', payload.sub)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let plan = sub?.plan || 'free';

  // If the user has a Stripe customer, verify the real plan directly from Stripe.
  // This makes the system self-healing — no webhook required.
  if (sub?.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: sub.stripe_customer_id,
        status:   'active',
        limit:    5,
      });

      if (subscriptions.data.length) {
        let stripePlan = 'free';
        for (const s of subscriptions.data) {
          const priceId = s.items?.data?.[0]?.price?.id;
          const p = planFromPriceId(priceId);
          if (p === 'enterprise') { stripePlan = 'enterprise'; break; }
          if (p === 'pro')          stripePlan = 'pro';
        }

        // If Stripe says something different from Supabase, fix Supabase
        if (stripePlan !== 'free' && stripePlan !== plan) {
          const activeSub = subscriptions.data[0];
          await supabase
            .from('subscriptions')
            .update({
              plan:                   stripePlan,
              status:                 'active',
              stripe_subscription_id: activeSub.id,
              current_period_end:     new Date(activeSub.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', user.id);
          plan = stripePlan;
        } else if (stripePlan !== 'free') {
          plan = stripePlan;
        }
      } else if (plan !== 'free') {
        // No active Stripe subscriptions but Supabase says paid — downgrade
        await supabase
          .from('subscriptions')
          .update({ plan: 'free', status: 'canceled' })
          .eq('user_id', user.id);
        plan = 'free';
      }
    } catch (err) {
      // Stripe unavailable — fall back to Supabase value
      console.error('Stripe lookup error in /api/auth/me:', err.message);
    }
  }

  return res.status(200).json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    plan,
    status:             sub?.status             || 'active',
    current_period_end: sub?.current_period_end || null,
  });
};
