
const test = require('node:test');
const assert = require('node:assert/strict');

const weeklyReviewService = require('../services/weeklyReviewService');
const {
  getWeek,
  getHistory,
  upsertWeek
} = require('../controllers/weeklyReviewController');

function createResponse() {
  const response = {
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

  return response;
}

function mockServiceMethod(t, methodName, implementation) {
  const original = weeklyReviewService[methodName];

  weeklyReviewService[methodName] = implementation;

  t.after(() => {
    weeklyReviewService[methodName] = original;
  });
}

test('getWeek forwards user ID, requested week and timezone', async (t) => {
  const expectedData = {
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
    reflection: null
  };

  let receivedArgs;

  mockServiceMethod(t, 'getWeek', async (...args) => {
    receivedArgs = args;
    return expectedData;
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'Asia/Karachi'
    },
    query: {
      weekStart: '2026-11-12'
    }
  };

  const res = createResponse();
  let nextError;

  await getWeek(req, res, (err) => {
    nextError = err;
  });

  assert.equal(nextError, undefined);

  assert.deepEqual(receivedArgs, [
    'user-123',
    '2026-11-12',
    'Asia/Karachi'
  ]);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    ...expectedData
  });
});

test('getHistory preserves existing service arguments and response shape', async (t) => {
  const expectedHistory = [
    {
      weekStart: '2026-11-09',
      weekEnd: '2026-11-15',
      hasContent: true
    }
  ];

  let receivedArgs;

  mockServiceMethod(t, 'listHistory', async (...args) => {
    receivedArgs = args;
    return expectedHistory;
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'Asia/Karachi'
    },
    query: {
      limit: '8'
    }
  };

  const res = createResponse();
  let nextError;

  await getHistory(req, res, (err) => {
    nextError = err;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(receivedArgs, ['user-123', '8']);
  assert.equal(res.statusCode, 200);

  assert.deepEqual(res.body, {
    success: true,
    history: expectedHistory
  });
});

test('upsertWeek forwards user ID, week, body and timezone', async (t) => {
  const requestBody = {
    wentWell: 'Completed my goals',
    challenges: 'Time management',
    improve: 'Better planning',
    priority: 'Consistency',
    status: 'draft'
  };

  const expectedData = {
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
    reflection: requestBody
  };

  let receivedArgs;

  mockServiceMethod(t, 'upsert', async (...args) => {
    receivedArgs = args;
    return expectedData;
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'Asia/Karachi'
    },
    params: {
      weekStart: '2026-11-12'
    },
    body: requestBody
  };

  const res = createResponse();
  let nextError;

  await upsertWeek(req, res, (err) => {
    nextError = err;
  });

  assert.equal(nextError, undefined);

  assert.deepEqual(receivedArgs, [
    'user-123',
    '2026-11-12',
    requestBody,
    'Asia/Karachi'
  ]);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    ...expectedData
  });
});

test('upsertWeek passes an empty object when request body is missing', async (t) => {
  let receivedArgs;

  mockServiceMethod(t, 'upsert', async (...args) => {
    receivedArgs = args;
    return { weekStart: '2026-11-09' };
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'UTC'
    },
    params: {
      weekStart: '2026-11-09'
    },
    body: undefined
  };

  const res = createResponse();

  await upsertWeek(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    '2026-11-09',
    {},
    'UTC'
  ]);
});

test('getWeek forwards service errors to next middleware', async (t) => {
  const expectedError = new Error('Weekly review failed');

  mockServiceMethod(t, 'getWeek', async () => {
    throw expectedError;
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'Asia/Karachi'
    },
    query: {}
  };

  const res = createResponse();
  let receivedError;

  await getWeek(req, res, (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, expectedError);
  assert.equal(res.body, null);
});

test('getHistory forwards service errors to next middleware', async (t) => {
  const expectedError = new Error('History retrieval failed');

  mockServiceMethod(t, 'listHistory', async () => {
    throw expectedError;
  });

  const req = {
    user: { _id: 'user-123' },
    query: {}
  };

  const res = createResponse();
  let receivedError;

  await getHistory(req, res, (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, expectedError);
  assert.equal(res.body, null);
});

test('upsertWeek forwards service errors to next middleware', async (t) => {
  const expectedError = new Error('Weekly review update failed');

  mockServiceMethod(t, 'upsert', async () => {
    throw expectedError;
  });

  const req = {
    user: {
      _id: 'user-123',
      timezone: 'Asia/Karachi'
    },
    params: {
      weekStart: '2026-11-09'
    },
    body: {}
  };

  const res = createResponse();
  let receivedError;

  await upsertWeek(req, res, (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, expectedError);
  assert.equal(res.body, null);
});
