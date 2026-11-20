
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logPath = path.resolve(
  __dirname,
  '../src/pages/Log.jsx'
);

const source = fs.readFileSync(logPath, 'utf8');

test('Log imports shared date utilities with correct casing', () => {
  assert.match(
    source,
    /import\s*\{\s*getDateKey\s*,\s*normalizeTimeZone\s*\}\s*from\s*['"]\.\.\/utils\/dateKey['"]/
  );
});

test('Log reads timezone from the authenticated user', () => {
  assert.match(
    source,
    /const\s+\{\s*user\s*\}\s*=\s*useAuth\(\)/
  );

  assert.match(
    source,
    /normalizeTimeZone\(user\?\.timezone\)/
  );
});

test('Log calculates today using the shared timezone-aware date utility', () => {
  assert.match(
    source,
    /getDateKey\(currentDate,\s*timeZone\)/
  );

  assert.doesNotMatch(
    source,
    /toISOString\(\)\.split\(['"]T['"]\)\[0\]/
  );
});

test('Log header formats its date using the authenticated timezone', () => {
  assert.match(
    source,
    /currentDate\.toLocaleDateString\(['"]en-PK['"],\s*\{[\s\S]*?timeZone/
  );

  assert.match(source, /\{formattedDate\}/);
});

test('Entry loading uses the timezone-aware today date', () => {
  assert.match(
    source,
    /fetchEntryDate\(today\)/
  );

  assert.match(
    source,
    /useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[today\]\)/
  );
});

test('Entry saving uses the same timezone-aware date key', () => {
  assert.match(
    source,
    /saveEntry\(\{[\s\S]*?date:\s*today/
  );
});

test('Existing habit scoring and entry payload fields are preserved', () => {
  assert.match(source, /function calcScore\(/);
  assert.match(source, /Math\.round\(gs - bs \* 0\.5\)/);
  assert.match(source, /customHabits:\s*customHabitsPayload/);
  assert.match(source, /good,\s*bad,\s*mood,\s*notes/);
});

test('Old UTC TODAY helper is removed', () => {
  assert.doesNotMatch(source, /const\s+TODAY\s*=/);
});

