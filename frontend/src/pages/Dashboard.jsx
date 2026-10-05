import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  NotebookPen,
  TrendingUp,
  Trophy,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Medal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchEntryDate } from '../api/entriesAPI';
import { getWeekly, getMonthly, getStreaks, getInsights } from '../api/analyticsAPI';
import { fetchPairs } from '../api/habitReplacementAPI';
import MissedDayBanner from '../components/ui/MissedDayBanner';
import ShareWeeklyCard from '../components/ShareWeeklyCard';
import PersonalFocusCard from '../components/PersonalFocusCard';
import { Target } from 'lucide-react'; // optional if unused elsewhere — card has its own icon

const TODAY = () => new Date().toISOString().split('T')[0];

const GRADE_COLORS = {
  A: 'var(--color-success)',
  B: '#84cc16',
  C: 'var(--color-warning)',
  D: '#f97316',
  F: 'var(--color-danger)'
};

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

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-border-hover)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p
        className="mt-2 font-display text-3xl font-semibold tracking-tight"
        style={{ color: valueColor || 'var(--color-text)' }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

function rateColor(r) {
  if (r >= 70) return 'var(--color-success)';
  if (r >= 45) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [streaks, setStreaks] = useState({});
  const [customStreaks, setCustomStreaks] = useState({});
  const [overallStreak, setOverallStreak] = useState(0);
  const [pairs, setPairs] = useState([]);
  const [insight, setInsight] = useState(null);
  const [records, setRecords] = useState(null);
  const [personalFocus, setPersonalFocus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [todayRes, weekRes, monthRes, streakRes, pairsRes, insightsRes] =
          await Promise.allSettled([
            fetchEntryDate(TODAY()),
            getWeekly(),
            getMonthly(),
            getStreaks(),
            fetchPairs(),
            getInsights()
          ]);

        if (todayRes.status === 'fulfilled') setToday(todayRes.value.data.entry);
        if (weekRes.status === 'fulfilled') setWeekly(weekRes.value.data.data || []);
        if (monthRes.status === 'fulfilled') setMonthly(monthRes.value.data);
        if (streakRes.status === 'fulfilled') {
          setStreaks(streakRes.value.data.streaks || {});
          setCustomStreaks(streakRes.value.data.customStreaks || {});
          setOverallStreak(streakRes.value.data.overallStreak || 0);
        }
        if (pairsRes.status === 'fulfilled') {
          setPairs(pairsRes.value.data.pairs || []);
        }
        if (insightsRes.status === 'fulfilled') {
          const payload = insightsRes.value.data;
          const body = payload?.data || payload;
          setInsight(body.insight || null);
          setRecords(body.records || null);
          setPersonalFocus(body.personalFocus || null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="page-loader">Loading dashboard…</div>;
  }

  const todayScore = today?.netScore ?? null;
  const todayGrade = today?.grade ?? null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const avgSuccess = pairs.length
    ? Math.round(
      pairs.reduce((s, p) => s + (p.stats?.successRate || 0), 0) / pairs.length
    )
    : 0;

  const topPairs = [...pairs]
    .sort((a, b) => (b.stats?.successRate || 0) - (a.stats?.successRate || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {new Date().toLocaleDateString('en-PK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
      <MissedDayBanner
        hasLoggedToday={!!today}
        overallStreak={overallStreak}
        hasHistory={(monthly?.totalEntries ?? 0) > 0}
      />
      <PersonalFocusCard focus={personalFocus} />
      {/* Weekly insight */}
      {insight && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
                {insight.title || 'Insight'}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {insight.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal records */}
      {records && records.totalEntries > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Medal className="h-4 w-4 text-[var(--color-brand-400)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Personal records
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Longest streak
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                {records.longestStreak}
                <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">
                  days
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Best score
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                {records.bestScore ?? '—'}
              </p>
              {records.bestScoreDate && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {new Date(records.bestScoreDate + 'T12:00:00').toLocaleDateString(
                    'en-PK',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  )}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Most habits / day
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
                {records.mostHabitsInDay ?? '—'}
              </p>
              {records.mostHabitsDate && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {new Date(records.mostHabitsDate + 'T12:00:00').toLocaleDateString(
                    'en-PK',
                    { month: 'short', day: 'numeric' }
                  )}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                First A grade
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-[var(--color-text)]">
                {records.firstAGradeDate
                  ? new Date(records.firstAGradeDate + 'T12:00:00').toLocaleDateString(
                    'en-PK',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  )
                  : '—'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Overall streak */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)]">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
              Overall Logging Streak
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
              Consecutive days you&apos;ve logged
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 sm:text-right">
          <span className="font-display text-5xl font-semibold tracking-tight text-[var(--color-brand-400)]">
            {overallStreak}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">days</span>
        </div>
      </div>

      {/* Today / empty */}
      {today ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Today's Score"
            value={todayScore}
            sub={`Grade ${todayGrade}`}
            valueColor={GRADE_COLORS[todayGrade]}
          />
          <StatCard
            label="Monthly Avg"
            value={monthly?.avgScore ?? '—'}
            sub={`${monthly?.totalEntries ?? 0} entries logged`}
          />
          <StatCard label="Avg Mood" value={monthly?.avgMood ?? '—'} sub="out of 5.0" />
          <StatCard
            label="Best Day"
            value={
              monthly?.bestDay
                ? new Date(monthly.bestDay + 'T12:00:00').toLocaleDateString('en-PK', {
                  month: 'short',
                  day: 'numeric'
                })
                : '—'
            }
            sub="this month"
            valueColor="var(--color-brand-400)"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <NotebookPen className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            You haven&apos;t logged today yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Log your habits now to track progress and keep your streak alive.
          </p>
          <Link
            to="/log"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-500)]"
          >
            Log Today&apos;s Habits
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Weekly grid */}
      {weekly.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-brand-400)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">This Week</h2>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekly.map((d) => {
              const isToday = d.date === TODAY();
              const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-PK', {
                weekday: 'short'
              });
              return (
                <div
                  key={d.date}
                  className={`rounded-xl border px-1 py-3 text-center ${isToday
                    ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {label}
                  </p>
                  <p
                    className="mt-1.5 font-display text-lg font-semibold"
                    style={{
                      color: d.grade ? GRADE_COLORS[d.grade] : 'var(--color-text-muted)'
                    }}
                  >
                    {d.netScore ?? '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
                    {d.grade ?? '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <ShareWeeklyCard
        userName={user?.name}
        overallStreak={overallStreak}
        weekly={weekly}
      />
      {/* Habit streaks */}
      {Object.keys(streaks).length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-[var(--color-warning)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Habit Streaks</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(streaks).map(([habit, count]) => (
              <div
                key={habit}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3"
              >
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {HABIT_LABELS[habit] || habit}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-warning)]">
                  {count}
                  <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">
                    day{count !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom habit streaks */}
      {Object.keys(customStreaks).length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[var(--color-brand-400)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Custom Habit Streaks</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(customStreaks).map(([key, data]) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3"
              >
                <p className="text-lg leading-none">{data.emoji}</p>
                <p className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  {data.name}
                </p>
                <p
                  className={`mt-1 font-display text-2xl font-semibold ${data.type === 'good'
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-danger)]'
                    }`}
                >
                  {data.streak}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {data.type === 'good' ? 'day streak' : 'days avoided'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Habit Replacement Overview */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--color-brand-400)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Habit Replacements</h2>
          </div>
          <Link
            to="/replacements"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-400)] no-underline hover:text-[var(--color-brand-300)]"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pairs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              No replacement pairs yet. Link a bad habit to a good one to track progress.
            </p>
            <Link
              to="/replacements"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-400)] no-underline"
            >
              Create a pair <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Avg success rate
              </p>
              <p
                className="mt-1 font-display text-2xl font-semibold"
                style={{ color: rateColor(avgSuccess) }}
              >
                {avgSuccess}%
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {topPairs.map((p) => (
                <div
                  key={p._id || p.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3"
                >
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {p.badHabitName || p.badHabit || 'Bad'} →{' '}
                    {p.goodHabitName || p.goodHabit || 'Good'}
                  </p>
                  <p
                    className="mt-1 font-display text-xl font-semibold"
                    style={{ color: rateColor(p.stats?.successRate || 0) }}
                  >
                    {p.stats?.successRate ?? 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}