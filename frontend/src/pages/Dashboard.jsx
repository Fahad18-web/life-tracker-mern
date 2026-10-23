import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  NotebookPen,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Medal,
  Target,
  LayoutDashboard,
  LineChart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard } from '../api/analyticsAPI';
import MissedDayBanner from '../components/ui/MissedDayBanner';
import CollapsibleSection from '../components/ui/CollapsibleSection';
import ShareWeeklyCard from '../components/ShareWeeklyCard';
import PersonalFocusCard from '../components/PersonalFocusCard';
import StreakAtRiskCard from '../components/StreakAtRiskCard';
import { buildStreakAtRisk } from '../utils/streakAtRisk';
import ReplacementFocusCard from '../components/ReplacementFocusCard';
import { buildReplacementFocus } from '../utils/replacementFocus';
import StreakVisualization from '../components/StreakVisualization';
import DailyFocusBlock from '../components/DailyFocusBlock';
import DailyRitualCard from '../components/DailyRitualCard';

const TODAY = () => new Date().toISOString().split('T')[0];

const TABS = [
  { id: 'today', label: 'Today', icon: Target },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'insights', label: 'Insights', icon: Sparkles }
];

const GRADE_COLORS = {
  A: 'var(--color-success)',
  B: '#84cc16',
  C: 'var(--color-warning)',
  D: '#f97316',
  F: 'var(--color-danger)'
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

function readTab() {
  try {
    const t = localStorage.getItem('lt-dashboard-tab');
    if (t === 'today' || t === 'progress' || t === 'insights') return t;
  } catch {
    /* ignore */
  }
  return 'today';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState(readTab);
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
        const res = await getDashboard();
        const payload = res.data?.data ?? res.data ?? {};

        setToday(payload.today || null);
        setWeekly(payload.weekly || []);
        setMonthly(payload.monthly || null);

        const s = payload.streaks || {};
        setStreaks(s.streaks || {});
        setCustomStreaks(s.customStreaks || {});
        setOverallStreak(s.overallStreak || 0);

        setPairs(Array.isArray(payload.pairs) ? payload.pairs : []);

        const insights = payload.insights || {};
        setInsight(insights.insight || null);
        setRecords(insights.records || null);
        setPersonalFocus(insights.personalFocus || null);
      } catch (err) {
        console.error('[dashboard] aggregate failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const streakRisk = useMemo(
    () =>
      buildStreakAtRisk({
        today,
        overallStreak,
        streaks,
        customStreaks
      }),
    [today, overallStreak, streaks, customStreaks]
  );

  const replacementFocus = useMemo(
    () => buildReplacementFocus(pairs),
    [pairs]
  );

  const selectTab = (id) => {
    setTab(id);
    try {
      localStorage.setItem('lt-dashboard-tab', id);
    } catch {
      /* ignore */
    }
  };

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-2">
          <Flame className="h-4 w-4 text-[var(--color-brand-400)]" />
          <span className="text-xs text-[var(--color-text-secondary)]">Streak</span>
          <span className="font-display text-lg font-semibold text-[var(--color-brand-400)]">
            {overallStreak}
          </span>
        </div>
      </div>

      {/* Always-visible alerts (compact zone) */}
      <MissedDayBanner
        hasLoggedToday={!!today}
        overallStreak={overallStreak}
        hasHistory={(monthly?.totalEntries ?? 0) > 0}
      />
      <StreakAtRiskCard primary={streakRisk.primary} items={streakRisk.items} />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-[var(--color-brand-600)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TODAY ── */}
      {tab === 'today' && (
        <div role="tabpanel" className="space-y-4">
          {!today ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <NotebookPen className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                You haven&apos;t logged today yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
                Log habits to keep your streak and score honest.
              </p>
              <Link
                to="/log"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[var(--color-brand-500)]"
              >
                Log today&apos;s habits
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Today's Score"
                value={todayScore}
                sub={`Grade ${todayGrade}`}
                valueColor={GRADE_COLORS[todayGrade]}
              />
              <StatCard
                label="Monthly Avg"
                value={monthly?.avgScore ?? '—'}
                sub={`${monthly?.totalEntries ?? 0} entries`}
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
          )}

          <DailyFocusBlock />
          <DailyRitualCard />

          {today && (
            <div className="flex justify-end">
              <Link
                to="/log"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-400)] no-underline hover:text-[var(--color-brand-300)]"
              >
                Edit today&apos;s log <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === 'progress' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/20 text-[var(--color-brand-400)]">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
                  Overall logging streak
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

          {weekly.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-brand-400)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text)]">This week</h2>
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
                      className={`rounded-xl border px-1 py-3 text-center ${
                        isToday
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

          <CollapsibleSection
            title="Streak visualization"
            subtitle="Week activity + habit bars"
            icon={LayoutDashboard}
            defaultOpen={false}
            storageKey="lt-collapse-streak-viz"
          >
            <StreakVisualization
              weekly={weekly}
              streaks={streaks}
              customStreaks={customStreaks}
              overallStreak={overallStreak}
            />
          </CollapsibleSection>
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {tab === 'insights' && (
        <div role="tabpanel" className="space-y-4">
          <PersonalFocusCard focus={personalFocus} />
          <ReplacementFocusCard focus={replacementFocus} />

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

          <CollapsibleSection
            title="Personal records"
            subtitle="Longest streak, best score, milestones"
            icon={Medal}
            defaultOpen={false}
            storageKey="lt-collapse-records"
          >
            {records && records.totalEntries > 0 ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Longest streak
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
                    {records.longestStreak}
                    <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">
                      days
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Best score
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
                    {records.bestScore ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Most habits / day
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
                    {records.mostHabitsInDay ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    First A grade
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold text-[var(--color-text)]">
                    {records.firstAGradeDate
                      ? new Date(records.firstAGradeDate + 'T12:00:00').toLocaleDateString(
                          'en-PK',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Keep logging to unlock personal records.
              </p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Habit replacements"
            subtitle="Success rates for your pairs"
            icon={RefreshCw}
            defaultOpen={false}
            storageKey="lt-collapse-replacements"
          >
            <div className="mb-3 flex justify-end">
              <Link
                to="/replacements"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-400)] no-underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {pairs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No pairs yet.{' '}
                <Link to="/replacements" className="font-semibold text-[var(--color-brand-400)]">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
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
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 px-3 py-2.5"
                    >
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {p.badHabitLabel || p.badHabitName || p.badHabit || 'Bad'} →{' '}
                        {p.goodHabitLabel || p.goodHabitName || p.goodHabit || 'Good'}
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
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}