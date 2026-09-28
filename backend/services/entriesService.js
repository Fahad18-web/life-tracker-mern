const Entry = require('../models/Entry');
const AppError = require('../utils/AppError');

class EntriesService {
  async getEntries(userId, { page = 1, limit = 30 }) {
    const skip = (page - 1) * limit;

    const [total, entries] = await Promise.all([
      Entry.countDocuments({ userId }),
      Entry.find({ userId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      total,
      page,
      pages: Math.ceil(total / limit),
      entries
    };
  }

  async getEntryByDate(userId, date) {
    const entry = await Entry.findOne({ userId, date }).lean();
    return entry; // null if not found
  }

  async saveEntry(userId, data) {
    const { date, good, bad, mood, notes, customHabits = [] } = data;

    if (!date || !mood) {
      throw new AppError('Date and mood are required', 400);
    }

    let entry = await Entry.findOne({ userId, date });

    if (entry) {
      entry.good = good;
      entry.bad = bad;
      entry.mood = mood;
      entry.notes = notes || '';
      entry.customHabits = customHabits;
    } else {
      entry = new Entry({
        userId,
        date,
        good,
        bad,
        mood,
        notes: notes || '',
        customHabits
      });
    }

    await entry.save();
    return entry;
  }

  async deleteEntry(userId, entryId) {
    const entry = await Entry.findOne({ _id: entryId, userId });

    if (!entry) {
      throw new AppError('Entry not found', 404);
    }

    await entry.deleteOne();
    return { message: 'Entry deleted' };
  }
}

module.exports = new EntriesService();