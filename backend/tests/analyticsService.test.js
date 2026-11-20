
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Entry = require('../models/Entry');
const habitReplacementService = require('../services/habitReplacementService');
const analyticsService = require('../services/analyticsService');

const {
  addDaysToDateString,
  getTodayInTimeZone,
  getDateRangeEndingOn
} = require('../utils/dateUtils');

const NativeDate = global.Date;
const originalFind = Entry.find;
const originalFindOne = Entry.findOne;
const originalGetPairs = habitReplacementService.getPairs;

const FIXED_NOW = '2026-11-14T20:00:00.000Z';

function freezeTime(instant = FIXED_NOW) {
  const fixedTimestamp = NativeDate.parse(instant);

  class FrozenDate extends NativeDate {
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
}

function restoreTime() {
  global.Date = NativeDate;
}

function createQuery(data) {
  return {
    select() {
      return this;
    },

    sort() {
      return this;
    },

    lean() {
      return Promise.resolve(data);
    }
  };
}

function createEntry(date, overrides = {}) {
  return {
    date,
    netScore: 80,
    mood: 4,
    grade: 'B',
    good: {},
    bad: {},
    customHabits: [],
    ...overrides
  };
}

function setupMocks({
  find = () => [],
  findOne = null,
  pairs = []
} = {}) {
  Entry.find = (filter) => createQuery(find(filter));

  Entry.findOne = (filter) => createQuery(
    findOne ? findOne(filter) : null
  );

  habitReplacementService.getPairs = async () => pairs;
}

test.beforeEach(() => {
  freezeTime();
  setupMocks();
});

test.afterEach(() => {
  Entry.find = originalFind;
  Entry.findOne = originalFindOne;
  habitReplacementService.getPairs = originalGetPairs;
  restoreTime();
});

test('weekly analytics uses the supplied timezone', async () => {
  let capturedFilter;

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery([]);
  };

  const result = await analyticsService.getWeekly(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(capturedFilter.date.$gte, '2026-11-09');
  assert.equal(capturedFilter.date.$lte, '2026-11-15');

  assert.equal(result.length, 7);
  assert.equal(result[6].date, '2026-11-15');
});

test('weekly analytics resolves different local dates for different timezones', async () => {
  const karachiToday = getTodayInTimeZone('Asia/Karachi');
  const utcToday = getTodayInTimeZone('UTC');

  assert.equal(karachiToday, '2026-11-15');
  assert.equal(utcToday, '2026-11-14');
});

test('monthly analytics includes exactly 30 calendar days', async () => {
  let capturedFilter;

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery([]);
  };

  const result = await analyticsService.getMonthly(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(capturedFilter.date.$gte, '2026-10-17');
  assert.equal(capturedFilter.date.$lte, '2026-11-15');

  assert.equal(result.totalEntries, 0);
  assert.equal(result.avgScore, 0);
  assert.equal(result.bestDay, null);
});

test('overall logging streak supports more than 120 consecutive days', async () => {
  const today = getTodayInTimeZone('Asia/Karachi');

  const dates = getDateRangeEndingOn(today, 150).reverse();

  const overallEntries = dates.map((date) => ({ date }));

  const recentEntries = dates.slice(0, 120).map((date) =>
    createEntry(date, {
      good: { exercise: true }
    })
  );

  let overallQuery;
  let recentQuery;

  Entry.find = (filter) => {
    if (filter.date.$gte) {
      recentQuery = filter;
      return createQuery(recentEntries);
    }

    overallQuery = filter;
    return createQuery(overallEntries);
  };

  const result = await analyticsService.getStreaks(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(result.overallStreak, 150);

  assert.equal(
    recentQuery.date.$gte,
    addDaysToDateString(today, -119)
  );

  assert.equal(recentQuery.date.$lte, today);

  assert.equal(overallQuery.date.$lte, today);
  assert.equal(result.streaks.exercise, 120);
});

test('overall streak allows yesterday when today has no entry', () => {
  const today = '2026-11-15';
  const yesterday = addDaysToDateString(today, -1);
  const dayBefore = addDaysToDateString(today, -2);

  const result = analyticsService._calculateCurrentLoggingStreak(
    [
      { date: yesterday },
      { date: dayBefore }
    ],
    today
  );

  assert.equal(result, 2);
});

test('overall streak stops at the first missing calendar day', () => {
  const today = '2026-11-15';

  const result = analyticsService._calculateCurrentLoggingStreak(
    [
      { date: today },
      { date: '2026-11-14' },
      { date: '2026-11-12' }
    ],
    today
  );

  assert.equal(result, 2);
});

test('overall streak ignores future-dated entries defensively', () => {
  const today = '2026-11-15';

  const result = analyticsService._calculateCurrentLoggingStreak(
    [
      { date: '2026-11-17' },
      { date: today },
      { date: '2026-11-14' }
    ],
    today
  );

  assert.equal(result, 2);
});

test('empty streak data returns zero streaks', async () => {
  const result = await analyticsService.getStreaks(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(result.overallStreak, 0);

  for (const key of [
    'morning',
    'exercise',
    'reading',
    'prayer',
    'coding',
    'sleep',
    'diet',
    'hydration'
  ]) {
    assert.equal(result.streaks[key], 0);
  }

  assert.deepEqual(result.customStreaks, {});
});

test('report analytics uses timezone-aware date boundaries', async () => {
  let capturedFilter;

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery([]);
  };

  const result = await analyticsService.getReport(
    'user-1',
    'week',
    'Asia/Karachi'
  );

  assert.equal(result.from, '2026-11-09');
  assert.equal(result.to, '2026-11-15');

  assert.equal(capturedFilter.date.$gte, result.from);
  assert.equal(capturedFilter.date.$lte, result.to);

  assert.equal(result.series.length, 7);
});

test('yearly report includes exactly 365 calendar days', async () => {
  let capturedFilter;

  const today = getTodayInTimeZone('Asia/Karachi');
  const expectedFrom = addDaysToDateString(today, -364);

  const entries = getDateRangeEndingOn(today, 365).map((date) =>
    createEntry(date)
  );

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery(entries);
  };

  const result = await analyticsService.getReport(
    'user-1',
    'year',
    'Asia/Karachi'
  );

  assert.equal(result.from, expectedFrom);
  assert.equal(result.to, today);

  assert.equal(capturedFilter.date.$gte, expectedFrom);
  assert.equal(capturedFilter.date.$lte, today);

  assert.equal(result.summary.totalEntries, 365);
  assert.equal(result.summary.consistencyPct, 100);
});

test('yearly report calculates consistency against 365 days', async () => {
  const today = getTodayInTimeZone('Asia/Karachi');

  const entries = getDateRangeEndingOn(today, 182).map((date) =>
    createEntry(date)
  );

  Entry.find = () => createQuery(entries);

  const result = await analyticsService.getReport(
    'user-1',
    'year',
    'Asia/Karachi'
  );

  assert.equal(result.summary.totalEntries, 182);
  assert.equal(result.summary.consistencyPct, 50);
});

test('report rejects unsupported ranges', async () => {
  await assert.rejects(
    analyticsService.getReport(
      'user-1',
      'invalid',
      'Asia/Karachi'
    ),
    {
      message: 'Invalid range. Use week, month, or year.'
    }
  );
});

test('insights query excludes future-dated entries and uses 365 calendar days', async () => {
  let capturedFilter;

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery([]);
  };

  await analyticsService.getInsights(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(capturedFilter.date.$lte, '2026-11-15');
  assert.equal(capturedFilter.date.$gte, '2025-11-16');
});

test('heatmap uses timezone-aware date boundaries', async () => {
  let capturedFilter;

  Entry.find = (filter) => {
    capturedFilter = filter;
    return createQuery([]);
  };

  const result = await analyticsService.getHeatmap(
    'user-1',
    4,
    'Asia/Karachi'
  );

  assert.equal(result.weeks, 4);
  assert.equal(result.totalDays, 28);
  assert.equal(result.to, '2026-11-15');
  assert.equal(result.from, '2026-10-19');

  assert.equal(capturedFilter.date.$gte, result.from);
  assert.equal(capturedFilter.date.$lte, result.to);

  assert.equal(result.cells.length, 28);
  assert.equal(result.loggedCount, 0);
});

test('dashboard passes timezone-aware date to today entry lookup', async () => {
  let capturedFilter;

  Entry.findOne = (filter) => {
    capturedFilter = filter;
    return createQuery(null);
  };

  await analyticsService.getDashboard(
    'user-1',
    'Asia/Karachi'
  );

  assert.equal(capturedFilter.date, '2026-11-15');
});

test('longest logging streak calculates calendar-day sequences', () => {
  const result = analyticsService._longestLoggingStreak([
    { date: '2026-11-10' },
    { date: '2026-11-11' },
    { date: '2026-11-12' },
    { date: '2026-11-14' },
    { date: '2026-11-15' }
  ]);

  assert.equal(result, 3);
});

test('longest logging streak returns zero for empty data', () => {
  assert.equal(
    analyticsService._longestLoggingStreak([]),
    0
  );
});
