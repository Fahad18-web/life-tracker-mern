import { Flame } from 'lucide-react';

const HABIT_LABELS = {
  morning: 'Morning',
  exercise: 'Exercise',
  reading: 'Reading',
  prayer: 'Prayer',
  coding: 'Coding',
  sleep: 'Sleep',
  diet: 'Diet',
  hydration: 'Hydration'
};

const GRADE_FILL = {
  A: 'bg-[var(--color-success)]',
  B: 'bg-[#84cc16]',
  C: 'bg-[var(--color-warning)]',
  D: 'bg-[#f97316]',
  F: 'bg-[var(--color-danger)]'
};

function barWidthPct(count, max) {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.round((Number(count) / max) * 100));
}

/**
 * Visual habit streaks: 7-day activity strip + relative streak bars.
 */
export default function StreakVisualization({
  weekly = [],
  streaks = {},
  customStreaks = {},
  overallStreak = 0
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultEntries = Object.entries(streaks || {}).map(([key, count]) => ({
    id: key,
    label: HABIT_LABELS[key] || key,
    count: Number(count) || 0,
    kind: 'good'
  }));

  const customEntries = Object.entries(customStreaks || {}).map(([key, data]) => ({
    id: `c-${key}`,
    label: data?.name || key,
    count: Number(data?.streak) || 0,
    kind: data?.type === 'bad' ? 'bad' : 'good',
    emoji: data?.emoji
  }));

  const allHabits = [...defaultEntries, ...customEntries].sort(
    (a, b) => b.count - a.count
  );

  const maxStreak = Math.max(overallStreak, ...allHabits.map((h) => h.count), 1);

  if (weekly.length === 0 && allHabits.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="streak-viz-title">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-[var(--color-warning)]" />
        <h2
          id="streak-viz-title"
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          Streak visualization
        </h2>
      </div>

      {/* 7-day logging activity */}
      {weekly.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              This week
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Overall streak{' '}
              <span className="font-semibold text-[var(--color-brand-400)]">
                {overallStreak}d
              </span>
            </p>
          </div>
          <div className="flex items-end justify-between gap-1.5 sm:gap-2">
            {weekly.map((d) => {
              const logged = d.netScore != null || d.grade;
              const isToday = d.date === todayStr;
              const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString(
                'en-PK',
                { weekday: 'short' }
              );
              const fill = logged
                ? GRADE_FILL[d.grade] || 'bg-[var(--color-brand-500)]'
                : 'bg-[var(--color-border)]';

              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-1.5"
                  title={
                    logged
                      ? `${d.date}: score ${d.netScore ?? '—'} (${d.grade || '—'})`
                      : `${d.date}: not logged`
                  }
                >
                  <div
                    className={`h-8 w-full max-w-[2.25rem] rounded-md sm:h-10 ${fill} ${
                      isToday ? 'ring-2 ring-[var(--color-brand-400)] ring-offset-1 ring-offset-[var(--color-surface)]' : ''
                    }`}
                    style={{
                      opacity: logged ? 1 : 0.35
                    }}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      isToday
                        ? 'text-[var(--color-brand-400)]'
                        : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
            Taller color = logged day (by grade). Grey = missed.
          </p>
        </div>
      )}

      {/* Per-habit streak bars */}
      {allHabits.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Habit streaks
          </p>
          <ul className="space-y-3">
            {allHabits.map((h) => {
              const pct = barWidthPct(h.count, maxStreak);
              const barColor =
                h.kind === 'bad'
                  ? 'bg-[var(--color-danger)]'
                  : 'bg-[var(--color-warning)]';

              return (
                <li key={h.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-[var(--color-text-secondary)]">
                      {h.emoji ? `${h.emoji} ` : ''}
                      {h.label}
                      {h.kind === 'bad' && (
                        <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
                          (avoid)
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-display text-sm font-semibold text-[var(--color-text)]">
                      {h.count}
                      <span className="ml-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                        d
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]/60"
                    role="presentation"
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-out ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}