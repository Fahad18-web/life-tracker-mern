import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { fetchPairs } from '../../api/habitReplacementAPI';

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
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        No replacement pairs yet.{' '}
        <Link to="/replacements" className="font-medium text-[var(--color-brand-400)] no-underline">
          Create one
        </Link>{' '}
        to see today’s focus here.
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
    <section className="rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-[var(--color-brand-400)]">
        <RefreshCw className="h-4 w-4" />
        <h2 className="text-sm font-semibold">Today’s replacements</h2>
      </div>
      <ul className="space-y-2.5">
        {pairs.slice(0, 5).map((pair) => {
          const avoided = resolveBadAvoided(pair);
          const done = resolveGoodDone(pair);
          const requireBoth = pair.rules?.requireBoth !== false;
          const success = requireBoth ? avoided && done : done;

          let tip = `Focus: skip ${pair.badHabitLabel}, do ${pair.goodHabitLabel}.`;
          if (success) tip = 'On track for this pair today.';
          else if (avoided && !done) tip = `Nice — now do: ${pair.goodHabitLabel}`;
          else if (!avoided && done) {
            tip = `Good on ${pair.goodHabitLabel}. Try avoiding ${pair.badHabitLabel}.`;
          }

          return (
            <li
              key={pair._id}
              className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text)]">
                <span>
                  {pair.badHabitEmoji} {pair.badHabitLabel}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                <span>
                  {pair.goodHabitEmoji} {pair.goodHabitLabel}
                </span>
              </div>
              <p
                className={`text-xs ${
                  success ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                {tip}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}