const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

// Extracts and verifies the Bearer token from an Authorization header.
// Returns the decoded payload or throws if invalid/missing.
function requireAuth(req) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }
  return verifyToken(token);
}

module.exports = { signToken, verifyToken, requireAuth };
