const Entry = require('../models/Entry');

class AnalyticsService {
  // Last 7 days
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

    const map = Object.fromEntries(entries.map(e => [e.date, e]));

    const data = days.map(date => ({
      date,
      netScore: map[date]?.netScore ?? null,
      mood:     map[date]?.mood     ?? null,
      grade:    map[date]?.grade    ?? null
    }));

    return data;
  }

  // Last 30 days
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

    const bestDay = entries.reduce((a, b) =>
      (a?.netScore || 0) > (b?.netScore || 0) ? a : b
    , entries[0]);

    return {
      avgScore,
      avgMood,
      bestDay: bestDay?.date || null,
      totalEntries: entries.length,
      entries
    };
  }

  // Streaks — only last 120 days (enough for practical streaks)
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

    // Default good habits streaks
    const habitKeys = ['morning', 'exercise', 'reading', 'prayer', 'coding', 'sleep', 'diet', 'hydration'];
    const streaks = {};

    habitKeys.forEach(habit => {
      let streak = 0;
      for (const entry of entries) {
        if (entry.good?.[habit]) streak++;
        else break;
      }
      streaks[habit] = streak;
    });



    // Custom habit streaks
    const customStreaks = {};
    const customHabitMeta = {};

    for (const entry of entries) {
      for (const ch of (entry.customHabits || [])) {
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

    Object.keys(customHabitMeta).forEach(key => {
      let streak = 0;
      for (const entry of entries) {
        const match = (entry.customHabits || []).find(
          h => (h.habitId?.toString() || h.name) === key
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

    // Overall logging streak
    let overallStreak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    for (const entry of entries) {
      const expected = checkDate.toISOString().split('T')[0];

      if (entry.date === expected) {
        overallStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (expected === today.toISOString().split('T')[0] && overallStreak === 0) {
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
    }

    return { streaks, customStreaks, overallStreak };
  }
   
    /**
   * Performance report — range: week | month | year
   * Year returns monthly aggregates (scalable chart series).
   */
  async getReport(userId, range = 'week') {
    const allowed = ['week', 'month', 'year'];
    if (!allowed.includes(range)) {
      const AppError = require('../utils/AppError');
      throw new AppError('Invalid range. Use week, month, or year.', 400);
    }

    const today = new Date();
    const toStr = today.toISOString().split('T')[0];

    let from = new Date(today);
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

  _buildSummary(entries, fromStr, toStr, range) {
    const totalLogged = entries.length;

    // Expected days in window (approx for consistency)
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
    // Group by YYYY-MM
    const buckets = {};
    for (const e of entries) {
      const key = e.date.slice(0, 7); // YYYY-MM
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

}



module.exports = new AnalyticsService();