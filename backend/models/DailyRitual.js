const mongoose = require('mongoose');

const DailyRitualSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD']
    },
    morningPlan: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Morning plan too long']
    },
    nightWin: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Win text too long']
    },
    nightBlocker: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Blocker text too long']
    },
    tomorrowTarget: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Tomorrow target too long']
    }
  },
  { timestamps: true }
);

DailyRitualSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyRitual', DailyRitualSchema);