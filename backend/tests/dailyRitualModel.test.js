
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const DailyRitual = require('../models/DailyRitual');

function createRitual(date, overrides = {}) {
  return new DailyRitual({
    userId: new mongoose.Types.ObjectId(),
    date,
    ...overrides
  });
}

test('model accepts a valid calendar date', () => {
  const ritual = createRitual('2026-11-14');

  const error = ritual.validateSync();

  assert.equal(error, undefined);
});

test('model accepts a valid leap day', () => {
  const ritual = createRitual('2028-02-29');

  const error = ritual.validateSync();

  assert.equal(error, undefined);
});

test('model rejects an impossible February date', () => {
  const ritual = createRitual('2026-02-30');

  const error = ritual.validateSync();

  assert.ok(error);
  assert.ok(error.errors.date);
});

test('model rejects an invalid leap day', () => {
  const ritual = createRitual('2027-02-29');

  const error = ritual.validateSync();

  assert.ok(error);
  assert.ok(error.errors.date);
});

test('model rejects invalid month values', () => {
  const invalidDates = [
    '2026-00-10',
    '2026-13-01'
  ];

  for (const date of invalidDates) {
    const ritual = createRitual(date);
    const error = ritual.validateSync();

    assert.ok(error, `Expected ${date} to be rejected`);
    assert.ok(error.errors.date);
  }
});

test('model rejects malformed date formats', () => {
  const invalidDates = [
    '2026-1-1',
    '26-11-14',
    '14-11-2026',
    'not-a-date',
    ''
  ];

  for (const date of invalidDates) {
    const ritual = createRitual(date);
    const error = ritual.validateSync();

    assert.ok(error, `Expected ${date} to be rejected`);
    assert.ok(error.errors.date);
  }
});

test('model requires the date field', () => {
  const ritual = createRitual(undefined);

  const error = ritual.validateSync();

  assert.ok(error);
  assert.ok(error.errors.date);
});

test('model preserves existing field defaults', () => {
  const ritual = createRitual('2026-11-14');

  assert.equal(ritual.morningPlan, '');
  assert.equal(ritual.nightWin, '');
  assert.equal(ritual.nightBlocker, '');
  assert.equal(ritual.tomorrowTarget, '');
});

test('model preserves existing field length limits', () => {
  const ritual = createRitual('2026-11-14', {
    morningPlan: 'a'.repeat(301),
    nightWin: 'b'.repeat(301),
    nightBlocker: 'c'.repeat(301),
    tomorrowTarget: 'd'.repeat(201)
  });

  const error = ritual.validateSync();

  assert.ok(error);
  assert.ok(error.errors.morningPlan);
  assert.ok(error.errors.nightWin);
  assert.ok(error.errors.nightBlocker);
  assert.ok(error.errors.tomorrowTarget);
});

test('model retains the compound user and date index', () => {
  const indexes = DailyRitual.schema.indexes();

  const compoundIndex = indexes.find(
    ([fields, options]) =>
      fields.userId === 1 &&
      fields.date === 1 &&
      options.unique === true
  );

  assert.ok(
    compoundIndex,
    'Expected unique compound index on userId and date'
  );
});
