
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profilePath = path.resolve(
  __dirname,
  '../src/pages/Profile.jsx'
);

const source = fs.readFileSync(profilePath, 'utf8');

test('Profile has a dedicated date-only formatter', () => {
  assert.match(source, /function formatCalendarDate\(dateString, options = \{\}\)/);
});

test('Calendar date formatter explicitly uses UTC', () => {
  assert.match(
    source,
    /timeZone:\s*['"]UTC['"]/
  );

  assert.match(
    source,
    /new Date\(`\$\{dateString\}T12:00:00\.000Z`\)/
  );
});

test('Calendar formatter handles missing and invalid dates', () => {
  assert.match(
    source,
    /typeof dateString !== ['"]string['"]/
  );

  assert.match(
    source,
    /Number\.isNaN\(date\.getTime\(\)\)/
  );
});

test('Best score date prefers bestDay and falls back to bestDate', () => {
  assert.match(
    source,
    /const bestScoreDate = stats\?\.bestDay \|\| stats\?\.bestDate/
  );
});

test('Best score date uses the shared calendar date formatter', () => {
  assert.match(
    source,
    /formatCalendarDate\(bestScoreDate,\s*\{[\s\S]*?month:\s*['"]short['"][\s\S]*?day:\s*['"]numeric['"]/
  );
});

test('Member since retains timestamp-based formatting', () => {
  assert.match(
    source,
    /new Date\(profile\.createdAt\)\.toLocaleDateString/
  );
});

test('Profile continues displaying backend overall streak', () => {
  assert.match(source, /stats\.overallStreak/);
});

test('Profile API integration remains intact', () => {
  assert.match(source, /fetchProfile\(\)/);
  assert.match(source, /updateProfile\(/);
  assert.match(source, /changePassword\(/);
  assert.match(source, /deleteAccount\(/);
});

test('Existing account and avatar functionality is preserved', () => {
  assert.match(source, /handleAvatarSelect/);
  assert.match(source, /AVATAR_PRESETS\.map/);
  assert.match(source, /handleEditSave/);
  assert.match(source, /handlePassSave/);
  assert.match(source, /handleDelete/);
});
