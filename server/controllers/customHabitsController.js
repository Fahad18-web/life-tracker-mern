const CustomHabit = require('../models/CustomHabit');

const MAX_CUSTOM_HABITS = 10;

// @desc   Get all custom habits for logged-in user
// @route  GET /api/custom-habits
const getCustomHabits = async (req, res, next) => {
  try {
    const habits = await CustomHabit.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, habits });
  } catch (err) { next(err); }
};

// @desc   Create a new custom habit
// @route  POST /api/custom-habits
const createCustomHabit = async (req, res, next) => {
  try {
    const { name, emoji, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required.' });
    }

    const count = await CustomHabit.countForUser(req.user._id);
    if (count >= MAX_CUSTOM_HABITS) {
      return res.status(400).json({ success: false, message: `Maximum ${MAX_CUSTOM_HABITS} custom habits allowed.` });
    }

    const habit = await CustomHabit.create({
      userId: req.user._id,
      name:   name.trim(),
      emoji:  emoji?.trim() || '⭐',
      type
    });

    res.status(201).json({ success: true, habit });
  } catch (err) { next(err); }
};

// @desc   Delete a custom habit
// @route  DELETE /api/custom-habits/:id
const deleteCustomHabit = async (req, res, next) => {
  try {
    const habit = await CustomHabit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found.' });

    await habit.deleteOne();
    res.json({ success: true, message: 'Custom habit deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getCustomHabits, createCustomHabit, deleteCustomHabit };