const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  date: {
    type:     String, // "YYYY-MM-DD"
    required: true
  },
  good: {
    morning:   { type: Boolean, default: false },
    exercise:  { type: Boolean, default: false },
    reading:   { type: Boolean, default: false },
    prayer:    { type: Boolean, default: false },
    coding:    { type: Boolean, default: false },
    sleep:     { type: Boolean, default: false },
    diet:      { type: Boolean, default: false },
    hydration: { type: Boolean, default: false }
  },
  bad: {
    social:          { type: Boolean, default: false },
    procrastination: { type: Boolean, default: false },
    junk:            { type: Boolean, default: false },
    late:            { type: Boolean, default: false },
    fajr:            { type: Boolean, default: false }
  },
  customHabits: [{
    habitId:   { type: mongoose.Schema.Types.ObjectId, ref: 'CustomHabit' },
    name:      { type: String },
    emoji:     { type: String, default: '⭐' },
    type:      { type: String, enum: ['good', 'bad'] },
    completed: { type: Boolean, default: false }
  }],
  mood:     { type: Number, min: 1, max: 5, required: true },
  notes:    { type: String, trim: true, maxlength: 1000, default: '' },
  netScore: { type: Number },
  grade:    { type: String }
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────
// 1. One entry per user per day (unique)
EntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// 2. Fast range queries + newest first (weekly/monthly/streaks)
EntrySchema.index({ userId: 1, date: -1 });

// ── Auto-calculate netScore + grade ──────────────────
EntrySchema.pre('save', function (next) {
  const goodKeys = Object.keys(this.good);
  const badKeys  = Object.keys(this.bad);

  const defaultGoodDone = goodKeys.filter(k => this.good[k]).length;
  const defaultBadDone  = badKeys.filter(k  => this.bad[k]).length;

  const customGoodTotal = (this.customHabits || []).filter(h => h.type === 'good').length;
  const customBadTotal  = (this.customHabits || []).filter(h => h.type === 'bad').length;
  const customGoodDone  = (this.customHabits || []).filter(h => h.type === 'good' && h.completed).length;
  const customBadDone   = (this.customHabits || []).filter(h => h.type === 'bad'  && h.completed).length;

  const totalGood = goodKeys.length + customGoodTotal;
  const totalBad  = badKeys.length  + customBadTotal;

  const goodScore = totalGood > 0 ? (defaultGoodDone + customGoodDone) / totalGood * 100 : 0;
  const badScore  = totalBad  > 0 ? (defaultBadDone  + customBadDone)  / totalBad  * 100 : 0;

  this.netScore = Math.round(goodScore - badScore * 0.5);

  if      (this.netScore >= 85) this.grade = 'A';
  else if (this.netScore >= 70) this.grade = 'B';
  else if (this.netScore >= 55) this.grade = 'C';
  else if (this.netScore >= 40) this.grade = 'D';
  else                          this.grade = 'F';

  next();
});

module.exports = mongoose.model('Entry', EntrySchema);