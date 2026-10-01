const HabitReplacement = require('../models/HabitReplacement');
const Entry = require('../models/Entry');
const AppError = require('../utils/AppError');

const MAX_PAIRS = 8;
const ALLOWED_WINDOWS = [7, 14, 21, 30];

const badAvoided = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(
      (h) => h.habitId?.toString() === habitKey || h.name === habitKey
    );
    return ch ? !ch.completed : null;
  }
  if (!entry.bad || entry.bad[habitKey] === undefined) return null;
  return !entry.bad[habitKey];
};

const goodDone = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(
      (h) => h.habitId?.toString() === habitKey || h.name === habitKey
    );
    return ch ? !!ch.completed : null;
  }
  if (!entry.good || entry.good[habitKey] === undefined) return null;
  return !!entry.good[habitKey];
};

function normalizeRules(rules = {}) {
  const windowDays = ALLOWED_WINDOWS.includes(Number(rules.windowDays))
    ? Number(rules.windowDays)
    : 7;
  const requireBoth = rules.requireBoth !== false;
  let minLoggedDays = Number(rules.minLoggedDays);
  if (!Number.isFinite(minLoggedDays) || minLoggedDays < 0) minLoggedDays = 1;
  if (minLoggedDays > 7) minLoggedDays = 7;

  return { windowDays, requireBoth, minLoggedDays };
}

function dateNDaysAgo(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function isSuccessDay(entry, pair, requireBoth) {
  const bAvoided = badAvoided(entry, pair.badHabit, pair.isCustomBad);
  const gDone = goodDone(entry, pair.goodHabit, pair.isCustomGood);

  if (bAvoided === null && gDone === null) return { status: 'skip', logged: false };

  if (requireBoth) {
    if (bAvoided === null || gDone === null) {
      return { status: 'skip', logged: bAvoided !== null || gDone !== null };
    }
    if (bAvoided && gDone) return { status: 'success', logged: true };
    if (bAvoided && !gDone) return { status: 'partial', logged: true };
    return { status: 'failed', logged: true };
  }

  // good-only mode still tracks bad when present
  if (gDone === true) return { status: 'success', logged: true };
  if (gDone === false) return { status: 'failed', logged: true };
  return { status: 'skip', logged: false };
}

const calcStats = (pair, allEntries) => {
  const rules = normalizeRules(pair.rules);
  const { windowDays, requireBoth, minLoggedDays } = rules;

  const fromStr = dateNDaysAgo(windowDays);
  const toStr = todayStr();

  const windowEntries = allEntries.filter(
    (e) => e.date >= fromStr && e.date <= toStr
  );
  const byDate = Object.fromEntries(windowEntries.map((e) => [e.date, e]));

  // Calendar days in window (newest first for streak / lastN dots)
  const calendarDays = [];
  const cursor = new Date(toStr + 'T12:00:00');
  for (let i = 0; i < windowDays; i++) {
    const ds = cursor.toISOString().split('T')[0];
    calendarDays.push(ds);
    cursor.setDate(cursor.getDate() - 1);
  }

  let successful = 0;
  let avoided = 0;
  let logged = 0;
  const dayStatuses = [];

  for (const ds of calendarDays) {
    const e = byDate[ds];
    if (!e) {
      dayStatuses.push('skip');
      continue;
    }
    const { status, logged: isLogged } = isSuccessDay(e, pair, requireBoth);
    dayStatuses.push(status);
    if (isLogged) logged++;
    if (status === 'success') successful++;
    if (requireBoth) {
      const b = badAvoided(e, pair.badHabit, pair.isCustomBad);
      if (b === true) avoided++;
    } else if (status === 'success' || status === 'partial') {
      /* optional */
    }
  }

  // Streak from today backwards
  let streak = 0;
  for (const status of dayStatuses) {
    if (status === 'success') streak++;
    else if (status === 'skip') continue; // no log — break or skip? break is stricter
    else break;
  }
  // Stricter streak: skip breaks streak
  streak = 0;
  for (const status of dayStatuses) {
    if (status === 'success') streak++;
    else break;
  }

  const rawRate = Math.round((successful / windowDays) * 100);
  const insufficient = logged < minLoggedDays;

  return {
    windowDays,
    requireBoth,
    minLoggedDays,
    totalEntries: logged,
    successDays: successful,
    avoidedDays: avoided,
    // Meaningful progress against full window
    successRate: insufficient ? null : rawRate,
    progressLabel: insufficient
      ? `Building… (${logged}/${minLoggedDays} days logged)`
      : `${successful}/${windowDays} days`,
    insufficientData: insufficient,
    avoidanceRate:
      logged > 0 ? Math.round((avoided / logged) * 100) : 0,
    streak,
    last7: dayStatuses.slice(0, Math.min(7, windowDays)),
    lastN: dayStatuses
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

    return pairs.map((p) => ({
      ...p,
      rules: normalizeRules(p.rules),
      stats: calcStats(p, entries)
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
      isCustomGood: !!isCustomGood,
      rules: normalizeRules(rules)
    });

    return pair.toObject();
  }

  async updatePairRules(userId, pairId, rules) {
    const pair = await HabitReplacement.findOne({ _id: pairId, userId });
    if (!pair) throw new AppError('Pair not found.', 404);

    pair.rules = normalizeRules({ ...pair.rules?.toObject?.() || pair.rules, ...rules });
    await pair.save();
    return pair.toObject();
  }

  async deletePair(userId, pairId) {
    const pair = await HabitReplacement.findOne({ _id: pairId, userId });
    if (!pair) throw new AppError('Pair not found.', 404);
    await pair.deleteOne();
    return { message: 'Replacement pair removed.' };
  }
}

module.exports = new HabitReplacementService();