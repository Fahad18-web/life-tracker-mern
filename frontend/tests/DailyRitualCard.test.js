
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const componentUrl = new URL(
  '../src/components/DailyRitualCard.jsx',
  import.meta.url
);

const source = await readFile(componentUrl, 'utf8');

test('component reads the authenticated user timezone', () => {
  assert.match(source, /import\s+\{\s*useAuth\s*\}\s+from\s+['"]\.\.\/contexts\/AuthContext['"]/);
  assert.match(source, /const\s+\{\s*user\s*\}\s*=\s*useAuth\(\)/);
});

test('component uses the shared timezone-aware date utility', () => {
  assert.match(source, /import\s+\{\s*getDateKey\s*\}\s+from\s+['"]\.\.\/utils\/dateKey['"]/);
  assert.match(
    source,
    /getDateKey\(new Date\(\),\s*user\?\.timezone\)/
  );
});

test('an explicitly supplied date takes priority', () => {
  assert.match(
    source,
    /providedDate\s*\|\|\s*getDateKey\(new Date\(\),\s*user\?\.timezone\)/
  );
});

test('ritual load and save operations use the resolved date', () => {
  assert.match(source, /getRitual\(date\)/);
  assert.match(source, /saveRitual\(date,/);
});
