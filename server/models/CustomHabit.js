const mongoose = require('mongoose');

const CustomHabitSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true
  },
  name: {
    type:      String,
    required:  [true, 'Habit name is required'],
    trim:      true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  emoji: {
    type:    String,
    default: '⭐',
    trim:    true
  },
  type: {
    type:     String,
    enum:     ['good', 'bad'],
    required: [true, 'Habit type (good or bad) is required']
  }
}, { timestamps: true });

// Max 10 custom habits per user
CustomHabitSchema.statics.countForUser = function (userId) {
  return this.countDocuments({ userId });
};

module.exports = mongoose.model('CustomHabit', CustomHabitSchema);