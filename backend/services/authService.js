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

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const { raw, hash, expires } = createEmailToken();

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
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
      // Account remains; user can resend from check-email page
    }

    // No JWT until email is verified
    return {
      requiresVerification: true,
      message: 'Check your email for a verification link before signing in.',
      email: user.email
    };
  }

    async login({ email, password, rememberMe }) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim()
    }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.emailVerified) {
      throw new AppError(
        'Please verify your email before signing in. Check your inbox for the link.',
        403
      );
    }

    const persist = Boolean(rememberMe);

    return {
      token: generateToken(user._id, persist),
      user: publicUser(user),
      rememberMe: persist
    };
  }

  async verifyEmail(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new AppError('Invalid or missing token', 400);
    }

    const hash = hashEmailToken(rawToken);
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

       return {
      token: generateToken(user._id, false),
      user: publicUser(user),
      message: 'Email verified successfully',
      rememberMe: false
    };
  }

  async resendVerificationByEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }

    const generic = {
      message: 'If an account exists and is unverified, a verification email was sent.'
    };

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return generic;

    if (user.emailVerified) {
      throw new AppError('Email is already verified. Please sign in.', 400);
    }

    const { raw, hash, expires } = createEmailToken();
    user.emailVerificationToken = hash;
    user.emailVerificationExpires = expires;
    await user.save();

    const verifyUrl = `${clientBaseUrl()}/verify-email?token=${raw}`;

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verifyUrl
      });
    } catch (err) {
      console.error('[auth] resend email failed:', err.message);
      throw new AppError('Could not send verification email. Try again later.', 502);
    }

    return generic;
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