
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TIME_ZONE,
  getDateKey,
  normalizeTimeZone
} from '../src/utils/dateKey.js';

test('uses Asia/Karachi as the default timezone', () => {
  assert.equal(DEFAULT_TIME_ZONE, 'Asia/Karachi');
  assert.equal(
    getDateKey(new Date('2026-11-14T20:00:00.000Z')),
    '2026-11-15'
  );
});

test('uses the supplied timezone instead of UTC', () => {
  const instant = new Date('2026-11-14T20:00:00.000Z');

  assert.equal(getDateKey(instant, 'UTC'), '2026-11-14');
  assert.equal(getDateKey(instant, 'Asia/Karachi'), '2026-11-15');
  assert.equal(getDateKey(instant, 'Asia/Tokyo'), '2026-11-15');
});

test('handles the exact Karachi midnight boundary', () => {
  assert.equal(
    getDateKey(new Date('2026-11-14T18:59:59.000Z'), 'Asia/Karachi'),
    '2026-11-14'
  );

  assert.equal(
    getDateKey(new Date('2026-11-14T19:00:00.000Z'), 'Asia/Karachi'),
    '2026-11-15'
  );
});

test('normalizes valid IANA timezones', () => {
  assert.equal(normalizeTimeZone('Asia/Karachi'), 'Asia/Karachi');
  assert.equal(normalizeTimeZone('UTC'), 'UTC');
  assert.equal(normalizeTimeZone('America/New_York'), 'America/New_York');
});

test('falls back for missing or invalid timezones', () => {
  assert.equal(normalizeTimeZone(undefined), DEFAULT_TIME_ZONE);
  assert.equal(normalizeTimeZone(null), DEFAULT_TIME_ZONE);
  assert.equal(normalizeTimeZone(''), DEFAULT_TIME_ZONE);
  assert.equal(normalizeTimeZone('Not/A_Timezone'), DEFAULT_TIME_ZONE);

  assert.equal(
    getDateKey(new Date('2026-11-14T20:00:00.000Z'), 'Invalid/Zone'),
    '2026-11-15'
  );
});

test('rejects invalid Date values', () => {
  assert.throws(
    () => getDateKey(new Date('invalid')),
    { name: 'TypeError' }
  );

  assert.throws(
    () => getDateKey('2026-11-14'),
    { name: 'TypeError' }
  );
});

test('preserves the correct date across daylight-saving transitions', () => {
  assert.equal(
    getDateKey(new Date('2026-03-08T07:00:00.000Z'), 'America/New_York'),
    '2026-03-08'
  );
});
