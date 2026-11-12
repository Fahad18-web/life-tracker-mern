const Entry = require('../models/Entry');
const WeeklyReview = require('../models/WeeklyReview');
const AppError = require('../utils/AppError');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FIELD = 1000;
const FIELD_KEYS = ['wentWell', 'challenges', 'improve', 'priority'];

function assertWeekStart(weekStart) {
  if (!weekStart || !DATE_RE.test(weekStart)) {
    throw new AppError('Valid weekStart (YYYY-MM-DD) is required.', 400);
  }
}

/** Monday (UTC) for a YYYY-MM-DD string — consistent with Entry date strings. */
function mondayOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new AppError('Invalid date.', 400);
  }
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function currentWeekStart() {
  return mondayOf(new Date().toISOString().split('T')[0]);
}

function normalizeField(value, name) {
  if (value == null) return '';
  if (typeof value !== 'string') {
    throw new AppError(`${name} must be a string.`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_FIELD) {
    throw new AppError(`${name} cannot exceed ${MAX_FIELD} characters.`, 400);
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
 * Overview from Entries only — no second scoring engine.
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

    for (const e of list) {
      const good = e.good || {};
      const bad = e.bad || {};
      for (const k of Object.keys(good)) {
        goodSlots += 1;
        if (good[k]) goodCompleted += 1;
      }
      for (const k of Object.keys(bad)) {
        badSlots += 1;
        if (bad[k]) badMarked += 1;
      }
      for (const ch of e.customHabits || []) {
        if (ch.type === 'good') {
          goodSlots += 1;
          if (ch.completed) goodCompleted += 1;
        } else if (ch.type === 'bad') {
          badSlots += 1;
          if (ch.completed) badMarked += 1;
        }
      }
    }

    const avgScore = daysLogged
      ? Math.round(
          list.reduce((s, e) => s + (e.netScore || 0), 0) / daysLogged
        )
      : null;

    const avgMood = daysLogged
      ? Number(
          (
            list.reduce((s, e) => s + (e.mood || 0), 0) / daysLogged
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
    previous.daysLogged > 0 && current.avgScore != null && previous.avgScore != null
      ? {
          avgScoreDelta: current.avgScore - previous.avgScore,
          daysLoggedDelta: current.daysLogged - previous.daysLogged,
          previousAvgScore: previous.avgScore,
          previousDaysLogged: previous.daysLogged
        }
      : null;

  const daily = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const e = entries.find((x) => x.date === date);
    daily.push({
      date,
      netScore: e?.netScore ?? null,
      mood: e?.mood ?? null,
      grade: e?.grade ?? null,
      logged: Boolean(e)
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
  getCurrentWeekStart() {
    return currentWeekStart();
  }

  normalizeWeekStart(weekStart) {
    if (!weekStart) return currentWeekStart();
    assertWeekStart(weekStart);
    const normalized = mondayOf(weekStart);
    if (normalized !== weekStart) {
      // Accept any day in week; canonicalize to Monday
      return normalized;
    }
    return weekStart;
  }

  async getWeek(userId, weekStartRaw) {
    const weekStart = this.normalizeWeekStart(weekStartRaw);
    const weekEnd = addDays(weekStart, 6);

    const [overview, doc] = await Promise.all([
      buildOverview(userId, weekStart),
      WeeklyReview.findOne({ userId, weekStart }).lean()
    ]);

    return {
      weekStart,
      weekEnd,
      overview,
      reflection: shapeReview(doc)
    };
  }

  async listHistory(userId, limit = 12) {
    const lim = Math.min(Math.max(Number(limit) || 12, 1), 52);
    const docs = await WeeklyReview.find({ userId })
      .sort({ weekStart: -1 })
      .limit(lim)
      .select('weekStart status completedAt updatedAt wentWell')
      .lean();

    return docs.map((d) => ({
      weekStart: d.weekStart,
      weekEnd: addDays(d.weekStart, 6),
      status: d.status,
      completedAt: d.completedAt,
      updatedAt: d.updatedAt,
      hasContent: Boolean(
        (d.wentWell && d.wentWell.length) ||
          d.status === 'completed'
      )
    }));
  }

    async upsert(userId, weekStartRaw, body = {}) {
    const weekStart = this.normalizeWeekStart(weekStartRaw);
    const payload = {};

    for (const key of FIELD_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        payload[key] = normalizeField(body[key], key);
      }
    }

    let status = body.status;
    if (status != null) {
      if (status !== 'draft' && status !== 'completed') {
        throw new AppError('status must be draft or completed.', 400);
      }

      // When marking completed, all reflection fields must be present and non-empty.
      if (status === 'completed') {
        const existing = await WeeklyReview.findOne({ userId, weekStart }).lean();
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

        const missing = FIELD_KEYS.filter((k) => !String(merged[k] || '').trim());
        if (missing.length > 0) {
          throw new AppError(
            'All four reflection fields are required to mark this review as completed.',
            400
          );
        }

        // Persist merged text if client only sent status
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
      throw new AppError('No valid fields to update.', 400);
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