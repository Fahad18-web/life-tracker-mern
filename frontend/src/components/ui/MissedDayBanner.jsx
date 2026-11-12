import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { buildStreakRecovery } from '../../utils/streakRecovery';

/**
 * Streak recovery surface (Phase B).
 * - start: missed / streak 0 + history
 * - progress: overallStreak 1–2 after a real history
 * Hides when streak ≥ 3 or brand-new user (no history).
 */
export default function MissedDayBanner({
  hasLoggedToday,
  overallStreak,
  hasHistory
}) {
  const recovery = buildStreakRecovery({
    hasLoggedToday: Boolean(hasLoggedToday),
    overallStreak,
    hasHistory: Boolean(hasHistory)
  });

  if (!recovery.active) return null;

  const { mode, day, target, title, message } = recovery;

  return (
    <div
      className="rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-surface)] p-4"
      role="status"
      aria-labelledby="streak-recovery-title"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <Heart className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            id="streak-recovery-title"
            className="text-sm font-semibold text-[var(--color-text)]"
          >
            {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {message}
          </p>

          {/* Progress dots: 3-day comeback */}
          <div
            className="mt-3 flex items-center gap-2"
            aria-label={`Comeback progress ${day} of ${target}`}
          >
            {Array.from({ length: target }, (_, i) => {
              const step = i + 1;
              const filled = day >= step;
              return (
                <span
                  key={step}
                  className={`h-2 flex-1 max-w-[3rem] rounded-full transition ${
                    filled
                      ? 'bg-[var(--color-brand-500)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                />
              );
            })}
            <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">
              {day}/{target}
            </span>
          </div>

          {mode === 'start' || !hasLoggedToday ? (
            <Link
              to="/log"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-400)] no-underline hover:underline"
            >
              Log today
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Today is counted. See you tomorrow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}