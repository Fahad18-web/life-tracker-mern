import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';

/**
 * Highlights the weakest (or only) replacement pair — product USP, no AI.
 */
export default function ReplacementFocusCard({ focus }) {
  if (!focus) return null;

  const rate = focus.rate;

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      aria-labelledby="replacement-focus-title"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="replacement-focus-title"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-400)]"
          >
            Replacement focus
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-[var(--color-text)]">
            {focus.label}
            {rate != null && (
              <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">
                {rate}%
              </span>
            )}
          </p>
          {focus.progressLabel && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {focus.progressLabel}
            </p>
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {focus.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/log"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-500)]"
            >
              Log today
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/replacements"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] no-underline transition hover:bg-[var(--color-bg)]"
            >
              View pairs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}