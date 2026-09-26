const habitReplacementService = require('../services/habitReplacementService');
const { success, created } = require('../utils/apiResponse');

const getPairs = async (req, res, next) => {
  try {
    const pairs = await habitReplacementService.getPairs(req.user._id);
    return success(res, { pairs });
  } catch (err) {
    next(err);
  }
};

const createPair = async (req, res, next) => {
  try {
    const pair = await habitReplacementService.createPair(req.user._id, req.body);
    return created(res, { pair });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This replacement pair already exists.'
      });
    }
    next(err);
  }
};

const deletePair = async (req, res, next) => {
  try {
    const result = await habitReplacementService.deletePair(req.user._id, req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPairs, createPair, deletePair };