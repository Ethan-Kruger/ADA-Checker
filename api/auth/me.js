const supabase = require('../_lib/supabase');
const { requireAuth } = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');

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

  return res.status(200).json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    plan:               sub?.plan               || 'free',
    status:             sub?.status             || 'active',
    current_period_end: sub?.current_period_end || null,
  });
};
