const crypto = require('crypto');

function createEmailToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { raw, hash, expires };
}

function hashEmailToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { createEmailToken, hashEmailToken };