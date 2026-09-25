const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const { normalizeHabitName } = require('../utils/habitCatalog');

// @desc   Register new user
// @route  POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, timezone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      timezone: timezone || 'Asia/Karachi'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences }
    });
  } catch (err) { next(err); }
};

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences }
    });
  } catch (err) { next(err); }
};

// @desc   Get logged-in user profile
// @route  GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc   Update preferences (theme etc.)
// @route  PUT /api/auth/preferences
const updatePreferences = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (Array.isArray(updates.customHabits)) {
      updates.customHabits = updates.customHabits
        .map((habit, index) => ({
          key: normalizeHabitName(habit.key || habit.name || `custom-${index}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
          name: normalizeHabitName(habit.name),
          category: habit.category === 'bad' ? 'bad' : 'good'
        }))
        .filter((habit) => habit.key && habit.name);
    }

    const currentUser = await User.findById(req.user._id).select('preferences');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: { ...currentUser.preferences.toObject(), ...updates } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, preferences: user.preferences });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updatePreferences };
