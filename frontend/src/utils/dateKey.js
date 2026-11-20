
'use strict';

export const DEFAULT_TIME_ZONE = 'Asia/Karachi';

/**
 * Returns a valid IANA timezone.
 * Invalid, missing, or blank values fall back to the app default.
 */
export function normalizeTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) {
    return DEFAULT_TIME_ZONE;
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone.trim()
    }).resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/**
 * Returns a YYYY-MM-DD calendar date for a specific timezone.
 *
 * Important:
 * - Uses the supplied timezone, not the browser's local timezone.
 * - Does not convert the date through UTC ISO strings.
 * - Defaults to Asia/Karachi when no valid timezone is supplied.
 *
 * @param {Date} date - Instant to convert.
 * @param {string} timeZone - Valid IANA timezone.
 * @returns {string} YYYY-MM-DD
 */
export function getDateKey(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('A valid Date instance is required.');
  }

  const normalizedTimeZone = normalizeTimeZone(timeZone);

  const parts = new Intl.DateTimeFormat(
    'en-US-u-ca-gregory-nu-latn',
    {
      timeZone: normalizedTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) =>
        type === 'year' || type === 'month' || type === 'day'
      )
      .map(({ type, value }) => [type, value])
  );

  return `${values.year.padStart(4, '0')}-${values.month}-${values.day}`;
}
