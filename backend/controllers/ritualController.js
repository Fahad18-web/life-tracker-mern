const ritualService = require('../services/ritualService');
const { success } = require('../utils/apiResponse');

const getRitual = async (req, res, next) => {
  try {
    const ritual = await ritualService.getByDate(req.user._id, req.params.date);
    return success(res, { ritual });
  } catch (err) {
    next(err);
  }
};

const upsertRitual = async (req, res, next) => {
  try {
    const ritual = await ritualService.upsert(
      req.user._id,
      req.params.date,
      req.body || {}
    );
    return success(res, { ritual });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRitual, upsertRitual };