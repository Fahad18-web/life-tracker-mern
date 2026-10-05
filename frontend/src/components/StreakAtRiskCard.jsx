import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';

/**
 * Shows streaks that need today’s action — calm CTA, no shame copy.
 */
export default function StreakAtRiskCard({ primary, items }) {
  if (!primary) return null;

  return (
    <section
      className="rounded-2xl border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-5"
      aria-labelledby="streak-at-risk-title"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
          <Flame className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="streak-at-risk-title"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warning)]"
          >
            Streak at risk
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[var(--color-text)]">
            {primary.label}
            <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">
              {primary.streak} days
            </span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {primary.message}
          </p>

          {items.length > 1 && (
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
              {items.slice(1).map((it) => (
                <li key={it.id}>
                  · {it.label} ({it.streak}d)
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/log"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-500)]"
          >
            Log today
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}