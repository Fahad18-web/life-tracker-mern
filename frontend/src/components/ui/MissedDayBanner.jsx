import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

/**
 * Soft recovery when user has history but did not log today and streak is broken.
 */
export default function MissedDayBanner({ hasLoggedToday, overallStreak, hasHistory }) {
  if (hasLoggedToday) return null;
  if (!hasHistory) return null;
  // Streak 0 while having past entries ⇒ missed at least the chain
  if (overallStreak > 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-brand-500)]/20 bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <Heart className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">Welcome back</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            You missed a day (or more). That is okay — one log today restarts the rhythm. No
            guilt, just show up.
          </p>
          <Link
            to="/log"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--color-brand-400)] no-underline"
          >
            Log today →
          </Link>
        </div>
      </div>
    </div>
  );
}