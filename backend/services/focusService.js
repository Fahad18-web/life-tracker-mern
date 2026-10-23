const DailyFocus = require('../models/DailyFocus');
const AppError = require('../utils/AppError');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 3;
const MAX_TEXT = 120;

function assertDate(date) {
  if (!date || !DATE_RE.test(date)) {
    throw new AppError('Valid date (YYYY-MM-DD) is required.', 400);
  }
}

function normalizeItems(rawItems) {
  if (rawItems == null) return [];
  if (!Array.isArray(rawItems)) {
    throw new AppError('items must be an array.', 400);
  }
  if (rawItems.length > MAX_ITEMS) {
    throw new AppError(`Maximum ${MAX_ITEMS} focus items allowed.`, 400);
  }

  return rawItems.map((item, i) => {
    const text = typeof item === 'string' ? item : item?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new AppError(`Focus item ${i + 1} text is required.`, 400);
    }
    const trimmed = text.trim();
    if (trimmed.length > MAX_TEXT) {
      throw new AppError(`Focus item ${i + 1} cannot exceed ${MAX_TEXT} characters.`, 400);
    }
    return {
      text: trimmed,
      completed: Boolean(item?.completed)
    };
  });
}

class FocusService {
  async getByDate(userId, date) {
    assertDate(date);
    const doc = await DailyFocus.findOne({ userId, date }).lean();
    if (!doc) {
      return { date, items: [], completedCount: 0, total: 0 };
    }
    const items = doc.items || [];
    return {
      date: doc.date,
      items,
      completedCount: items.filter((x) => x.completed).length,
      total: items.length,
      updatedAt: doc.updatedAt
    };
  }

  /** Replace full list for the day (create or update). */
  async setItems(userId, date, rawItems) {
    assertDate(date);
    const items = normalizeItems(rawItems);

    const doc = await DailyFocus.findOneAndUpdate(
      { userId, date },
      { $set: { items } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    const list = doc.items || [];
    return {
      date: doc.date,
      items: list,
      completedCount: list.filter((x) => x.completed).length,
      total: list.length,
      updatedAt: doc.updatedAt
    };
  }

  async toggleItem(userId, date, itemId, completed) {
    assertDate(date);
    if (!itemId) throw new AppError('Item id is required.', 400);
    if (typeof completed !== 'boolean') {
      throw new AppError('completed must be a boolean.', 400);
    }

    const doc = await DailyFocus.findOne({ userId, date });
    if (!doc) throw new AppError('No focus block for this date.', 404);

    const item = doc.items.id(itemId);
    if (!item) throw new AppError('Focus item not found.', 404);

    item.completed = completed;
    await doc.save();

    const list = doc.items;
    return {
      date: doc.date,
      items: list,
      completedCount: list.filter((x) => x.completed).length,
      total: list.length,
      updatedAt: doc.updatedAt
    };
  }
}

module.exports = new FocusService();