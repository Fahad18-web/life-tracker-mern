'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const u = require('../utils/dateUtils');

test('date near midnight resolves in the user timezone, not UTC', () => {
  // 01:30 AM PKT on 13 Nov == 20:30 UTC on 12 Nov
  const instant = new Date('2026-11-12T20:30:00Z');
  assert.equal(u.getTodayInTimeZone('Asia/Karachi', instant), '2026-11-13');
  assert.equal(instant.toISOString().slice(0, 10), '2026-11-12'); // the old, wrong answer
});

test('hour is 0 at local midnight (never 24)', () => {
  assert.equal(u.getHourInTimeZone('Asia/Karachi', new Date('2026-11-12T19:00:00Z')), 0);
  assert.equal(u.getHourInTimeZone('Asia/Karachi', new Date('2026-11-12T18:59:00Z')), 23);
});

test('invalid / missing timezone falls back to Asia/Karachi', () => {
  assert.equal(u.normalizeTimeZone('Foo/Bar'), 'Asia/Karachi');
  assert.equal(u.normalizeTimeZone(''), 'Asia/Karachi');
  assert.equal(u.normalizeTimeZone(undefined), 'Asia/Karachi');
  assert.equal(u.normalizeTimeZone('America/New_York'), 'America/New_York');
});

test('addDaysToDateString handles month, year and leap boundaries', () => {
  assert.equal(u.addDaysToDateString('2026-12-31', 1), '2027-01-01');
  assert.equal(u.addDaysToDateString('2028-02-28', 1), '2028-02-29');
  assert.equal(u.addDaysToDateString('2027-02-28', 1), '2027-03-01');
  assert.equal(u.addDaysToDateString('2026-03-01', -1), '2026-02-28');
});

test('DST changes never shift calendar arithmetic', () => {
  assert.equal(u.addDaysToDateString('2026-03-07', 2), '2026-03-09');
  assert.equal(u.addDaysToDateString('2026-10-31', 2), '2026-11-02');
});

test('isValidDateString rejects impossible dates', () => {
  for (const bad of ['2026-02-30', '2026-13-01', '2026-00-10', 'abc', '2026-1-1', '', null]) {
    assert.equal(u.isValidDateString(bad), false, String(bad));
  }
  assert.equal(u.isValidDateString('2028-02-29'), true);
});

test('Monday is the start of the week', () => {
  assert.equal(u.getMondayDateString('2026-11-09'), '2026-11-09'); // Monday
  assert.equal(u.getMondayDateString('2026-11-13'), '2026-11-09'); // Friday
  assert.equal(u.getMondayDateString('2026-11-15'), '2026-11-09'); // Sunday
});

test('getDateRangeEndingOn is oldest-first and inclusive', () => {
  assert.deepEqual(u.getDateRangeEndingOn('2026-03-01', 3), ['2026-02-27', '2026-02-28', '2026-03-01']);
  assert.throws(() => u.getDateRangeEndingOn('2026-03-01', 0), TypeError);
});

test('out-of-range results throw instead of returning garbage', () => {
  assert.throws(() => u.addDaysToDateString('9999-12-31', 1), RangeError);
});

test('repeated calls are cached and stay cheap', () => {
  const start = process.hrtime.bigint();
  for (let i = 0; i < 20000; i += 1) u.getTodayInTimeZone('Asia/Karachi');
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(ms < 1500, `20k calls took ${ms}ms`);
});