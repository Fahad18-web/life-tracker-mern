
const test = require('node:test');
const assert = require('node:assert/strict');

const corsOptions = require('../middleware/corsOptions');

function checkOrigin(value) {
  return new Promise((resolve, reject) => {
    corsOptions.origin(value, (error, allowed) => {
      if (error) {
        return reject(error);
      }

      resolve(allowed);
    });
  });
}

test('allows the configured primary frontend origin', async () => {
  const allowed = await checkOrigin(corsOptionsOrigin());

  assert.equal(allowed, true);
});

test('allows requests without an Origin header', async () => {
  assert.equal(await checkOrigin(undefined), true);
  assert.equal(await checkOrigin(null), true);
});

test('does not allow an untrusted origin', async () => {
  assert.equal(
    await checkOrigin('https://untrusted.example.com'),
    false
  );
});

test('does not allow a similar but different origin', async () => {
  assert.equal(
    await checkOrigin('https://example.com.attacker.test'),
    false
  );
});

test('does not allow the null origin', async () => {
  assert.equal(await checkOrigin('null'), false);
});

test('keeps credentials enabled', () => {
  assert.equal(corsOptions.credentials, true);
});

function corsOptionsOrigin() {
  // Read the primary origin from the same configuration
  // used by the production CORS middleware.
  return require('../config').clientUrl;
}
