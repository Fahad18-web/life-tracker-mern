
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeEntries,
  buildEntryRows,
  buildReportSummary,
  getLocalDateStamp
} from '../src/utils/exportPdf.js';

test('normalizeEntries supports an entries array', () => {
  const entries = [{ date: '2026-11-14' }];

  assert.deepEqual(normalizeEntries({ entries }), entries);
});

test('normalizeEntries supports the legacy logs array', () => {
  const entries = [{ date: '2026-11-14' }];

  assert.deepEqual(normalizeEntries({ logs: entries }), entries);
});

test('normalizeEntries supports nested data.entries', () => {
  const entries = [{ date: '2026-11-14' }];

  assert.deepEqual(normalizeEntries({ data: { entries } }), entries);
});

test('normalizeEntries supports a direct array', () => {
  const entries = [{ date: '2026-11-14' }];

  assert.deepEqual(normalizeEntries(entries), entries);
});

test('normalizeEntries safely handles empty and unsupported payloads', () => {
  assert.deepEqual(normalizeEntries(null), []);
  assert.deepEqual(normalizeEntries(undefined), []);
  assert.deepEqual(normalizeEntries({}), []);
  assert.deepEqual(normalizeEntries({ entries: 'invalid' }), []);
});

test('buildEntryRows includes completed default good and bad habits', () => {
  const rows = buildEntryRows([
    {
      date: '2026-11-14',
      netScore: 75,
      grade: 'B',
      mood: 4,
      good: {
        morning: true,
        exercise: true,
        reading: false
      },
      bad: {
        social: true,
        procrastination: false,
        junk: true
      },
      customHabits: [],
      notes: 'A productive day.'
    }
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0][0], '2026-11-14');
  assert.equal(rows[0][1], '75');
  assert.equal(rows[0][2], 'B');
  assert.equal(rows[0][3], '4/5');
  assert.equal(rows[0][4], 'Morning, Exercise');
  assert.equal(rows[0][5], 'Social, Junk food');
  assert.equal(rows[0][6], 'None');
  assert.equal(rows[0][7], 'A productive day.');
});

test('buildEntryRows includes custom good and bad habits with their status', () => {
  const rows = buildEntryRows([
    {
      date: '2026-11-15',
      good: {},
      bad: {},
      customHabits: [
        {
          name: 'Learn TypeScript',
          type: 'good',
          completed: true
        },
        {
          name: 'Avoid late scrolling',
          type: 'bad',
          completed: false
        },
        {
          name: 'Daily journaling',
          type: 'good',
          completed: false
        }
      ]
    }
  ]);

  assert.equal(
    rows[0][6],
    [
      'Good: Learn TypeScript (Completed)',
      'Bad: Avoid late scrolling (Not completed)',
      'Good: Daily journaling (Not completed)'
    ].join('\n')
  );
});

test('buildEntryRows safely handles missing fields and malformed entries', () => {
  const rows = buildEntryRows([
    {},
    null,
    {
      date: '',
      netScore: 'invalid',
      grade: null,
      mood: NaN,
      good: null,
      bad: [],
      customHabits: null,
      notes: ''
    }
  ]);

  assert.deepEqual(rows[0], [
    '—',
    '—',
    '—',
    '—',
    'None',
    'None',
    'None',
    '—'
  ]);

  assert.deepEqual(rows[1], [
    '—',
    '—',
    '—',
    '—',
    'None',
    'None',
    'None',
    '—'
  ]);

  assert.deepEqual(rows[2], [
    '—',
    '—',
    '—',
    '—',
    'None',
    'None',
    'None',
    '—'
  ]);
});

test('buildEntryRows returns an empty array for invalid input', () => {
  assert.deepEqual(buildEntryRows(null), []);
  assert.deepEqual(buildEntryRows(undefined), []);
  assert.deepEqual(buildEntryRows({}), []);
});

test('buildReportSummary calculates entry count and averages', () => {
  const summary = buildReportSummary([
    { netScore: 80, mood: 4, grade: 'B' },
    { netScore: 60, mood: 3, grade: 'C' },
    { netScore: 100, mood: 5, grade: 'A' }
  ]);

  assert.deepEqual(summary, {
    entryCount: 3,
    averageScore: 80,
    averageMood: 4,
    gradeCounts: {
      B: 1,
      C: 1,
      A: 1
    }
  });
});

test('buildReportSummary ignores missing and invalid numeric values', () => {
  const summary = buildReportSummary([
    { netScore: 80, mood: 4, grade: 'B' },
    { netScore: null, mood: 'invalid', grade: '' },
    { netScore: NaN, mood: Infinity, grade: null }
  ]);

  assert.deepEqual(summary, {
    entryCount: 3,
    averageScore: 80,
    averageMood: 4,
    gradeCounts: {
      B: 1
    }
  });
});

test('buildReportSummary handles an empty export', () => {
  assert.deepEqual(buildReportSummary([]), {
    entryCount: 0,
    averageScore: null,
    averageMood: null,
    gradeCounts: {}
  });
});

test('getLocalDateStamp uses the local calendar date', () => {
  const date = new Date(2026, 10, 16, 0, 30);

  assert.equal(getLocalDateStamp(date), '2026-11-16');
});

test('getLocalDateStamp pads month and day with zeroes', () => {
  const date = new Date(2026, 0, 5, 12, 0);

  assert.equal(getLocalDateStamp(date), '2026-01-05');
});

test('getLocalDateStamp rejects invalid dates', () => {
  assert.throws(
    () => getLocalDateStamp(new Date('invalid')),
    {
      name: 'TypeError',
      message: 'A valid Date instance is required.'
    }
  );

  assert.throws(
    () => getLocalDateStamp('2026-11-16'),
    TypeError
  );
});
