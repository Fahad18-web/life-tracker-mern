import { useEffect, useMemo, useState } from 'react';
import { getHeatmap } from '../api/analyticsAPI';

function levelFor(cell) {
  if (!cell?.logged || cell.netScore == null) return 0;
  const s = cell.netScore;
  if (s >= 85) return 4;
  if (s >= 70) return 3;
  if (s >= 50) return 2;
  return 1;
}

const LEVEL_CLASS = ['hm-l0', 'hm-l1', 'hm-l2', 'hm-l3', 'hm-l4'];

export default function ActivityHeatmap({ weeks = 53 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getHeatmap(weeks);
        const hm = res.data?.heatmap ?? res.data?.data?.heatmap ?? res.data;
        if (!cancelled) setData(hm);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load heatmap');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  const columns = useMemo(() => {
    if (!data?.cells?.length) return [];
    const cells = data.cells;
    const first = new Date(cells[0].date + 'T12:00:00');
    const jsDay = first.getDay();
    const monIndex = jsDay === 0 ? 6 : jsDay - 1;
    const padded = Array(monIndex).fill(null).concat(cells);
    const cols = [];
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7));
    }
    return cols;
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
        Loading activity…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-danger)]">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Activity heatmap
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {data?.loggedCount ?? 0} days logged · last {data?.weeks ?? weeks} weeks
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
          <span>Less</span>
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={`hm-cell ${c}`} aria-hidden />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1">
          <div className="mr-1 flex flex-col justify-between py-0.5 text-[9px] text-[var(--color-text-muted)]">
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Mon</span>
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Wed</span>
            <span className="h-3 leading-3" />
            <span className="h-3 leading-3">Fri</span>
            <span className="h-3 leading-3" />
          </div>

          {columns.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {col.map((cell, di) => {
                if (!cell) {
                  return <span key={`e-${wi}-${di}`} className="hm-cell hm-empty" />;
                }
                const lv = levelFor(cell);
                return (
                  <button
                    key={cell.date}
                    type="button"
                    className={`hm-cell ${LEVEL_CLASS[lv]}`}
                    title={`${cell.date}: ${
                      cell.logged
                        ? `score ${cell.netScore ?? '—'} · ${cell.grade ?? '—'}`
                        : 'no log'
                    }`}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                    aria-label={cell.date}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hover && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-text)]">{hover.date}</span>
          {hover.logged
            ? ` · score ${hover.netScore ?? '—'} · grade ${hover.grade ?? '—'}`
            : ' · no log'}
        </p>
      )}
    </section>
  );
}