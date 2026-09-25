const mongoose = require('mongoose');

const HabitReplacementSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true
  },
  // Bad habit being replaced
  badHabit:       { type: String, required: true },   // key OR custom habit _id
  badHabitLabel:  { type: String, required: true },
  badHabitEmoji:  { type: String, default: '❌' },
  isCustomBad:    { type: Boolean, default: false },

  // Good habit replacing it
  goodHabit:      { type: String, required: true },   // key OR custom habit _id
  goodHabitLabel: { type: String, required: true },
  goodHabitEmoji: { type: String, default: '✅' },
  isCustomGood:   { type: Boolean, default: false },
}, { timestamps: true });

// Max 8 pairs per user
HabitReplacementSchema.statics.countForUser = function (userId) {
  return this.countDocuments({ userId });
};

// No duplicate pairs per user
HabitReplacementSchema.index({ userId: 1, badHabit: 1, goodHabit: 1 }, { unique: true });

module.exports = mongoose.model('HabitReplacement', HabitReplacementSchema);