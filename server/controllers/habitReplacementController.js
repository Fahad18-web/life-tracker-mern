const HabitReplacement = require('../models/HabitReplacement');
const Entry            = require('../models/Entry');

const MAX_PAIRS = 8;

// ── Helpers ───────────────────────────────────────────────────────

// Was bad habit AVOIDED on this entry?
const badAvoided = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(h => h.habitId?.toString() === habitKey);
    return ch ? !ch.completed : null;   // null = habit not in this entry (skip)
  }
  return !entry.bad[habitKey];
};

// Was good habit DONE on this entry?
const goodDone = (entry, habitKey, isCustom) => {
  if (isCustom) {
    const ch = (entry.customHabits || []).find(h => h.habitId?.toString() === habitKey);
    return ch ? ch.completed : null;
  }
  return !!entry.good[habitKey];
};

// Calculate stats for one pair against all entries
const calcStats = (pair, entries) => {
  let successful = 0;   // bad avoided AND good done
  let avoided    = 0;   // bad avoided (regardless of good)
  let relentries = 0;   // entries where both habits are trackable

  const sortedDesc = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  // Streak — consecutive days of successful replacement
  let streak = 0;
  for (const e of sortedDesc) {
    const bAvoided = badAvoided(e, pair.badHabit,  pair.isCustomBad);
    const gDone    = goodDone(e,   pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) break;   // habit not in this entry
    if (bAvoided && gDone) streak++;
    else break;
  }

  // Overall counts (all entries)
  for (const e of entries) {
    const bAvoided = badAvoided(e, pair.badHabit,  pair.isCustomBad);
    const gDone    = goodDone(e,   pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) continue;

    relentries++;
    if (bAvoided)           avoided++;
    if (bAvoided && gDone)  successful++;
  }

  // Last 7 days breakdown (newest first)
  const last7 = sortedDesc.slice(0, 7).map(e => {
    const bAvoided = badAvoided(e, pair.badHabit,  pair.isCustomBad);
    const gDone    = goodDone(e,   pair.goodHabit, pair.isCustomGood);
    if (bAvoided === null || gDone === null) return 'skip';
    if (bAvoided && gDone)  return 'success';
    if (bAvoided && !gDone) return 'partial';
    return 'failed';
  });

  return {
    totalEntries:    relentries,
    successDays:     successful,
    avoidedDays:     avoided,
    successRate:     relentries > 0 ? Math.round(successful / relentries * 100) : 0,
    avoidanceRate:   relentries > 0 ? Math.round(avoided    / relentries * 100) : 0,
    streak,
    last7,           // 'success' | 'partial' | 'failed' | 'skip'  (newest → oldest)
  };
};

// ── Controllers ───────────────────────────────────────────────────

// @route  GET /api/habit-replacements
const getPairs = async (req, res, next) => {
  try {
    const [pairs, entries] = await Promise.all([
      HabitReplacement.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean(),
      Entry.find({ userId: req.user._id }).lean()
    ]);

    const result = pairs.map(p => ({
      ...p,
      stats: calcStats(p, entries)
    }));

    res.json({ success: true, pairs: result });
  } catch (err) { next(err); }
};

// @route  POST /api/habit-replacements
const createPair = async (req, res, next) => {
  try {
    const { badHabit, badHabitLabel, badHabitEmoji, isCustomBad,
            goodHabit, goodHabitLabel, goodHabitEmoji, isCustomGood } = req.body;

    if (!badHabit || !goodHabit || !badHabitLabel || !goodHabitLabel)
      return res.status(400).json({ success: false, message: 'Both habits are required.' });

    if (badHabit === goodHabit)
      return res.status(400).json({ success: false, message: 'Bad and good habit cannot be the same.' });

    const count = await HabitReplacement.countForUser(req.user._id);
    if (count >= MAX_PAIRS)
      return res.status(400).json({ success: false, message: `Maximum ${MAX_PAIRS} replacement pairs allowed.` });

    const pair = await HabitReplacement.create({
      userId: req.user._id,
      badHabit, badHabitLabel, badHabitEmoji: badHabitEmoji || '❌', isCustomBad: !!isCustomBad,
      goodHabit, goodHabitLabel, goodHabitEmoji: goodHabitEmoji || '✅', isCustomGood: !!isCustomGood,
    });

    res.status(201).json({ success: true, pair });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'This replacement pair already exists.' });
    next(err);
  }
};

// @route  DELETE /api/habit-replacements/:id
const deletePair = async (req, res, next) => {
  try {
    const pair = await HabitReplacement.findOne({ _id: req.params.id, userId: req.user._id });
    if (!pair) return res.status(404).json({ success: false, message: 'Pair not found.' });
    await pair.deleteOne();
    res.json({ success: true, message: 'Replacement pair removed.' });
  } catch (err) { next(err); }
};

module.exports = { getPairs, createPair, deletePair };