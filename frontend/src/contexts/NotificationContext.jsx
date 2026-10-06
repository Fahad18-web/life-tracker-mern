import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEntryDate } from '../api/entriesAPI';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

const todayKey = () => new Date().toISOString().split('T')[0];
const DISMISS_KEY = () => `lt_notif_dismissed_${todayKey()}`;

/**
 * Resolve reminder hour 0–23 from account prefs, then localStorage, then 20.
 */
function resolveReminderHour(user) {
  const fromPrefs = Number(user?.preferences?.dailyReminderHour);
  if (Number.isInteger(fromPrefs) && fromPrefs >= 0 && fromPrefs <= 23) {
    return fromPrefs;
  }

  const stored = localStorage.getItem('lt_reminder_time'); // "HH:MM" or "18"
  if (stored) {
    if (stored.includes(':')) {
      const h = Number(stored.split(':')[0]);
      if (Number.isInteger(h) && h >= 0 && h <= 23) return h;
    } else {
      const h = Number(stored);
      if (Number.isInteger(h) && h >= 0 && h <= 23) return h;
    }
  }

  return 20;
}

function isPastLocalHour(hour) {
  const now = new Date();
  return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= 0);
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [hasPendingLog, setHasPendingLog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkTodayEntry = useCallback(async () => {
    if (!user) {
      setHasPendingLog(false);
      return;
    }

    if (localStorage.getItem(DISMISS_KEY())) {
      setDismissed(true);
      setHasPendingLog(false);
      return;
    }

    setDismissed(false);

    const reminderHour = resolveReminderHour(user);
    // Keep localStorage in sync when prefs exist (Settings is source of truth)
    if (user?.preferences?.dailyReminderHour != null) {
      const h = resolveReminderHour(user);
      localStorage.setItem('lt_reminder_time', `${String(h).padStart(2, '0')}:00`);
    }

    try {
      const res = await fetchEntryDate(todayKey());
      const entry =
        res?.data?.entry ??
        res?.data?.data?.entry ??
        res?.data?.data ??
        null;

      // Some APIs return 200 + null entry instead of 404
      const hasEntry = Boolean(entry && (entry._id || entry.date || entry.netScore != null));

      if (hasEntry) {
        setHasPendingLog(false);
        return;
      }

      setHasPendingLog(isPastLocalHour(reminderHour));
    } catch (err) {
      if (err?.response?.status === 404) {
        setHasPendingLog(isPastLocalHour(reminderHour));
      } else {
        // Network / auth errors: do not spam banner
        setHasPendingLog(false);
      }
    }
  }, [user]);

  useEffect(() => {
    checkTodayEntry();
    const interval = setInterval(checkTodayEntry, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTodayEntry]);

  const markLogged = useCallback(() => {
    setHasPendingLog(false);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY(), '1');
    setDismissed(true);
    setHasPendingLog(false);
  }, []);

  /**
   * Optional: still allow manual override (e.g. future UI).
   * Prefer Settings → preferences.dailyReminderHour.
   * @param {string|number} time - "18:00" or 18
   */
  const updateReminderTime = useCallback((time) => {
    if (typeof time === 'number') {
      const h = Math.min(23, Math.max(0, time));
      localStorage.setItem('lt_reminder_time', `${String(h).padStart(2, '0')}:00`);
    } else if (typeof time === 'string') {
      localStorage.setItem('lt_reminder_time', time);
    }
    // Re-run check after local override
    setTimeout(() => {
      // fire-and-forget; checkTodayEntry closes over latest user
    }, 0);
  }, []);

  const showBanner = Boolean(user) && hasPendingLog && !dismissed;

  return (
    <NotificationContext.Provider
      value={{
        showBanner,
        hasPendingLog,
        reminderTime: `${String(resolveReminderHour(user)).padStart(2, '0')}:00`,
        markLogged,
        dismiss,
        updateReminderTime,
        recheckEntry: checkTodayEntry
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};