const Entry = require('../models/Entry');

// @desc   Weekly summary (last 7 days)
// @route  GET /api/analytics/weekly
const getWeekly = async (req, res, next) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    const entries = await Entry.find({ userId: req.user._id, date: { $in: days } }).lean();
    const map     = Object.fromEntries(entries.map(e => [e.date, e]));
    const data    = days.map(date => ({
      date,
      netScore: map[date]?.netScore ?? null,
      mood:     map[date]?.mood     ?? null,
      grade:    map[date]?.grade    ?? null
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// @desc   Monthly summary — last 30 days
// @route  GET /api/analytics/monthly
const getMonthly = async (req, res, next) => {
  try {
    const from = new Date(); from.setDate(from.getDate() - 29);
    const fromStr = from.toISOString().split('T')[0];
    const entries = await Entry.find({
      userId: req.user._id,
      date: { $gte: fromStr }
    }).sort({ date: 1 }).lean();

    const avgScore = entries.length
      ? Math.round(entries.reduce((s, e) => s + e.netScore, 0) / entries.length) : 0;
    const avgMood  = entries.length
      ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : 0;
    const bestDay  = entries.reduce((a, b) => (a?.netScore > b?.netScore ? a : b), entries[0]);

    res.json({ success: true, avgScore, avgMood, bestDay: bestDay?.date, totalEntries: entries.length, entries });
  } catch (err) { next(err); }
};

// @desc   Per-habit streaks + overall logging streak
// @route  GET /api/analytics/streaks
const getStreaks = async (req, res, next) => {
  try {
    // Fetch all entries sorted newest first
    const entries = await Entry.find({ userId: req.user._id })
      .sort({ date: -1 })
      .lean();

    // ── Per-habit streaks (default good habits) ──
    const habitKeys = ['morning', 'exercise', 'reading', 'prayer', 'coding', 'sleep', 'diet', 'hydration'];
    const streaks = {};
    habitKeys.forEach(habit => {
      let streak = 0;
      for (const entry of entries) {
        if (entry.good[habit]) streak++; else break;
      }
      streaks[habit] = streak;
    });

    // ── Custom habit streaks ──
    // Collect unique custom habit names seen across entries
    const customStreaks = {};
    const customHabitMeta = {};   // habitId → { name, emoji }

    for (const entry of entries) {
      for (const ch of (entry.customHabits || [])) {
        const key = ch.habitId?.toString() || ch.name;
        if (!customHabitMeta[key]) {
          customHabitMeta[key] = { name: ch.name, emoji: ch.emoji || '⭐', type: ch.type };
        }
      }
    }

    Object.keys(customHabitMeta).forEach(key => {
      let streak = 0;
      for (const entry of entries) {
        const match = (entry.customHabits || []).find(
          h => (h.habitId?.toString() || h.name) === key
        );
        // Only count good custom habits for streaks; bad = avoiding them
        if (customHabitMeta[key].type === 'good') {
          if (match?.completed) streak++; else break;
        } else {
          // Bad habit: streak = consecutive days it was NOT done
          if (match && !match.completed) streak++; else break;
        }
      }
      customStreaks[key] = { ...customHabitMeta[key], streak };
    });

    // ── Overall logging streak (consecutive days with any entry) ──
    let overallStreak = 0;
    const today     = new Date();
    const checkDate = new Date(today);

    for (const entry of entries) {
      const expected = checkDate.toISOString().split('T')[0];
      if (entry.date === expected) {
        overallStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow today to be missing (user hasn't logged yet)
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

    res.json({ success: true, streaks, customStreaks, overallStreak });
  } catch (err) { next(err); }
};

module.exports = { getWeekly, getMonthly, getStreaks };