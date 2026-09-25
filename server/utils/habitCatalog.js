const GOOD_HABITS = [
  { key: 'morning', label: 'Morning Routine', emoji: '🌅' },
  { key: 'exercise', label: 'Exercise', emoji: '💪' },
  { key: 'reading', label: 'Reading', emoji: '📚' },
  { key: 'prayer', label: 'Prayer / Ibadah', emoji: '🕌' },
  { key: 'coding', label: 'Coding / Work', emoji: '💻' },
  { key: 'sleep', label: 'Sleep on Time', emoji: '😴' },
  { key: 'diet', label: 'Healthy Diet', emoji: '🥗' },
  { key: 'hydration', label: 'Hydration', emoji: '💧' }
];

const BAD_HABITS = [
  { key: 'social', label: 'Excessive Social Media', emoji: '📱' },
  { key: 'procrastination', label: 'Procrastination', emoji: '⏰' },
  { key: 'junk', label: 'Junk Food', emoji: '🍔' },
  { key: 'late', label: 'Late Night', emoji: '🌙' },
  { key: 'fajr', label: 'Skipped Fajr', emoji: '🌙' }
];

const getDefaultHabitGroups = () => ({
  good: GOOD_HABITS.map((habit) => ({ ...habit, source: 'default' })),
  bad: BAD_HABITS.map((habit) => ({ ...habit, source: 'default' }))
});

const normalizeHabitName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);

const buildHabitCatalog = (customHabits = []) => {
  const defaults = getDefaultHabitGroups();
  const extras = customHabits
    .filter((habit) => habit?.name)
    .map((habit) => ({
      key: habit.key,
      label: habit.name,
      emoji: habit.category === 'bad' ? '⚠️' : '✨',
      source: 'custom',
      category: habit.category === 'bad' ? 'bad' : 'good'
    }));

  const good = [...defaults.good, ...extras.filter((habit) => habit.category === 'good')];
  const bad = [...defaults.bad, ...extras.filter((habit) => habit.category === 'bad')];

  return { good, bad };
};

const getHabitKeys = (habits) => habits.map((habit) => habit.key);

module.exports = {
  GOOD_HABITS,
  BAD_HABITS,
  normalizeHabitName,
  buildHabitCatalog,
  getHabitKeys
};