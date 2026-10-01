const mongoose = require('mongoose');

const RulesSchema = new mongoose.Schema(
  {
    windowDays: {
      type: Number,
      enum: [7, 14, 21, 30],
      default: 7
    },
    requireBoth: {
      type: Boolean,
      default: true
    },
    minLoggedDays: {
      type: Number,
      min: 0,
      max: 7,
      default: 1
    }
  },
  { _id: false }
);

const HabitReplacementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    badHabit: { type: String, required: true },
    badHabitLabel: { type: String, required: true },
    badHabitEmoji: { type: String, default: '❌' },
    isCustomBad: { type: Boolean, default: false },

    goodHabit: { type: String, required: true },
    goodHabitLabel: { type: String, required: true },
    goodHabitEmoji: { type: String, default: '✅' },
    isCustomGood: { type: Boolean, default: false },

    rules: {
      type: RulesSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

HabitReplacementSchema.index({ userId: 1, createdAt: 1 });
HabitReplacementSchema.index(
  { userId: 1, badHabit: 1, goodHabit: 1 },
  { unique: true }
);

HabitReplacementSchema.statics.countForUser = function (userId) {
  return this.countDocuments({ userId });
};

module.exports = mongoose.model('HabitReplacement', HabitReplacementSchema);