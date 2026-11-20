
'use strict';

const Entry = require('../models/Entry');
const habitReplacementService = require('./habitReplacementService');
const AppError = require('../utils/AppError');
const {
  addDaysToDateString,
  getDateRangeEndingOn,
  getTodayInTimeZone,
  normalizeTimeZone,
  parseDateString
} = require('../utils/dateUtils');

const RECENT_STREAK_WINDOW_DAYS = 120;

const HABIT_KEYS = [
  'morning',
  'exercise',
  'reading',
  'prayer',
  'coding',
  'sleep',
  'diet',
  'hydration'
];

function formatDateLabel(dateString, options) {
  const date = parseDateString(dateString);

  return date.toLocaleDateString('en', {
    ...options,
    timeZone: 'UTC'
  });
}

class AnalyticsService {
  async getWeekly(userId, timeZone) {
    const today = getTodayInTimeZone(timeZone);
    const days = getDateRangeEndingOn(today, 7);

    const entries = await Entry.find({
      userId,
      date: { $gte: days[0], $lte: today }
    })
      .select('date netScore mood grade')
      .lean();

    const map = Object.fromEntries(entries.map((entry) => [entry.date, entry]));

    return days.map((date) => ({
      date,
      netScore: map[date]?.netScore ?? null,
      mood: map[date]?.mood ?? null,
      grade: map[date]?.grade ?? null
    }));
  }

  async getMonthly(userId, timeZone) {
    const today = getTodayInTimeZone(timeZone);
    const fromStr = addDaysToDateString(today, -29);

    const entries = await Entry.find({
      userId,
      date: { $gte: fromStr, $lte: today }
    })
      .sort({ date: 1 })
      .lean();

    const avgScore = entries.length
      ? Math.round(
          entries.reduce((sum, entry) => sum + (entry.netScore || 0), 0) /
            entries.length
        )
      : 0;

    const avgMood = entries.length
      ? (
          entries.reduce((sum, entry) => sum + (entry.mood || 0), 0) /
          entries.length
        ).toFixed(1)
      : 0;

    const bestDay = entries.reduce(
      (best, entry) =>
        (best?.netScore || 0) > (entry.netScore || 0) ? best : entry,
      entries[0]
    );

    return {
      avgScore,
      avgMood,
      bestDay: bestDay?.date || null,
      totalEntries: entries.length,
      entries
    };
  }

  async getStreaks(userId, timeZone) {
    const today = getTodayInTimeZone(timeZone);
    const recentFrom = addDaysToDateString(
      today,
      -(RECENT_STREAK_WINDOW_DAYS - 1)
    );

    // Preserve the existing 120-day window for individual habit streaks.
    // Future entries are excluded so they cannot inflate current streaks.
    const entries = await Entry.find({
      userId,
      date: { $gte: recentFrom, $lte: today }
    })
      .sort({ date: -1 })
      .lean();

    // Overall logging streak is independent of the recent habit window.
    // Fetch only dates, allowing streaks longer than 120 days.
    const overallEntries = await Entry.find({
      userId,
      date: { $lte: today }
    })
      .select('date')
      .sort({ date: -1 })
      .lean();

    const streaks = {};

    HABIT_KEYS.forEach((habit) => {
      let streak = 0;

      for (const entry of entries) {
        if (entry.good?.[habit]) {
          streak += 1;
        } else {
          break;
        }
      }

      streaks[habit] = streak;
    });

    const customStreaks = {};
    const customHabitMeta = {};

    for (const entry of entries) {
      for (const customHabit of entry.customHabits || []) {
        const key = customHabit.habitId?.toString() || customHabit.name;

        if (!customHabitMeta[key]) {
          customHabitMeta[key] = {
            name: customHabit.name,
            emoji: customHabit.emoji || '⭐',
            type: customHabit.type
          };
        }
      }
    }

    Object.keys(customHabitMeta).forEach((key) => {
      let streak = 0;

      for (const entry of entries) {
        const match = (entry.customHabits || []).find(
          (habit) => (habit.habitId?.toString() || habit.name) === key
        );

        if (customHabitMeta[key].type === 'good') {
          if (match?.completed) {
            streak += 1;
          } else {
            break;
          }
        } else {
          if (match && !match.completed) {
            streak += 1;
          } else {
            break;
          }
        }
      }

      customStreaks[key] = {
        ...customHabitMeta[key],
        streak
      };
    });

    const overallStreak = this._calculateCurrentLoggingStreak(
      overallEntries,
      today
    );

    return {
      streaks,
      customStreaks,
      overallStreak
    };
  }

  _calculateCurrentLoggingStreak(entries, today) {
    if (!entries.length) return 0;

    // A current streak may begin today or yesterday.
    let expectedDate = today;
    let streak = 0;

    for (const entry of entries) {
      // Defensive protection if a query or test fixture contains future dates.
      if (!entry.date || entry.date > today) continue;

      if (entry.date === expectedDate) {
        streak += 1;
        expectedDate = addDaysToDateString(expectedDate, -1);
        continue;
      }

      // If today has not been logged, allow the streak to begin yesterday.
      if (streak === 0 && expectedDate === today) {
        const yesterday = addDaysToDateString(today, -1);

        if (entry.date === yesterday) {
          streak = 1;
          expectedDate = addDaysToDateString(yesterday, -1);
          continue;
        }
      }

      // The first missing calendar day ends the current streak.
      if (entry.date < expectedDate) break;
    }

    return streak;
  }

  async getReport(userId, range = 'week', timeZone) {
    const allowed = ['week', 'month', 'year'];

    if (!allowed.includes(range)) {
      throw new AppError('Invalid range. Use week, month, or year.', 400);
    }

    const toStr = getTodayInTimeZone(timeZone);

    let daysBack = 6;

    if (range === 'month') daysBack = 29;
    if (range === 'year') daysBack = 364;

    const fromStr = addDaysToDateString(toStr, -daysBack);

    const entries = await Entry.find({
      userId,
      date: { $gte: fromStr, $lte: toStr }
    })
      .select('date netScore mood grade')
      .sort({ date: 1 })
      .lean();

    const summary = this._buildSummary(entries, fromStr, toStr, range);

    const series =
      range === 'year'
        ? this._monthlySeries(entries, fromStr, toStr)
        : this._dailySeries(entries, fromStr, toStr, range);

    return {
      range,
      from: fromStr,
      to: toStr,
      summary,
      series
    };
  }

  async getInsights(userId, timeZone) {
    const today = getTodayInTimeZone(timeZone);
    const yearFromStr = addDaysToDateString(today, -364);
    const weekFromStr = addDaysToDateString(today, -6);

    const entries = await Entry.find({
      userId,
      date: { $gte: yearFromStr, $lte: today }
    })
      .select('date netScore mood grade good bad')
      .sort({ date: 1 })
      .lean();

    const weekEntries = entries.filter(
      (entry) => entry.date >= weekFromStr && entry.date <= today
    );

    return {
      insight: this._buildWeeklyInsight(weekEntries),
      records: this._buildRecords(entries),
      personalFocus: this._buildPersonalFocus(weekEntries)
    };
  }

  /**
   * Single payload for Dashboard — one HTTP round-trip.
   * Uses the same timezone for all date-sensitive dashboard data.
   */
  async getDashboard(userId, timeZone) {
    const normalizedTimeZone = normalizeTimeZone(timeZone);
    const todayStr = getTodayInTimeZone(normalizedTimeZone);

    const [weekly, monthly, streaks, insights, pairs, todayEntry] =
      await Promise.all([
        this.getWeekly(userId, normalizedTimeZone),
        this.getMonthly(userId, normalizedTimeZone),
        this.getStreaks(userId, normalizedTimeZone),
        this.getInsights(userId, normalizedTimeZone),
        habitReplacementService.getPairs(userId, normalizedTimeZone),
        Entry.findOne({
          userId,
          date: todayStr
        }).lean()
      ]);

    return {
      today: todayEntry || null,
      weekly,
      monthly,
      streaks,
      insights,
      pairs
    };
  }

  async getHeatmap(userId, weeks = 53, timeZone) {
    const normalizedWeeks = Math.min(
      Math.max(Number(weeks) || 53, 4),
      53
    );

    const dayCount = normalizedWeeks * 7;
    const today = getTodayInTimeZone(timeZone);
    const fromStr = addDaysToDateString(today, -(dayCount - 1));

    const entries = await Entry.find({
      userId,
      date: { $gte: fromStr, $lte: today }
    })
      .select('date netScore grade')
      .lean();

    const byDate = Object.fromEntries(
      entries.map((entry) => [
        entry.date,
        {
          netScore: entry.netScore,
          grade: entry.grade
        }
      ])
    );

    const dates = getDateRangeEndingOn(today, dayCount);

    const cells = dates.map((date) => {
      const hit = byDate[date];

      return {
        date,
        netScore: hit ? hit.netScore : null,
        grade: hit ? hit.grade : null,
        logged: Boolean(hit)
      };
    });

    return {
      from: fromStr,
      to: today,
      weeks: normalizedWeeks,
      loggedCount: cells.filter((cell) => cell.logged).length,
      totalDays: dayCount,
      cells
    };
  }

  _buildSummary(entries, fromStr, toStr, range) {
    const totalLogged = entries.length;

    let expectedDays = 7;

    if (range === 'month') expectedDays = 30;
    if (range === 'year') expectedDays = 365;

    const avgScore = totalLogged
      ? Math.round(
          entries.reduce((sum, entry) => sum + (entry.netScore || 0), 0) /
            totalLogged
        )
      : 0;

    const avgMood = totalLogged
      ? Number(
          (
            entries.reduce((sum, entry) => sum + (entry.mood || 0), 0) /
            totalLogged
          ).toFixed(1)
        )
      : 0;

    const best = entries.reduce(
      (currentBest, entry) =>
        (currentBest?.netScore || 0) >= (entry.netScore || 0)
          ? currentBest
          : entry,
      entries[0]
    );

    const gradeCounts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0
    };

    for (const entry of entries) {
      if (entry.grade && gradeCounts[entry.grade] !== undefined) {
        gradeCounts[entry.grade] += 1;
      }
    }

    const consistencyPct = expectedDays
      ? Math.min(100, Math.round((totalLogged / expectedDays) * 100))
      : 0;

    return {
      avgScore,
      avgMood,
      bestDay: best?.date || null,
      bestScore: best?.netScore ?? null,
      totalEntries: totalLogged,
      consistencyPct,
      gradeCounts
    };
  }

  _dailySeries(entries, fromStr, toStr, range) {
    const map = Object.fromEntries(
      entries.map((entry) => [entry.date, entry])
    );

    const dates = getDateRangeEndingOn(
      toStr,
      this._getInclusiveDayCount(fromStr, toStr)
    );

    return dates.map((date) => {
      const entry = map[date];

      return {
        date,
        label:
          range === 'week'
            ? formatDateLabel(date, { weekday: 'short' })
            : formatDateLabel(date, { month: 'short', day: 'numeric' }),
        netScore: entry?.netScore ?? null,
        mood: entry?.mood ?? null,
        grade: entry?.grade ?? null
      };
    });
  }

  _getInclusiveDayCount(fromStr, toStr) {
    let count = 1;
    let cursor = fromStr;

    while (cursor < toStr) {
      cursor = addDaysToDateString(cursor, 1);
      count += 1;
    }

    return count;
  }

  _monthlySeries(entries, fromStr, toStr) {
    const buckets = {};

    for (const entry of entries) {
      const key = entry.date.slice(0, 7);

      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(entry);
    }

    const fromDate = parseDateString(fromStr);
    const toDate = parseDateString(toStr);

    const cursor = new Date(
      Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 1, 12)
    );

    const end = new Date(
      Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), 1, 12)
    );

    const series = [];

    while (cursor <= end) {
      const year = cursor.getUTCFullYear();
      const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const list = buckets[key] || [];

      const avgScore = list.length
        ? Math.round(
            list.reduce((sum, entry) => sum + (entry.netScore || 0), 0) /
              list.length
          )
        : null;

      const avgMood = list.length
        ? Number(
            (
              list.reduce((sum, entry) => sum + (entry.mood || 0), 0) /
              list.length
            ).toFixed(1)
          )
        : null;

      const monthDate = `${key}-01`;

      series.push({
        date: monthDate,
        label: formatDateLabel(monthDate, {
          month: 'short',
          year: '2-digit'
        }),
        netScore: avgScore,
        mood: avgMood,
        grade: null,
        entryCount: list.length
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return series;
  }

  _buildWeeklyInsight(weekEntries) {
    if (!weekEntries.length) {
      return {
        type: 'empty',
        title: 'Start your week',
        message: 'No logs this week yet. One entry today keeps momentum going.'
      };
    }

    const labels = {
      morning: 'Morning routine',
      exercise: 'Exercise',
      reading: 'Reading',
      prayer: 'Prayer',
      coding: 'Coding',
      sleep: 'Sleep',
      diet: 'Diet',
      hydration: 'Hydration'
    };

    const counts = {};

    HABIT_KEYS.forEach((key) => {
      counts[key] = 0;
    });

    for (const entry of weekEntries) {
      for (const key of HABIT_KEYS) {
        if (entry.good?.[key]) counts[key] += 1;
      }
    }

    let strongest = HABIT_KEYS[0];
    let weakest = HABIT_KEYS[0];

    for (const key of HABIT_KEYS) {
      if (counts[key] > counts[strongest]) strongest = key;
      if (counts[key] < counts[weakest]) weakest = key;
    }

    const best = weekEntries.reduce(
      (currentBest, entry) =>
        (currentBest?.netScore || 0) >= (entry.netScore || 0)
          ? currentBest
          : entry,
      weekEntries[0]
    );

    const loggedDays = weekEntries.length;

    const avgScore = Math.round(
      weekEntries.reduce((sum, entry) => sum + (entry.netScore || 0), 0) /
        loggedDays
    );

    if (counts[strongest] >= 4 && counts[strongest] > counts[weakest]) {
      return {
        type: 'strength',
        title: 'Weekly strength',
        message: `${labels[strongest]} led this week (${counts[strongest]}/7 days). Avg score ${avgScore}.`
      };
    }

    if (counts[weakest] <= 2 && loggedDays >= 3) {
      return {
        type: 'focus',
        title: 'Gentle focus',
        message: `${labels[weakest]} only ${counts[weakest]} day(s) this week. One intentional day helps.`
      };
    }

    if (best?.netScore != null) {
      const dayLabel = formatDateLabel(best.date, {
        weekday: 'long'
      });

      return {
        type: 'best',
        title: 'Best day this week',
        message: `${dayLabel} scored ${best.netScore}${
          best.grade ? ` (grade ${best.grade})` : ''
        }. You logged ${loggedDays}/7 days.`
      };
    }

    return {
      type: 'consistency',
      title: 'This week',
      message: `You logged ${loggedDays} day(s). Average score ${avgScore}.`
    };
  }

  /**
   * Personalized weekly focus from the last 7 days of logs (no AI).
   */
  _buildPersonalFocus(weekEntries) {
    const GOOD_KEYS = [
      'morning',
      'exercise',
      'reading',
      'prayer',
      'coding',
      'sleep',
      'diet',
      'hydration'
    ];

    const BAD_KEYS = [
      'social',
      'procrastination',
      'junk',
      'late',
      'fajr'
    ];

    const GOOD_LABELS = {
      morning: 'Morning routine',
      exercise: 'Exercise',
      reading: 'Reading / Quran',
      prayer: 'Prayer',
      coding: 'Coding practice',
      sleep: 'Quality sleep',
      diet: 'Healthy diet',
      hydration: 'Hydration'
    };

    const BAD_LABELS = {
      social: 'Excessive social media',
      procrastination: 'Procrastination',
      junk: 'Junk food',
      late: 'Sleeping late',
      fajr: 'Missing Fajr'
    };

    const loggedDays = weekEntries.length;

    if (loggedDays === 0) {
      return {
        type: 'empty',
        title: 'This week’s focus',
        habitKey: null,
        habitLabel: null,
        kind: null,
        count: 0,
        loggedDays: 0,
        message:
          'Log a few days this week and we’ll pick one personal focus from your real data.',
        cta: {
          label: 'Log today',
          to: '/log'
        }
      };
    }

    const goodCounts = {};
    GOOD_KEYS.forEach((key) => {
      goodCounts[key] = 0;
    });

    const badCounts = {};
    BAD_KEYS.forEach((key) => {
      badCounts[key] = 0;
    });

    for (const entry of weekEntries) {
      for (const key of GOOD_KEYS) {
        if (entry.good?.[key]) goodCounts[key] += 1;
      }

      for (const key of BAD_KEYS) {
        if (entry.bad?.[key]) badCounts[key] += 1;
      }
    }

    let weakestGood = GOOD_KEYS[0];

    for (const key of GOOD_KEYS) {
      if (goodCounts[key] < goodCounts[weakestGood]) {
        weakestGood = key;
      }
    }

    let worstBad = BAD_KEYS[0];

    for (const key of BAD_KEYS) {
      if (badCounts[key] > badCounts[worstBad]) {
        worstBad = key;
      }
    }

    const goodScore = goodCounts[weakestGood];
    const badScore = badCounts[worstBad];

    if (badScore >= 2 && badScore >= loggedDays - goodScore) {
      return {
        type: 'reduce_bad',
        title: 'This week’s focus',
        habitKey: worstBad,
        habitLabel: BAD_LABELS[worstBad],
        kind: 'bad',
        count: badScore,
        loggedDays,
        message: `${BAD_LABELS[worstBad]} showed up ${badScore}/${loggedDays} logged day(s). One cleaner day this week is real progress — consider linking a replacement pair.`,
        cta: {
          label: 'Log today',
          to: '/log'
        },
        secondaryCta: {
          label: 'Habit replacement',
          to: '/replacements'
        }
      };
    }

    return {
      type: 'build_good',
      title: 'This week’s focus',
      habitKey: weakestGood,
      habitLabel: GOOD_LABELS[weakestGood],
      kind: 'good',
      count: goodScore,
      loggedDays,
      message: `${GOOD_LABELS[weakestGood]} only ${goodScore}/${loggedDays} day(s) so far. Make that your one intentional win when you log today.`,
      cta: {
        label: 'Log today',
        to: '/log'
      },
      secondaryCta: null
    };
  }

  _buildRecords(entries) {
    if (!entries.length) {
      return {
        longestStreak: 0,
        bestScore: null,
        bestScoreDate: null,
        mostHabitsInDay: null,
        mostHabitsDate: null,
        firstAGradeDate: null,
        totalEntries: 0
      };
    }

    let bestScore = null;
    let bestScoreDate = null;
    let mostHabitsInDay = 0;
    let mostHabitsDate = null;
    let firstAGradeDate = null;

    for (const entry of entries) {
      const score = entry.netScore ?? null;

      if (score != null && (bestScore == null || score > bestScore)) {
        bestScore = score;
        bestScoreDate = entry.date;
      }

      if (entry.grade === 'A' && !firstAGradeDate) {
        firstAGradeDate = entry.date;
      }

      let goodCount = 0;

      for (const key of HABIT_KEYS) {
        if (entry.good?.[key]) goodCount += 1;
      }

      if (goodCount > mostHabitsInDay) {
        mostHabitsInDay = goodCount;
        mostHabitsDate = entry.date;
      }
    }

    return {
      longestStreak: this._longestLoggingStreak(entries),
      bestScore,
      bestScoreDate,
      mostHabitsInDay: mostHabitsInDay || null,
      mostHabitsDate,
      firstAGradeDate,
      totalEntries: entries.length
    };
  }

  _longestLoggingStreak(entries) {
    if (!entries.length) return 0;

    const dates = [...new Set(entries.map((entry) => entry.date))].sort();

    let longest = 1;
    let current = 1;

    for (let index = 1; index < dates.length; index += 1) {
      const expectedNext = addDaysToDateString(dates[index - 1], 1);

      if (dates[index] === expectedNext) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }
}

module.exports = new AnalyticsService();
