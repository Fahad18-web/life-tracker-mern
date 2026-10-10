const analyticsService = require('../services/analyticsService');
const { success } = require('../utils/apiResponse');

const getWeekly = async (req, res, next) => {
  try {
    const data = await analyticsService.getWeekly(req.user._id);
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getMonthly = async (req, res, next) => {
  try {
    const result = await analyticsService.getMonthly(req.user._id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getStreaks = async (req, res, next) => {
  try {
    const result = await analyticsService.getStreaks(req.user._id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getReport = async (req, res, next) => {
  try {
    const range = (req.query.range || 'week').toLowerCase();
    const result = await analyticsService.getReport(req.user._id, range);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const result = await analyticsService.getInsights(req.user._id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const result = await analyticsService.getDashboard(req.user._id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeekly,
  getMonthly,
  getStreaks,
  getReport,
  getInsights,
  getDashboard
};