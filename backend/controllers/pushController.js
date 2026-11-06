const pushService = require('../services/pushService');
const { success } = require('../utils/apiResponse');

const getVapidPublic = async (req, res, next) => {
  try {
    return success(res, { publicKey: pushService.getPublicKey() });
  } catch (err) {
    next(err);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const result = await pushService.saveSubscription(
      req.user._id,
      req.body
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    const result = await pushService.removeSubscription(req.user._id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getVapidPublic, subscribe, unsubscribe };