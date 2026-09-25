import { useState, useEffect, useCallback } from 'react';
import { fetchCustomHabits, createCustomHabit, deleteCustomHabit } from '../api/customHabitsAPI';
import toast from 'react-hot-toast';

export const useCustomHabits = () => {
  const [habits,  setHabits]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCustomHabits();
      setHabits(res.data.habits);
    } catch {
      toast.error('Could not load custom habits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addHabit = async ({ name, emoji, type }) => {
    setSaving(true);
    try {
      const res = await createCustomHabit({ name, emoji, type });
      setHabits(prev => [...prev, res.data.habit]);
      toast.success(`"${name}" added!`);
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add habit.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeHabit = async (id) => {
    try {
      await deleteCustomHabit(id);
      setHabits(prev => prev.filter(h => h._id !== id));
      toast.success('Habit removed.');
    } catch {
      toast.error('Could not remove habit.');
    }
  };

  return { habits, loading, saving, addHabit, removeHabit, reload: load };
};