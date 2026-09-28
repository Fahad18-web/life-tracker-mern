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
  return success(res, { user: req.user });
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await authService.updatePreferences(req.user._id, req.body);
    return success(res, { preferences });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updatePreferences };