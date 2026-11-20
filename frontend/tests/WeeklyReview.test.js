
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const weeklyReviewPath = path.resolve(
  __dirname,
  '../src/pages/WeeklyReview.jsx'
);

const source = fs.readFileSync(weeklyReviewPath, 'utf8');

test('WeeklyReview uses explicit UTC for calendar date formatting', () => {
  assert.match(
    source,
    /timeZone:\s*['"]UTC['"]/
  );
});

test('Date range formatting uses explicit UTC options', () => {
  assert.match(
    source,
    /DATE_FORMAT_OPTIONS\s*=\s*\{[^}]*timeZone:\s*['"]UTC['"]/s
  );

  assert.match(
    source,
    /DATE_RANGE_END_OPTIONS\s*=\s*\{/
  );

  assert.match(
    source,
    /toLocaleDateString\(\s*['"]en-PK['"],\s*DATE_FORMAT_OPTIONS/
  );
});

test('Daily overview weekday labels use explicit UTC formatting', () => {
  assert.match(
    source,
    /WEEKDAY_FORMAT_OPTIONS\s*=\s*\{\s*weekday:\s*['"]narrow['"],\s*timeZone:\s*['"]UTC['"]\s*\}/
  );

  assert.match(
    source,
    /toLocaleDateString\(\s*['"]en['"],\s*WEEKDAY_FORMAT_OPTIONS/
  );
});

test('Week navigation uses UTC calendar arithmetic', () => {
  assert.match(source, /setUTCDate/);
  assert.match(source, /getUTCDate/);
});

test('ISO week calculation uses UTC date methods', () => {
  assert.match(source, /getUTCDay/);
  assert.match(source, /getUTCFullYear/);
  assert.match(source, /setUTCDate/);
});

test('Weekly review API receives the selected week start', () => {
  assert.match(
    source,
    /fetchWeeklyReview\(ws\s*\|\|\s*undefined\)/
  );

  assert.match(
    source,
    /saveWeeklyReview\(weekStart,\s*\{/
  );
});

test('Weekly review preserves all four reflection fields', () => {
  for (const field of [
    'wentWell',
    'challenges',
    'improve',
    'priority'
  ]) {
    assert.match(source, new RegExp(`\\b${field}\\b`));
  }
});

test('Completing a review still requires all four fields', () => {
  assert.match(
    source,
    /PROMPTS\.every/
  );

  assert.match(
    source,
    /nextStatus\s*===\s*['"]completed['"]\s*&&\s*!fieldsComplete/
  );
});

test('Weekly review retains draft and completed statuses', () => {
  assert.match(source, /status:\s*['"]draft['"]/);
  assert.match(source, /handleSave\(['"]draft['"]\)/);
  assert.match(source, /handleSave\(['"]completed['"]\)/);
});
