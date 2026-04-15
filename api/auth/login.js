const bcrypt   = require('bcryptjs');
const supabase = require('../_lib/supabase');
const { signToken } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email.toLowerCase())
    .single();

  // Use a generic error to avoid confirming whether the email exists
  const invalid = () => res.status(401).json({ error: 'Invalid email or password' });

  if (error || !user) return invalid();

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return invalid();

  // Fetch the user's plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const plan = sub?.plan || 'free';

  const token = signToken({ sub: user.id, email: user.email });

  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email },
    plan,
  });
};
