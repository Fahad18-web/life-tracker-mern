import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp } from 'lucide-react';
import { getReport } from '../api/analyticsAPI';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const RANGES = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' }
];

function brandColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-brand-500')
      .trim() || '#1f9f7a'
  );
}

export default function Trends() {
  const [range, setRange] = useState('week');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getReport(range);
        // success() wraps payload at top level of data
        const payload = res.data.series ? res.data : res.data.data || res.data;
        if (!cancelled) setReport(payload);
      } catch {
        if (!cancelled) setError('Could not load performance report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const series = report?.series || [];
  const summary = report?.summary || {};

  const chartOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(148, 163, 157, 0.12)' },
          ticks: { color: '#9aa8a2' }
        },
        x: {
          grid: { color: 'rgba(148, 163, 157, 0.08)' },
          ticks: { color: '#9aa8a2', maxRotation: 0 }
        }
      }
    }),
    []
  );

  const scoreData = useMemo(() => {
    const color = brandColor();
    return {
      labels: series.map((d) => d.label),
      datasets: [
        {
          label: 'Score',
          data: series.map((d) => d.netScore),
          borderColor: color,
          backgroundColor: `${color}22`,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: color,
          pointRadius: range === 'month' ? 2 : 4,
          spanGaps: true
        }
      ]
    };
  }, [series, range]);

  const moodData = useMemo(() => {
    return {
      labels: series.map((d) => d.label),
      datasets: [
        {
          label: 'Mood',
          data: series.map((d) => d.mood),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#22c55e',
          pointRadius: range === 'month' ? 2 : 4,
          spanGaps: true
        }
      ]
    };
  }, [series, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Performance
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Performance Report
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Score, mood, consistency — week, month, or year
          </p>
        </div>

        {/* Range tabs */}
        <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                range === r.id
                  ? 'bg-[var(--color-brand-600)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="page-loader">Loading report…</div>}

      {error && (
        <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Avg Score', value: summary.avgScore ?? '—' },
              { label: 'Avg Mood', value: summary.avgMood ?? '—' },
              {
                label: 'Consistency',
                value: `${summary.consistencyPct ?? 0}%`
              },
              {
                label: 'Entries',
                value: summary.totalEntries ?? 0
              }
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
                {range === 'year' ? 'Avg Score by Month' : 'Net Score'}
              </h2>
              <div className="h-56">
                <Line data={scoreData} options={chartOpts} />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
                {range === 'year' ? 'Avg Mood by Month' : 'Mood'}
              </h2>
              <div className="h-56">
                <Line data={moodData} options={chartOpts} />
              </div>
            </div>
          </div>

          {/* Grades + best day */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
                Grade distribution
              </h2>
              <div className="flex flex-wrap gap-2">
                {['A', 'B', 'C', 'D', 'F'].map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
                  >
                    {g} × {summary.gradeCounts?.[g] || 0}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                Best day in range
              </h2>
              <p className="font-display text-2xl font-semibold text-[var(--color-brand-400)]">
                {summary.bestDay || '—'}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Score: {summary.bestScore ?? '—'}
              </p>
              {range === 'year' && (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Year view shows monthly averages for performance.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}