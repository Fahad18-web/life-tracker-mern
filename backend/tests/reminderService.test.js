'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const FIXED_NOW = '2026-11-14T20:00:00.000Z';

const modulePaths = {
  User: require.resolve('../models/User'),
  Entry: require.resolve('../models/Entry'),
  ReminderDelivery: require.resolve('../models/ReminderDelivery'),
  emailService: require.resolve('../services/emailService'),
  pushService: require.resolve('../services/pushService'),
  reminderService: require.resolve('../services/reminderService')
};

function freezeTime(t, isoDate) {
  const RealDate = global.Date;
  const fixedTimestamp = new RealDate(isoDate).getTime();

  class FrozenDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedTimestamp);
      } else {
        super(...args);
      }
    }

    static now() {
      return fixedTimestamp;
    }
  }

  global.Date = FrozenDate;

  t.after(() => {
    global.Date = RealDate;
  });
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function getPath(object, path) {
  return path.split('.').reduce(
    (current, key) => current?.[key],
    object
  );
}

function setPath(object, path, value) {
  const parts = path.split('.');
  const finalKey = parts.pop();

  let current = object;

  for (const part of parts) {
    current[part] ??= {};
    current = current[part];
  }

  current[finalKey] = value;
}

function matchesCondition(actual, expected) {
  if (
    expected &&
    typeof expected === 'object' &&
    !Array.isArray(expected) &&
    !(expected instanceof Date)
  ) {
    if ('$lt' in expected) {
      return actual < expected.$lt;
    }

    if ('$lte' in expected) {
      return actual instanceof Date &&
        actual.getTime() <= expected.$lte.getTime();
    }

    if ('$in' in expected) {
      return expected.$in.includes(actual);
    }
  }

  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  }

  return actual === expected;
}

function matchesFilter(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') {
      return expected.some((condition) =>
        matchesFilter(record, condition)
      );
    }

    return matchesCondition(
      getPath(record, key),
      expected
    );
  });
}

function applyUpdate(record, update) {
  for (const [path, value] of Object.entries(update.$set || {})) {
    setPath(record, path, clone(value));
  }

  for (const [path, value] of Object.entries(update.$inc || {})) {
    setPath(
      record,
      path,
      (getPath(record, path) || 0) + value
    );
  }
}

function createEmailError(
  message,
  {
    deliveryOutcome = 'rejected',
    retryable = false,
    code = 'EMAIL_PROVIDER_REJECTED',
    statusCode = 400
  } = {}
) {
  return Object.assign(new Error(message), {
    deliveryOutcome,
    retryable,
    code,
    statusCode
  });
}

function loadReminderService(t, options = {}) {
  const {
    users = [],
    hasEntry = async () => false,
    recentEntries = [],
    historyError = null,
    emailError = null,
    emailErrorSequence = [],
    emailResult = { queued: true },
    afterEmail = null,
    pushResult = { sent: true },
    pushError = null
  } = options;

  const calls = {
    userQueries: [],
    entryQueries: [],
    historyQueries: [],
    emails: [],
    pushes: []
  };

  const deliveryRecords = new Map();
  const queuedEmailErrors = [...emailErrorSequence];

  const User = {
    find(query) {
      calls.userQueries.push(query);

      return {
        select() {
          return this;
        },

        lean: async () => users
      };
    }
  };

  const Entry = {
    exists: async (query) => {
      calls.entryQueries.push(query);
      return hasEntry(query);
    },

    find(query) {
      calls.historyQueries.push(query);

      return {
        select() {
          return this;
        },

        lean: async () => {
          if (historyError) {
            throw historyError;
          }

          return recentEntries;
        }
      };
    }
  };

  const ReminderDelivery = {
    async updateOne(filter, update, options = {}) {
      const key = `${filter.userId}:${filter.localDate}`;

      let record = deliveryRecords.get(key);

      if (!record && options.upsert) {
        record = {
          userId: filter.userId,
          localDate: filter.localDate,
          ...clone(update.$setOnInsert || {})
        };

        deliveryRecords.set(key, record);

        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 1
        };
      }

      if (!record || !matchesFilter(record, filter)) {
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedCount: 0
        };
      }

      applyUpdate(record, update);

      return {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedCount: 0
      };
    },

    async findOneAndUpdate(filter, update) {
      const key = `${filter.userId}:${filter.localDate}`;
      const record = deliveryRecords.get(key);

      if (!record || !matchesFilter(record, filter)) {
        return null;
      }

      applyUpdate(record, update);

      return clone(record);
    }
  };

  const emailService = {
    sendDailyReminderEmail: async (payload) => {
      calls.emails.push(clone(payload));

      const nextError = queuedEmailErrors.length
        ? queuedEmailErrors.shift()
        : emailError;

      if (nextError) {
        throw nextError;
      }

      if (afterEmail) {
        await afterEmail({
          payload,
          deliveryRecords
        });
      }

      return clone(emailResult);
    }
  };

  const pushService = {
    sendToUser: async (userId, payload) => {
      calls.pushes.push({
        userId,
        payload: clone(payload)
      });

      if (pushError) {
        throw pushError;
      }

      return clone(pushResult);
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

  replaceModule(modulePaths.User, User);
  replaceModule(modulePaths.Entry, Entry);
  replaceModule(modulePaths.ReminderDelivery, ReminderDelivery);
  replaceModule(modulePaths.emailService, emailService);
  replaceModule(modulePaths.pushService, pushService);

  delete require.cache[modulePaths.reminderService];

  const service = require(modulePaths.reminderService);

  t.after(() => {
    delete require.cache[modulePaths.reminderService];

    for (const [path, originalModule] of replacements) {
      if (originalModule) {
        require.cache[path] = originalModule;
      } else {
        delete require.cache[path];
      }
    }
  });

  return {
    service,
    calls,
    deliveryRecords
  };
}

function createUser(overrides = {}) {
  return {
    _id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    timezone: 'Asia/Karachi',
    preferences: {
      dailyReminderEnabled: true,
      dailyReminderHour: 20
    },
    ...overrides
  };
}

function getDeliveryRecord(deliveryRecords, userId, localDate) {
  return deliveryRecords.get(`${userId}:${localDate}`);
}

// -----------------------------------------------------------------------------
// Timezone and scheduling
// -----------------------------------------------------------------------------

test('dateInTimezone resolves dates using the supplied timezone', (t) => {
  freezeTime(t, FIXED_NOW);

  const { service } = loadReminderService(t);

  assert.equal(service.dateInTimezone('Asia/Karachi'), '2026-11-15');
  assert.equal(service.dateInTimezone('UTC'), '2026-11-14');
  assert.equal(service.dateInTimezone('Asia/Tokyo'), '2026-11-15');
});

test('dateInTimezone falls back to Asia/Karachi for an invalid timezone', (t) => {
  freezeTime(t, FIXED_NOW);

  const { service } = loadReminderService(t);

  assert.equal(
    service.dateInTimezone('Invalid/Timezone'),
    '2026-11-15'
  );
});

test('daily reminders check the current date in each user timezone', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders();

  assert.deepEqual(calls.entryQueries, [
    {
      userId: user._id,
      date: '2026-11-15'
    }
  ]);

  assert.equal(result.candidates, 1);
  assert.equal(result.sent, 1);
  assert.equal(result.pushAttempted, 1);
  assert.equal(result.pushSent, 1);
  assert.equal(result.pushFailed, 0);
  assert.equal(result.pushNoSubscription, 0);
  assert.equal(result.skipped, 0);
  assert.equal(result.failed, 0);

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.emails[0].variant, 'gentle');

  assert.equal(calls.pushes.length, 1);
  assert.equal(calls.pushes[0].payload.variant, 'gentle');
});

test('daily reminders skip users who have already logged locally today', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user],
    hasEntry: async () => true
  });

  const result = await service.runDailyReminders();

  assert.equal(result.candidates, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.skippedAlreadyLogged, 1);
  assert.equal(result.skippedWrongHour, 0);
  assert.equal(result.sent, 0);
  assert.equal(result.pushAttempted, 0);
  assert.equal(result.pushSent, 0);

  assert.equal(calls.emails.length, 0);
  assert.equal(calls.pushes.length, 0);
  assert.equal(calls.historyQueries.length, 0);
});

test('strictHour skips users outside their preferred local reminder hour', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(result.candidates, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.skippedWrongHour, 1);
  assert.equal(result.skippedAlreadyLogged, 0);
  assert.equal(result.sent, 0);

  assert.equal(calls.entryQueries.length, 0);
  assert.equal(calls.emails.length, 0);
  assert.equal(calls.pushes.length, 0);
});

test('reminder variant uses the timezone-aware seven-day date window', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user],
    recentEntries: [
      { date: '2026-11-14' }
    ]
  });

  const result = await service.runDailyReminders();

  assert.deepEqual(calls.historyQueries, [
    {
      userId: user._id,
      date: {
        $gte: '2026-11-08',
        $lte: '2026-11-15'
      }
    }
  ]);

  assert.equal(result.sent, 1);
  assert.equal(calls.emails[0].variant, 'protect');
  assert.equal(calls.pushes[0].payload.variant, 'protect');
});

test('invalid user timezone uses Asia/Karachi for strict-hour checks and dates', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser({
    timezone: 'Invalid/Timezone',
    preferences: {
      dailyReminderEnabled: true,
      dailyReminderHour: 1
    }
  });

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(result.sent, 1);
  assert.equal(result.skipped, 0);

  assert.deepEqual(calls.entryQueries, [
    {
      userId: user._id,
      date: '2026-11-15'
    }
  ]);
});

// -----------------------------------------------------------------------------
// Push delivery
// -----------------------------------------------------------------------------

test('push failure is counted and its reason is included in diagnostics', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service } = loadReminderService(t, {
    users: [user],
    pushResult: {
      sent: false,
      reason: 'VAPID authentication failed',
      statusCode: 401
    }
  });

  const result = await service.runDailyReminders();

  assert.equal(result.sent, 1);
  assert.equal(result.pushAttempted, 1);
  assert.equal(result.pushSent, 0);
  assert.equal(result.pushFailed, 1);
  assert.equal(result.pushNoSubscription, 0);

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].channel, 'push');
  assert.equal(
    result.errors[0].message,
    'VAPID authentication failed'
  );
  assert.equal(result.errors[0].statusCode, 401);
  assert.equal(result.errors[0].email, undefined);
});

test('missing push subscription is counted separately from push failures', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, deliveryRecords } = loadReminderService(t, {
    users: [user],
    pushResult: {
      sent: false,
      reason: 'no_subscription',
      statusCode: null
    }
  });

  const result = await service.runDailyReminders();

  assert.equal(result.pushAttempted, 1);
  assert.equal(result.pushSent, 0);
  assert.equal(result.pushFailed, 0);
  assert.equal(result.pushNoSubscription, 1);
  assert.equal(result.errors.length, 0);

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-15'
  );

  assert.equal(record.push.status, 'skipped');
  assert.equal(record.push.retryable, false);
});

test('unexpected push service errors are counted and reported', async (t) => {
  freezeTime(t, FIXED_NOW);

  const user = createUser();

  const { service, deliveryRecords } = loadReminderService(t, {
    users: [user],
    pushError: new Error('Database connection failed')
  });

  const result = await service.runDailyReminders();

  assert.equal(result.pushAttempted, 1);
  assert.equal(result.pushSent, 0);
  assert.equal(result.pushFailed, 1);

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].channel, 'push');
  assert.equal(
    result.errors[0].message,
    'Database connection failed'
  );
  assert.equal(
    result.errors[0].deliveryOutcome,
    'uncertain'
  );

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-15'
  );

  assert.equal(record.push.status, 'uncertain');
  assert.equal(record.push.retryable, false);
});

test('email failure does not prevent push delivery', async (t) => {
  freezeTime(t, FIXED_NOW);

  const { service } = loadReminderService(t, {
    users: [createUser()],
    emailError: new Error('Email provider unavailable')
  });

  const result = await service.runDailyReminders();

  assert.equal(result.sent, 0);
  assert.equal(result.failed, 1);

  assert.equal(result.pushAttempted, 1);
  assert.equal(result.pushSent, 1);
  assert.equal(result.pushFailed, 0);

  assert.equal(result.errors[0].channel, 'email');
  assert.equal(
    result.errors[0].deliveryOutcome,
    'uncertain'
  );
});

// -----------------------------------------------------------------------------
// Reminder variants and validation
// -----------------------------------------------------------------------------

test('variant resolution failure falls back to default and is counted', async (t) => {
  freezeTime(t, FIXED_NOW);

  const { service, calls } = loadReminderService(t, {
    users: [createUser()],
    historyError: new Error('History query failed')
  });

  const result = await service.runDailyReminders();

  assert.equal(result.sent, 1);
  assert.equal(result.variantFallbacks, 1);

  assert.equal(calls.emails[0].variant, 'default');
  assert.equal(calls.pushes[0].payload.variant, 'default');
});

test('strictHour sends at the exact configured local hour', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(result.sent, 1);
  assert.equal(result.pushSent, 1);
  assert.equal(result.skippedWrongHour, 0);

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  assert.deepEqual(calls.entryQueries, [
    {
      userId: user._id,
      date: '2026-11-14'
    }
  ]);
});

test('invalid configured reminder hour is skipped safely', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser({
    preferences: {
      dailyReminderEnabled: true,
      dailyReminderHour: 20.5
    }
  });

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(result.skipped, 1);
  assert.equal(result.skippedInvalidHour, 1);
  assert.equal(result.sent, 0);
  assert.equal(result.pushAttempted, 0);

  assert.equal(calls.entryQueries.length, 0);
  assert.equal(calls.emails.length, 0);
  assert.equal(calls.pushes.length, 0);
});

// -----------------------------------------------------------------------------
// Idempotency and concurrent execution
// -----------------------------------------------------------------------------

test('repeated cron executions do not resend successful channels', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  const first = await service.runDailyReminders({
    strictHour: true
  });

  const second = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(first.sent, 1);
  assert.equal(first.pushSent, 1);

  assert.equal(second.sent, 0);
  assert.equal(second.pushSent, 0);
  assert.equal(second.emailNotClaimed, 1);
  assert.equal(second.pushNotClaimed, 1);

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(record.email.status, 'sent');
  assert.equal(record.push.status, 'sent');
  assert.equal(record.email.attempts, 1);
  assert.equal(record.push.attempts, 1);
});

test('concurrent cron executions cannot both claim the same channels', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  const results = await Promise.all([
    service.runDailyReminders({ strictHour: true }),
    service.runDailyReminders({ strictHour: true })
  ]);

  assert.equal(
    results.reduce((total, item) => total + item.sent, 0),
    1
  );

  assert.equal(
    results.reduce((total, item) => total + item.pushSent, 0),
    1
  );

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(record.email.attempts, 1);
  assert.equal(record.push.attempts, 1);
});

// -----------------------------------------------------------------------------
// Email reliability
// -----------------------------------------------------------------------------

test('missing email configuration does not mark email as sent', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailResult: {
      queued: false,
      logged: false,
      reason: 'email_not_configured'
    }
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(result.sent, 0);
  assert.equal(result.failed, 1);

  assert.equal(record.email.status, 'failed');
  assert.equal(record.email.retryable, true);
  assert.equal(record.email.attempts, 1);

  assert.equal(result.pushSent, 1);
});

test('email delivery receives a stable idempotency key', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls } = loadReminderService(t, {
    users: [user]
  });

  await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(calls.emails.length, 1);

  assert.equal(
    calls.emails[0].idempotencyKey,
    `daily-reminder:${user._id}:2026-11-14:email`
  );
});

test('a retryable rejected email can retry without resending successful push', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailErrorSequence: [
      createEmailError(
        'Email provider temporarily unavailable',
        {
          deliveryOutcome: 'rejected',
          retryable: true,
          statusCode: 429,
          code: 'EMAIL_RATE_LIMITED'
        }
      ),
      null
    ]
  });

  const first = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(first.sent, 0);
  assert.equal(first.failed, 1);
  assert.equal(first.pushSent, 1);

  const second = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(second.sent, 1);
  assert.equal(second.pushSent, 0);
  assert.equal(second.pushNotClaimed, 1);

  assert.equal(calls.emails.length, 2);
  assert.equal(calls.pushes.length, 1);

  assert.equal(
    calls.emails[0].idempotencyKey,
    calls.emails[1].idempotencyKey
  );

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(record.email.status, 'sent');
  assert.equal(record.email.attempts, 2);
  assert.equal(record.email.retryable, false);

  assert.equal(record.push.status, 'sent');
  assert.equal(record.push.attempts, 1);
});

test('a permanent email rejection is not automatically retried', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailError: createEmailError(
      'Email provider rejected the request.',
      {
        deliveryOutcome: 'rejected',
        retryable: false,
        statusCode: 400
      }
    )
  });

  const first = await service.runDailyReminders({
    strictHour: true
  });

  const second = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(first.failed, 1);
  assert.equal(second.sent, 0);

  assert.equal(calls.emails.length, 1);

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(record.email.status, 'failed');
  assert.equal(record.email.retryable, false);
  assert.equal(record.email.attempts, 1);
});

test('an uncertain email outcome is not automatically retried', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailError: createEmailError(
      'Email request timed out; delivery outcome is uncertain.',
      {
        deliveryOutcome: 'uncertain',
        retryable: true,
        statusCode: null,
        code: 'EMAIL_TIMEOUT'
      }
    )
  });

  const first = await service.runDailyReminders({
    strictHour: true
  });

  const second = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(first.failed, 1);
  assert.equal(second.sent, 0);

  assert.equal(calls.emails.length, 1);

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(record.email.status, 'uncertain');
  assert.equal(record.email.retryable, false);
  assert.equal(record.email.attempts, 1);
});

test('an unexpected email error is treated as uncertain', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailError: new Error('Unexpected transport error')
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(result.sent, 0);
  assert.equal(result.failed, 1);

  assert.equal(record.email.status, 'uncertain');
  assert.equal(record.email.retryable, false);
});

test('an expired sending email lease becomes uncertain and is not resent', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  record.email.status = 'sending';
  record.email.claimId = 'abandoned-email-claim';
  record.email.leaseUntil = new Date(
    new Date().getTime() - 60_000
  );
  record.email.retryable = false;

  const second = await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(calls.emails.length, 1);
  assert.equal(second.sent, 0);

  assert.equal(record.email.status, 'uncertain');
  assert.equal(record.email.claimId, null);
  assert.equal(record.email.leaseUntil, null);
  assert.equal(record.email.retryable, false);
});

test('a stale email claim cannot mark provider-accepted delivery as sent', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, deliveryRecords } = loadReminderService(t, {
    users: [user],

    afterEmail: async ({ deliveryRecords: records }) => {
      const record = getDeliveryRecord(
        records,
        user._id,
        '2026-11-14'
      );

      // Simulate another worker replacing the original claim.
      record.email.claimId = 'replacement-claim';
    }
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(result.sent, 0);

  assert.equal(record.email.status, 'sending');
  assert.equal(record.email.claimId, 'replacement-claim');

  assert.equal(
    result.errors.some(
      (item) =>
        item.channel === 'email' &&
        item.message ===
          'email_claim_lost_after_provider_acceptance'
    ),
    true
  );
});

test('an expired sending push lease becomes uncertain and is not resent', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  record.push.status = 'sending';
  record.push.claimId = 'abandoned-push-claim';
  record.push.leaseUntil = new Date(
    new Date().getTime() - 60_000
  );

  await service.runDailyReminders({
    strictHour: true
  });

  assert.equal(calls.pushes.length, 1);
  assert.equal(record.push.status, 'uncertain');
  assert.equal(record.push.claimId, null);
  assert.equal(record.push.retryable, false);
});

test('push remains independently deliverable when email is uncertain', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z');

  const user = createUser();

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user],
    emailError: createEmailError(
      'Email delivery outcome is uncertain.',
      {
        deliveryOutcome: 'uncertain',
        retryable: true
      }
    )
  });

  const result = await service.runDailyReminders({
    strictHour: true
  });

  const record = getDeliveryRecord(
    deliveryRecords,
    user._id,
    '2026-11-14'
  );

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  assert.equal(record.email.status, 'uncertain');
  assert.equal(record.push.status, 'sent');

  assert.equal(result.sent, 0);
  assert.equal(result.pushSent, 1);
});

// -----------------------------------------------------------------------------
// Catch-up window: a missed preferred-hour run can still be delivered later
// -----------------------------------------------------------------------------

/**
 * Like freezeTime(), but the clock can be moved between runs inside one test.
 * Returns setNow(isoDate).
 */
function useMovableClock(t, isoDate) {
  const RealDate = global.Date;
  let currentTimestamp = new RealDate(isoDate).getTime();

  class MovableDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(currentTimestamp);
      } else {
        super(...args);
      }
    }

    static now() {
      return currentTimestamp;
    }
  }

  global.Date = MovableDate;

  t.after(() => {
    global.Date = RealDate;
  });

  return (nextIsoDate) => {
    currentTimestamp = new RealDate(nextIsoDate).getTime();
  };
}

function userWithHour(hour, overrides = {}) {
  return createUser({
    preferences: {
      dailyReminderEnabled: true,
      dailyReminderHour: hour
    },
    ...overrides
  });
}

// 2026-11-14 in Asia/Karachi (UTC+5): 15:00Z = 20:00, 16:00Z = 21:00 ...
test('the catch-up window is the preferred hour plus three hours, clipped at 23', (t) => {
  const { service } = loadReminderService(t);
  const inWindow = service.isWithinReminderWindow;

  assert.equal(service.REMINDER_CATCHUP_HOURS, 3);

  const cases = [
    // [preferredHour, localHour, expected]
    [20, 19, false],
    [20, 20, true],
    [20, 21, true],
    [20, 23, true],
    [17, 20, true],
    [17, 21, false],
    [22, 22, true],
    [22, 23, true],
    [22, 0, false],
    [23, 23, true],
    [23, 0, false],
    [0, 0, true],
    [0, 3, true],
    [0, 4, false]
  ];

  for (const [preferredHour, localHour, expected] of cases) {
    assert.equal(
      inWindow(localHour, preferredHour),
      expected,
      `preferred ${preferredHour}, local ${localHour}`
    );
  }
});

test('a reminder missed at the preferred hour is delivered by a later run in the window', async (t) => {
  freezeTime(t, '2026-11-14T16:00:00.000Z'); // 21:00 PKT, preferred 20:00

  const user = userWithHour(20);

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 1);
  assert.equal(result.pushSent, 1);
  assert.equal(result.catchUpProcessed, 1);
  assert.equal(result.skippedWrongHour, 0);
  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  const record = getDeliveryRecord(deliveryRecords, user._id, '2026-11-14');
  assert.equal(record.email.status, 'sent');
  assert.equal(record.push.status, 'sent');
});

test('the run at the exact preferred hour is not counted as a catch-up', async (t) => {
  freezeTime(t, '2026-11-14T15:00:00.000Z'); // 20:00 PKT

  const { service } = loadReminderService(t, { users: [userWithHour(20)] });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 1);
  assert.equal(result.catchUpProcessed, 0);
});

test('the last hour of the window still delivers', async (t) => {
  freezeTime(t, '2026-11-14T18:00:00.000Z'); // 23:00 PKT, preferred 20:00

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(20)]
  });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 1);
  assert.equal(calls.emails.length, 1);
});

test('runs after the window skip the user and report why', async (t) => {
  freezeTime(t, '2026-11-14T16:00:00.000Z'); // 21:00 PKT, window for 17:00 ends 20:00

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(17)]
  });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.skippedAfterWindow, 1);
  assert.equal(result.skippedBeforeWindow, 0);
  assert.equal(result.skippedWrongHour, 1); // total, kept for compatibility
  assert.equal(calls.entryQueries.length, 0);
  assert.equal(calls.emails.length, 0);
  assert.equal(calls.pushes.length, 0);
});

test('runs before the preferred hour never send early', async (t) => {
  freezeTime(t, '2026-11-14T14:00:00.000Z'); // 19:00 PKT, preferred 20:00

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(20)]
  });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 0);
  assert.equal(result.skippedBeforeWindow, 1);
  assert.equal(result.skippedAfterWindow, 0);
  assert.equal(result.skippedWrongHour, 1);
  assert.equal(calls.emails.length, 0);
});

test('the window never crosses midnight into the next local day', async (t) => {
  const setNow = useMovableClock(t, '2026-11-14T18:00:00.000Z'); // 23:00 PKT

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(22)]
  });

  const lateRun = await service.runDailyReminders({ strictHour: true });
  assert.equal(lateRun.sent, 1);

  setNow('2026-11-14T19:00:00.000Z'); // 00:00 PKT on 15 Nov, preferred 22:00
  const afterMidnight = await service.runDailyReminders({ strictHour: true });

  assert.equal(afterMidnight.sent, 0);
  assert.equal(afterMidnight.skippedBeforeWindow, 1);
  assert.equal(calls.emails.length, 1);
});

test('hourly runs inside the window never send the same reminder twice', async (t) => {
  const setNow = useMovableClock(t, '2026-11-14T15:00:00.000Z'); // 20:00 PKT

  const user = userWithHour(20);

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  const first = await service.runDailyReminders({ strictHour: true });
  assert.equal(first.sent, 1);
  assert.equal(first.pushSent, 1);

  for (const hourUtc of ['16', '17', '18']) {
    setNow(`2026-11-14T${hourUtc}:00:00.000Z`); // 21:00, 22:00, 23:00 PKT

    const later = await service.runDailyReminders({ strictHour: true });

    assert.equal(later.sent, 0, `email resent at ${hourUtc}:00Z`);
    assert.equal(later.pushSent, 0, `push resent at ${hourUtc}:00Z`);
  }

  assert.equal(calls.emails.length, 1);
  assert.equal(calls.pushes.length, 1);

  const record = getDeliveryRecord(deliveryRecords, user._id, '2026-11-14');
  assert.equal(record.email.attempts, 1);
  assert.equal(record.push.attempts, 1);
});

test('a user who logs during the catch-up window stops receiving reminders', async (t) => {
  const setNow = useMovableClock(t, '2026-11-14T16:00:00.000Z'); // 21:00 PKT

  let logged = false;

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(20)],
    hasEntry: async () => logged
  });

  // The 20:00 run failed to reach the app; the user then logs at 21:30.
  logged = true;
  setNow('2026-11-14T17:00:00.000Z'); // 22:00 PKT

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.skippedAlreadyLogged, 1);
  assert.equal(result.sent, 0);
  assert.equal(calls.emails.length, 0);
});

test('the window is evaluated in the user timezone, not the server timezone', async (t) => {
  // 02:00Z on 15 Nov = 21:00 on 14 Nov in New York (UTC-5), preferred 20:00.
  freezeTime(t, '2026-11-15T02:00:00.000Z');

  const user = userWithHour(20, { timezone: 'America/New_York' });

  const { service, calls, deliveryRecords } = loadReminderService(t, {
    users: [user]
  });

  const result = await service.runDailyReminders({ strictHour: true });

  assert.equal(result.sent, 1);
  assert.equal(result.catchUpProcessed, 1);
  assert.deepEqual(calls.entryQueries, [
    { userId: user._id, date: '2026-11-14' }
  ]);
  assert.ok(getDeliveryRecord(deliveryRecords, user._id, '2026-11-14'));
});

test('a permanent email rejection is not retried by later catch-up runs', async (t) => {
  const setNow = useMovableClock(t, '2026-11-14T15:00:00.000Z'); // 20:00 PKT

  const { service, calls } = loadReminderService(t, {
    users: [userWithHour(20)],
    emailError: {
      message: 'invalid recipient',
      deliveryOutcome: 'rejected',
      retryable: false
    }
  });

  await service.runDailyReminders({ strictHour: true });
  setNow('2026-11-14T16:00:00.000Z');
  await service.runDailyReminders({ strictHour: true });
  setNow('2026-11-14T17:00:00.000Z');
  await service.runDailyReminders({ strictHour: true });

  assert.equal(calls.emails.length, 1);
});