import { Link } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';

/**
 * Personalized weekly focus from analytics (rule-based, no AI).
 */
export default function PersonalFocusCard({ focus }) {
  if (!focus) return null;

  return (
    <section
      className="rounded-2xl border border-[var(--color-brand-500)]/35 bg-[var(--color-brand-600)]/10 p-5"
      aria-labelledby="personal-focus-title"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)]">
          <Target className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="personal-focus-title"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-400)]"
          >
            {focus.title || 'This week’s focus'}
          </p>

          {focus.habitLabel && (
            <p className="mt-1 font-display text-lg font-semibold text-[var(--color-text)]">
              {focus.habitLabel}
              {focus.kind === 'good' && focus.loggedDays > 0 && (
                <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">
                  {focus.count}/{focus.loggedDays} days
                </span>
              )}
              {focus.kind === 'bad' && focus.loggedDays > 0 && (
                <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">
                  slipped {focus.count}/{focus.loggedDays}
                </span>
              )}
            </p>
          )}

          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {focus.message}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {focus.cta?.to && (
              <Link
                to={focus.cta.to}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-500)]"
              >
                {focus.cta.label || 'Log today'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {focus.secondaryCta?.to && (
              <Link
                to={focus.secondaryCta.to}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] no-underline transition hover:bg-[var(--color-surface)]"
              >
                {focus.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}