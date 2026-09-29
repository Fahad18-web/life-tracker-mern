const User = require('../models/User');
const Entry = require('../models/Entry');
const CustomHabit = require('../models/CustomHabit');
const { isValidAvatar } = require('../config/avatarPresets');

const calcOverallStreak = (entries) => {
  if (!entries.length) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  for (const entry of sorted) {
    const expected = checkDate.toISOString().split('T')[0];
    if (entry.date === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (expected === today.toISOString().split('T')[0] && streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (entry.date === checkDate.toISOString().split('T')[0]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      } else break;
    }
  }
  return streak;
};

const getProfile = async (req, res, next) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).lean();

    const totalEntries = entries.length;
    const avgScore = totalEntries
      ? Math.round(entries.reduce((s, e) => s + (e.netScore || 0), 0) / totalEntries)
      : 0;
    const overallStreak = calcOverallStreak(entries);
    const bestEntry = entries.reduce(
      (a, b) => (a?.netScore > b?.netScore ? a : b),
      entries[0]
    );
    const gradeCounts = entries.reduce((acc, e) => {
      if (e.grade) acc[e.grade] = (acc[e.grade] || 0) + 1;
      return acc;
    }, {});
    const customHabitsCount = await CustomHabit.countForUser(req.user._id);

    res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || null,
        createdAt: req.user.createdAt
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
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const hasAvatar = Object.prototype.hasOwnProperty.call(req.body, 'avatar');

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
      const exists = await User.findOne({ email: email.toLowerCase() });
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

    res.json({
      success: true,
      message: 'Profile updated.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null
      }
    });
  } catch (err) {
    next(err);
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
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.'
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
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

    const user = await User.findById(req.user._id).select('+passwordHash');
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

    res.json({
      success: true,
      message: 'Account and all data permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};