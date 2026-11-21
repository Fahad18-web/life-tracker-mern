
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modulePaths = {
  webpush: require.resolve('web-push'),
  User: require.resolve('../models/User'),
  pushService: require.resolve('../services/pushService')
};

const DEFAULT_ENDPOINT =
  'https://push.example.com/subscription';

function loadPushService(t, options = {}) {
  const {
    configured = true,
    user = {
      pushSubscription: {
        endpoint: DEFAULT_ENDPOINT,
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth'
        }
      }
    },
    sendError = null,
    cleanupResult = {
      matchedCount: 1,
      modifiedCount: 1
    }
  } = options;

  const originalEnv = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
  };

  if (configured) {
    process.env.VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
  } else {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  }

  process.env.VAPID_SUBJECT = 'mailto:test@example.com';

  const calls = {
    vapid: [],
    notifications: [],
    findById: [],
    updates: [],
    cleanupUpdates: []
  };

  const webpush = {
    setVapidDetails(...args) {
      calls.vapid.push(args);
    },

    async sendNotification(subscription, payload) {
      calls.notifications.push({ subscription, payload });

      if (sendError) {
        throw sendError;
      }

      return { statusCode: 201 };
    }
  };

  const User = {
    findById(userId) {
      calls.findById.push(userId);

      return {
        select: async () => user
      };
    },

    findByIdAndUpdate(userId, update) {
      calls.updates.push({ userId, update });
      return Promise.resolve({});
    },

    async updateOne(filter, update) {
      calls.cleanupUpdates.push({ filter, update });
      return cleanupResult;
    }
  };

  const replacements = new Map();

  function replaceModule(path, exports) {
    replacements.set(path, require.cache[path]);

    require.cache[path] = {
      id: path,
      filename: path,
      loaded: true,
      exports
    };
  }

  replaceModule(modulePaths.webpush, webpush);
  replaceModule(modulePaths.User, User);

  delete require.cache[modulePaths.pushService];

  const service = require(modulePaths.pushService);

  t.after(() => {
    delete require.cache[modulePaths.pushService];

    for (const [path, originalModule] of replacements) {
      if (originalModule) {
        require.cache[path] = originalModule;
      } else {
        delete require.cache[path];
      }
    }

    if (originalEnv.publicKey === undefined) {
      delete process.env.VAPID_PUBLIC_KEY;
    } else {
      process.env.VAPID_PUBLIC_KEY = originalEnv.publicKey;
    }

    if (originalEnv.privateKey === undefined) {
      delete process.env.VAPID_PRIVATE_KEY;
    } else {
      process.env.VAPID_PRIVATE_KEY = originalEnv.privateKey;
    }

    if (originalEnv.subject === undefined) {
      delete process.env.VAPID_SUBJECT;
    } else {
      process.env.VAPID_SUBJECT = originalEnv.subject;
    }
  });

  return { service, calls };
}

test('configures VAPID when public and private keys exist', (t) => {
  const { calls } = loadPushService(t);

  assert.equal(calls.vapid.length, 1);

  assert.deepEqual(calls.vapid[0], [
    'mailto:test@example.com',
    'test-public-key',
    'test-private-key'
  ]);
});

test('sends a push notification successfully', async (t) => {
  const { service, calls } = loadPushService(t);

  const payload = {
    title: 'Log today',
    body: 'Time to log your habits.',
    url: '/log'
  };

  const result = await service.sendToUser(
    'user-123',
    payload
  );

  assert.deepEqual(result, {
    sent: true,
    deliveryOutcome: 'accepted'
  });

  assert.deepEqual(calls.findById, ['user-123']);
  assert.equal(calls.notifications.length, 1);

  assert.equal(
    calls.notifications[0].subscription.endpoint,
    DEFAULT_ENDPOINT
  );

  assert.equal(
    calls.notifications[0].payload,
    JSON.stringify(payload)
  );
});

test('returns no_subscription when the user has no saved subscription', async (t) => {
  const { service, calls } = loadPushService(t, {
    user: null
  });

  const result = await service.sendToUser(
    'user-123',
    { title: 'Test' }
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'no_subscription',
    statusCode: null,
    deliveryOutcome: 'rejected',
    retryable: false
  });

  assert.equal(calls.notifications.length, 0);
  assert.equal(calls.cleanupUpdates.length, 0);
});

test('returns a configuration failure when VAPID keys are missing', async (t) => {
  const { service, calls } = loadPushService(t, {
    configured: false
  });

  const result = await service.sendToUser(
    'user-123',
    { title: 'Test' }
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'push_not_configured',
    statusCode: 503,
    deliveryOutcome: 'rejected',
    retryable: true
  });

  assert.equal(calls.findById.length, 0);
  assert.equal(calls.notifications.length, 0);
});

for (const statusCode of [404, 410]) {
  test(
    `removes matching subscription after ${statusCode} response`,
    async (t) => {
      const error = new Error('Provider subscription error');
      error.statusCode = statusCode;

      const { service, calls } = loadPushService(t, {
        sendError: error
      });

      const result = await service.sendToUser(
        'user-123',
        { title: 'Test' }
      );

      assert.deepEqual(result, {
        sent: false,
        reason: 'invalid_subscription',
        statusCode,
        deliveryOutcome: 'rejected',
        retryable: false,
        subscriptionRemoved: true
      });

      assert.deepEqual(calls.cleanupUpdates, [
        {
          filter: {
            _id: 'user-123',
            'pushSubscription.endpoint': DEFAULT_ENDPOINT
          },
          update: {
            $unset: {
              pushSubscription: 1
            }
          }
        }
      ]);
    }
  );
}

test(
  'does not report subscription removed if endpoint no longer matches',
  async (t) => {
    const error = new Error('Provider subscription error');
    error.statusCode = 410;

    const { service, calls } = loadPushService(t, {
      sendError: error,
      cleanupResult: {
        matchedCount: 0,
        modifiedCount: 0
      }
    });

    const result = await service.sendToUser(
      'user-123',
      { title: 'Test' }
    );

    assert.deepEqual(result, {
      sent: false,
      reason: 'invalid_subscription',
      statusCode: 410,
      deliveryOutcome: 'rejected',
      retryable: false,
      subscriptionRemoved: false
    });

    assert.equal(calls.cleanupUpdates.length, 1);
  }
);

test('does not remove subscription for a 503 provider error', async (t) => {
  const error = new Error('Sensitive provider error details');
  error.statusCode = 503;

  const { service, calls } = loadPushService(t, {
    sendError: error
  });

  const result = await service.sendToUser(
    'user-123',
    { title: 'Test' }
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'push_provider_unavailable',
    statusCode: 503,
    deliveryOutcome: 'rejected',
    retryable: true,
    subscriptionRemoved: false
  });

  assert.equal(calls.cleanupUpdates.length, 0);
});

test('classifies 429 provider response as retryable', async (t) => {
  const error = new Error('Too many requests');
  error.statusCode = 429;

  const { service, calls } = loadPushService(t, {
    sendError: error
  });

  const result = await service.sendToUser(
    'user-123',
    { title: 'Test' }
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'push_rate_limited',
    statusCode: 429,
    deliveryOutcome: 'rejected',
    retryable: true,
    subscriptionRemoved: false
  });

  assert.equal(calls.cleanupUpdates.length, 0);
});

test('classifies network errors as uncertain and non-retryable', async (t) => {
  const error = new Error('Network connection lost');

  const { service, calls } = loadPushService(t, {
    sendError: error
  });

  const result = await service.sendToUser(
    'user-123',
    { title: 'Test' }
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'push_delivery_uncertain',
    statusCode: null,
    deliveryOutcome: 'uncertain',
    retryable: false,
    subscriptionRemoved: false
  });

  assert.equal(calls.cleanupUpdates.length, 0);
});

test('rejects invalid payload without contacting provider', async (t) => {
  const { service, calls } = loadPushService(t);

  const circularPayload = {};
  circularPayload.self = circularPayload;

  const result = await service.sendToUser(
    'user-123',
    circularPayload
  );

  assert.deepEqual(result, {
    sent: false,
    reason: 'push_payload_invalid',
    statusCode: null,
    deliveryOutcome: 'rejected',
    retryable: false
  });

  assert.equal(calls.notifications.length, 0);
});
