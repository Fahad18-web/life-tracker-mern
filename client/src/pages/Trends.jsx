import { useAnalytics } from '../hooks/useAnalytics';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Trends() {
  const { weekly, monthly, loading } = useAnalytics();
  if (loading) return <div className="page-loader">Loading trends...</div>;

  const scoreData = {
    labels: weekly.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })),
    datasets: [{
      label: 'Net Score',
      data: weekly.map(d => d.netScore),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#6366f1', pointRadius: 5
    }]
  };

  const moodData = {
    labels: scoreData.labels,
    datasets: [{
      label: 'Mood',
      data: weekly.map(d => d.mood),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#22c55e', pointRadius: 5
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { grid: { color: 'rgba(255,255,255,0.06)' } }, x: { grid: { color: 'rgba(255,255,255,0.06)' } } }
  };

  return (
    <main className="page">
      <div className="page-header">
        <h1>📈 Trends</h1>
        <p className="text-muted">Last 7 days performance</p>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h2 className="chart-title">Net Score — Weekly</h2>
          <Line data={scoreData} options={chartOpts} />
        </div>
        <div className="chart-card">
          <h2 className="chart-title">Mood — Weekly</h2>
          <Line data={moodData} options={chartOpts} />
        </div>
      </div>

      {monthly && (
        <div className="monthly-summary">
          <h2 className="section-title">📊 Monthly Summary</h2>
          <div className="stat-grid">
            <div className="stat-card"><span className="stat-label">Avg Score</span><span className="stat-value">{monthly.avgScore}</span></div>
            <div className="stat-card"><span className="stat-label">Avg Mood</span><span className="stat-value">{monthly.avgMood}</span></div>
            <div className="stat-card"><span className="stat-label">Best Day</span><span className="stat-value">{monthly.bestDay || '—'}</span></div>
            <div className="stat-card"><span className="stat-label">Entries</span><span className="stat-value">{monthly.totalEntries}</span></div>
          </div>
        </div>
      )}
    </main>
  );
}
