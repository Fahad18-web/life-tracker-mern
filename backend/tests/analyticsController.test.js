
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const analyticsService = require('../services/analyticsService');
const controller = require('../controllers/analyticsController');

const methodNames = [
  'getWeekly',
  'getMonthly',
  'getStreaks',
  'getReport',
  'getInsights',
  'getDashboard',
  'getHeatmap'
];

const originalMethods = {};

for (const name of methodNames) {
  originalMethods[name] = analyticsService[name];
}

function createRequest({
  userId = 'user-123',
  timezone = 'Asia/Karachi',
  query = {}
} = {}) {
  return {
    user: {
      _id: userId,
      timezone
    },
    query
  };
}

function createResponse() {
  return {
    statusCode: null,
    payload: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function stubService(methodName, implementation) {
  analyticsService[methodName] = implementation;
}

test.afterEach(() => {
  for (const name of methodNames) {
    analyticsService[name] = originalMethods[name];
  }
});

test('getWeekly passes user ID and timezone and preserves data wrapper', async () => {
  let receivedArgs;

  stubService('getWeekly', async (...args) => {
    receivedArgs = args;
    return [{ date: '2026-11-15' }];
  });

  const req = createRequest();
  const res = createResponse();
  let nextCalled = false;

  await controller.getWeekly(req, res, () => {
    nextCalled = true;
  });

  assert.deepEqual(receivedArgs, ['user-123', 'Asia/Karachi']);
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 200);

  assert.deepEqual(res.payload, {
    success: true,
    data: [{ date: '2026-11-15' }]
  });
});

test('getMonthly passes user timezone and preserves response shape', async () => {
  let receivedArgs;

  stubService('getMonthly', async (...args) => {
    receivedArgs = args;
    return { totalEntries: 12 };
  });

  const req = createRequest({
    timezone: 'America/New_York'
  });

  const res = createResponse();

  await controller.getMonthly(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'America/New_York'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    totalEntries: 12
  });
});

test('getStreaks passes user timezone', async () => {
  let receivedArgs;

  stubService('getStreaks', async (...args) => {
    receivedArgs = args;
    return { overallStreak: 10 };
  });

  const req = createRequest();
  const res = createResponse();

  await controller.getStreaks(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'Asia/Karachi'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    overallStreak: 10
  });
});

test('getReport passes normalized query range and timezone', async () => {
  let receivedArgs;

  stubService('getReport', async (...args) => {
    receivedArgs = args;
    return { range: 'month' };
  });

  const req = createRequest({
    timezone: 'Europe/London',
    query: { range: 'MONTH' }
  });

  const res = createResponse();

  await controller.getReport(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'month',
    'Europe/London'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    range: 'month'
  });
});

test('getReport defaults to week when range is missing', async () => {
  let receivedArgs;

  stubService('getReport', async (...args) => {
    receivedArgs = args;
    return {};
  });

  const req = createRequest({
    query: {}
  });

  const res = createResponse();

  await controller.getReport(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'week',
    'Asia/Karachi'
  ]);
});

test('getInsights passes user timezone', async () => {
  let receivedArgs;

  stubService('getInsights', async (...args) => {
    receivedArgs = args;
    return { insights: [] };
  });

  const req = createRequest({
    timezone: 'Asia/Tokyo'
  });

  const res = createResponse();

  await controller.getInsights(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'Asia/Tokyo'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    insights: []
  });
});

test('getDashboard passes user timezone', async () => {
  let receivedArgs;

  stubService('getDashboard', async (...args) => {
    receivedArgs = args;
    return { today: null };
  });

  const req = createRequest({
    timezone: 'Asia/Karachi'
  });

  const res = createResponse();

  await controller.getDashboard(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    'Asia/Karachi'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    today: null
  });
});

test('getHeatmap passes parsed weeks and timezone and preserves wrapper', async () => {
  let receivedArgs;

  stubService('getHeatmap', async (...args) => {
    receivedArgs = args;
    return { weeks: 12, cells: [] };
  });

  const req = createRequest({
    timezone: 'Asia/Karachi',
    query: { weeks: '12' }
  });

  const res = createResponse();

  await controller.getHeatmap(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    12,
    'Asia/Karachi'
  ]);

  assert.deepEqual(res.payload, {
    success: true,
    heatmap: {
      weeks: 12,
      cells: []
    }
  });
});

test('getHeatmap defaults to 53 weeks for invalid input', async () => {
  let receivedArgs;

  stubService('getHeatmap', async (...args) => {
    receivedArgs = args;
    return {};
  });

  const req = createRequest({
    query: { weeks: 'invalid' }
  });

  const res = createResponse();

  await controller.getHeatmap(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    53,
    'Asia/Karachi'
  ]);
});

test('controller forwards service errors to error middleware', async () => {
  const expectedError = new Error('Analytics service failed');

  stubService('getDashboard', async () => {
    throw expectedError;
  });

  const req = createRequest();
  const res = createResponse();

  let forwardedError;

  await controller.getDashboard(req, res, (err) => {
    forwardedError = err;
  });

  assert.equal(forwardedError, expectedError);
  assert.equal(res.payload, null);
});

test('controller passes missing timezone through for service fallback', async () => {
  let receivedArgs;

  stubService('getWeekly', async (...args) => {
    receivedArgs = args;
    return [];
  });

  // Do not use createRequest() here:
  // its destructuring default replaces undefined with Asia/Karachi.
  const req = {
    user: {
      _id: 'user-123',
      timezone: undefined
    },
    query: {}
  };

  const res = createResponse();

  await controller.getWeekly(req, res, () => {});

  assert.deepEqual(receivedArgs, [
    'user-123',
    undefined
  ]);
});
