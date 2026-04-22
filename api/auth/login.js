const bcrypt      = require('bcryptjs');
const supabase    = require('../_lib/supabase');
const { signToken, buildTokenCookie } = require('../_lib/auth');
const { applyHeaders } = require('../_lib/cors');
const { rateLimit, recordFailedLogin, isLockedOut, clearLockout } = require('../_lib/rateLimit');

module.exports = async function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 10 login attempts per IP per minute (distributed via KV)
  const { limited } = await rateLimit(req, 'rl:login', 10, 60 * 1000);
  if (limited) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait a minute and try again.' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single();

  // Generic error — don't confirm whether email exists
  const invalid = async () => res.status(401).json({ error: 'Invalid email or password' });

  if (error || !user) return invalid();

  // Check account lockout before attempting password compare
  const { locked, ttl } = await isLockedOut(user.id);
  if (locked) {
    const mins = Math.ceil(ttl / 60);
    return res.status(423).json({
      error: `Account temporarily locked due to too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
    });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    await recordFailedLogin(user.id);
    return invalid();
  }

  // Successful login — clear any lockout counter
  await clearLockout(user.id);

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const plan  = sub?.plan || 'free';
  const token = signToken({ sub: user.id, email: user.email });

  res.setHeader('Set-Cookie', buildTokenCookie(token));
  return res.status(200).json({
    user: { id: user.id, email: user.email },
    plan,
  });
};
