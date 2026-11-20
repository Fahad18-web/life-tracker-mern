
'use strict';

const Entry = require('../models/Entry');
const WeeklyReview = require('../models/WeeklyReview');
const AppError = require('../utils/AppError');
const {
  addDaysToDateString,
  getTodayInTimeZone,
  getMondayDateString,
  isValidDateString,
  normalizeTimeZone
} = require('../utils/dateUtils');

const MAX_FIELD = 1000;
const FIELD_KEYS = ['wentWell', 'challenges', 'improve', 'priority'];

function assertWeekStart(weekStart) {
  if (!isValidDateString(weekStart)) {
    throw new AppError(
      'Valid weekStart (YYYY-MM-DD) is required.',
      400
    );
  }
}

function addDays(dateString, days) {
  try {
    return addDaysToDateString(dateString, days);
  } catch {
    throw new AppError('Invalid date range.', 400);
  }
}

function currentWeekStart(timeZone) {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const today = getTodayInTimeZone(normalizedTimeZone);

  return getMondayDateString(today);
}

function normalizeField(value, name) {
  if (value == null) return '';

  if (typeof value !== 'string') {
    throw new AppError(`${name} must be a string.`, 400);
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_FIELD) {
    throw new AppError(
      `${name} cannot exceed ${MAX_FIELD} characters.`,
      400
    );
  }

  return trimmed;
}

function emptyReflection() {
  return {
    wentWell: '',
    challenges: '',
    improve: '',
    priority: '',
    status: 'draft',
    completedAt: null,
    updatedAt: null
  };
}

function shapeReview(doc) {
  if (!doc) return emptyReflection();

  return {
    wentWell: doc.wentWell || '',
    challenges: doc.challenges || '',
    improve: doc.improve || '',
    priority: doc.priority || '',
    status: doc.status || 'draft',
    completedAt: doc.completedAt || null,
    updatedAt: doc.updatedAt || null
  };
}

/**
 * Build the weekly overview exclusively from Entry documents.
 * Existing scoring and summary semantics are intentionally preserved.
 */
async function buildOverview(userId, weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const prevStart = addDays(weekStart, -7);
  const prevEnd = addDays(weekStart, -1);

  const [entries, prevEntries] = await Promise.all([
    Entry.find({
      userId,
      date: { $gte: weekStart, $lte: weekEnd }
    })
      .select('date netScore mood grade good bad customHabits')
      .lean(),

    Entry.find({
      userId,
      date: { $gte: prevStart, $lte: prevEnd }
    })
      .select('date netScore mood good bad customHabits')
      .lean()
  ]);

  const summarize = (list) => {
    const daysLogged = list.length;

    let goodCompleted = 0;
    let badMarked = 0;
    let goodSlots = 0;
    let badSlots = 0;

    for (const entry of list) {
      const good = entry.good || {};
      const bad = entry.bad || {};

      for (const key of Object.keys(good)) {
        goodSlots += 1;

        if (good[key]) {
          goodCompleted += 1;
        }
      }

      for (const key of Object.keys(bad)) {
        badSlots += 1;

        if (bad[key]) {
          badMarked += 1;
        }
      }

      for (const habit of entry.customHabits || []) {
        if (habit.type === 'good') {
          goodSlots += 1;

          if (habit.completed) {
            goodCompleted += 1;
          }
        } else if (habit.type === 'bad') {
          badSlots += 1;

          if (habit.completed) {
            badMarked += 1;
          }
        }
      }
    }

    const avgScore = daysLogged
      ? Math.round(
          list.reduce(
            (sum, entry) => sum + (entry.netScore || 0),
            0
          ) / daysLogged
        )
      : null;

    const avgMood = daysLogged
      ? Number(
          (
            list.reduce(
              (sum, entry) => sum + (entry.mood || 0),
              0
            ) / daysLogged
          ).toFixed(1)
        )
      : null;

    const consistencyPct = Math.round((daysLogged / 7) * 100);

    const goodCompletionPct =
      goodSlots > 0
        ? Math.round((goodCompleted / goodSlots) * 100)
        : null;

    return {
      daysLogged,
      daysInWeek: 7,
      consistencyPct,
      avgScore,
      avgMood,
      goodCompleted,
      badMarked,
      goodCompletionPct
    };
  };

  const current = summarize(entries);
  const previous = summarize(prevEntries);

  const comparison =
    previous.daysLogged > 0 &&
    current.avgScore != null &&
    previous.avgScore != null
      ? {
          avgScoreDelta: current.avgScore - previous.avgScore,
          daysLoggedDelta: current.daysLogged - previous.daysLogged,
          previousAvgScore: previous.avgScore,
          previousDaysLogged: previous.daysLogged
        }
      : null;

  const daily = [];

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(weekStart, index);
    const entry = entries.find((item) => item.date === date);

    daily.push({
      date,
      netScore: entry?.netScore ?? null,
      mood: entry?.mood ?? null,
      grade: entry?.grade ?? null,
      logged: Boolean(entry)
    });
  }

  return {
    weekStart,
    weekEnd,
    ...current,
    comparison,
    daily
  };
}

class WeeklyReviewService {
  getCurrentWeekStart(timeZone) {
    return currentWeekStart(timeZone);
  }

  normalizeWeekStart(weekStart, timeZone) {
    if (!weekStart) {
      return currentWeekStart(timeZone);
    }

    assertWeekStart(weekStart);

    try {
      return getMondayDateString(weekStart);
    } catch {
      throw new AppError(
        'Valid weekStart (YYYY-MM-DD) is required.',
        400
      );
    }
  }

  async getWeek(userId, weekStartRaw, timeZone) {
    const weekStart = this.normalizeWeekStart(
      weekStartRaw,
      timeZone
    );

    const weekEnd = addDays(weekStart, 6);

    const [overview, doc] = await Promise.all([
      buildOverview(userId, weekStart),
      WeeklyReview.findOne({
        userId,
        weekStart
      }).lean()
    ]);

    return {
      weekStart,
      weekEnd,
      overview,
      reflection: shapeReview(doc)
    };
  }

  async listHistory(userId, limit = 12) {
    const parsedLimit = Number(limit) || 12;
    const safeLimit = Math.min(
      Math.max(parsedLimit, 1),
      52
    );

    const docs = await WeeklyReview.find({ userId })
      .sort({ weekStart: -1 })
      .limit(safeLimit)
      .select('weekStart status completedAt updatedAt wentWell')
      .lean();

    return docs.map((doc) => ({
      weekStart: doc.weekStart,
      weekEnd: addDays(doc.weekStart, 6),
      status: doc.status,
      completedAt: doc.completedAt,
      updatedAt: doc.updatedAt,
      hasContent: Boolean(
        (doc.wentWell && doc.wentWell.length) ||
        doc.status === 'completed'
      )
    }));
  }

  async upsert(userId, weekStartRaw, body = {}, timeZone) {
    const weekStart = this.normalizeWeekStart(
      weekStartRaw,
      timeZone
    );

    const payload = {};

    for (const key of FIELD_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        payload[key] = normalizeField(body[key], key);
      }
    }

    const status = body.status;

    if (status != null) {
      if (status !== 'draft' && status !== 'completed') {
        throw new AppError(
          'status must be draft or completed.',
          400
        );
      }

      if (status === 'completed') {
        const existing = await WeeklyReview.findOne({
          userId,
          weekStart
        }).lean();

        const merged = {
          wentWell:
            payload.wentWell !== undefined
              ? payload.wentWell
              : existing?.wentWell || '',

          challenges:
            payload.challenges !== undefined
              ? payload.challenges
              : existing?.challenges || '',

          improve:
            payload.improve !== undefined
              ? payload.improve
              : existing?.improve || '',

          priority:
            payload.priority !== undefined
              ? payload.priority
              : existing?.priority || ''
        };

        const missing = FIELD_KEYS.filter(
          (key) => !String(merged[key] || '').trim()
        );

        if (missing.length > 0) {
          throw new AppError(
            'All four reflection fields are required to mark this review as completed.',
            400
          );
        }

        Object.assign(payload, {
          wentWell: merged.wentWell.trim(),
          challenges: merged.challenges.trim(),
          improve: merged.improve.trim(),
          priority: merged.priority.trim()
        });

        payload.completedAt = new Date();
      }

      if (status === 'draft') {
        payload.completedAt = null;
      }

      payload.status = status;
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError(
        'No valid fields to update.',
        400
      );
    }

    const doc = await WeeklyReview.findOneAndUpdate(
      { userId, weekStart },
      { $set: payload },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    const overview = await buildOverview(userId, weekStart);

    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      overview,
      reflection: shapeReview(doc)
    };
  }
}

module.exports = new WeeklyReviewService();
