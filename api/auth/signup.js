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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  // Create user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash })
    .select('id, email, created_at')
    .single();

  if (userErr) {
    console.error('signup user error', userErr);
    return res.status(500).json({ error: 'Failed to create account' });
  }

  // Create a free subscription row for the user
  await supabase
    .from('subscriptions')
    .insert({ user_id: user.id, plan: 'free', status: 'active' });

  const token = signToken({ sub: user.id, email: user.email });

  return res.status(201).json({ token, user: { id: user.id, email: user.email }, plan: 'free' });
};
