const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { normalizeHabitName } = require('../utils/habitCatalog');
const AppError = require('../utils/AppError');

class AuthService {
  async register({ name, email, password, timezone }) {
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400);
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      timezone: timezone || 'Asia/Karachi'
    });

    return {
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401);
    }

    return {
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    };
  }

  async updatePreferences(userId, updates) {
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

    const currentUser = await User.findById(userId).select('preferences');

    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences: { ...currentUser.preferences.toObject(), ...updates } },
      { new: true, runValidators: true }
    );

    return user.preferences;
  }
}

module.exports = new AuthService();