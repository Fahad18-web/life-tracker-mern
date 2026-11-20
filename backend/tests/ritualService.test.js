
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../services/ritualService');
const modelPath = require.resolve('../models/DailyRitual');

function loadService(t, overrides = {}) {
  const originalService = require.cache[servicePath];
  const originalModel = require.cache[modelPath];

  const calls = {
    findOne: [],
    findOneAndUpdate: []
  };

  const defaultDoc = {
    date: '2026-11-14',
    morningPlan: 'Plan my day',
    nightWin: 'Finished my work',
    nightBlocker: '',
    tomorrowTarget: 'Study JavaScript',
    updatedAt: new Date('2026-11-14T18:00:00.000Z')
  };

  const model = {
    findOne(query) {
      calls.findOne.push(query);

      return {
        lean: async () =>
          overrides.findOneResult === undefined
            ? defaultDoc
            : overrides.findOneResult
      };
    },

    findOneAndUpdate(filter, update, options) {
      calls.findOneAndUpdate.push({
        filter,
        update,
        options
      });

      return {
        lean: async () =>
          overrides.updateResult === undefined
            ? {
                ...defaultDoc,
                ...update.$set
              }
            : overrides.updateResult
      };
    }
  };

  require.cache[modelPath] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: model
  };

  delete require.cache[servicePath];

  const service = require('../services/ritualService');

  t.after(() => {
    delete require.cache[servicePath];

    if (originalService) {
      require.cache[servicePath] = originalService;
    }

    if (originalModel) {
      require.cache[modelPath] = originalModel;
    } else {
      delete require.cache[modelPath];
    }
  });

  return { service, calls };
}

test('getByDate retrieves a ritual for the specified user and date', async (t) => {
  const { service, calls } = loadService(t);

  const result = await service.getByDate(
    'user-1',
    '2026-11-14'
  );

  assert.equal(calls.findOne.length, 1);

  assert.deepEqual(calls.findOne[0], {
    userId: 'user-1',
    date: '2026-11-14'
  });

  assert.equal(result.date, '2026-11-14');
  assert.equal(result.morningPlan, 'Plan my day');
  assert.equal(result.hasMorning, true);
  assert.equal(result.hasNight, true);
});

test('getByDate returns an empty ritual when no record exists', async (t) => {
  const { service } = loadService(t, {
    findOneResult: null
  });

  const result = await service.getByDate(
    'user-1',
    '2026-11-14'
  );

  assert.deepEqual(result, {
    date: '2026-11-14',
    morningPlan: '',
    nightWin: '',
    nightBlocker: '',
    tomorrowTarget: '',
    hasMorning: false,
    hasNight: false
  });
});

test('getByDate rejects impossible calendar dates', async (t) => {
  const { service, calls } = loadService(t);

  await assert.rejects(
    service.getByDate('user-1', '2026-02-30'),
    {
      message: 'Valid date (YYYY-MM-DD) is required.',
      statusCode: 400
    }
  );

  assert.equal(calls.findOne.length, 0);
});

test('getByDate rejects malformed date strings', async (t) => {
  const { service, calls } = loadService(t);

  const invalidDates = [
    '2026-1-1',
    '26-11-14',
    'not-a-date',
    '',
    null,
    undefined
  ];

  for (const date of invalidDates) {
    await assert.rejects(
      service.getByDate('user-1', date),
      {
        statusCode: 400
      }
    );
  }

  assert.equal(calls.findOne.length, 0);
});

test('getByDate accepts a valid leap day', async (t) => {
  const { service, calls } = loadService(t, {
    findOneResult: null
  });

  const result = await service.getByDate(
    'user-1',
    '2028-02-29'
  );

  assert.equal(result.date, '2028-02-29');
  assert.equal(calls.findOne.length, 1);
});

test('upsert stores only supplied ritual fields for the specified user and date', async (t) => {
  const { service, calls } = loadService(t);

  const result = await service.upsert(
    'user-1',
    '2026-11-14',
    {
      morningPlan: '  Start early  ',
      nightWin: 'Completed a task'
    }
  );

  assert.equal(calls.findOneAndUpdate.length, 1);

  const call = calls.findOneAndUpdate[0];

  assert.deepEqual(call.filter, {
    userId: 'user-1',
    date: '2026-11-14'
  });

  assert.deepEqual(call.update, {
    $set: {
      morningPlan: 'Start early',
      nightWin: 'Completed a task'
    }
  });

  assert.deepEqual(call.options, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true
  });

  assert.equal(result.morningPlan, 'Start early');
  assert.equal(result.nightWin, 'Completed a task');
});

test('upsert rejects impossible dates before database access', async (t) => {
  const { service, calls } = loadService(t);

  await assert.rejects(
    service.upsert('user-1', '2026-04-31', {
      morningPlan: 'Test'
    }),
    {
      statusCode: 400
    }
  );

  assert.equal(calls.findOneAndUpdate.length, 0);
});

test('upsert rejects requests without ritual fields', async (t) => {
  const { service, calls } = loadService(t);

  await assert.rejects(
    service.upsert('user-1', '2026-11-14', {}),
    {
      message: 'No ritual fields to update.',
      statusCode: 400
    }
  );

  assert.equal(calls.findOneAndUpdate.length, 0);
});

test('upsert rejects non-string ritual field values', async (t) => {
  const { service, calls } = loadService(t);

  await assert.rejects(
    service.upsert('user-1', '2026-11-14', {
      morningPlan: 123
    }),
    {
      message: 'Ritual fields must be strings.',
      statusCode: 400
    }
  );

  assert.equal(calls.findOneAndUpdate.length, 0);
});

test('upsert trims and clips ritual fields to their existing limits', async (t) => {
  const { service, calls } = loadService(t);

  await service.upsert(
    'user-1',
    '2026-11-14',
    {
      morningPlan: ` ${'a'.repeat(350)} `,
      nightWin: ` ${'b'.repeat(350)} `,
      nightBlocker: ` ${'c'.repeat(350)} `,
      tomorrowTarget: ` ${'d'.repeat(250)} `
    }
  );

  const update = calls.findOneAndUpdate[0].update.$set;

  assert.equal(update.morningPlan.length, 300);
  assert.equal(update.nightWin.length, 300);
  assert.equal(update.nightBlocker.length, 300);
  assert.equal(update.tomorrowTarget.length, 200);

  assert.equal(update.morningPlan, 'a'.repeat(300));
  assert.equal(update.nightWin, 'b'.repeat(300));
  assert.equal(update.nightBlocker, 'c'.repeat(300));
  assert.equal(update.tomorrowTarget, 'd'.repeat(200));
});

test('upsert converts null ritual field values to empty strings', async (t) => {
  const { service, calls } = loadService(t);

  await service.upsert(
    'user-1',
    '2026-11-14',
    {
      morningPlan: null
    }
  );

  assert.deepEqual(
    calls.findOneAndUpdate[0].update,
    {
      $set: {
        morningPlan: ''
      }
    }
  );
});

test('shape flags correctly represent morning and night content', async (t) => {
  const { service } = loadService(t, {
    updateResult: {
      date: '2026-11-14',
      morningPlan: '',
      nightWin: '',
      nightBlocker: 'Avoided distractions',
      tomorrowTarget: '',
      updatedAt: new Date('2026-11-14T18:00:00.000Z')
    }
  });

  const result = await service.upsert(
    'user-1',
    '2026-11-14',
    {
      nightBlocker: 'Avoided distractions'
    }
  );

  assert.equal(result.hasMorning, false);
  assert.equal(result.hasNight, true);
  assert.equal(result.nightBlocker, 'Avoided distractions');
});
