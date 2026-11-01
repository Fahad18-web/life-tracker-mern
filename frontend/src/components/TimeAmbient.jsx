import { useEffect, useMemo, useState } from 'react';
import { Sunrise, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  resolveAmbientWindow,
  shouldShowAmbient,
  markAmbientShown,
  ambientCopy
} from '../utils/timeAmbient';

export default function TimeAmbient() {
  const { user } = useAuth();
  const timeZone = user?.timezone || 'Asia/Karachi';
  const firstName = user?.name?.split(' ')[0] || 'there';

  const ambientWindow = useMemo(
    () => resolveAmbientWindow(timeZone),
    [timeZone]
  );

  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const update = () => setReduceMotion(Boolean(mq.matches));
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!ambientWindow || !shouldShowAmbient(ambientWindow, timeZone)) {
      setVisible(false);
      return;
    }
    setVisible(true);
    markAmbientShown(ambientWindow, timeZone);
  }, [ambientWindow, timeZone]);

  if (!visible || !ambientWindow) return null;

  const copy = ambientCopy(ambientWindow, firstName);
  if (!copy) return null;

  const Icon = ambientWindow === 'morning' ? Sunrise : Moon;

  return (
    <div
      className={`time-ambient time-ambient--${ambientWindow}${
        reduceMotion ? ' time-ambient--static' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="time-ambient__glow" aria-hidden="true" />
      <div className="time-ambient__content">
        <span className="time-ambient__icon">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="time-ambient__eyebrow">{copy.eyebrow}</p>
          <p className="time-ambient__title">{copy.title}</p>
          <p className="time-ambient__body">{copy.body}</p>
        </div>
        <button
          type="button"
          className="time-ambient__dismiss"
          onClick={() => setVisible(false)}
          aria-label="Dismiss greeting"
        >
          ×
        </button>
      </div>
    </div>
  );
}