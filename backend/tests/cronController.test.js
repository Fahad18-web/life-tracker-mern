
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

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
