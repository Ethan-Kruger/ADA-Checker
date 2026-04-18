const supabase    = require('../_lib/supabase');
const stripe      = require('../_lib/stripe');
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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', payload.sub)
    .single();

  if (!sub?.stripe_customer_id) {
    return res.status(200).json({ invoices: [] });
  }

  const list = await stripe.invoices.list({
    customer: sub.stripe_customer_id,
    limit: 24,
  });

  const invoices = list.data.map(function (inv) {
    return {
      id:       inv.id,
      date:     inv.created,
      amount:   inv.amount_paid,
      currency: inv.currency,
      status:   inv.status,
      pdf:      inv.invoice_pdf,
    };
  });

  return res.status(200).json({ invoices });
};
