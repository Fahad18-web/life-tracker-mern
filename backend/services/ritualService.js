const DailyRitual = require('../models/DailyRitual');
const AppError = require('../utils/AppError');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS = {
  morningPlan: 300,
  nightWin: 300,
  nightBlocker: 300,
  tomorrowTarget: 200
};

function assertDate(date) {
  if (!date || !DATE_RE.test(date)) {
    throw new AppError('Valid date (YYYY-MM-DD) is required.', 400);
  }
}

function clip(value, max) {
  if (value == null) return '';
  if (typeof value !== 'string') {
    throw new AppError('Ritual fields must be strings.', 400);
  }
  return value.trim().slice(0, max);
}

function emptyRitual(date) {
  return {
    date,
    morningPlan: '',
    nightWin: '',
    nightBlocker: '',
    tomorrowTarget: '',
    hasMorning: false,
    hasNight: false
  };
}

function shape(doc) {
  if (!doc) return null;
  const morningPlan = doc.morningPlan || '';
  const nightWin = doc.nightWin || '';
  const nightBlocker = doc.nightBlocker || '';
  const tomorrowTarget = doc.tomorrowTarget || '';
  return {
    date: doc.date,
    morningPlan,
    nightWin,
    nightBlocker,
    tomorrowTarget,
    hasMorning: Boolean(morningPlan),
    hasNight: Boolean(nightWin || nightBlocker || tomorrowTarget),
    updatedAt: doc.updatedAt
  };
}

class RitualService {
  async getByDate(userId, date) {
    assertDate(date);
    const doc = await DailyRitual.findOne({ userId, date }).lean();
    return shape(doc) || emptyRitual(date);
  }

  async upsert(userId, date, body = {}) {
    assertDate(date);

    const $set = {};
    if (Object.prototype.hasOwnProperty.call(body, 'morningPlan')) {
      $set.morningPlan = clip(body.morningPlan, LIMITS.morningPlan);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nightWin')) {
      $set.nightWin = clip(body.nightWin, LIMITS.nightWin);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nightBlocker')) {
      $set.nightBlocker = clip(body.nightBlocker, LIMITS.nightBlocker);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tomorrowTarget')) {
      $set.tomorrowTarget = clip(body.tomorrowTarget, LIMITS.tomorrowTarget);
    }

    if (Object.keys($set).length === 0) {
      throw new AppError('No ritual fields to update.', 400);
    }

    const doc = await DailyRitual.findOneAndUpdate(
      { userId, date },
      { $set },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return shape(doc);
  }
}

module.exports = new RitualService();