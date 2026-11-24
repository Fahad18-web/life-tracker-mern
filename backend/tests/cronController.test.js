'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// The controller logs through utils/logger, which loads config/index.js.
// That module exits the process when required variables are missing, so
// provide harmless test values before anything is required.
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/life-tracker-test';
process.env.JWT_SECRET ??= 'test-jwt-secret';

const servicePath = require.resolve('../services/reminderService');
const controllerPath = require.resolve('../controllers/cronController');

function createResponse() {
  return {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    }
  };
}

function loadController(t, runDailyReminders) {
  const originalService = require.cache[servicePath];
  const originalController = require.cache[controllerPath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: { runDailyReminders }
  };

  delete require.cache[controllerPath];

  const controller = require(controllerPath);

  t.after(() => {
    delete require.cache[controllerPath];

    if (originalController) {
      require.cache[controllerPath] = originalController;
    }

    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }
  });

  return controller;
}

function createRequest({
  headerSecret,
  query = {},
  body = {}
} = {}) {
  const headers = {};

  if (headerSecret !== undefined) {
    headers['x-cron-secret'] = headerSecret;
  }

  return {
    query,
    body,

    get(name) {
      return headers[name.toLowerCase()];
    }
  };
}

test('dailyReminders accepts a valid header secret', async (t) => {
  const previousSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test-cron-secret';

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousSecret;
    }
  });

  const expectedResult = {
    candidates: 5,
    sent: 3,
    pushSent: 2,
    skipped: 2,
    failed: 0,
    errors: []
  };

  let receivedOptions;

  const { dailyReminders } = loadController(t, async (options) => {
    receivedOptions = options;
    return expectedResult;
  });

  const req = createRequest({
    headerSecret: 'test-cron-secret'
  });

  const res = createResponse();
  let nextError;

  await dailyReminders(req, res, (err) => {
    nextError = err;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(receivedOptions, { strictHour: true });
  assert.deepEqual(res.body, {
    success: true,
    ...expectedResult
  });
});

test('dailyReminders rejects a missing header secret', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  let serviceCalled = false;

  const { dailyReminders } = loadController(t, async () => {
    serviceCalled = true;
    return {};
  });

  const res = createResponse();

  await dailyReminders(createRequest(), res, () => {});

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    success: false,
    message: 'Unauthorized'
  });
  assert.equal(serviceCalled, false);
});

test('dailyReminders does not accept the secret from query parameters', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  let serviceCalled = false;

  const { dailyReminders } = loadController(t, async () => {
    serviceCalled = true;
    return {};
  });

  const req = createRequest({
    query: {
      secret: 'test-cron-secret'
    }
  });

  const res = createResponse();

  await dailyReminders(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(serviceCalled, false);
});

test('dailyReminders does not accept the secret from request body', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  let serviceCalled = false;

  const { dailyReminders } = loadController(t, async () => {
    serviceCalled = true;
    return {};
  });

  const req = createRequest({
    body: {
      secret: 'test-cron-secret'
    }
  });

  const res = createResponse();

  await dailyReminders(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(serviceCalled, false);
});

test('dailyReminders rejects an incorrect header secret', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  let serviceCalled = false;

  const { dailyReminders } = loadController(t, async () => {
    serviceCalled = true;
    return {};
  });

  const req = createRequest({
    headerSecret: 'wrong-secret'
  });

  const res = createResponse();

  await dailyReminders(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(serviceCalled, false);
});

test('dailyReminders preserves strictHour query and body behavior', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  const receivedOptions = [];

  const { dailyReminders } = loadController(t, async (options) => {
    receivedOptions.push(options);
    return {};
  });

  const queryResponse = createResponse();

  await dailyReminders(
    createRequest({
      headerSecret: 'test-cron-secret',
      query: { strictHour: '1' }
    }),
    queryResponse,
    () => {}
  );

  const bodyResponse = createResponse();

  await dailyReminders(
    createRequest({
      headerSecret: 'test-cron-secret',
      body: { strictHour: true }
    }),
    bodyResponse,
    () => {}
  );

  assert.deepEqual(receivedOptions, [
    { strictHour: true },
    { strictHour: true }
  ]);

  assert.deepEqual(queryResponse.body, { success: true });
  assert.deepEqual(bodyResponse.body, { success: true });
});

test('dailyReminders forwards service errors to next middleware', async (t) => {
  process.env.CRON_SECRET = 'test-cron-secret';

  const expectedError = new Error('Reminder job failed');

  const { dailyReminders } = loadController(t, async () => {
    throw expectedError;
  });

  const req = createRequest({
    headerSecret: 'test-cron-secret'
  });

  const res = createResponse();
  let receivedError;

  await dailyReminders(req, res, (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, expectedError);
  assert.equal(res.body, null);
});

// -----------------------------------------------------------------------------
// Run summary logging
// -----------------------------------------------------------------------------

function captureLogs(t) {
  const lines = { log: [], warn: [], error: [] };

  for (const method of ['log', 'warn', 'error']) {
    t.mock.method(console, method, (line) => {
      lines[method].push(String(line));
    });
  }

  return lines;
}

function withCronSecret(t, secret = 'test-cron-secret') {
  const previousSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = secret;

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousSecret;
    }
  });
}

test('a successful run writes one counts-only summary line to the log', async (t) => {
  withCronSecret(t);
  const logs = captureLogs(t);

  const { dailyReminders } = loadController(t, async () => ({
    candidates: 4,
    sent: 2,
    pushSent: 2,
    pushFailed: 1,
    pushNoSubscription: 1,
    failed: 0,
    skipped: 2,
    skippedBeforeWindow: 1,
    skippedAfterWindow: 0,
    skippedAlreadyLogged: 1,
    skippedInvalidHour: 0,
    catchUpProcessed: 1,
    errors: [{ channel: 'push', message: 'push_provider_unavailable' }]
  }));

  const res = createResponse();
  await dailyReminders(createRequest({ headerSecret: 'test-cron-secret' }), res, assert.ifError);

  assert.equal(logs.log.length, 1);

  const entry = JSON.parse(logs.log[0]);

  assert.equal(entry.message, 'cron.daily_reminders.completed');
  assert.equal(entry.level, 'info');
  assert.equal(typeof entry.durationMs, 'number');
  assert.equal(entry.candidates, 4);
  assert.equal(entry.reminded, 2);
  assert.equal(entry.pushDelivered, 2);
  assert.equal(entry.pushFailed, 1);
  assert.equal(entry.pushNoSub, 1);
  assert.equal(entry.skippedBeforeWindow, 1);
  assert.equal(entry.skippedAlreadyLogged, 1);
  assert.equal(entry.catchUpProcessed, 1);
  assert.equal(entry.errorCount, 1);
  assert.deepEqual(entry.errors, [
    { channel: 'push', message: 'push_provider_unavailable' }
  ]);
});

test('no counter in the summary is hidden by the logger redaction rules', async (t) => {
  withCronSecret(t);
  const logs = captureLogs(t);

  const { dailyReminders } = loadController(t, async () => ({
    candidates: 1,
    sent: 1,
    pushSent: 1,
    errors: []
  }));

  await dailyReminders(
    createRequest({ headerSecret: 'test-cron-secret' }),
    createResponse(),
    assert.ifError
  );

  assert.ok(!logs.log[0].includes('[REDACTED]'), logs.log[0]);
});

test('the HTTP response body is unchanged by logging', async (t) => {
  withCronSecret(t);
  captureLogs(t);

  const serviceResult = { candidates: 1, sent: 1, errors: [] };
  const { dailyReminders } = loadController(t, async () => serviceResult);
  const res = createResponse();

  await dailyReminders(
    createRequest({ headerSecret: 'test-cron-secret' }),
    res,
    assert.ifError
  );

  assert.deepEqual(res.body, { success: true, ...serviceResult });
});

test('an unauthorized call is logged without the provided secret', async (t) => {
  withCronSecret(t, 'the-real-secret');
  const logs = captureLogs(t);
  let serviceCalled = false;

  const { dailyReminders } = loadController(t, async () => {
    serviceCalled = true;
    return {};
  });

  const res = createResponse();
  await dailyReminders(
    createRequest({ headerSecret: 'guessed-wrong-secret' }),
    res,
    assert.ifError
  );

  assert.equal(res.statusCode, 401);
  assert.equal(serviceCalled, false);
  assert.equal(logs.warn.length, 1);
  assert.equal(JSON.parse(logs.warn[0]).message, 'cron.daily_reminders.unauthorized');

  const everything = [...logs.log, ...logs.warn, ...logs.error].join('\n');
  assert.ok(!everything.includes('guessed-wrong-secret'));
  assert.ok(!everything.includes('the-real-secret'));
});

test('a service failure is logged and still forwarded to the error middleware', async (t) => {
  withCronSecret(t);
  const logs = captureLogs(t);
  const failure = new Error('database exploded');

  const { dailyReminders } = loadController(t, async () => {
    throw failure;
  });

  let forwarded;
  await dailyReminders(
    createRequest({ headerSecret: 'test-cron-secret' }),
    createResponse(),
    (err) => {
      forwarded = err;
    }
  );

  assert.equal(forwarded, failure);
  assert.equal(logs.error.length, 1);

  const entry = JSON.parse(logs.error[0]);
  assert.equal(entry.message, 'cron.daily_reminders.failed');
  assert.equal(typeof entry.durationMs, 'number');
});

test('summarizeRun tolerates missing or malformed counters', (t) => {
  const { summarizeRun } = loadController(t, async () => ({}));

  const summary = summarizeRun({ candidates: 'x', errors: 'nope' }, 12);

  assert.equal(summary.durationMs, 12);
  assert.equal(summary.candidates, 0);
  assert.equal(summary.errorCount, 0);
  assert.deepEqual(summary.errors, []);
});