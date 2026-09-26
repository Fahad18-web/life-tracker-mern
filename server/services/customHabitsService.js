const CustomHabit = require('../models/CustomHabit');
const AppError = require('../utils/AppError');

const MAX_CUSTOM_HABITS = 10;

class CustomHabitsService {
  async getCustomHabits(userId) {
    const habits = await CustomHabit.find({ userId })
      .sort({ createdAt: 1 })
      .lean();
    return habits;
  }

  async createCustomHabit(userId, data) {
    const { name, emoji, type } = data;

    if (!name || !type) {
      throw new AppError('Name and type are required.', 400);
    }

    const count = await CustomHabit.countForUser(userId);
    if (count >= MAX_CUSTOM_HABITS) {
      throw new AppError(`Maximum ${MAX_CUSTOM_HABITS} custom habits allowed.`, 400);
    }

    const habit = await CustomHabit.create({
      userId,
      name: name.trim(),
      emoji: emoji?.trim() || '⭐',
      type
    });

    return habit;
  }

  async deleteCustomHabit(userId, habitId) {
    const habit = await CustomHabit.findOne({ _id: habitId, userId });

    if (!habit) {
      throw new AppError('Habit not found.', 404);
    }

    await habit.deleteOne();
    return { message: 'Custom habit deleted.' };
  }
}

module.exports = new CustomHabitsService();