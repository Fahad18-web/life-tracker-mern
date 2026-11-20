
'use strict';

const User = require('../models/User');
const Entry = require('../models/Entry');
const CustomHabit = require('../models/CustomHabit');
const { isValidAvatar } = require('../config/avatarPresets');
const { validatePassword } = require('../utils/passwordPolicy');
const {
  addDaysToDateString,
  getTodayInTimeZone,
  normalizeTimeZone
} = require('../utils/dateUtils');

const calcOverallStreak = (entries, timeZone) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 0;
  }

  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const today = getTodayInTimeZone(normalizedTimeZone);

  // A Set avoids duplicate dates affecting the streak calculation.
  const entryDates = new Set(
    entries
      .map((entry) => entry?.date)
      .filter((date) => typeof date === 'string')
  );

  // Preserve existing behavior: an unlogged current day does not
  // immediately break a streak that continued through yesterday.
  let currentDate = entryDates.has(today)
    ? today
    : addDaysToDateString(today, -1);

  let streak = 0;

  while (entryDates.has(currentDate)) {
    streak += 1;
    currentDate = addDaysToDateString(currentDate, -1);
  }

  return streak;
};

const getProfile = async (req, res, next) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).lean();

    const totalEntries = entries.length;
    const avgScore = totalEntries
      ? Math.round(
          entries.reduce((s, e) => s + (e.netScore || 0), 0) /
            totalEntries
        )
      : 0;

    const overallStreak = calcOverallStreak(
      entries,
      req.user.timezone
    );

    const bestEntry = entries.reduce(
      (a, b) => (a?.netScore > b?.netScore ? a : b),
      entries[0]
    );

    const gradeCounts = entries.reduce((acc, e) => {
      if (e.grade) {
        acc[e.grade] = (acc[e.grade] || 0) + 1;
      }
      return acc;
    }, {});

    const customHabitsCount = await CustomHabit.countForUser(
      req.user._id
    );

    return res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || null,
        emailVerified: Boolean(req.user.emailVerified),
        onboardingCompleted: Boolean(req.user.onboardingCompleted),
        createdAt: req.user.createdAt,
        timezone: normalizeTimeZone(req.user.timezone)
      },
      stats: {
        totalEntries,
        avgScore,
        overallStreak,
        bestScore: bestEntry?.netScore ?? 0,
        bestDate: bestEntry?.date ?? null,
        customHabitsCount,
        gradeCounts
      }
    });
  } catch (err) {
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const hasAvatar = Object.prototype.hasOwnProperty.call(
      req.body,
      'avatar'
    );

    if (!name && !email && !hasAvatar) {
      return res.status(400).json({
        success: false,
        message: 'Provide name, email, or avatar to update.'
      });
    }

    if (hasAvatar && !isValidAvatar(avatar)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid avatar. Choose a preset.'
      });
    }

    if (email && email !== req.user.email) {
      const exists = await User.findOne({
        email: email.toLowerCase()
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use.'
        });
      }
    }

    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();

    if (hasAvatar) {
      user.avatar = avatar === '' || avatar === null ? null : avatar;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        emailVerified: Boolean(user.emailVerified),
        onboardingCompleted: Boolean(user.onboardingCompleted),
        timezone: normalizeTimeZone(user.timezone)
      }
    });
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both fields are required.'
      });
    }

    const policy = validatePassword(newPassword);

    if (!policy.ok) {
      return res.status(400).json({
        success: false,
        message: policy.message
      });
    }

    const user = await User.findById(req.user._id).select(
      '+passwordHash'
    );

    const match = await user.comparePassword(currentPassword);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.passwordHash = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    return next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account.'
      });
    }

    const user = await User.findById(req.user._id).select(
      '+passwordHash'
    );

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password.'
      });
    }

    await Promise.all([
      Entry.deleteMany({ userId: req.user._id }),
      CustomHabit.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id)
    ]);

    return res.json({
      success: true,
      message: 'Account and all data permanently deleted.'
    });
  } catch (err) {
    return next(err);
  }
};

const completeOnboarding = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { onboardingCompleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        emailVerified: Boolean(user.emailVerified),
        onboardingCompleted: true,
        preferences: user.preferences,
        timezone: normalizeTimeZone(user.timezone)
      }
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  completeOnboarding
};
