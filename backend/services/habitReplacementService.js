const HabitReplacement = require('../models/HabitReplacement');
const Entry = require('../models/Entry');
const AppError = require('../utils/AppError');

const MAX_PAIRS = 8;

// Helpers
const badAvoided = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(h => h.habitId?.toString() === habitKey);
    return ch ? !ch.completed : null;
  }
  return !entry.bad?.[habitKey];
};

const goodDone = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(h => h.habitId?.toString() === habitKey);
    return ch ? ch.completed : null;
  }
  return !!entry.good?.[habitKey];
};

const calcStats = (pair, entries) => {
  let successful = 0;
  let avoided = 0;
  let relentries = 0;

  const sortedDesc = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  // Streak
  let streak = 0;
  for (const e of sortedDesc) {
    const bAvoided = badAvoided(e, pair.badHabit, pair.isCustomBad);
    const gDone = goodDone(e, pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) break;
    if (bAvoided && gDone) streak++;
    else break;
  }

  // Overall counts
  for (const e of entries) {
    const bAvoided = badAvoided(e, pair.badHabit, pair.isCustomBad);
    const gDone = goodDone(e, pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) continue;

    relentries++;
    if (bAvoided) avoided++;
    if (bAvoided && gDone) successful++;
  }

  // Last 7 days
  const last7 = sortedDesc.slice(0, 7).map(e => {
    const bAvoided = badAvoided(e, pair.badHabit, pair.isCustomBad);
    const gDone = goodDone(e, pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) return 'skip';
    if (bAvoided && gDone) return 'success';
    if (bAvoided && !gDone) return 'partial';
    return 'failed';
  });

  return {
    totalEntries: relentries,
    successDays: successful,
    avoidedDays: avoided,
    successRate: relentries > 0 ? Math.round((successful / relentries) * 100) : 0,
    avoidanceRate: relentries > 0 ? Math.round((avoided / relentries) * 100) : 0,
    streak,
    last7
  };
};

class HabitReplacementService {
  async getPairs(userId) {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const fromStr = from.toISOString().split('T')[0];

    const [pairs, entries] = await Promise.all([
      HabitReplacement.find({ userId }).sort({ createdAt: 1 }).lean(),
      Entry.find({ userId, date: { $gte: fromStr } }).lean()
    ]);

    return pairs.map(p => ({
      ...p,
      stats: calcStats(p, entries)
    }));
  }

  async createPair(userId, data) {
    const {
      badHabit, badHabitLabel, badHabitEmoji, isCustomBad,
      goodHabit, goodHabitLabel, goodHabitEmoji, isCustomGood
    } = data;

    if (!badHabit || !goodHabit || !badHabitLabel || !goodHabitLabel) {
      throw new AppError('Both habits are required.', 400);
    }

    if (badHabit === goodHabit) {
      throw new AppError('Bad and good habit cannot be the same.', 400);
    }

    const count = await HabitReplacement.countForUser(userId);
    if (count >= MAX_PAIRS) {
      throw new AppError(`Maximum ${MAX_PAIRS} replacement pairs allowed.`, 400);
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
      isCustomGood: !!isCustomGood
    });

    return pair;
  }

  async deletePair(userId, pairId) {
    const pair = await HabitReplacement.findOne({ _id: pairId, userId });

    if (!pair) {
      throw new AppError('Pair not found.', 404);
    }

    await pair.deleteOne();
    return { message: 'Replacement pair removed.' };
  }
}

module.exports = new HabitReplacementService();