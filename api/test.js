module.exports = async function handler(req, res) {
  try {
    const stripe = require('./_lib/stripe');
    const supabase = require('./_lib/supabase');
    return res.status(200).json({ ok: true, stripeLoaded: !!stripe, supabaseLoaded: !!supabase });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};
