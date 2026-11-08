
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
import {
  TrendingUp,
  Activity,
  Smile,
  Target,
  CalendarDays,
  Award,
  Sparkles
} from 'lucide-react';
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

const GRADES = [
  { id: 'A', label: 'Excellent', color: '#22c55e' },
  { id: 'B', label: 'Good', color: '#84cc16' },
  { id: 'C', label: 'Average', color: '#f59e0b' },
  { id: 'D', label: 'Below avg.', color: '#f97316' },
  { id: 'F', label: 'Needs work', color: '#ef4444' }
];

function brandColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-brand-500')
      .trim() || '#1f9f7a'
  );
}

function SummaryCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-500)]/40 hover:shadow-lg hover:shadow-black/[0.04] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {hint}
            </p>
          )}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            color: accent,
            backgroundColor: `${accent}15`
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full opacity-[0.04] blur-xl transition-opacity group-hover:opacity-10"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-border-hover)] sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)]">
          <Activity className="h-4 w-4" />
        </div>
      </div>
      {children}
    </section>
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
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#102b25',
          titleColor: '#ffffff',
          bodyColor: '#d1e7df',
          padding: 12,
          cornerRadius: 10,
          displayColors: false
        }
      },
      scales: {
        y: {
          border: { display: false },
          grid: { color: 'rgba(148, 163, 157, 0.12)' },
          ticks: {
            color: '#9aa8a2',
            padding: 10
          }
        },
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: '#9aa8a2',
            maxRotation: 0,
            padding: 8
          }
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
          pointBorderColor: 'var(--color-surface)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
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
          pointBorderColor: 'var(--color-surface)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointRadius: range === 'month' ? 2 : 4,
          spanGaps: true
        }
      ]
    };
  }, [series, range]);

  const summaryCards = [
    {
      label: 'Avg Score',
      value: summary.avgScore ?? '—',
      hint: 'Overall performance',
      icon: Target,
      accent: 'var(--color-brand-400)'
    },
    {
      label: 'Avg Mood',
      value: summary.avgMood ?? '—',
      hint: 'Daily mood average',
      icon: Smile,
      accent: '#eab308'
    },
    {
      label: 'Consistency',
      value: `${summary.consistencyPct ?? 0}%`,
      hint: 'Logging consistency',
      icon: Activity,
      accent: '#22c55e'
    },
    {
      label: 'Entries',
      value: summary.totalEntries ?? 0,
      hint: 'Total logged days',
      icon: CalendarDays,
      accent: '#8b5cf6'
    }
  ];

  const hasData = series.length > 0;

  return (
    <div className="space-y-6">

      {/* Page heading */}
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
            Understand your growth, mood, and daily consistency.
          </p>
        </div>

        {/* Range selector */}
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {RANGES.map((r) => {
            const active = range === r.id;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                aria-pressed={active}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-[var(--color-brand-600)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-14 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-500)]/20 border-t-[var(--color-brand-500)]" />
          <p className="text-sm text-[var(--color-text-muted)]">
            Preparing your performance report…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-4 text-sm text-[var(--color-danger)]">
          <Activity className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Report */}
      {!loading && !error && report && (
        <>
          {hasData ? (
            <>
              {/* Summary */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    At a glance
                  </h2>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {range.charAt(0).toUpperCase() + range.slice(1)} overview
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {summaryCards.map((card) => (
                    <SummaryCard key={card.label} {...card} />
                  ))}
                </div>
              </section>

              {/* Charts */}
              <section>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    Performance trends
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Track how your daily performance changes over time.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard
                    title={range === 'year' ? 'Average score by month' : 'Net score'}
                    subtitle="Your daily performance score"
                  >
                    <div className="h-56 sm:h-64">
                      <Line data={scoreData} options={chartOpts} />
                    </div>
                  </ChartCard>

                  <ChartCard
                    title={range === 'year' ? 'Average mood by month' : 'Mood'}
                    subtitle="Your emotional wellbeing over time"
                  >
                    <div className="h-56 sm:h-64">
                      <Line data={moodData} options={chartOpts} />
                    </div>
                  </ChartCard>
                </div>
              </section>

              {/* Grade distribution and best day */}
              <section className="grid gap-4 lg:grid-cols-2">

                {/* Grade distribution */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)]">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--color-text)]">
                        Grade distribution
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        Breakdown of your daily performance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {GRADES.map((grade) => {
                      const count = summary.gradeCounts?.[grade.id] || 0;

                      return (
                        <div key={grade.id} className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              color: grade.color,
                              backgroundColor: `${grade.color}18`
                            }}
                          >
                            {grade.id}
                          </span>

                          <span className="min-w-0 flex-1 text-xs text-[var(--color-text-secondary)]">
                            {grade.label}
                          </span>

                          <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Best day */}
                <div className="relative overflow-hidden rounded-2xl border border-[var(--color-brand-500)]/20 bg-[var(--color-surface)] p-5">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />

                  <div className="relative">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[var(--color-text)]">
                          Best day in range
                        </h2>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          Your strongest performance
                        </p>
                      </div>
                    </div>

                    <p className="font-display text-2xl font-semibold text-[var(--color-brand-400)]">
                      {summary.bestDay || '—'}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-500)]/20 bg-[var(--color-brand-500)]/10 px-3 py-2">
                      <Award className="h-4 w-4 text-[var(--color-brand-400)]" />
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Score:
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {summary.bestScore ?? '—'}
                      </span>
                    </div>

                    {range === 'year' && (
                      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                        Year view shows monthly averages for performance.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)]">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
                No performance data yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
                Start logging your daily progress to see your performance trends and insights here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
