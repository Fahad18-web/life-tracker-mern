
'use strict';

const mongoose = require('mongoose');
const { isValidDateString } = require('../utils/dateUtils');

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
      validate: {
        validator: isValidDateString,
        message: 'date must be a valid YYYY-MM-DD calendar date'
      }
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

DailyRitualSchema.index(
  { userId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'DailyRitual',
  DailyRitualSchema
);
