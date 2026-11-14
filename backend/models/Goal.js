
const mongoose = require('mongoose');

const TITLE_MAX = 120;
const DESC_MAX = 1000;
const MILESTONE_TITLE_MAX = 120;
const MILESTONE_DESC_MAX = 500;

const CATEGORIES = [
  'personal',
  'career',
  'learning',
  'health',
  'fitness',
  'finance',
  'faith',
  'other'
];

const STATUSES = ['active', 'completed', 'archived'];

/**
 * Validate a real calendar date in YYYY-MM-DD format.
 * Rejects impossible dates while supporting leap years.
 */
const isValidDateString = (value) => {
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return day <= daysInMonth;
};

// Embedded Milestone Schema
const MilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: [
        MILESTONE_TITLE_MAX,
        `Milestone title cannot exceed ${MILESTONE_TITLE_MAX} characters`
      ],
      validate: {
        validator(v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Milestone title cannot be empty'
      }
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        MILESTONE_DESC_MAX,
        `Milestone description cannot exceed ${MILESTONE_DESC_MAX} characters`
      ],
      default: ''
    },

    completed: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    },

    order: {
      type: Number,
      default: 0,
      min: [0, 'Milestone order cannot be negative'],
      validate: {
        validator(v) {
          return Number.isInteger(v);
        },
        message: 'Milestone order must be an integer'
      }
    }
  },
  { _id: true }
);

// Goal Schema
const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required']
    },

    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [
        TITLE_MAX,
        `Goal title cannot exceed ${TITLE_MAX} characters`
      ],
      validate: {
        validator(v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Goal title cannot be empty'
      }
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        DESC_MAX,
        `Goal description cannot exceed ${DESC_MAX} characters`
      ],
      default: ''
    },

    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: 'Invalid goal category'
      },
      default: 'personal'
    },

    /**
     * Optional target date.
     * Uses the application's YYYY-MM-DD date convention.
     */
    targetDate: {
      type: String,
      default: null,
      validate: {
        validator(v) {
          if (v == null || v === '') return true;
          return isValidDateString(v);
        },
        message: 'targetDate must be a valid date in YYYY-MM-DD format'
      }
    },

    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Invalid goal status'
      },
      default: 'active'
    },

    /**
     * Denormalized progress from 0–100.
     * Authoritative updates must happen in the service layer
     * using milestone completion data only.
     */
    progress: {
      type: Number,
      default: 0,
      min: [0, 'progress cannot be below 0'],
      max: [100, 'progress cannot exceed 100']
    },

    milestones: {
      type: [MilestoneSchema],
      default: []
    }
  },
  { timestamps: true }
);

// Efficient goal listing by owner and status.
GoalSchema.index({
  userId: 1,
  status: 1,
  updatedAt: -1
});

module.exports = mongoose.model('Goal', GoalSchema);
