const { applyHeaders } = require('../_lib/cors');
const { buildClearCookie } = require('../_lib/auth');

module.exports = function handler(req, res) {
  applyHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Set-Cookie', buildClearCookie());
  return res.status(200).json({ ok: true });
};
