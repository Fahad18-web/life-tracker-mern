import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEntryDate } from '../api/entriesAPI';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

const TODAY = () => new Date().toISOString().split('T')[0];
const DISMISS_KEY = () => `lt_notif_dismissed_${TODAY()}`;

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [hasPendingLog, setHasPendingLog] = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const [reminderTime,  setReminderTime]  = useState(
    () => localStorage.getItem('lt_reminder_time') || '20:00'
  );

  // Check if today's entry is already logged
  const checkTodayEntry = useCallback(async () => {
    if (!user) return;
    // Respect today's dismiss
    if (localStorage.getItem(DISMISS_KEY())) {
      setDismissed(true);
      return;
    }
    try {
      await fetchEntryDate(TODAY());
      setHasPendingLog(false);    // entry exists — no reminder needed
    } catch (err) {
      if (err?.response?.status === 404) {
        // Check if it's past the reminder time
        const [rHour, rMin] = reminderTime.split(':').map(Number);
        const now = new Date();
        const isPastReminderTime = now.getHours() > rHour ||
          (now.getHours() === rHour && now.getMinutes() >= rMin);

        setHasPendingLog(isPastReminderTime);
      }
    }
  }, [user, reminderTime]);

  useEffect(() => {
    checkTodayEntry();
    // Re-check every 15 minutes
    const interval = setInterval(checkTodayEntry, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTodayEntry]);

  // Called by Log page after successful save
  const markLogged = () => setHasPendingLog(false);

  // Dismiss banner for today
  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY(), '1');
    setDismissed(true);
    setHasPendingLog(false);
  };

  // Update reminder time
  const updateReminderTime = (time) => {
    setReminderTime(time);
    localStorage.setItem('lt_reminder_time', time);
  };

  const showBanner = hasPendingLog && !dismissed;

  return (
    <NotificationContext.Provider value={{
      showBanner,
      hasPendingLog,
      reminderTime,
      markLogged,
      dismiss,
      updateReminderTime,
      recheckEntry: checkTodayEntry
    }}>
      {children}
    </NotificationContext.Provider>
  );
};