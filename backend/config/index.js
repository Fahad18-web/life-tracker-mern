
require('dotenv').config();

const DEFAULT_CLIENT_URL = 'http://localhost:5173';

/**
 * Normalize and validate a configured HTTP(S) origin.
 *
 * Accepted:
 *   https://example.com
 *   https://example.com/
 *   http://localhost:5173
 *
 * Rejected:
 *   *
 *   https://example.com/dashboard
 *   https://example.com?token=123
 *   javascript:alert(1)
 */
function normalizeOrigin(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('CORS origin must be a non-empty string.');
  }

  const input = value.trim();

  if (
    input === '*' ||
    input.includes('\\') ||
    !/^https?:\/\//i.test(input)
  ) {
    throw new Error(`Invalid CORS origin: ${input}`);
  }

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`Invalid CORS origin: ${input}`);
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`Invalid CORS origin: ${input}`);
  }

  return parsed.origin;
}

/**
 * Parse comma-separated additional CORS origins.
 */
function parseCorsOrigins(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
}

const env = process.env.NODE_ENV || 'development';

let clientUrl;
let corsOrigins;

try {
  // In production, CLIENT_URL must be explicitly configured.
  if (env === 'production' && !process.env.CLIENT_URL?.trim()) {
    throw new Error(
      'CLIENT_URL must be explicitly configured in production.'
    );
  }

  clientUrl = normalizeOrigin(
    process.env.CLIENT_URL || DEFAULT_CLIENT_URL
  );

  const additionalOrigins = parseCorsOrigins(
    process.env.CORS_ORIGINS || ''
  );

  // CLIENT_URL is the primary trusted origin.
  // CORS_ORIGINS adds optional trusted origins.
  corsOrigins = [...new Set([clientUrl, ...additionalOrigins])];
} catch (error) {
  console.error(`❌ CORS configuration error: ${error.message}`);
  process.exit(1);
}

const config = {
  env,
  port: process.env.PORT || 5000,

  mongoUri: process.env.MONGO_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  clientUrl,
  corsOrigins,

  isDev: env === 'development',
  isProd: env === 'production'
};

// Required environment variable validation.
const required = ['mongoUri', 'jwt.secret'];

const missing = required.filter(key => {
  const value = key.split('.').reduce(
    (obj, k) => obj?.[k],
    config
  );

  return !value;
});

if (missing.length > 0) {
  console.error(
    `❌ Missing required env variables: ${missing.join(', ')}`
  );
  process.exit(1);
}

module.exports = config;
