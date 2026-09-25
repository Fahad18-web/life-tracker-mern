const Entry = require('../models/Entry');

// @desc   Get all entries for logged-in user (paginated)
// @route  GET /api/entries
const getEntries = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip  = (page - 1) * limit;

    const total   = await Entry.countDocuments({ userId: req.user._id });
    const entries = await Entry.find({ userId: req.user._id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), entries });
  } catch (err) { next(err); }
};

// @desc   Get single entry by date
// @route  GET /api/entries/:date   (format: YYYY-MM-DD)
const getEntryByDate = async (req, res, next) => {
  try {
    const entry = await Entry.findOne({ userId: req.user._id, date: req.params.date });
    if (!entry) return res.status(404).json({ success: false, message: 'No entry found for this date' });
    res.json({ success: true, entry });
  } catch (err) { next(err); }
};

// @desc   Create or update today's entry (upsert)
// @route  POST /api/entries
const saveEntry = async (req, res, next) => {
  try {
    const { date, good, bad, mood, notes, customHabits = [] } = req.body;
    if (!date || !mood) return res.status(400).json({ success: false, message: 'Date and mood are required' });

    // findOneAndUpdate does NOT trigger pre('save') — use findOne + save instead
    let entry = await Entry.findOne({ userId: req.user._id, date });
    if (entry) {
      entry.good         = good;
      entry.bad          = bad;
      entry.mood         = mood;
      entry.notes        = notes || '';
      entry.customHabits = customHabits;
    } else {
      entry = new Entry({
        userId: req.user._id,
        date,
        good,
        bad,
        mood,
        notes:        notes || '',
        customHabits
      });
    }

    await entry.save();   // triggers pre('save') → score recalculated with custom habits
    res.status(201).json({ success: true, entry });
  } catch (err) { next(err); }
};

// @desc   Delete an entry
// @route  DELETE /api/entries/:id
const deleteEntry = async (req, res, next) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) { next(err); }
};

module.exports = { getEntries, getEntryByDate, saveEntry, deleteEntry };