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

const sendTest = async (req, res, next) => {
  try {
    const result = await pushService.sendToUser(req.user._id, {
      title: 'LifeTracker',
      body: 'Push is working. You will get log reminders here.',
      url: '/log'
    });
    if (!result.sent) {
      return res.status(400).json({
        success: false,
        message: result.reason || 'Push not sent',
        ...result
      });
    }
    return success(res, { message: 'Test notification sent', ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getVapidPublic, subscribe, unsubscribe, sendTest };