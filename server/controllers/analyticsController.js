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

module.exports = { getWeekly, getMonthly, getStreaks };