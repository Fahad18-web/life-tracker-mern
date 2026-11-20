
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const HabitReplacement = require('../models/HabitReplacement');
const Entry = require('../models/Entry');
const habitReplacementService = require('../services/habitReplacementService');

const originalHabitReplacementFind = HabitReplacement.find;
const originalEntryFind = Entry.find;
const NativeDate = global.Date;

const FIXED_NOW = '2026-11-14T20:00:00.000Z';

function freezeTime(instant = FIXED_NOW) {
  const timestamp = NativeDate.parse(instant);

  class FrozenDate extends NativeDate {
    constructor(...args) {
      if (args.length === 0) {
        super(timestamp);
      } else {
        super(...args);
      }
    }

    static now() {
      return timestamp;
    }
  }

  global.Date = FrozenDate;
}

function restoreTime() {
  global.Date = NativeDate;
}

function createQuery(data, sortable = false) {
  const query = {
    lean() {
      return Promise.resolve(data);
    }
  };

  if (sortable) {
    query.sort = function () {
      return this;
    };
  }

  return query;
}

function createPair(overrides = {}) {
  return {
    _id: 'pair-1',
    userId: 'user-1',
    badHabit: 'late',
    badHabitLabel: 'Sleeping Late',
    badHabitEmoji: '🌙',
    isCustomBad: false,
    goodHabit: 'exercise',
    goodHabitLabel: 'Exercise',
    goodHabitEmoji: '🏃',
    isCustomGood: false,
    createdAt: new NativeDate(FIXED_NOW),
    rules: {
      windowDays: 7,
      requireBoth: true,
      minLoggedDays: 1
    },
    ...overrides
  };
}

function createEntry(date, overrides = {}) {
  return {
    date,
    good: {
      exercise: true
    },
    bad: {
      late: false
    },
    customHabits: [],
    ...overrides
  };
}

function setupMocks({
  pairs = [],
  entries = []
} = {}) {
  HabitReplacement.find = () =>
    createQuery(pairs, true);

  Entry.find = () =>
    createQuery(entries);
}

test.beforeEach(() => {
  freezeTime();
  setupMocks();
});

test.afterEach(() => {
  HabitReplacement.find = originalHabitReplacementFind;
  Entry.find = originalEntryFind;
  restoreTime();
});

test('getPairs uses the supplied timezone for query date boundaries', async () => {
  let capturedEntryFilter;

  Entry.find = (filter) => {
    capturedEntryFilter = filter;
    return createQuery([]);
  };

  await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  assert.deepEqual(capturedEntryFilter, {
    userId: 'user-1',
    date: {
      $gte: '2026-08-17',
      $lte: '2026-11-15'
    }
  });
});

test('getPairs uses UTC calendar date when UTC is supplied', async () => {
  let capturedEntryFilter;

  Entry.find = (filter) => {
    capturedEntryFilter = filter;
    return createQuery([]);
  };

  await habitReplacementService.getPairs(
    'user-1',
    'UTC'
  );

  assert.deepEqual(capturedEntryFilter, {
    userId: 'user-1',
    date: {
      $gte: '2026-08-16',
      $lte: '2026-11-14'
    }
  });
});

test('getPairs falls back to Asia/Karachi for an invalid timezone', async () => {
  let capturedEntryFilter;

  Entry.find = (filter) => {
    capturedEntryFilter = filter;
    return createQuery([]);
  };

  await habitReplacementService.getPairs(
    'user-1',
    'Invalid/Timezone'
  );

  assert.equal(
    capturedEntryFilter.date.$lte,
    '2026-11-15'
  );
});

test('pair creation date is resolved in the user timezone', async () => {
  const pair = createPair();

  setupMocks({
    pairs: [pair],
    entries: [
      createEntry('2026-11-15'),
      createEntry('2026-11-16')
    ]
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(result.length, 1);

  assert.equal(
    result[0].stats.pairStart,
    '2026-11-15'
  );

  assert.equal(result[0].stats.activeDays, 1);
  assert.equal(result[0].stats.successDays, 1);
  assert.equal(result[0].stats.streak, 1);
  assert.equal(result[0].stats.successRate, 14);

  assert.deepEqual(
    result[0].stats.lastN,
    ['success']
  );
});

test('pair creation date uses UTC when UTC is supplied', async () => {
  const pair = createPair();

  setupMocks({
    pairs: [pair],
    entries: [
      createEntry('2026-11-14'),
      createEntry('2026-11-15')
    ]
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'UTC'
  );

  assert.equal(
    result[0].stats.pairStart,
    '2026-11-14'
  );

  assert.equal(result[0].stats.activeDays, 1);
  assert.equal(result[0].stats.successDays, 1);
});

test('rolling window preserves success, partial and failed scoring', async () => {
  const pair = createPair({
    createdAt: new NativeDate('2026-11-12T12:00:00.000Z')
  });

  setupMocks({
    pairs: [pair],
    entries: [
      createEntry('2026-11-15'),
      createEntry('2026-11-14', {
        good: {
          exercise: false
        }
      }),
      createEntry('2026-11-13', {
        bad: {
          late: true
        }
      })
    ]
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  const stats = result[0].stats;

  assert.equal(stats.activeDays, 4);
  assert.equal(stats.totalEntries, 3);
  assert.equal(stats.successDays, 1);
  assert.equal(stats.avoidedDays, 2);
  assert.equal(stats.streak, 1);

  assert.deepEqual(stats.lastN, [
    'success',
    'partial',
    'failed',
    'missed'
  ]);
});

test('rolling window does not include entries dated in the future', async () => {
  const pair = createPair();

  setupMocks({
    pairs: [pair],
    entries: [
      createEntry('2026-11-15'),
      createEntry('2026-11-16'),
      createEntry('2026-11-17')
    ]
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  const stats = result[0].stats;

  assert.equal(stats.activeDays, 1);
  assert.equal(stats.totalEntries, 1);
  assert.equal(stats.successDays, 1);

  assert.deepEqual(stats.lastN, ['success']);
});

test('pair created before rolling window uses full configured window', async () => {
  const pair = createPair({
    createdAt: new NativeDate('2026-01-01T12:00:00.000Z')
  });

  setupMocks({
    pairs: [pair],
    entries: []
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  const stats = result[0].stats;

  assert.equal(stats.pairStart, '2026-11-09');
  assert.equal(stats.activeDays, 7);
  assert.equal(stats.successDays, 0);
  assert.equal(stats.streak, 0);

  assert.deepEqual(stats.lastN, [
    'missed',
    'missed',
    'missed',
    'missed',
    'missed',
    'missed',
    'missed'
  ]);
});

test('empty pair list returns an empty array', async () => {
  setupMocks({
    pairs: [],
    entries: []
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  assert.deepEqual(result, []);
});

test('existing pair rules are normalized without changing pair data', async () => {
  const pair = createPair({
    rules: {
      windowDays: 30,
      requireBoth: false,
      minLoggedDays: 3
    }
  });

  setupMocks({
    pairs: [pair],
    entries: []
  });

  const result = await habitReplacementService.getPairs(
    'user-1',
    'Asia/Karachi'
  );

  assert.deepEqual(result[0].rules, {
    windowDays: 30,
    requireBoth: false,
    minLoggedDays: 3
  });

  assert.equal(result[0]._id, 'pair-1');
  assert.equal(result[0].badHabit, 'late');
  assert.equal(result[0].goodHabit, 'exercise');
});
