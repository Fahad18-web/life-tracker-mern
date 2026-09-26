const customHabitsService = require('../services/customHabitsService');
const { success, created } = require('../utils/apiResponse');

const getCustomHabits = async (req, res, next) => {
  try {
    const habits = await customHabitsService.getCustomHabits(req.user._id);
    return success(res, { habits });
  } catch (err) {
    next(err);
  }
};

const createCustomHabit = async (req, res, next) => {
  try {
    const habit = await customHabitsService.createCustomHabit(req.user._id, req.body);
    return created(res, { habit });
  } catch (err) {
    next(err);
  }
};

const deleteCustomHabit = async (req, res, next) => {
  try {
    const result = await customHabitsService.deleteCustomHabit(req.user._id, req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomHabits, createCustomHabit, deleteCustomHabit };