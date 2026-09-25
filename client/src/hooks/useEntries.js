import { useState, useEffect } from 'react';
import { fetchEntries, saveEntry, deleteEntry as apiDelete } from '../api/entriesAPI';
import toast from 'react-hot-toast';

export const useEntries = () => {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const loadEntries = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchEntries(page);
      setEntries(res.data.entries);
    } catch {
      toast.error('Could not load entries');
    } finally { setLoading(false); }
  };

  const save = async (data) => {
    setSaving(true);
    try {
      const res = await saveEntry(data);
      await loadEntries();
      toast.success('Entry saved! Keep going 🌱');
      return res.data.entry;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await apiDelete(id);
      setEntries(prev => prev.filter(e => e._id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Delete failed'); }
  };

  useEffect(() => { loadEntries(); }, []);

  return { entries, loading, saving, save, remove, reload: loadEntries };
};
