import { useState, useEffect } from 'react';
import { fetchWeekly, fetchMonthly, fetchStreaks } from '../api/entriesAPI';

export const useAnalytics = () => {
  const [weekly,  setWeekly]  = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, m, s] = await Promise.all([fetchWeekly(), fetchMonthly(), fetchStreaks()]);
        setWeekly(w.data.data);
        setMonthly(m.data);
        setStreaks(s.data.streaks);
      } catch { /* handled globally */ } finally { setLoading(false); }
    };
    load();
  }, []);

  return { weekly, monthly, streaks, loading };
};
