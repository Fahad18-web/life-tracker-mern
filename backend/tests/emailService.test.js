// backend/tests/emailService.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDailyReminderEmail,
  sendViaResend,
  EmailDeliveryError
} = require('../services/emailService');

const ENV_KEYS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_TIMEOUT_MS'
];

let originalEnv;
let originalFetch;
let originalConsoleInfo;
let originalConsoleError;
let infoLogs;
let errorLogs;
let fetchCalls;

function mockFetch(response = { ok: true, status: 200 }) {
  global.fetch = async (...args) => {
    fetchCalls.push(args);
    return response;
  };
}

function getRequest() {
  assert.equal(fetchCalls.length, 1);

  const [url, options] = fetchCalls[0];

  return {
    url,
    options,
    body: JSON.parse(options.body)
  };
}

function getErrorLogsText() {
  return errorLogs.map(args => args.map(String).join(' ')).join('\n');
}

test.beforeEach(() => {
  originalEnv = {};

  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
  }

  originalFetch = global.fetch;
  originalConsoleInfo = console.info;
  originalConsoleError = console.error;

  infoLogs = [];
  errorLogs = [];
  fetchCalls = [];

  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'LifeTracker Test <test@example.com>';
  process.env.EMAIL_TIMEOUT_MS = '10000';

  console.info = (...args) => infoLogs.push(args);
  console.error = (...args) => errorLogs.push(args);

  mockFetch();
});

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }

  global.fetch = originalFetch;
  console.info = originalConsoleInfo;
  console.error = originalConsoleError;
});

// ---------------------------------------------------------
// Exports
// ---------------------------------------------------------

test('exports all expected email service methods', () => {
  assert.equal(typeof sendVerificationEmail, 'function');
  assert.equal(typeof sendPasswordResetEmail, 'function');
  assert.equal(typeof sendDailyReminderEmail, 'function');
  assert.equal(typeof sendViaResend, 'function');
  assert.equal(typeof EmailDeliveryError, 'function');
});

// ---------------------------------------------------------
// Missing configuration
// ---------------------------------------------------------

test('missing Resend API key returns an explicit unavailable result', async () => {
  delete process.env.RESEND_API_KEY;

  const result = await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log',
    variant: 'gentle'
  });

  assert.deepEqual(result, {
    queued: false,
    logged: false,
    reason: 'email_not_configured',
    variant: 'gentle'
  });
  
  assert.equal(result.logged, false);
  assert.equal(fetchCalls.length, 0);
  assert.equal(infoLogs.length, 0);
  assert.equal(errorLogs.length, 0);
});

test('missing API key never logs recipient or reminder URL', async () => {
  delete process.env.RESEND_API_KEY;

  await sendDailyReminderEmail({
    to: 'private-user@example.com',
    name: 'Private Name',
    logUrl: 'https://example.com/private-token',
    variant: 'default'
  });

  const logText = JSON.stringify(infoLogs);

  assert.equal(logText.includes('private-user@example.com'), false);
  assert.equal(logText.includes('private-token'), false);
  assert.equal(logText.includes('Private Name'), false);
});

test('verification email does not log its verification URL when unconfigured', async () => {
  delete process.env.RESEND_API_KEY;

  const result = await sendVerificationEmail({
    to: 'user@example.com',
    name: 'User',
    verifyUrl: 'https://example.com/verify/secret-token'
  });

  assert.equal(result.queued, false);
  assert.equal(result.reason, 'email_not_configured');
  assert.equal(fetchCalls.length, 0);

  const logs = JSON.stringify(infoLogs);

  assert.equal(logs.includes('secret-token'), false);
  assert.equal(logs.includes('user@example.com'), false);
});

test('password reset email does not log its reset URL when unconfigured', async () => {
  delete process.env.RESEND_API_KEY;

  const result = await sendPasswordResetEmail({
    to: 'user@example.com',
    name: 'User',
    resetUrl: 'https://example.com/reset/sensitive-token'
  });

  assert.equal(result.queued, false);
  assert.equal(result.reason, 'email_not_configured');
  assert.equal(fetchCalls.length, 0);

  const logs = JSON.stringify(infoLogs);

  assert.equal(logs.includes('sensitive-token'), false);
  assert.equal(logs.includes('user@example.com'), false);
});

// ---------------------------------------------------------
// Resend request
// ---------------------------------------------------------

test('sends email to Resend with the correct request format', async () => {
  const result = await sendViaResend({
    to: 'user@example.com',
    subject: 'Test email',
    html: '<p>Hello</p>'
  });

  assert.deepEqual(result, { queued: true });

  const request = getRequest();

  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');

  assert.equal(
    request.options.headers.Authorization,
    'Bearer test-resend-key'
  );

  assert.equal(
    request.options.headers['Content-Type'],
    'application/json'
  );

  assert.deepEqual(request.body, {
    from: 'LifeTracker Test <test@example.com>',
    to: ['user@example.com'],
    subject: 'Test email',
    html: '<p>Hello</p>'
  });
});

test('uses the default EMAIL_FROM when configuration is absent', async () => {
  delete process.env.EMAIL_FROM;

  await sendViaResend({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  const request = getRequest();

  assert.equal(
    request.body.from,
    'LifeTracker <onboarding@fahad.engineer>'
  );
});

test('passes the stable idempotency key to Resend', async () => {
  await sendViaResend({
    to: 'user@example.com',
    subject: 'Daily reminder',
    html: '<p>Log today</p>',
    idempotencyKey: 'daily-reminder-user123-2026-11-19-email'
  });

  const request = getRequest();

  assert.equal(
    request.options.headers['Idempotency-Key'],
    'daily-reminder-user123-2026-11-19-email'
  );
});

test('omits the idempotency header when no key is provided', async () => {
  await sendViaResend({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  const request = getRequest();

  assert.equal(
    Object.hasOwn(request.options.headers, 'Idempotency-Key'),
    false
  );
});

test('rejects invalid idempotency keys', async () => {
  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      idempotencyKey: ''
    }),
    {
      name: 'TypeError'
    }
  );

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      idempotencyKey: 'x'.repeat(257)
    }),
    {
      name: 'TypeError'
    }
  );

  assert.equal(fetchCalls.length, 0);
});

// ---------------------------------------------------------
// Timeout and network failure
// ---------------------------------------------------------

test('uses a bounded timeout signal for outbound requests', async () => {
  await sendViaResend({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  const request = getRequest();

  assert.ok(request.options.signal);
  assert.equal(typeof request.options.signal.aborted, 'boolean');
});

test('uses a valid configured timeout value', async () => {
  process.env.EMAIL_TIMEOUT_MS = '5000';

  await sendViaResend({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  const request = getRequest();

  assert.ok(request.options.signal);
});

test('falls back to the default timeout for invalid configuration', async () => {
  process.env.EMAIL_TIMEOUT_MS = 'invalid';

  await sendViaResend({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  const request = getRequest();

  assert.ok(request.options.signal);
});

test('classifies a network failure as uncertain', async () => {
  global.fetch = async () => {
    throw new TypeError('Sensitive network internals');
  };

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.ok(error instanceof EmailDeliveryError);
      assert.equal(error.code, 'EMAIL_NETWORK_ERROR');
      assert.equal(error.deliveryOutcome, 'uncertain');
      assert.equal(error.retryable, true);
      assert.equal(error.message.includes('Sensitive'), false);
      return true;
    }
  );
});

test('classifies timeout errors as uncertain', async () => {
  global.fetch = async () => {
    const error = new Error('Internal timeout details');
    error.name = 'TimeoutError';
    throw error;
  };

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.equal(error.code, 'EMAIL_TIMEOUT');
      assert.equal(error.deliveryOutcome, 'uncertain');
      assert.equal(error.retryable, true);
      assert.equal(error.message.includes('Internal'), false);
      return true;
    }
  );
});

// ---------------------------------------------------------
// Provider error classification
// ---------------------------------------------------------

test('classifies a provider 400 error as rejected and non-retryable', async () => {
  mockFetch({
    ok: false,
    status: 400,
    text: async () => 'Private provider response'
  });

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.equal(error.code, 'EMAIL_PROVIDER_REJECTED');
      assert.equal(error.statusCode, 400);
      assert.equal(error.deliveryOutcome, 'rejected');
      assert.equal(error.retryable, false);
      return true;
    }
  );
});

test('classifies rate limiting as rejected and retryable', async () => {
  mockFetch({
    ok: false,
    status: 429
  });

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.equal(error.code, 'EMAIL_RATE_LIMITED');
      assert.equal(error.statusCode, 429);
      assert.equal(error.deliveryOutcome, 'rejected');
      assert.equal(error.retryable, true);
      return true;
    }
  );
});

test('classifies a provider 409 conflict as uncertain', async () => {
  mockFetch({
    ok: false,
    status: 409
  });

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.equal(error.code, 'EMAIL_PROVIDER_AMBIGUOUS');
      assert.equal(error.deliveryOutcome, 'uncertain');
      assert.equal(error.retryable, true);
      return true;
    }
  );
});

test('classifies a provider 500 error as uncertain', async () => {
  mockFetch({
    ok: false,
    status: 500
  });

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }),
    error => {
      assert.equal(error.code, 'EMAIL_PROVIDER_UNAVAILABLE');
      assert.equal(error.statusCode, 500);
      assert.equal(error.deliveryOutcome, 'uncertain');
      assert.equal(error.retryable, true);
      return true;
    }
  );
});

test('never logs raw provider response bodies', async () => {
  mockFetch({
    ok: false,
    status: 500,
    text: async () => 'secret provider diagnostic'
  });

  await assert.rejects(
    () => sendViaResend({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
  );

  assert.equal(
    getErrorLogsText().includes('secret provider diagnostic'),
    false
  );
  assert.equal(errorLogs.length, 0);
});

// ---------------------------------------------------------
// HTML safety
// ---------------------------------------------------------

test('verification email escapes the user name', async () => {
  await sendVerificationEmail({
    to: 'user@example.com',
    name: '<script>alert(1)</script>',
    verifyUrl: 'https://example.com/verify/token'
  });

  const request = getRequest();

  assert.ok(request.body.html.includes('&lt;script&gt;'));
  assert.equal(request.body.html.includes('<script>alert(1)'), false);
});

test('password reset email escapes the user name', async () => {
  await sendPasswordResetEmail({
    to: 'user@example.com',
    name: '<img src=x onerror=alert(1)>',
    resetUrl: 'https://example.com/reset/token'
  });

  const request = getRequest();

  assert.ok(request.body.html.includes('&lt;img'));
  assert.equal(request.body.html.includes('<img src=x'), false);
});

test('daily reminder escapes name and copy', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: '<script>bad()</script>',
    logUrl: 'https://example.com/log',
    variant: 'gentle'
  });

  const request = getRequest();

  assert.ok(request.body.html.includes('&lt;script&gt;'));
  assert.equal(request.body.html.includes('<script>bad()'), false);
});

test('rejects unsafe verification URL schemes', async () => {
  await assert.rejects(
    () => sendVerificationEmail({
      to: 'user@example.com',
      name: 'User',
      verifyUrl: 'javascript:alert(1)'
    }),
    {
      name: 'TypeError'
    }
  );

  assert.equal(fetchCalls.length, 0);
});

test('rejects unsafe password reset URL schemes', async () => {
  await assert.rejects(
    () => sendPasswordResetEmail({
      to: 'user@example.com',
      name: 'User',
      resetUrl: 'javascript:alert(1)'
    }),
    {
      name: 'TypeError'
    }
  );

  assert.equal(fetchCalls.length, 0);
});

test('rejects unsafe daily reminder URL schemes', async () => {
  await assert.rejects(
    () => sendDailyReminderEmail({
      to: 'user@example.com',
      name: 'User',
      logUrl: 'javascript:alert(1)'
    }),
    {
      name: 'TypeError'
    }
  );

  assert.equal(fetchCalls.length, 0);
});

// ---------------------------------------------------------
// Existing email behavior
// ---------------------------------------------------------

test('verification email preserves recipient, subject, and template', async () => {
  await sendVerificationEmail({
    to: 'user@example.com',
    name: 'Fahad',
    verifyUrl: 'https://example.com/verify/token'
  });

  const request = getRequest();

  assert.deepEqual(request.body.to, ['user@example.com']);
  assert.equal(request.body.subject, 'Verify your LifeTracker email');
  assert.ok(request.body.html.includes('Verify email'));
  assert.ok(request.body.html.includes('Fahad'));
});

test('password reset email preserves recipient, subject, and template', async () => {
  await sendPasswordResetEmail({
    to: 'user@example.com',
    name: 'Fahad',
    resetUrl: 'https://example.com/reset/token'
  });

  const request = getRequest();

  assert.deepEqual(request.body.to, ['user@example.com']);
  assert.equal(request.body.subject, 'Reset your LifeTracker password');
  assert.ok(request.body.html.includes('Reset password'));
  assert.ok(request.body.html.includes('1 hour'));
});

test('daily reminder preserves default variant', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log'
  });

  const request = getRequest();

  assert.equal(
    request.body.subject,
    'LifeTracker — log today (1 minute)'
  );

  assert.ok(request.body.html.includes('Log today'));
});

test('daily reminder preserves protect variant', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log',
    variant: 'protect'
  });

  const request = getRequest();

  assert.equal(
    request.body.subject,
    'LifeTracker — keep today’s chain'
  );
});

test('daily reminder preserves comeback variant', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log',
    variant: 'comeback'
  });

  const request = getRequest();

  assert.equal(
    request.body.subject,
    'LifeTracker — start a small comeback'
  );
});

test('daily reminder preserves gentle variant', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log',
    variant: 'gentle'
  });

  const request = getRequest();

  assert.equal(
    request.body.subject,
    'LifeTracker — a quiet check-in'
  );
});

test('unknown daily reminder variant falls back to default', async () => {
  await sendDailyReminderEmail({
    to: 'user@example.com',
    name: 'Fahad',
    logUrl: 'https://example.com/log',
    variant: 'unknown'
  });

  const request = getRequest();

  assert.equal(
    request.body.subject,
    'LifeTracker — log today (1 minute)'
  );
});