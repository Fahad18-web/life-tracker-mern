
'use strict';

require('dotenv').config();

const DEFAULT_CLIENT_URL = 'http://localhost:5173';

function normalizeOrigin(value, { requireHttps = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('CORS origin must be a non-empty string.');
  }

  const input = value.trim();

  if (
    input === '*' ||
    input.includes('\\') ||
    !/^https?:\/\//i.test(input)
  ) {
    throw new Error('Invalid CORS origin.');
  }

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error('Invalid CORS origin.');
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
    throw new Error('Invalid CORS origin.');
  }

  if (requireHttps && parsed.protocol !== 'https:') {
    throw new Error('Production CORS origins must use HTTPS.');
  }

  return parsed.origin;
}

function parseCorsOrigins(value, options = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => normalizeOrigin(origin, options));
}

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

let clientUrl;
let corsOrigins;

try {
  if (isProd && !process.env.CLIENT_URL?.trim()) {
    throw new Error(
      'CLIENT_URL must be explicitly configured in production.'
    );
  }

  const originOptions = {
    requireHttps: isProd
  };

  clientUrl = normalizeOrigin(
    process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
    originOptions
  );

  const additionalOrigins = parseCorsOrigins(
    process.env.CORS_ORIGINS || '',
    originOptions
  );

  corsOrigins = [...new Set([
    clientUrl,
    ...additionalOrigins
  ])];
} catch (error) {
  console.error(
    `[Configuration] CORS configuration error: ${error.message}`
  );

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
  isProd
};

// Validate required environment variables.
const required = ['mongoUri', 'jwt.secret'];

if (isProd) {
  required.push('cronSecret');
}

const configWithCron = {
  ...config,
  cronSecret: process.env.CRON_SECRET
};

const missing = required.filter(key => {
  const value = key.split('.').reduce(
    (obj, k) => obj?.[k],
    configWithCron
  );

  return typeof value !== 'string' || !value.trim();
});

if (missing.length > 0) {
  console.error(
    `[Configuration] Missing required environment variables: ${missing.join(', ')}`
  );

  process.exit(1);
}

// Require a sufficiently strong cron secret in production.
if (
  isProd &&
  Buffer.byteLength(configWithCron.cronSecret, 'utf8') < 32
) {
  console.error(
    '[Configuration] CRON_SECRET must contain at least 32 bytes in production.'
  );

  process.exit(1);
}

module.exports = config;
