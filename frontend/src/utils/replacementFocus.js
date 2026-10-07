/**
 * Pick the weakest habit-replacement pair for a calm "focus" card.
 * Uses existing pair.stats from the API (no extra request).
 */

/**
 * @param {Array<object>} pairs
 * @returns {{ pair: object, rate: number|null, message: string } | null}
 */
export function buildReplacementFocus(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  // Prefer pairs with enough data and lowest successRate
  const withRate = pairs
    .map((p) => ({
      pair: p,
      rate:
        p.stats?.successRate == null || Number.isNaN(Number(p.stats.successRate))
          ? null
          : Number(p.stats.successRate),
      insufficient: Boolean(p.stats?.insufficientData)
    }))
    .filter(Boolean);

  const ranked = [...withRate].sort((a, b) => {
    // Known rates first, lowest first
    if (a.rate != null && b.rate != null) return a.rate - b.rate;
    if (a.rate != null) return -1;
    if (b.rate != null) return 1;
    return 0;
  });

  const pick = ranked[0];
  if (!pick) return null;

  const bad =
    pick.pair.badHabitLabel || pick.pair.badHabitName || pick.pair.badHabit || 'Bad habit';
  const good =
    pick.pair.goodHabitLabel || pick.pair.goodHabitName || pick.pair.goodHabit || 'Good habit';
  const label = `${bad} → ${good}`;

  let message;
  if (pick.insufficient || pick.rate == null) {
    message = `${label} is still building data. Log both sides a few more days for a clear success rate.`;
  } else if (pick.rate < 40) {
    message = `${label} is at ${pick.rate}% in this window. One clean day — avoid the bad, do the good — moves the needle.`;
  } else if (pick.rate < 70) {
    message = `${label} is at ${pick.rate}%. Solid progress; protect it when you log today.`;
  } else {
    // Even strong pairs can be "focus" if it's the only/lowest
    message = `${label} leads at ${pick.rate}%. Keep the replacement habit when you log today.`;
  }

  return {
    pair: pick.pair,
    rate: pick.rate,
    label,
    message,
    progressLabel: pick.pair.stats?.progressLabel || null
  };
}