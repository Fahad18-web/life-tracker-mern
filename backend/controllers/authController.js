const authService = require('../services/authService');
const { success, created } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return created(res, result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  return success(res, {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar || null,
      emailVerified: Boolean(req.user.emailVerified),
      preferences: req.user.preferences
    }
  });
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await authService.updatePreferences(req.user._id, req.body);
    return success(res, { preferences });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body?.token || req.query?.token;
    const result = await authService.verifyEmail(token);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const result = await authService.resendVerificationByEmail(req.body?.email);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePreferences,
  verifyEmail,
  resendVerification
};