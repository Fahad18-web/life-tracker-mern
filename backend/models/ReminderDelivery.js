
'use strict';

const mongoose = require('mongoose');

const DELIVERY_STATUSES = [
  'pending',
  'sending',
  'sent',
  'failed',
  'skipped',
  'uncertain'
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidLocalDate(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimezone(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

const channelSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: 'pending',
      required: true
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: 'Attempts must be a non-negative integer.'
      },
      required: true
    },

    // Only failed deliveries explicitly marked retryable can be claimed again.
    // Existing documents without this field safely receive false.
    retryable: {
      type: Boolean,
      default: false,
      required: true
    },

    claimId: {
      type: String,
      default: null
    },

    leaseUntil: {
      type: Date,
      default: null
    },

    lastAttemptAt: {
      type: Date,
      default: null
    },

    sentAt: {
      type: Date,
      default: null
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 500
    }
  },
  {
    _id: false
  }
);

const reminderDeliverySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: false
    },

    localDate: {
      type: String,
      required: true,
      validate: {
        validator: isValidLocalDate,
        message: 'localDate must be a valid YYYY-MM-DD calendar date.'
      }
    },

    timezone: {
      type: String,
      required: true,
      validate: {
        validator: isValidTimezone,
        message: 'timezone must be a valid IANA timezone.'
      }
    },

    preferredHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
      validate: {
        validator: Number.isInteger,
        message: 'preferredHour must be an integer.'
      }
    },

    email: {
      type: channelSchema,
      default: () => ({})
    },

    push: {
      type: channelSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reminderDeliverySchema.index(
  { userId: 1, localDate: 1 },
  {
    unique: true,
    name: 'uniq_user_local_reminder_date'
  }
);

const ReminderDelivery = mongoose.model(
  'ReminderDelivery',
  reminderDeliverySchema
);

module.exports = ReminderDelivery;
