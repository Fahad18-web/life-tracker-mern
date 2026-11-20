
'use strict';

const HabitReplacement = require('../models/HabitReplacement');
const Entry = require('../models/Entry');
const AppError = require('../utils/AppError');

const {
  addDaysToDateString,
  getDateStringInTimeZone,
  getTodayInTimeZone,
  normalizeTimeZone
} = require('../utils/dateUtils');

const MAX_PAIRS = 8;
const ALLOWED_WINDOWS = [7, 14, 21, 30];

const badAvoided = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(
      (h) => h.habitId?.toString() === habitKey || h.name === habitKey
    );

    return ch ? !ch.completed : null;
  }

  if (!entry.bad || entry.bad[habitKey] === undefined) {
    return null;
  }

  return !entry.bad[habitKey];
};

const goodDone = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(
      (h) => h.habitId?.toString() === habitKey || h.name === habitKey
    );

    return ch ? !!ch.completed : null;
  }

  if (!entry.good || entry.good[habitKey] === undefined) {
    return null;
  }

  return !!entry.good[habitKey];
};

function normalizeRules(rules = {}) {
  const windowDays = ALLOWED_WINDOWS.includes(Number(rules.windowDays))
    ? Number(rules.windowDays)
    : 7;

  const requireBoth = rules.requireBoth !== false;

  let minLoggedDays = Number(rules.minLoggedDays);

  if (!Number.isFinite(minLoggedDays) || minLoggedDays < 0) {
    minLoggedDays = 1;
  }

  if (minLoggedDays > 7) {
    minLoggedDays = 7;
  }

  return {
    windowDays,
    requireBoth,
    minLoggedDays
  };
}

function isSuccessDay(entry, pair, requireBoth) {
  const bAvoided = badAvoided(
    entry,
    pair.badHabit,
    pair.isCustomBad
  );

  const gDone = goodDone(
    entry,
    pair.goodHabit,
    pair.isCustomGood
  );

  if (bAvoided === null && gDone === null) {
    return {
      status: 'skip',
      logged: false
    };
  }

  if (requireBoth) {
    if (bAvoided === null || gDone === null) {
      return {
        status: 'skip',
        logged: bAvoided !== null || gDone !== null
      };
    }

    if (bAvoided && gDone) {
      return {
        status: 'success',
        logged: true
      };
    }

    if (bAvoided && !gDone) {
      return {
        status: 'partial',
        logged: true
      };
    }

    return {
      status: 'failed',
      logged: true
    };
  }

  // Good-only mode still tracks the good habit when present.
  if (gDone === true) {
    return {
      status: 'success',
      logged: true
    };
  }

  if (gDone === false) {
    return {
      status: 'failed',
      logged: true
    };
  }

  return {
    status: 'skip',
    logged: false
  };
}

function getPairStartDate(pair, timeZone, today) {
  if (!pair.createdAt) {
    return today;
  }

  const createdAt = new Date(pair.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return today;
  }

  return getDateStringInTimeZone(timeZone, createdAt);
}

const calcStats = (pair, allEntries, timeZone) => {
  const rules = normalizeRules(pair.rules);

  const {
    windowDays,
    requireBoth,
    minLoggedDays
  } = rules;

  const today = getTodayInTimeZone(timeZone);

  // Evaluate pair progress from its creation date in the user's timezone.
  const pairCreatedDate = getPairStartDate(
    pair,
    timeZone,
    today
  );

  // Never evaluate a pair beyond today's local calendar date.
  const windowStart = addDaysToDateString(
    today,
    -(windowDays - 1)
  );

  const fromStr = pairCreatedDate > windowStart
    ? pairCreatedDate
    : windowStart;

  const windowEntries = allEntries.filter(
    (entry) =>
      typeof entry.date === 'string' &&
      entry.date >= fromStr &&
      entry.date <= today
  );

  const byDate = Object.create(null);

  for (const entry of windowEntries) {
    byDate[entry.date] = entry;
  }

  // Generate calendar dates using date-only arithmetic.
  // This is independent of server timezone and DST.
  const calendarDays = [];

  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = addDaysToDateString(today, -offset);

    if (date < fromStr) {
      break;
    }

    calendarDays.push(date);
  }

  let successful = 0;
  let avoided = 0;
  let logged = 0;

  const dayStatuses = [];

  for (const date of calendarDays) {
    const entry = byDate[date];

    if (!entry) {
      // Preserve existing product behaviour:
      // a missing log after pair creation is considered missed.
      dayStatuses.push('missed');
      continue;
    }

    const {
      status,
      logged: isLogged
    } = isSuccessDay(entry, pair, requireBoth);

    if (status === 'success') {
      dayStatuses.push('success');
      successful += 1;
    } else if (status === 'partial') {
      dayStatuses.push('partial');
    } else if (status === 'failed') {
      dayStatuses.push('failed');
    } else {
      dayStatuses.push('missed');
    }

    if (isLogged) {
      logged += 1;
    }

    if (requireBoth) {
      const avoidedBadHabit = badAvoided(
        entry,
        pair.badHabit,
        pair.isCustomBad
      );

      if (avoidedBadHabit === true) {
        avoided += 1;
      }
    }
  }

  // Preserve the existing streak rule:
  // count consecutive successful days from today backwards.
  let streak = 0;

  for (const status of dayStatuses) {
    if (status !== 'success') {
      break;
    }

    streak += 1;
  }

  // Preserve the existing full-window denominator.
  const successRate = Math.round(
    (successful / windowDays) * 100
  );

  return {
    windowDays,
    requireBoth,
    minLoggedDays,
    totalEntries: logged,
    successDays: successful,
    avoidedDays: avoided,
    activeDays: calendarDays.length,
    pairStart: fromStr,
    successRate,
    progressLabel: `${successful}/${windowDays} days in window`,
    insufficientData: false,
    avoidanceRate: logged > 0
      ? Math.round((avoided / logged) * 100)
      : 0,
    streak,
    last7: dayStatuses.slice(
      0,
      Math.min(7, dayStatuses.length)
    ),
    lastN: dayStatuses
  };
};

class HabitReplacementService {
  async getPairs(userId, timeZone) {
    const normalizedTimeZone = normalizeTimeZone(timeZone);

    const today = getTodayInTimeZone(normalizedTimeZone);

    // Keep the existing 90-day historical fetch window.
    // Add an upper boundary to exclude future-dated entries.
    const fromDate = addDaysToDateString(today, -90);

    const [pairs, entries] = await Promise.all([
      HabitReplacement.find({ userId })
        .sort({ createdAt: 1 })
        .lean(),

      Entry.find({
        userId,
        date: {
          $gte: fromDate,
          $lte: today
        }
      }).lean()
    ]);

    return pairs.map((pair) => ({
      ...pair,
      rules: normalizeRules(pair.rules),
      stats: calcStats(
        pair,
        entries,
        normalizedTimeZone
      )
    }));
  }

  async createPair(userId, data) {
    const {
      badHabit,
      badHabitLabel,
      badHabitEmoji,
      isCustomBad,
      goodHabit,
      goodHabitLabel,
      goodHabitEmoji,
      isCustomGood,
      rules
    } = data;

    if (
      !badHabit ||
      !goodHabit ||
      !badHabitLabel ||
      !goodHabitLabel
    ) {
      throw new AppError(
        'Both habits are required.',
        400
      );
    }

    if (badHabit === goodHabit) {
      throw new AppError(
        'Bad and good habit cannot be the same.',
        400
      );
    }

    const count = await HabitReplacement.countForUser(userId);

    if (count >= MAX_PAIRS) {
      throw new AppError(
        `Maximum ${MAX_PAIRS} replacement pairs allowed.`,
        400
      );
    }

    const pair = await HabitReplacement.create({
      userId,
      badHabit,
      badHabitLabel,
      badHabitEmoji: badHabitEmoji || '❌',
      isCustomBad: !!isCustomBad,
      goodHabit,
      goodHabitLabel,
      goodHabitEmoji: goodHabitEmoji || '✅',
      isCustomGood: !!isCustomGood,
      rules: normalizeRules(rules)
    });

    return pair.toObject();
  }

  async updatePairRules(userId, pairId, rules) {
    const pair = await HabitReplacement.findOne({
      _id: pairId,
      userId
    });

    if (!pair) {
      throw new AppError('Pair not found.', 404);
    }

    pair.rules = normalizeRules({
      ...pair.rules?.toObject?.() || pair.rules,
      ...rules
    });

    await pair.save();

    return pair.toObject();
  }

  async deletePair(userId, pairId) {
    const pair = await HabitReplacement.findOne({
      _id: pairId,
      userId
    });

    if (!pair) {
      throw new AppError('Pair not found.', 404);
    }

    await pair.deleteOne();

    return {
      message: 'Replacement pair removed.'
    };
  }
}

module.exports = new HabitReplacementService();
