import { useEffect, useState } from 'react';
import { Link }               from 'react-router-dom';
import { useAuth }            from '../contexts/AuthContext';
import { fetchEntryDate }     from '../api/entriesAPI';
import { getWeekly, getMonthly, getStreaks } from '../api/analyticsAPI';

const TODAY = () => new Date().toISOString().split('T')[0];
const GRADE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

const HABIT_LABELS = {
  morning: '🌅 Morning', exercise: '🏃 Exercise', reading: '📖 Reading',
  prayer: '🤲 Prayer',   coding: '💻 Coding',   sleep: '😴 Sleep',
  diet: '🥗 Diet',       hydration: '💧 Hydration'
};

export default function Dashboard() {
  const { user }  = useAuth();
  const [today,   setToday]   = useState(null);
  const [weekly,  setWeekly]  = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [streaks, setStreaks]  = useState({});
  const [customStreaks, setCustomStreaks] = useState({});
  const [overallStreak, setOverallStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, weekRes, monthRes, streakRes] = await Promise.allSettled([
          fetchEntryDate(TODAY()),
          getWeekly(),
          getMonthly(),
          getStreaks()
        ]);

        if (todayRes.status === 'fulfilled')  setToday(todayRes.value.data.entry);
        if (weekRes.status === 'fulfilled')   setWeekly(weekRes.value.data.data);
        if (monthRes.status === 'fulfilled')  setMonthly(monthRes.value.data);
        if (streakRes.status === 'fulfilled') {
          setStreaks(streakRes.value.data.streaks || {});
          setCustomStreaks(streakRes.value.data.customStreaks || {});
          setOverallStreak(streakRes.value.data.overallStreak || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard…</div>;

  const todayScore = today?.netScore ?? null;
  const todayGrade = today?.grade   ?? null;

  return (
    <>
      <style>{`
        .overall-streak-card {
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.05));
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: background-color 0.25s ease;
        }
        .overall-streak-left  { display: flex; flex-direction: column; gap: 4px; }
        .overall-streak-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #818cf8; }
        .overall-streak-sub   { font-size: 13px; color: var(--text-muted); }
        .overall-streak-val   { font-size: 52px; font-weight: 800; font-family: var(--font-mono); color: var(--accent); letter-spacing: -0.04em; line-height: 1; }
        .overall-streak-unit  { font-size: 16px; color: var(--text-secondary); font-weight: 500; font-family: var(--font); }

        .custom-streak-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 10px; }
        .custom-streak-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
          transition: background-color 0.25s ease;
        }
        .cs-emoji  { font-size: 20px; line-height: 1; }
        .cs-name   { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-top: 4px; }
        .cs-count  { font-size: 22px; font-weight: 700; font-family: var(--font-mono); line-height: 1; }
        .cs-label  { font-size: 10px; color: var(--text-muted); font-weight: 500; }
        .cs-type-good { color: var(--success); }
        .cs-type-bad  { color: var(--danger); }

        .no-entry-banner {
          background: var(--bg-card); border: 1px dashed var(--border);
          border-radius: var(--radius-lg); padding: 28px;
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 12px;
        }
        .no-entry-banner h3 { font-size: 16px; font-weight: 600; }
        .no-entry-banner p  { color: var(--text-muted); font-size: 13px; }
      `}</style>

      <main className="page">
        <div className="page-header">
          <h1>👋 Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* ── Overall Streak Banner ── */}
        <div className="overall-streak-card">
          <div className="overall-streak-left">
            <span className="overall-streak-title">🔥 Overall Logging Streak</span>
            <span className="overall-streak-sub">Consecutive days you've logged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="overall-streak-val">{overallStreak}</span>
            <span className="overall-streak-unit">days</span>
          </div>
        </div>

        {/* ── Today's Score ── */}
        {today ? (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Today's Score</div>
              <div className="stat-value" style={{ color: GRADE_COLORS[todayGrade] }}>{todayScore}</div>
              <span className="stat-badge" style={{ background: GRADE_COLORS[todayGrade] }}>Grade {todayGrade}</span>
            </div>
            <div className="stat-card">
              <div className="stat-label">Monthly Avg</div>
              <div className="stat-value">{monthly?.avgScore ?? '—'}</div>
              <div className="stat-sub">{monthly?.totalEntries ?? 0} entries logged</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Mood</div>
              <div className="stat-value">{monthly?.avgMood ?? '—'}</div>
              <div className="stat-sub">out of 5.0</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Best Day</div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>
                {monthly?.bestDay ? new Date(monthly.bestDay).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : '—'}
              </div>
              <div className="stat-sub">this month</div>
            </div>
          </div>
        ) : (
          <div className="no-entry-banner">
            <span style={{ fontSize: 36 }}>📝</span>
            <h3>You haven't logged today yet</h3>
            <p>Log your habits now to track your progress and keep your streak alive!</p>
            <Link to="/log" className="btn btn-primary">Log Today's Habits</Link>
          </div>
        )}

        {/* ── Weekly Grid ── */}
        {weekly.length > 0 && (
          <div className="section">
            <div className="section-title">This Week</div>
            <div className="week-grid">
              {weekly.map((d, i) => {
                const isToday = d.date === TODAY();
                const label   = new Date(d.date + 'T12:00:00').toLocaleDateString('en-PK', { weekday: 'short' });
                return (
                  <div key={d.date} className={`day-card ${isToday ? 'today' : ''}`}>
                    <span className="day-label">{label}</span>
                    <span className="day-score" style={{ color: d.grade ? GRADE_COLORS[d.grade] : 'var(--text-muted)' }}>
                      {d.netScore ?? '—'}
                    </span>
                    <span className="day-grade">{d.grade ?? '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Per-Habit Streaks (default) ── */}
        {Object.keys(streaks).length > 0 && (
          <div className="section">
            <div className="section-title">🔥 Habit Streaks</div>
            <div className="streak-grid">
              {Object.entries(streaks).map(([habit, count]) => (
                <div key={habit} className="streak-card">
                  <div className="streak-habit">{HABIT_LABELS[habit] || habit}</div>
                  <div className="streak-count">{count} <small>day{count !== 1 ? 's' : ''}</small></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Custom Habit Streaks ── */}
        {Object.keys(customStreaks).length > 0 && (
          <div className="section">
            <div className="section-title">⭐ Custom Habit Streaks</div>
            <div className="custom-streak-grid">
              {Object.entries(customStreaks).map(([key, data]) => (
                <div key={key} className="custom-streak-card">
                  <span className="cs-emoji">{data.emoji}</span>
                  <div className="cs-name">{data.name}</div>
                  <div className={`cs-count ${data.type === 'good' ? 'cs-type-good' : 'cs-type-bad'}`}>
                    {data.streak}
                  </div>
                  <div className="cs-label">
                    {data.type === 'good' ? 'day streak 🔥' : 'days avoided ✅'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}