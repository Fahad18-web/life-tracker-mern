/**
 * Streak recovery (comeback) — pure helper.
 * Goal: rebuild logging streak to 3 days after a break.
 * No backend / no second streak engine.
 */

const RECOVERY_TARGET = 3;

/**
 * @param {object} opts
 * @param {boolean} opts.hasLoggedToday
 * @param {number} opts.overallStreak
 * @param {boolean} opts.hasHistory
 * @returns {{
 *   active: boolean,
 *   mode: 'start' | 'progress' | null,
 *   day: number,
 *   target: number,
 *   title: string,
 *   message: string
 * }}
 */
export function buildStreakRecovery({
  hasLoggedToday = false,
  overallStreak = 0,
  hasHistory = false
}) {
  const streak = Number(overallStreak) || 0;

  if (!hasHistory) {
    return {
      active: false,
      mode: null,
      day: 0,
      target: RECOVERY_TARGET,
      title: '',
      message: ''
    };
  }

  // Broken chain: no log today, streak 0
  if (!hasLoggedToday && streak === 0) {
    return {
      active: true,
      mode: 'start',
      day: 0,
      target: RECOVERY_TARGET,
      title: 'Start a 3-day comeback',
      message:
        'You missed a day (or more). That is okay. Log today to begin a short comeback — no guilt, just show up.'
    };
  }

  // Rebuilding: streak 1 or 2 (only meaningful if user already had history)
  if (streak >= 1 && streak < RECOVERY_TARGET) {
    return {
      active: true,
      mode: 'progress',
      day: streak,
      target: RECOVERY_TARGET,
      title: `Comeback day ${streak} of ${RECOVERY_TARGET}`,
      message: hasLoggedToday
        ? 'Nice — keep the chain going tomorrow. Three days in a row rebuilds the rhythm.'
        : 'You are rebuilding. Log today so this comeback does not reset.'
    };
  }

  return {
    active: false,
    mode: null,
    day: streak,
    target: RECOVERY_TARGET,
    title: '',
    message: ''
  };
}