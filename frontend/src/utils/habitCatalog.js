export const GOOD_HABITS = [
  { key: 'morning', label: 'Morning Routine', emoji: '🌅' },
  { key: 'exercise', label: 'Exercise', emoji: '💪' },
  { key: 'reading', label: 'Reading', emoji: '📚' },
  { key: 'prayer', label: 'Prayer / Ibadah', emoji: '🕌' },
  { key: 'coding', label: 'Coding / Work', emoji: '💻' },
  { key: 'sleep', label: 'Sleep on Time', emoji: '😴' },
  { key: 'diet', label: 'Healthy Diet', emoji: '🥗' },
  { key: 'hydration', label: 'Hydration', emoji: '💧' }
];

export const BAD_HABITS = [
  { key: 'social', label: 'Excessive Social Media', emoji: '📱' },
  { key: 'procrastination', label: 'Procrastination', emoji: '⏰' },
  { key: 'junk', label: 'Junk Food', emoji: '🍔' },
  { key: 'late', label: 'Late Night', emoji: '🌙' },
  { key: 'fajr', label: 'Skipped Fajr', emoji: '🌙' }
];

export const normalizeHabitName = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 40);

export const buildHabitCatalog = (customHabits = []) => {
  const defaults = {
    good: GOOD_HABITS.map((habit) => ({ ...habit, source: 'default' })),
    bad: BAD_HABITS.map((habit) => ({ ...habit, source: 'default' }))
  };

  const extras = customHabits
    .filter((habit) => habit?.name)
    .map((habit) => ({
      key: habit.key,
      label: habit.name,
      emoji: habit.category === 'bad' ? '⚠️' : '✨',
      source: 'custom',
      category: habit.category === 'bad' ? 'bad' : 'good'
    }));

  return {
    good: [...defaults.good, ...extras.filter((habit) => habit.category === 'good')],
    bad: [...defaults.bad, ...extras.filter((habit) => habit.category === 'bad')]
  };
};