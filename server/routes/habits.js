const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { buildHabitCatalog, normalizeHabitName } = require('../utils/habitCatalog');

router.get('/', protect, (req, res) => {
  const customHabits = req.user.preferences?.customHabits || [];
  res.json({ success: true, catalog: buildHabitCatalog(customHabits), customHabits });
});

router.post('/', protect, async (req, res, next) => {
  try {
    const name = normalizeHabitName(req.body.name);
    const category = req.body.category === 'bad' ? 'bad' : 'good';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Habit name is required' });
    }

    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const customHabits = req.user.preferences?.customHabits || [];

    if (customHabits.some((habit) => habit.key === key)) {
      return res.status(409).json({ success: false, message: 'That habit already exists' });
    }

    const updatedHabits = [...customHabits, { key, name, category }];
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'preferences.customHabits': updatedHabits },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      customHabits: user.preferences.customHabits,
      catalog: buildHabitCatalog(user.preferences.customHabits)
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:key', protect, async (req, res, next) => {
  try {
    const customHabits = req.user.preferences?.customHabits || [];
    const updatedHabits = customHabits.filter((habit) => habit.key !== req.params.key);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'preferences.customHabits': updatedHabits },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      customHabits: user.preferences.customHabits,
      catalog: buildHabitCatalog(user.preferences.customHabits)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
