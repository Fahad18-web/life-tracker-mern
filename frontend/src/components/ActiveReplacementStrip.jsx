import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';

/**
 * Compact, always-visible reminder that replacement progress
 * is independent of today's letter grade.
 */
export default function ActiveReplacementStrip({ pairs = [] }) {
  if (!Array.isArray(pairs) || pairs.length === 0) return null;

  const ranked = [...pairs].sort((a, b) => {
    const ar = a.stats?.successRate;
    const br = b.stats?.successRate;
    if (ar == null && br == null) return 0;
    if (ar == null) return 1;
    if (br == null) return -1;
    return ar - br; // weakest first — most needs attention
  });

  const primary = ranked[0];
  const bad =
    primary.badHabitLabel || primary.badHabitName || primary.badHabit || 'Bad habit';
  const good =
    primary.goodHabitLabel || primary.goodHabitName || primary.goodHabit || 'Good habit';
  const rate = primary.stats?.successRate;
  const label = primary.stats?.progressLabel;

  return (
    <aside
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      aria-label="Habit replacement progress"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <RefreshCw className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
            Replacement (separate from today&apos;s grade)
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">
            {bad} → {good}
            {rate != null && (
              <span className="ml-2 font-display text-[var(--color-text-secondary)]">
                {rate}%
              </span>
            )}
          </p>
          {label && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</p>
          )}
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Window progress stays visible even on a rough day.
          </p>
          <Link
            to="/replacements"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-400)] no-underline hover:text-[var(--color-brand-300)]"
          >
            View pairs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}