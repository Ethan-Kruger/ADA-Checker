const bcrypt      = require('bcryptjs');
const supabase    = require('../_lib/supabase');
const { signToken } = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');
const { rateLimit }    = require('../_lib/rateLimit');

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 5 signup attempts per IP per 10 minutes
  const { limited } = rateLimit(req, 5, 10 * 60 * 1000);
  if (limited) {
    return res.status(429).json({ error: 'Too many signup attempts. Please wait and try again.' });
  }

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
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one number' });
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase().trim(), password_hash })
    .select('id, email, created_at')
    .single();

  if (userErr) {
    console.error('signup user error:', userErr.message);
    return res.status(500).json({ error: 'Failed to create account' });
  }

  await supabase
    .from('subscriptions')
    .insert({ user_id: user.id, plan: 'free', status: 'active' });

  const token = signToken({ sub: user.id, email: user.email });

  return res.status(201).json({ token, user: { id: user.id, email: user.email }, plan: 'free' });
};
