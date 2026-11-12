const weeklyReviewService = require('../services/weeklyReviewService');
const { success } = require('../utils/apiResponse');

const getWeek = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart;
    const data = await weeklyReviewService.getWeek(req.user._id, weekStart);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await weeklyReviewService.listHistory(
      req.user._id,
      req.query.limit
    );
    return success(res, { history });
  } catch (err) {
    next(err);
  }
};

const upsertWeek = async (req, res, next) => {
  try {
    const weekStart = req.params.weekStart;
    const data = await weeklyReviewService.upsert(
      req.user._id,
      weekStart,
      req.body || {}
    );
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWeek, getHistory, upsertWeek };