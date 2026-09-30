const Entry = require('../models/Entry');
const AppError = require('../utils/AppError');

class AnalyticsService {
  async getWeekly(userId) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const entries = await Entry.find({
      userId,
      date: { $in: days }
    }).lean();

    const map = Object.fromEntries(entries.map((e) => [e.date, e]));

    return days.map((date) => ({
      date,
      netScore: map[date]?.netScore ?? null,
      mood: map[date]?.mood ?? null,
      grade: map[date]?.grade ?? null
    }));
  }

  async getMonthly(userId) {
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const fromStr = from.toISOString().split('T')[0];

    const entries = await Entry.find({
      userId,
      date: { $gte: fromStr }
    })
      .sort({ date: 1 })
      .lean();

    const avgScore = entries.length
      ? Math.round(entries.reduce((s, e) => s + (e.netScore || 0), 0) / entries.length)
      : 0;

    const avgMood = entries.length
      ? (entries.reduce((s, e) => s + (e.mood || 0), 0) / entries.length).toFixed(1)
      : 0;

    const bestDay = entries.reduce(
      (a, b) => ((a?.netScore || 0) > (b?.netScore || 0) ? a : b),
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

  async getStreaks(userId) {
    const from = new Date();
    from.setDate(from.getDate() - 120);
    const fromStr = from.toISOString().split('T')[0];

    const entries = await Entry.find({
      userId,
      date: { $gte: fromStr }
    })
      .sort({ date: -1 })
      .lean();

    const habitKeys = [
      'morning', 'exercise', 'reading', 'prayer',
      'coding', 'sleep', 'diet', 'hydration'
    ];
    const streaks = {};

    habitKeys.forEach((habit) => {
      let streak = 0;
      for (const entry of entries) {
        if (entry.good?.[habit]) streak++;
        else break;
      }
      streaks[habit] = streak;
    });

    const customStreaks = {};
    const customHabitMeta = {};

    for (const entry of entries) {
      for (const ch of entry.customHabits || []) {
        const key = ch.habitId?.toString() || ch.name;
        if (!customHabitMeta[key]) {
          customHabitMeta[key] = {
            name: ch.name,
            emoji: ch.emoji || '⭐',
            type: ch.type
          };
        }
      }
    }

    Object.keys(customHabitMeta).forEach((key) => {
      let streak = 0;
      for (const entry of entries) {
        const match = (entry.customHabits || []).find(
          (h) => (h.habitId?.toString() || h.name) === key
        );

        if (customHabitMeta[key].type === 'good') {
          if (match?.completed) streak++;
          else break;
        } else {
          if (match && !match.completed) streak++;
          else break;
        }
      }
      customStreaks[key] = { ...customHabitMeta[key], streak };
    });

    let overallStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    for (const entry of entries) {
      const expected = checkDate.toISOString().split('T')[0];

      if (entry.date === expected) {
        overallStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (expected === today.toISOString().split('T')[0] && overallStreak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (entry.date === checkDate.toISOString().split('T')[0]) {
          overallStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return { streaks, customStreaks, overallStreak };
  }

  async getReport(userId, range = 'week') {
    const allowed = ['week', 'month', 'year'];
    if (!allowed.includes(range)) {
      throw new AppError('Invalid range. Use week, month, or year.', 400);
    }

    const today = new Date();
    const toStr = today.toISOString().split('T')[0];

    const from = new Date(today);
    if (range === 'week') from.setDate(from.getDate() - 6);
    else if (range === 'month') from.setDate(from.getDate() - 29);
    else from.setFullYear(from.getFullYear() - 1);

    const fromStr = from.toISOString().split('T')[0];

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
        ? this._monthlySeries(entries, from, today)
        : this._dailySeries(entries, fromStr, toStr, range);

    return {
      range,
      from: fromStr,
      to: toStr,
      summary,
      series
    };
  }

  async getInsights(userId) {
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];

    const yearFrom = new Date(today);
    yearFrom.setDate(yearFrom.getDate() - 365);
    const yearFromStr = yearFrom.toISOString().split('T')[0];

    const weekFrom = new Date(today);
    weekFrom.setDate(weekFrom.getDate() - 6);
    const weekFromStr = weekFrom.toISOString().split('T')[0];

    const entries = await Entry.find({
      userId,
      date: { $gte: yearFromStr, $lte: toStr }
    })
      .select('date netScore mood grade good')
      .sort({ date: 1 })
      .lean();

    const weekEntries = entries.filter((e) => e.date >= weekFromStr);

    return {
      insight: this._buildWeeklyInsight(weekEntries),
      records: this._buildRecords(entries)
    };
  }

  _buildSummary(entries, fromStr, toStr, range) {
    const totalLogged = entries.length;

    let expectedDays = 7;
    if (range === 'month') expectedDays = 30;
    if (range === 'year') expectedDays = 365;

    const avgScore = totalLogged
      ? Math.round(entries.reduce((s, e) => s + (e.netScore || 0), 0) / totalLogged)
      : 0;

    const avgMood = totalLogged
      ? Number(
          (entries.reduce((s, e) => s + (e.mood || 0), 0) / totalLogged).toFixed(1)
        )
      : 0;

    const best = entries.reduce(
      (a, b) => ((a?.netScore || 0) >= (b?.netScore || 0) ? a : b),
      entries[0]
    );

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const e of entries) {
      if (e.grade && gradeCounts[e.grade] !== undefined) {
        gradeCounts[e.grade]++;
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
    const map = Object.fromEntries(entries.map((e) => [e.date, e]));
    const days = [];
    const start = new Date(fromStr + 'T12:00:00');
    const end = new Date(toStr + 'T12:00:00');
    const cursor = new Date(start);

    while (cursor <= end) {
      const date = cursor.toISOString().split('T')[0];
      const e = map[date];
      days.push({
        date,
        label:
          range === 'week'
            ? cursor.toLocaleDateString('en', { weekday: 'short' })
            : cursor.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        netScore: e?.netScore ?? null,
        mood: e?.mood ?? null,
        grade: e?.grade ?? null
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  _monthlySeries(entries, fromDate, toDate) {
    const buckets = {};
    for (const e of entries) {
      const key = e.date.slice(0, 7);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(e);
    }

    const series = [];
    const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const list = buckets[key] || [];

      const avgScore = list.length
        ? Math.round(list.reduce((s, e) => s + (e.netScore || 0), 0) / list.length)
        : null;
      const avgMood = list.length
        ? Number(
            (list.reduce((s, e) => s + (e.mood || 0), 0) / list.length).toFixed(1)
          )
        : null;

      series.push({
        date: `${key}-01`,
        label: cursor.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        netScore: avgScore,
        mood: avgMood,
        grade: null,
        entryCount: list.length
      });

      cursor.setMonth(cursor.getMonth() + 1);
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

    const habitKeys = [
      'morning', 'exercise', 'reading', 'prayer',
      'coding', 'sleep', 'diet', 'hydration'
    ];
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
    habitKeys.forEach((k) => {
      counts[k] = 0;
    });
    for (const e of weekEntries) {
      for (const k of habitKeys) {
        if (e.good?.[k]) counts[k]++;
      }
    }

    let strongest = habitKeys[0];
    let weakest = habitKeys[0];
    for (const k of habitKeys) {
      if (counts[k] > counts[strongest]) strongest = k;
      if (counts[k] < counts[weakest]) weakest = k;
    }

    const best = weekEntries.reduce(
      (a, b) => ((a?.netScore || 0) >= (b?.netScore || 0) ? a : b),
      weekEntries[0]
    );

    const loggedDays = weekEntries.length;
    const avgScore = Math.round(
      weekEntries.reduce((s, e) => s + (e.netScore || 0), 0) / loggedDays
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
      const dayLabel = new Date(best.date + 'T12:00:00').toLocaleDateString('en', {
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

    const habitKeys = [
      'morning', 'exercise', 'reading', 'prayer',
      'coding', 'sleep', 'diet', 'hydration'
    ];

    for (const e of entries) {
      const score = e.netScore ?? null;
      if (score != null && (bestScore == null || score > bestScore)) {
        bestScore = score;
        bestScoreDate = e.date;
      }

      if (e.grade === 'A' && !firstAGradeDate) {
        firstAGradeDate = e.date;
      }

      let goodCount = 0;
      for (const k of habitKeys) {
        if (e.good?.[k]) goodCount++;
      }
      if (goodCount > mostHabitsInDay) {
        mostHabitsInDay = goodCount;
        mostHabitsDate = e.date;
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
    const dates = [...new Set(entries.map((e) => e.date))].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  }
}

module.exports = new AnalyticsService();