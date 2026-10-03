const { runDailyReminders } = require('../services/reminderService');

const dailyReminders = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    const provided =
      req.get('x-cron-secret') ||
      req.query.secret ||
      req.body?.secret;

    if (!secret || provided !== secret) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const strictHour = req.query.strictHour === '1' || req.body?.strictHour === true;
    const result = await runDailyReminders({ strictHour });

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { dailyReminders };