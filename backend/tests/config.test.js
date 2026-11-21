
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const configPath = path.resolve(__dirname, '../config/index.js');

function loadConfig(overrides = {}) {
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://127.0.0.1:27017/life-tracker-test',
    JWT_SECRET: 'test-jwt-secret',
    CLIENT_URL: 'http://localhost:5173'
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  const script = `
    const config = require(${JSON.stringify(configPath)});
    process.stdout.write(JSON.stringify({
      clientUrl: config.clientUrl,
      corsOrigins: config.corsOrigins,
      env: config.env,
      isDev: config.isDev,
      isProd: config.isProd
    }));
  `;

  return spawnSync(process.execPath, ['-e', script], {
    env,
    encoding: 'utf8'
  });
}

function getConfig(overrides = {}) {
  const result = loadConfig(overrides);

  assert.equal(
    result.status,
    0,
    `Configuration failed:\n${result.stderr}`
  );

  return JSON.parse(result.stdout);
}

test('preserves the localhost CLIENT_URL default', () => {
  const config = getConfig({
    CLIENT_URL: undefined,
    CORS_ORIGINS: undefined
  });

  assert.equal(config.clientUrl, 'http://localhost:5173');
  assert.deepEqual(config.corsOrigins, [
    'http://localhost:5173'
  ]);
});

test('normalizes the primary CLIENT_URL', () => {
  const config = getConfig({
    CLIENT_URL: '  HTTPS://Example.COM/  '
  });

  assert.equal(config.clientUrl, 'https://example.com');
  assert.deepEqual(config.corsOrigins, [
    'https://example.com'
  ]);
});

test('supports multiple comma-separated CORS origins', () => {
  const config = getConfig({
    CLIENT_URL: 'https://app.example.com',
    CORS_ORIGINS:
      'https://admin.example.com, https://dashboard.example.com'
  });

  assert.deepEqual(config.corsOrigins, [
    'https://app.example.com',
    'https://admin.example.com',
    'https://dashboard.example.com'
  ]);
});

test('removes duplicate origins after normalization', () => {
  const config = getConfig({
    CLIENT_URL: 'https://app.example.com/',
    CORS_ORIGINS:
      'https://app.example.com, HTTPS://APP.EXAMPLE.COM/'
  });

  assert.deepEqual(config.corsOrigins, [
    'https://app.example.com'
  ]);
});

test('allows an empty optional CORS_ORIGINS variable', () => {
  const config = getConfig({
    CORS_ORIGINS: '   '
  });

  assert.deepEqual(config.corsOrigins, [
    'http://localhost:5173'
  ]);
});

test('rejects wildcard origins', () => {
  const result = loadConfig({
    CORS_ORIGINS: '*'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CORS configuration error/);
});

test('rejects origins containing paths', () => {
  const result = loadConfig({
    CORS_ORIGINS: 'https://example.com/dashboard'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid CORS origin/);
});

test('rejects origins containing query strings or fragments', () => {
  for (const origin of [
    'https://example.com?token=123',
    'https://example.com#section'
  ]) {
    const result = loadConfig({
      CORS_ORIGINS: origin
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid CORS origin/);
  }
});

test('rejects non-HTTP protocols', () => {
  const result = loadConfig({
    CORS_ORIGINS: 'javascript:alert(1)'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid CORS origin/);
});

test('rejects malformed additional origins', () => {
  const result = loadConfig({
    CORS_ORIGINS: 'https://valid.example.com,not-a-valid-origin'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CORS configuration error/);
});

test('rejects an invalid primary CLIENT_URL', () => {
  const result = loadConfig({
    CLIENT_URL: 'https://example.com/api'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CORS configuration error/);
});

test('preserves environment flags', () => {
  const development = getConfig({
    NODE_ENV: 'development'
  });

  assert.equal(development.isDev, true);
  assert.equal(development.isProd, false);

  const production = getConfig({
    NODE_ENV: 'production',
    CLIENT_URL: 'https://example.com',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/lifetracker_test',
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    CRON_SECRET: 'test-cron-secret-at-least-32-characters-long'
  });

  assert.equal(production.isDev, false);
  assert.equal(production.isProd, true);
});