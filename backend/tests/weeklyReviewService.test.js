
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const Entry = require('../models/Entry');
const WeeklyReview = require('../models/WeeklyReview');
const weeklyReviewService = require('../services/weeklyReviewService');

const originalEntryFind = Entry.find;
const originalReviewFindOne = WeeklyReview.findOne;
const originalReviewFind = WeeklyReview.find;
const originalFindOneAndUpdate = WeeklyReview.findOneAndUpdate;
const NativeDate = global.Date;

const FIXED_NOW = '2026-11-15T20:00:00.000Z';

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

function createEntryQuery(entries) {
  return {
    select() {
      return this;
    },
    lean() {
      return Promise.resolve(entries);
    }
  };
}

function createReviewQuery(doc) {
  return {
    lean() {
      return Promise.resolve(doc);
    }
  };
}

function setupMocks({
  currentEntries = [],
  previousEntries = [],
  review = null
} = {}) {
  Entry.find = (filter) => {
    const start = filter.date.$gte;

    return createEntryQuery(
      start === '2026-11-16' || start === '2026-11-09'
        ? currentEntries
        : previousEntries
    );
  };

  WeeklyReview.findOne = () => createReviewQuery(review);
}

test.beforeEach(() => {
  freezeTime();
  setupMocks();
});

test.afterEach(() => {
  Entry.find = originalEntryFind;
  WeeklyReview.findOne = originalReviewFindOne;
  WeeklyReview.find = originalReviewFind;
  WeeklyReview.findOneAndUpdate = originalFindOneAndUpdate;
  restoreTime();
});

test('current week uses the supplied user timezone', () => {
  assert.equal(
    weeklyReviewService.getCurrentWeekStart('Asia/Karachi'),
    '2026-11-16'
  );

  assert.equal(
    weeklyReviewService.getCurrentWeekStart('UTC'),
    '2026-11-09'
  );
});

test('current week falls back to Asia/Karachi for invalid timezone', () => {
  assert.equal(
    weeklyReviewService.getCurrentWeekStart('Invalid/Timezone'),
    '2026-11-16'
  );
});

test('normalizeWeekStart defaults to current week in user timezone', () => {
  assert.equal(
    weeklyReviewService.normalizeWeekStart(
      undefined,
      'Asia/Karachi'
    ),
    '2026-11-16'
  );
});

test('normalizeWeekStart converts any valid date to Monday', () => {
  assert.equal(
    weeklyReviewService.normalizeWeekStart(
      '2026-11-18',
      'Asia/Karachi'
    ),
    '2026-11-16'
  );

  assert.equal(
    weeklyReviewService.normalizeWeekStart(
      '2026-11-16',
      'Asia/Karachi'
    ),
    '2026-11-16'
  );
});

test('normalizeWeekStart rejects impossible calendar dates', () => {
  assert.throws(
    () => weeklyReviewService.normalizeWeekStart('2026-02-30'),
    (error) => error.statusCode === 400
  );
});

test('normalizeWeekStart rejects malformed date strings', () => {
  for (const value of [
    '2026/11/16',
    '16-11-2026',
    'not-a-date',
    '2026-1-6'
  ]) {
    assert.throws(
      () => weeklyReviewService.normalizeWeekStart(value),
      (error) => error.statusCode === 400
    );
  }
});

test('getWeek uses timezone-aware current week boundaries', async () => {
  const capturedEntryFilters = [];
  let capturedReviewFilter;

  Entry.find = (filter) => {
    capturedEntryFilters.push(filter);
    return createEntryQuery([]);
  };

  WeeklyReview.findOne = (filter) => {
    capturedReviewFilter = filter;
    return createReviewQuery(null);
  };

  const result = await weeklyReviewService.getWeek(
    'user-1',
    undefined,
    'Asia/Karachi'
  );

  assert.equal(result.weekStart, '2026-11-16');
  assert.equal(result.weekEnd, '2026-11-22');

  assert.deepEqual(capturedEntryFilters, [
    {
      userId: 'user-1',
      date: {
        $gte: '2026-11-16',
        $lte: '2026-11-22'
      }
    },
    {
      userId: 'user-1',
      date: {
        $gte: '2026-11-09',
        $lte: '2026-11-15'
      }
    }
  ]);

  assert.deepEqual(capturedReviewFilter, {
    userId: 'user-1',
    weekStart: '2026-11-16'
  });
});

test('getWeek preserves existing overview calculations and reflection shape', async () => {
  const currentEntries = [
    {
      date: '2026-11-09',
      netScore: 20,
      mood: 4,
      grade: 'A',
      good: {
        quran: true,
        reading: false
      },
      bad: {
        late: true
      },
      customHabits: [
        {
          type: 'good',
          completed: true
        },
        {
          type: 'bad',
          completed: false
        }
      ]
    },
    {
      date: '2026-11-10',
      netScore: 40,
      mood: 5,
      grade: 'B',
      good: {
        quran: true
      },
      bad: {
        late: false
      },
      customHabits: []
    }
  ];

  const previousEntries = [
    {
      date: '2026-11-08',
      netScore: 10,
      mood: 3,
      good: {},
      bad: {},
      customHabits: []
    }
  ];

  const review = {
    wentWell: 'Consistent reading',
    challenges: 'Late sleep',
    improve: 'Sleep earlier',
    priority: 'Exercise',
    status: 'draft',
    completedAt: null,
    updatedAt: null
  };

  const filters = [];

  Entry.find = (filter) => {
    filters.push(filter);

    return createEntryQuery(
      filter.date.$gte === '2026-11-09'
        ? currentEntries
        : previousEntries
    );
  };

  WeeklyReview.findOne = () => createReviewQuery(review);

  const result = await weeklyReviewService.getWeek(
    'user-1',
    '2026-11-11',
    'Asia/Karachi'
  );

  assert.equal(result.weekStart, '2026-11-09');
  assert.equal(result.weekEnd, '2026-11-15');

  assert.equal(result.overview.daysLogged, 2);
  assert.equal(result.overview.daysInWeek, 7);
  assert.equal(result.overview.consistencyPct, 29);
  assert.equal(result.overview.avgScore, 30);
  assert.equal(result.overview.avgMood, 4.5);
  assert.equal(result.overview.goodCompleted, 3);
  assert.equal(result.overview.badMarked, 1);
  assert.equal(result.overview.goodCompletionPct, 75);

  assert.deepEqual(result.overview.comparison, {
    avgScoreDelta: 20,
    daysLoggedDelta: 1,
    previousAvgScore: 10,
    previousDaysLogged: 1
  });

  assert.equal(result.overview.daily.length, 7);
  assert.equal(result.overview.daily[0].date, '2026-11-09');
  assert.equal(result.overview.daily[0].logged, true);
  assert.equal(result.overview.daily[2].date, '2026-11-11');
  assert.equal(result.overview.daily[2].logged, false);

  assert.equal(
    result.reflection.wentWell,
    'Consistent reading'
  );
  assert.equal(result.reflection.status, 'draft');
  assert.equal(filters.length, 2);
});

test('getWeek returns an empty reflection when no review exists', async () => {
  setupMocks();

  const result = await weeklyReviewService.getWeek(
    'user-1',
    '2026-11-16',
    'Asia/Karachi'
  );

  assert.deepEqual(result.reflection, {
    wentWell: '',
    challenges: '',
    improve: '',
    priority: '',
    status: 'draft',
    completedAt: null,
    updatedAt: null
  });
});

test('upsert rejects an empty update payload', async () => {
  await assert.rejects(
    weeklyReviewService.upsert(
      'user-1',
      '2026-11-16',
      {},
      'Asia/Karachi'
    ),
    (error) => error.statusCode === 400
  );
});

test('upsert rejects completion when reflection fields are missing', async () => {
  WeeklyReview.findOne = () =>
    createReviewQuery({
      wentWell: 'Good progress',
      challenges: '',
      improve: '',
      priority: ''
    });

  await assert.rejects(
    weeklyReviewService.upsert(
      'user-1',
      '2026-11-16',
      { status: 'completed' },
      'Asia/Karachi'
    ),
    (error) =>
      error.statusCode === 400 &&
      error.message.includes('All four reflection fields')
  );
});

test('upsert rejects invalid reflection field types', async () => {
  await assert.rejects(
    weeklyReviewService.upsert(
      'user-1',
      '2026-11-16',
      { wentWell: 123 },
      'Asia/Karachi'
    ),
    (error) => error.statusCode === 400
  );
});

test('upsert rejects reflection fields exceeding 1000 characters', async () => {
  await assert.rejects(
    weeklyReviewService.upsert(
      'user-1',
      '2026-11-16',
      { wentWell: 'x'.repeat(1001) },
      'Asia/Karachi'
    ),
    (error) => error.statusCode === 400
  );
});

test('listHistory clamps requested limit and calculates week end', async () => {
  let capturedLimit;

  const docs = [
    {
      weekStart: '2026-11-09',
      status: 'completed',
      completedAt: null,
      updatedAt: null,
      wentWell: 'Good progress'
    }
  ];

  WeeklyReview.find = () => ({
    sort() {
      return this;
    },
    limit(value) {
      capturedLimit = value;
      return this;
    },
    select() {
      return this;
    },
    lean() {
      return Promise.resolve(docs);
    }
  });

  const result = await weeklyReviewService.listHistory(
    'user-1',
    100
  );

  assert.equal(capturedLimit, 52);
  assert.equal(result.length, 1);
  assert.equal(result[0].weekStart, '2026-11-09');
  assert.equal(result[0].weekEnd, '2026-11-15');
  assert.equal(result[0].hasContent, true);
});
