
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dashboardPath = path.resolve(
  __dirname,
  '../src/pages/Dashboard.jsx'
);

const dashboardSource = fs.readFileSync(dashboardPath, 'utf8');

test('Dashboard imports the shared date utility with correct casing', () => {
  assert.match(
    dashboardSource,
    /import\s*\{\s*getDateKey\s*,\s*normalizeTimeZone\s*\}\s*from\s*['"]\.\.\/utils\/dateKey['"]/
  );
});

test('Dashboard reads the authenticated user timezone', () => {
  assert.match(
    dashboardSource,
    /const\s+timeZone\s*=\s*normalizeTimeZone\(user\?\.timezone\)/
  );
});

test('Dashboard calculates today using the shared date utility', () => {
  assert.match(
    dashboardSource,
    /const\s+todayDateKey\s*=\s*getDateKey\(currentDate,\s*timeZone\)/
  );

  assert.doesNotMatch(
    dashboardSource,
    /toISOString\(\)\.split\(['"]T['"]\)\[0\]/
  );
});

test('Dashboard formats its header date in the user timezone', () => {
  assert.match(
    dashboardSource,
    /currentDate\.toLocaleDateString\(['"]en-PK['"],\s*\{[\s\S]*?timeZone/
  );

  assert.match(dashboardSource, /\{formattedDate\}/);
});

test('Dashboard highlights today using the timezone-aware date key', () => {
  assert.match(
    dashboardSource,
    /day\.date\s*===\s*todayDateKey/
  );

  assert.doesNotMatch(dashboardSource, /TODAY\(\)/);
});
