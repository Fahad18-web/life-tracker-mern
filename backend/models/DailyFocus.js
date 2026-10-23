const mongoose = require('mongoose');

const FocusItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Focus item text is required'],
      trim: true,
      maxlength: [120, 'Focus item cannot exceed 120 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const DailyFocusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD']
    },
    items: {
      type: [FocusItemSchema],
      default: [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length <= 3;
        },
        message: 'Maximum 3 focus items per day'
      }
    }
  },
  { timestamps: true }
);

DailyFocusSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyFocus', DailyFocusSchema);