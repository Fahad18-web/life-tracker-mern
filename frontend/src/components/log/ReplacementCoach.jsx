import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  RefreshCw,
  Ban,
  CheckCircle2,
  Circle,
  Sparkles
} from 'lucide-react';
import { fetchPairs } from '../../api/habitReplacementAPI';

function statusMeta(avoided, done, requireBoth) {
  const success = requireBoth ? avoided && done : done;

  if (success) {
    return {
      success: true,
      label: 'On track',
      tip: 'Both sides of this pair look good for today.',
      tone: 'text-[var(--color-success)]',
      border: 'border-[var(--color-success)]/25',
      bg: 'bg-[var(--color-success)]/5'
    };
  }
  if (avoided && !done) {
    return {
      success: false,
      label: 'Almost',
      tip: 'You avoided the hard habit — still need the replacement.',
      tone: 'text-[var(--color-warning)]',
      border: 'border-[var(--color-warning)]/25',
      bg: 'bg-[var(--color-warning)]/5'
    };
  }
  if (!avoided && done) {
    return {
      success: false,
      label: 'Partial',
      tip: 'Replacement done — still try to avoid the hard habit.',
      tone: 'text-[var(--color-brand-400)]',
      border: 'border-[var(--color-brand-500)]/25',
      bg: 'bg-[var(--color-brand-600)]/5'
    };
  }
  return {
    success: false,
    label: 'Open',
    tip: 'Skip the hard habit and do the replacement when you can.',
    tone: 'text-[var(--color-text-muted)]',
    border: 'border-[var(--color-border)]',
    bg: 'bg-[var(--color-surface)]'
  };
}

function SidePanel({ variant, label, active, activeText, idleText }) {
  const isAvoid = variant === 'avoid';
  const Icon = isAvoid ? Ban : CheckCircle2;
  const StatusIcon = active ? CheckCircle2 : Circle;

  const activeStyles = isAvoid
    ? 'border-[var(--color-danger)]/35 bg-[var(--color-danger)]/8 text-[var(--color-danger)]'
    : 'border-[var(--color-success)]/35 bg-[var(--color-success)]/8 text-[var(--color-success)]';

  const idleStyles =
    'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]';

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2 rounded-[var(--radius-control)] border px-3 py-3 ${
        active ? activeStyles : idleStyles
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {isAvoid ? 'Avoid' : 'Do instead'}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug text-[var(--color-text)]">
        {label}
      </p>
      <div className="mt-auto flex items-center gap-1.5 text-xs font-medium">
        <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{active ? activeText : idleText}</span>
      </div>
    </div>
  );
}

export default function ReplacementCoach({ good, bad, customStates }) {
  const [pairs, setPairs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPairs()
      .then((res) => {
        if (!cancelled) setPairs(res.data.pairs || []);
      })
      .catch(() => {
        if (!cancelled) setPairs([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  if (pairs.length === 0) {
    return (
      <div className="lt-card-muted flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-600)]/12 text-[var(--color-brand-400)]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              No replacement pairs yet
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Link a hard habit to a better one — progress shows here while you
              log today.
            </p>
          </div>
        </div>
        <Link
          to="/replacements"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--color-brand-500)]"
        >
          Create a pair
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const resolveBadAvoided = (pair) => {
    if (pair.isCustomBad) return !customStates[pair.badHabit];
    return !bad[pair.badHabit];
  };

  const resolveGoodDone = (pair) => {
    if (pair.isCustomGood) return !!customStates[pair.goodHabit];
    return !!good[pair.goodHabit];
  };

  return (
    <section className="lt-card border-[var(--color-brand-500)]/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-600)]/12 text-[var(--color-brand-400)]">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Today&apos;s replacements
            </h2>
            <p className="mt-0.5 max-w-md text-xs leading-relaxed text-[var(--color-text-secondary)]">
              Avoid one hard habit and do its replacement. This tracks pairs —
              separate from your letter grade.
            </p>
          </div>
        </div>
        <Link
          to="/replacements"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-400)] no-underline hover:text-[var(--color-brand-300)]"
        >
          Manage pairs
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="space-y-3">
        {pairs.slice(0, 5).map((pair) => {
          const avoided = resolveBadAvoided(pair);
          const done = resolveGoodDone(pair);
          const requireBoth = pair.rules?.requireBoth !== false;
          const meta = statusMeta(avoided, done, requireBoth);

          return (
            <li
              key={pair._id}
              className={`rounded-[var(--radius-card)] border p-3 sm:p-3.5 ${meta.border} ${meta.bg}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                <SidePanel
                  variant="avoid"
                  label={pair.badHabitLabel}
                  active={avoided}
                  activeText="Avoided today"
                  idleText="Still in play"
                />

                <div
                  className="flex shrink-0 items-center justify-center py-0.5 sm:px-1"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4 rotate-90 text-[var(--color-brand-400)] sm:rotate-0" />
                </div>

                <SidePanel
                  variant="do"
                  label={pair.goodHabitLabel}
                  active={done}
                  activeText="Done today"
                  idleText="Not yet"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)]/60 pt-2.5">
                <p className={`text-xs font-semibold ${meta.tone}`}>{meta.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {meta.tip}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}