
const analyticsService = require('../services/analyticsService');
const { success } = require('../utils/apiResponse');

const getWeekly = async (req, res, next) => {
  try {
    const data = await analyticsService.getWeekly(
      req.user._id,
      req.user.timezone
    );

    return success(res, { data });
  } catch (err) {
    return next(err);
  }
};

const getMonthly = async (req, res, next) => {
  try {
    const result = await analyticsService.getMonthly(
      req.user._id,
      req.user.timezone
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getStreaks = async (req, res, next) => {
  try {
    const result = await analyticsService.getStreaks(
      req.user._id,
      req.user.timezone
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getReport = async (req, res, next) => {
  try {
    const range = (req.query.range || 'week').toLowerCase();

    const result = await analyticsService.getReport(
      req.user._id,
      range,
      req.user.timezone
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const result = await analyticsService.getInsights(
      req.user._id,
      req.user.timezone
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const result = await analyticsService.getDashboard(
      req.user._id,
      req.user.timezone
    );

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getHeatmap = async (req, res, next) => {
  try {
    const weeks = parseInt(req.query.weeks, 10);

    const result = await analyticsService.getHeatmap(
      req.user._id,
      Number.isFinite(weeks) ? weeks : 53,
      req.user.timezone
    );

    return success(res, { heatmap: result });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getWeekly,
  getMonthly,
  getStreaks,
  getReport,
  getInsights,
  getDashboard,
  getHeatmap
};
