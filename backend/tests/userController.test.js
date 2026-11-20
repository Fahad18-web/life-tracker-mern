
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../controllers/userController');
const userModelPath = require.resolve('../models/User');
const entryModelPath = require.resolve('../models/Entry');
const customHabitModelPath = require.resolve('../models/CustomHabit');
const avatarPath = require.resolve('../config/avatarPresets');
const passwordPath = require.resolve('../utils/passwordPolicy');
const dateUtilsPath = require.resolve('../utils/dateUtils');

function createResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    }
  };
}

function loadController(t, entries, today = '2026-11-14') {
  const originalCache = new Map(
    [
      controllerPath,
      userModelPath,
      entryModelPath,
      customHabitModelPath,
      avatarPath,
      passwordPath,
      dateUtilsPath
    ].map((path) => [path, require.cache[path]])
  );

  require.cache[userModelPath] = {
    id: userModelPath,
    filename: userModelPath,
    loaded: true,
    exports: {}
  };

  require.cache[entryModelPath] = {
    id: entryModelPath,
    filename: entryModelPath,
    loaded: true,
    exports: {
      find: () => ({
        lean: async () => entries
      }),
      deleteMany: async () => ({ deletedCount: 0 })
    }
  };

  require.cache[customHabitModelPath] = {
    id: customHabitModelPath,
    filename: customHabitModelPath,
    loaded: true,
    exports: {
      countForUser: async () => 2,
      deleteMany: async () => ({ deletedCount: 0 })
    }
  };

  require.cache[avatarPath] = {
    id: avatarPath,
    filename: avatarPath,
    loaded: true,
    exports: {
      isValidAvatar: () => true
    }
  };

  require.cache[passwordPath] = {
    id: passwordPath,
    filename: passwordPath,
    loaded: true,
    exports: {
      validatePassword: () => ({ ok: true })
    }
  };

  require.cache[dateUtilsPath] = {
    id: dateUtilsPath,
    filename: dateUtilsPath,
    loaded: true,
    exports: {
      addDaysToDateString: require('../utils/dateUtils')
        .addDaysToDateString,

      getTodayInTimeZone: (timezone) =>
        typeof today === 'function'
          ? today(timezone)
          : today,

      normalizeTimeZone: (timezone) =>
        timezone === 'Invalid/Timezone'
          ? 'Asia/Karachi'
          : timezone || 'Asia/Karachi'
    }
  };

  delete require.cache[controllerPath];

  const controller = require('../controllers/userController');

  t.after(() => {
    delete require.cache[controllerPath];

    for (const [path, cachedModule] of originalCache) {
      if (cachedModule) {
        require.cache[path] = cachedModule;
      } else {
        delete require.cache[path];
      }
    }
  });

  return controller;
}

async function getProfileStats(controller, timezone) {
  const req = {
    user: {
      _id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      timezone
    }
  };

  const res = createResponse();
  let nextError;

  await controller.getProfile(req, res, (error) => {
    nextError = error;
  });

  if (nextError) {
    throw nextError;
  }

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  return res.body;
}

test('profile streak counts consecutive days including today', async (t) => {
  const entries = [
    { date: '2026-11-14', netScore: 10, grade: 'A' },
    { date: '2026-11-13', netScore: 8, grade: 'B' },
    { date: '2026-11-12', netScore: 6, grade: 'C' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.overallStreak, 3);
});

test('profile streak continues from yesterday when today is unlogged', async (t) => {
  const entries = [
    { date: '2026-11-13', netScore: 10, grade: 'A' },
    { date: '2026-11-12', netScore: 8, grade: 'B' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.overallStreak, 2);
});

test('profile streak is zero when neither today nor yesterday is logged', async (t) => {
  const entries = [
    { date: '2026-11-11', netScore: 10, grade: 'A' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.overallStreak, 0);
});

test('profile streak stops at the first missing calendar day', async (t) => {
  const entries = [
    { date: '2026-11-14', netScore: 10, grade: 'A' },
    { date: '2026-11-13', netScore: 8, grade: 'B' },
    { date: '2026-11-11', netScore: 6, grade: 'C' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.overallStreak, 2);
});

test('profile streak ignores duplicate entry dates', async (t) => {
  const entries = [
    { date: '2026-11-14', netScore: 10, grade: 'A' },
    { date: '2026-11-14', netScore: 8, grade: 'B' },
    { date: '2026-11-13', netScore: 6, grade: 'C' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.overallStreak, 2);
});

test('profile streak uses the supplied user timezone', async (t) => {
  const entries = [
    { date: '2026-11-15', netScore: 10, grade: 'A' },
    { date: '2026-11-14', netScore: 8, grade: 'B' }
  ];

  const resolvedTimeZones = [];

  const controller = loadController(
    t,
    entries,
    (timezone) => {
      resolvedTimeZones.push(timezone);

      return timezone === 'Asia/Tokyo'
        ? '2026-11-15'
        : '2026-11-14';
    }
  );

  const profile = await getProfileStats(
    controller,
    'Asia/Tokyo'
  );

  assert.equal(profile.stats.overallStreak, 2);
  assert.equal(profile.user.timezone, 'Asia/Tokyo');

  assert.deepEqual(resolvedTimeZones, ['Asia/Tokyo']);
});

test('profile uses Asia/Karachi when timezone is missing', async (t) => {
  const controller = loadController(t, [
    { date: '2026-11-14', netScore: 10, grade: 'A' }
  ]);

  const profile = await getProfileStats(
    controller,
    undefined
  );

  assert.equal(profile.stats.overallStreak, 1);
  assert.equal(profile.user.timezone, 'Asia/Karachi');
});

test('profile preserves existing summary statistics', async (t) => {
  const entries = [
    { date: '2026-11-14', netScore: 10, grade: 'A' },
    { date: '2026-11-13', netScore: 6, grade: 'B' }
  ];

  const controller = loadController(t, entries);
  const profile = await getProfileStats(
    controller,
    'Asia/Karachi'
  );

  assert.equal(profile.stats.totalEntries, 2);
  assert.equal(profile.stats.avgScore, 8);
  assert.equal(profile.stats.bestScore, 10);
  assert.equal(profile.stats.bestDate, '2026-11-14');
  assert.equal(profile.stats.customHabitsCount, 2);

  assert.deepEqual(profile.stats.gradeCounts, {
    A: 1,
    B: 1
  });
});
