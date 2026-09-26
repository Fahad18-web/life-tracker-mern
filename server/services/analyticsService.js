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
}

module.exports = new AnalyticsService();