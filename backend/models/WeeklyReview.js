const mongoose = require('mongoose');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FIELD = 1000;

const WeeklyReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    /** Monday of the week as YYYY-MM-DD (UTC noon convention, same as Entry dates). */
    weekStart: {
      type: String,
      required: true,
      match: [DATE_RE, 'weekStart must be YYYY-MM-DD']
    },
    wentWell: {
      type: String,
      trim: true,
      maxlength: [MAX_FIELD, `wentWell cannot exceed ${MAX_FIELD} characters`],
      default: ''
    },
    challenges: {
      type: String,
      trim: true,
      maxlength: [MAX_FIELD, `challenges cannot exceed ${MAX_FIELD} characters`],
      default: ''
    },
    improve: {
      type: String,
      trim: true,
      maxlength: [MAX_FIELD, `improve cannot exceed ${MAX_FIELD} characters`],
      default: ''
    },
    priority: {
      type: String,
      trim: true,
      maxlength: [MAX_FIELD, `priority cannot exceed ${MAX_FIELD} characters`],
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft'
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

WeeklyReviewSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
WeeklyReviewSchema.index({ userId: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyReview', WeeklyReviewSchema);