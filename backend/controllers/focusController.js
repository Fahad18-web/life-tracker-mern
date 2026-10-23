const focusService = require('../services/focusService');
const { success } = require('../utils/apiResponse');

const getFocus = async (req, res, next) => {
  try {
    const date = req.params.date;
    const data = await focusService.getByDate(req.user._id, date);
    return success(res, { focus: data });
  } catch (err) {
    next(err);
  }
};

const setFocus = async (req, res, next) => {
  try {
    const date = req.params.date;
    const items = req.body?.items;
    const data = await focusService.setItems(req.user._id, date, items);
    return success(res, { focus: data });
  } catch (err) {
    next(err);
  }
};

const toggleFocusItem = async (req, res, next) => {
  try {
    const { date, itemId } = req.params;
    const completed = req.body?.completed;
    const data = await focusService.toggleItem(
      req.user._id,
      date,
      itemId,
      completed
    );
    return success(res, { focus: data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFocus, setFocus, toggleFocusItem };