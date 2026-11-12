import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * In-app log reminder — calm copy (Phase C).
 * Show/hide logic stays in NotificationContext.
 */
export default function NotificationBanner() {
  const { showBanner, dismiss } = useNotification();
  const navigate = useNavigate();

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-14 z-40 border-b border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Bell className="h-4 w-4 shrink-0 text-[var(--color-brand-400)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">
            No log for today yet.{' '}
            <span className="hidden text-[var(--color-text-secondary)] sm:inline">
              One minute is enough — protect a streak or start a small comeback.
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/log')}
            className="rounded-lg bg-[var(--color-brand-600)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
          >
            Log now
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}