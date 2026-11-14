'use strict';

const DEFAULT_TIME_ZONE = 'Asia/Karachi';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Validate a calendar date without relying on the host machine's timezone.
 * Handles years 0001–0099 without Date.UTC()'s special year behaviour.
 */
function parseDateString(dateString) {
  if (typeof dateString !== 'string') {
    throw new TypeError('dateString must be a YYYY-MM-DD string.');
  }

  const match = DATE_PATTERN.exec(dateString);
  if (!match) {
    throw new RangeError('dateString must use the YYYY-MM-DD format.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new RangeError('dateString is not a valid calendar date.');
  }

  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('dateString is not a valid calendar date.');
  }

  return date;
}

function isValidDateString(dateString) {
  try {
    parseDateString(dateString);
    return true;
  } catch {
    return false;
  }
}

const validTimeZones = new Set();
const invalidTimeZones = new Set();

/**
 * Return a supported IANA timezone.
 * Invalid or missing values use the established app default.
 */
function normalizeTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || timeZone.trim() === '') {
    return DEFAULT_TIME_ZONE;
  }

  const candidate = timeZone.trim();

  if (validTimeZones.has(candidate)) return candidate;
  if (invalidTimeZones.has(candidate)) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: candidate
    });

    validTimeZones.add(candidate);
    return candidate;
  } catch {
    // Bounded: user input must not be able to grow this set forever.
    if (invalidTimeZones.size < 200) invalidTimeZones.add(candidate);
    return DEFAULT_TIME_ZONE;
  }
}

// Building an Intl.DateTimeFormat is expensive (~0.1 ms). Cache one per
// (timezone, kind) so cron loops over many users stay cheap.
const formatterCache = new Map();

function getFormatter(kind, timeZone) {
  const key = `${kind}|${timeZone}`;
  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter =
      kind === 'date'
        ? new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        : new Intl.DateTimeFormat('en-GB', {
            timeZone,
            hour: '2-digit',
            hourCycle: 'h23'
          });
    formatterCache.set(key, formatter);
  }

  return formatter;
}

function assertValidDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('instant must be a valid Date object.');
  }
}

/**
 * Resolve an instant to YYYY-MM-DD in the supplied IANA timezone.
 */
function getDateStringInTimeZone(
  timeZone = DEFAULT_TIME_ZONE,
  instant = new Date()
) {
  assertValidDate(instant);

  const formatter = getFormatter('date', normalizeTimeZone(timeZone));

  const parts = formatter.formatToParts(instant);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return [
    String(values.year).padStart(4, '0'),
    values.month,
    values.day
  ].join('-');
}

/**
 * "Today" (YYYY-MM-DD) for a user's timezone. Single source of truth for
 * every backend feature that needs the current calendar day.
 */
function getTodayInTimeZone(timeZone = DEFAULT_TIME_ZONE, now = new Date()) {
  return getDateStringInTimeZone(timeZone, now);
}

/**
 * Resolve the local hour (0–23).
 * h23 prevents midnight from being returned as 24.
 */
function getHourInTimeZone(
  timeZone = DEFAULT_TIME_ZONE,
  instant = new Date()
) {
  assertValidDate(instant);

  const formatter = getFormatter('hour', normalizeTimeZone(timeZone));

  const hourPart = formatter
    .formatToParts(instant)
    .find((part) => part.type === 'hour');

  const hour = Number(hourPart?.value);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError('Could not resolve a valid local hour.');
  }

  return hour;
}

/**
 * Add calendar days using UTC date-only arithmetic.
 * This avoids daylight-saving-time calculation errors.
 */
function addDaysToDateString(dateString, days) {
  if (!Number.isSafeInteger(days)) {
    throw new TypeError('days must be a safe integer.');
  }

  const date = parseDateString(dateString);

  date.setUTCDate(date.getUTCDate() + days);

  const year = date.getUTCFullYear();

  if (year < 1 || year > 9999) {
    throw new RangeError(
      'Resulting date is outside the supported YYYY-MM-DD range.'
    );
  }

  return [
    String(year).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

/**
 * Return Monday for the week containing the supplied date.
 */
function getMondayDateString(dateString) {
  const date = parseDateString(dateString);

  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  return addDaysToDateString(dateString, -daysSinceMonday);
}

/**
 * Return consecutive dates ending on endDate,
 * ordered from oldest to newest.
 */
function getDateRangeEndingOn(endDate, count) {
  parseDateString(endDate);

  if (!Number.isSafeInteger(count) || count < 1) {
    throw new TypeError('count must be a positive safe integer.');
  }

  const startDate = addDaysToDateString(
    endDate,
    -(count - 1)
  );

  const dates = [];

  for (let offset = 0; offset < count; offset += 1) {
    dates.push(addDaysToDateString(startDate, offset));
  }

  return dates;
}

module.exports = {
  DEFAULT_TIME_ZONE,
  addDaysToDateString,
  getDateRangeEndingOn,
  getDateStringInTimeZone,
  getHourInTimeZone,
  getTodayInTimeZone,
  getMondayDateString,
  isValidDateString,
  normalizeTimeZone,
  parseDateString
};