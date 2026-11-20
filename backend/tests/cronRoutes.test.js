
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('cron routes register POST only for daily reminders', () => {
  const expressPath = require.resolve('express');
  const controllerPath = require.resolve('../controllers/cronController');
  const routePath = require.resolve('../routes/cron');

  const originalExpress = require.cache[expressPath];
  const originalController = require.cache[controllerPath];
  const originalRoute = require.cache[routePath];

  const calls = [];
  const dailyReminders = async () => {};

  const mockRouter = {
    post(...args) {
      calls.push({ method: 'POST', args });
    },
    get(...args) {
      calls.push({ method: 'GET', args });
    }
  };

  try {
    require.cache[expressPath] = {
      id: expressPath,
      filename: expressPath,
      loaded: true,
      exports: {
        Router: () => mockRouter
      }
    };

    require.cache[controllerPath] = {
      id: controllerPath,
      filename: controllerPath,
      loaded: true,
      exports: { dailyReminders }
    };

    delete require.cache[routePath];

    const router = require('../routes/cron');

    assert.equal(router, mockRouter);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].args[0], '/daily-reminders');
    assert.equal(calls[0].args[1], dailyReminders);

    assert.equal(
      calls.some((call) => call.method === 'GET'),
      false,
      'GET route must not be registered'
    );
  } finally {
    delete require.cache[routePath];

    if (originalRoute) {
      require.cache[routePath] = originalRoute;
    }

    if (originalExpress) {
      require.cache[expressPath] = originalExpress;
    } else {
      delete require.cache[expressPath];
    }

    if (originalController) {
      require.cache[controllerPath] = originalController;
    } else {
      delete require.cache[controllerPath];
    }
  }
});
