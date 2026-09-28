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
import { useAnalytics } from '../hooks/useAnalytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export default function Trends() {
  const { weekly, monthly, loading } = useAnalytics();

  if (loading) return <div className="page-loader">Loading trends…</div>;

  const labels = (weekly || []).map((d) =>
    new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })
  );

  const scoreData = {
    labels,
    datasets: [
      {
        label: 'Net Score',
        data: (weekly || []).map((d) => d.netScore),
        borderColor: '#1f9f7a',
        backgroundColor: 'rgba(31, 159, 122, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#1f9f7a',
        pointRadius: 4
      }
    ]
  };

  const moodData = {
    labels,
    datasets: [
      {
        label: 'Mood',
        data: (weekly || []).map((d) => d.mood),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#22c55e',
        pointRadius: 4
      }
    ]
  };

  const chartOpts = {
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
        ticks: { color: '#9aa8a2' }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Trends</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Performance Trends
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Last 7 days overview</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Net Score — Weekly</h2>
          <div className="h-56">
            <Line data={scoreData} options={chartOpts} />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Mood — Weekly</h2>
          <div className="h-56">
            <Line data={moodData} options={chartOpts} />
          </div>
        </div>
      </div>

      {monthly && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Monthly Summary</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Avg Score', value: monthly.avgScore },
              { label: 'Avg Mood', value: monthly.avgMood },
              { label: 'Best Day', value: monthly.bestDay || '—' },
              { label: 'Entries', value: monthly.totalEntries }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}