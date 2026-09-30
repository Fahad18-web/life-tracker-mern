const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { normalizeHabitName } = require('../utils/habitCatalog');
const AppError = require('../utils/AppError');
const { createEmailToken, hashEmailToken } = require('../utils/emailToken');
const { sendVerificationEmail } = require('./emailService');

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    emailVerified: Boolean(user.emailVerified),
    preferences: user.preferences
  };
}

function clientBaseUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

class AuthService {
  async register({ name, email, password, timezone }) {
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const { raw, hash, expires } = createEmailToken();

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      timezone: timezone || 'Asia/Karachi',
      emailVerified: false,
      emailVerificationToken: hash,
      emailVerificationExpires: expires
    });

    const verifyUrl = `${clientBaseUrl()}/verify-email?token=${raw}`;

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl
      });
    } catch (err) {
      console.error('[auth] verification email failed:', err.message);
      // Account still created — user can resend
    }

    return {
      token: generateToken(user._id),
      user: publicUser(user)
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
      user: publicUser(user)
    };
  }

  async verifyEmail(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new AppError('Invalid or missing token', 400);
    }

    const hash = hashEmailToken(rawToken.trim());
    const user = await User.findOne({
      emailVerificationToken: hash,
      emailVerificationExpires: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw new AppError('Invalid or expired verification link', 400);
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return publicUser(user);
  }

  async resendVerification(userId) {
    const user = await User.findById(userId).select(
      '+emailVerificationToken +emailVerificationExpires'
    );
    if (!user) throw new AppError('User not found', 404);

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const { raw, hash, expires } = createEmailToken();
    user.emailVerificationToken = hash;
    user.emailVerificationExpires = expires;
    await user.save();

    const verifyUrl = `${clientBaseUrl()}/verify-email?token=${raw}`;
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl
    });

    return { message: 'Verification email sent' };
  }

  async updatePreferences(userId, updates) {
    const allowed = {};

    if (updates.theme !== undefined) {
      if (!['dark', 'light'].includes(updates.theme)) {
        throw new AppError('Invalid theme. Use dark or light.', 400);
      }
      allowed.theme = updates.theme;
    }

    if (updates.themePreset !== undefined) {
      if (!['teal', 'ocean', 'sunset', 'forest', 'violet'].includes(updates.themePreset)) {
        throw new AppError('Invalid theme preset.', 400);
      }
      allowed.themePreset = updates.themePreset;
    }

    if (Array.isArray(updates.customHabits)) {
      allowed.customHabits = updates.customHabits
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
    if (!currentUser) throw new AppError('User not found', 404);

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences: { ...currentUser.preferences.toObject(), ...allowed } },
      { new: true, runValidators: true }
    );

    return user.preferences;
  }
}

module.exports = new AuthService();