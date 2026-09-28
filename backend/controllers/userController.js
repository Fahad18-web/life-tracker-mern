const User        = require('../models/User');
const Entry       = require('../models/Entry');
const CustomHabit = require('../models/CustomHabit');

// ── Helper: calculate overall streak from entries ─────────────────
const calcOverallStreak = (entries) => {
  if (!entries.length) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today     = new Date();
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

// @desc   Get profile + account stats
// @route  GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).lean();

    const totalEntries  = entries.length;
    const avgScore      = totalEntries
      ? Math.round(entries.reduce((s, e) => s + (e.netScore || 0), 0) / totalEntries) : 0;
    const overallStreak = calcOverallStreak(entries);
    const bestEntry     = entries.reduce((a, b) => (a?.netScore > b?.netScore ? a : b), entries[0]);
    const gradeCounts   = entries.reduce((acc, e) => {
      if (e.grade) acc[e.grade] = (acc[e.grade] || 0) + 1;
      return acc;
    }, {});
    const customHabitsCount = await CustomHabit.countForUser(req.user._id);

    res.json({
      success: true,
      user: {
        _id:       req.user._id,
        name:      req.user.name,
        email:     req.user.email,
        createdAt: req.user.createdAt,
      },
      stats: {
        totalEntries,
        avgScore,
        overallStreak,
        bestScore:          bestEntry?.netScore  ?? 0,
        bestDate:           bestEntry?.date       ?? null,
        customHabitsCount,
        gradeCounts,
      }
    });
  } catch (err) { next(err); }
};

// @desc   Update name and/or email
// @route  PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name && !email)
      return res.status(400).json({ success: false, message: 'Provide name or email to update.' });

    // Check email uniqueness
    if (email && email !== req.user.email) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const user = await User.findById(req.user._id);
    if (name)  user.name  = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    await user.save();

    res.json({ success: true, message: 'Profile updated.', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
};

// @desc   Change password
// @route  PUT /api/users/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    // Must select passwordHash explicitly (select: false on schema)
    const user = await User.findById(req.user._id).select('+passwordHash');
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.passwordHash = newPassword;   // pre-save hook will re-hash
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

// @desc   Delete account + all data
// @route  DELETE /api/users/account
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ success: false, message: 'Password is required to delete account.' });

    const user = await User.findById(req.user._id).select('+passwordHash');
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    // Cascade delete everything
    await Promise.all([
      Entry.deleteMany({ userId: req.user._id }),
      CustomHabit.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);

    res.json({ success: true, message: 'Account and all data permanently deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };