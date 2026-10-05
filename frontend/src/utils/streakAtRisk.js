/**
 * Derive streaks that are at risk if the user does not complete them today.
 * Calm, non-shaming messages — production-safe pure function.
 */

const DEFAULT_LABELS = {
  morning: 'Morning routine',
  exercise: 'Exercise',
  reading: 'Reading',
  prayer: 'Prayer',
  coding: 'Coding',
  sleep: 'Sleep',
  diet: 'Diet',
  hydration: 'Hydration'
};

/** Minimum streak length before we surface "at risk" (avoids noise). */
const MIN_STREAK = 3;

/**
 * @param {object} opts
 * @param {object|null} opts.today - today's entry or null
 * @param {number} opts.overallStreak
 * @param {Record<string, number>} opts.streaks - default good habits
 * @param {Record<string, { name?: string, emoji?: string, type?: string, streak?: number }>} opts.customStreaks
 * @returns {{ items: Array<{ id: string, label: string, streak: number, kind: string }>, primary: object|null }}
 */
export function buildStreakAtRisk({
  today,
  overallStreak = 0,
  streaks = {},
  customStreaks = {}
}) {
  const items = [];

  // Overall logging streak: at risk only if nothing logged today
  if (!today && overallStreak >= MIN_STREAK) {
    items.push({
      id: 'overall',
      kind: 'overall',
      label: 'Daily logging',
      streak: overallStreak,
      message: `Your ${overallStreak}-day logging streak needs today’s entry to continue.`
    });
  }

  // Default good habits
  for (const [key, n] of Object.entries(streaks)) {
    const streak = Number(n) || 0;
    if (streak < MIN_STREAK) continue;

    const doneToday = Boolean(today?.good?.[key]);
    // No entry today → all active streaks at risk; entry but habit off → at risk
    if (!today || !doneToday) {
      const label = DEFAULT_LABELS[key] || key;
      items.push({
        id: `good:${key}`,
        kind: 'habit',
        label,
        streak,
        message: `${label}: ${streak}-day streak — mark it today to keep it going.`
      });
    }
  }

  // Custom good habits only
  for (const [key, meta] of Object.entries(customStreaks)) {
    if (meta?.type === 'bad') continue;
    const streak = Number(meta?.streak) || 0;
    if (streak < MIN_STREAK) continue;

    let doneToday = false;
    if (today?.customHabits?.length) {
      const match = today.customHabits.find(
        (h) => (h.habitId?.toString?.() || h.name) === key || h.name === meta.name
      );
      doneToday = Boolean(match?.completed);
    }

    if (!today || !doneToday) {
      const label = meta.name || key;
      items.push({
        id: `custom:${key}`,
        kind: 'custom',
        label,
        streak,
        message: `${label}: ${streak}-day streak — complete it in today’s log to protect it.`
      });
    }
  }

  // Highest streak first; cap list
  items.sort((a, b) => b.streak - a.streak);
  const top = items.slice(0, 3);

  return {
    items: top,
    primary: top[0] || null
  };
}