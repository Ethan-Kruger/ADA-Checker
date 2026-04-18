const bcrypt      = require('bcryptjs');
const supabase    = require('../_lib/supabase');
const { requireAuth } = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');
const { rateLimit }    = require('../_lib/rateLimit');

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 5 attempts per IP per 15 minutes
  const { limited } = await rateLimit(req, 'rl:change-password', 5, 15 * 60 * 1000);
  if (limited) {
    return res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
  }

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ error: 'New password must contain at least one uppercase letter' });
  }
  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'New password must contain at least one number' });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('id', payload.sub)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', user.id);

  if (updateErr) {
    console.error('change-password update error:', updateErr.message);
    return res.status(500).json({ error: 'Failed to update password' });
  }

  return res.status(200).json({ ok: true });
};
