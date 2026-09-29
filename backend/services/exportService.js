const Entry = require('../models/Entry');
const CustomHabit = require('../models/CustomHabit');
const AppError = require('../utils/AppError');

/** Hard cap — protects memory/CPU on huge accounts */
const MAX_ENTRIES = 5000;

class ExportService {
  async getUserExportData(userId) {
    const [entries, customHabits] = await Promise.all([
      Entry.find({ userId })
        .select('date good bad customHabits mood notes netScore grade createdAt updatedAt')
        .sort({ date: 1 })
        .limit(MAX_ENTRIES)
        .lean(),
      CustomHabit.find({ userId })
        .select('name emoji type isActive reminderTime createdAt')
        .sort({ createdAt: 1 })
        .lean()
        .catch(() => []) // model missing edge-case
    ]);

    return {
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      truncated: entries.length >= MAX_ENTRIES,
      entries,
      customHabits: customHabits || []
    };
  }

  async buildJson(userId) {
    const data = await this.getUserExportData(userId);
    return {
      contentType: 'application/json; charset=utf-8',
      filename: `life-tracker-export-${this._dateStamp()}.json`,
      body: JSON.stringify(data, null, 2)
    };
  }

  async buildCsv(userId) {
    const data = await this.getUserExportData(userId);
    const rows = data.entries.map((e) => {
      const good = e.good || {};
      const bad = e.bad || {};
      return {
        date: e.date,
        netScore: e.netScore ?? '',
        grade: e.grade ?? '',
        mood: e.mood ?? '',
        notes: e.notes ?? '',
        morning: !!good.morning,
        exercise: !!good.exercise,
        reading: !!good.reading,
        prayer: !!good.prayer,
        coding: !!good.coding,
        sleep: !!good.sleep,
        diet: !!good.diet,
        hydration: !!good.hydration,
        social: !!bad.social,
        procrastination: !!bad.procrastination,
        junk: !!bad.junk,
        late: !!bad.late,
        fajr: !!bad.fajr,
        customHabits: (e.customHabits || [])
          .map((h) => `${h.name}:${h.completed ? 1 : 0}`)
          .join('|')
      };
    });

    const headers = [
      'date', 'netScore', 'grade', 'mood', 'notes',
      'morning', 'exercise', 'reading', 'prayer', 'coding', 'sleep', 'diet', 'hydration',
      'social', 'procrastination', 'junk', 'late', 'fajr',
      'customHabits'
    ];

    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => this._csvEscape(row[h])).join(',')
      )
    ];

    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `life-tracker-export-${this._dateStamp()}.csv`,
      body: lines.join('\n'),
      meta: {
        entryCount: data.entryCount,
        truncated: data.truncated
      }
    };
  }

  async export(userId, format = 'json') {
    const f = String(format).toLowerCase();
    if (f !== 'json' && f !== 'csv') {
      throw new AppError('Invalid format. Use json or csv.', 400);
    }
    return f === 'csv' ? this.buildCsv(userId) : this.buildJson(userId);
  }

  _dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  _csvEscape(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
}

module.exports = new ExportService();