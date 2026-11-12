
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Medal,
  Target,
  LayoutDashboard,
  LineChart,
  Sparkles,
  CalendarDays,
  Activity,
  Trophy
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
import ActiveReplacementStrip from '../components/ActiveReplacementStrip';
import TimeAmbient from '../components/TimeAmbient';
import ActivityHeatmap from '../components/ActivityHeatmap';

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

function StatCard({ label, value, sub, valueColor, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-500)]/40 hover:shadow-lg hover:shadow-black/5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {label}
        </p>

        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/10 text-[var(--color-brand-400)]">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <p
        className="mt-2 font-display text-2xl font-semibold tracking-tight"
        style={{ color: valueColor || 'var(--color-text)' }}
      >
        {value}
      </p>

      {sub && (
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          {sub}
        </p>
      )}

      <div className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-[var(--color-brand-500)]/5 blur-2xl transition-all duration-300 group-hover:bg-[var(--color-brand-500)]/10" />
    </div>
  );
}

function rateColor(rate) {
  if (rate >= 70) return 'var(--color-success)';
  if (rate >= 45) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function readTab() {
  try {
    const storedTab = localStorage.getItem('lt-dashboard-tab');

    if (
      storedTab === 'today' ||
      storedTab === 'progress' ||
      storedTab === 'insights'
    ) {
      return storedTab;
    }
  } catch {
    /* Ignore unavailable localStorage */
  }

  return 'today';
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/10 text-[var(--color-brand-400)]">
        <Icon className="h-4 w-4" />
      </span>

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-52 rounded-lg bg-[var(--color-border)]" />
        <div className="h-4 w-36 rounded-lg bg-[var(--color-border)]" />
      </div>

      <div className="h-20 rounded-2xl bg-[var(--color-surface)]" />
      <div className="h-12 rounded-2xl bg-[var(--color-surface)]" />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-2xl bg-[var(--color-surface)] lg:col-span-3" />
        <div className="h-64 rounded-2xl bg-[var(--color-surface)] lg:col-span-2" />
      </div>
    </div>
  );
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

        const streakData = payload.streaks || {};

        setStreaks(streakData.streaks || {});
        setCustomStreaks(streakData.customStreaks || {});
        setOverallStreak(streakData.overallStreak || 0);

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
      /* Ignore unavailable localStorage */
    }
  };

  const avgSuccess = pairs.length
    ? Math.round(
      pairs.reduce(
        (sum, pair) => sum + (pair.stats?.successRate || 0),
        0
      ) / pairs.length
    )
    : 0;

  const topPairs = [...pairs]
    .sort(
      (a, b) =>
        (b.stats?.successRate || 0) -
        (a.stats?.successRate || 0)
    )
    .slice(0, 3);

  if (loading) {
    return <LoadingDashboard />;
  }

  const todayScore = today?.netScore ?? null;
  const todayGrade = today?.grade ?? null;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const formattedDate = new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="dashboard-page space-y-5">

      {/* DASHBOARD HEADER */}
      {/* Dashboard Welcome Header */}
      <header className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <div className="dashboard-eyebrow">
            <span className="dashboard-eyebrow-dot" />
            YOUR PERSONAL DASHBOARD
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Welcome back, {firstName}
          </h1>

          <p className="dashboard-date">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="dashboard-welcome-actions">
          <div className="dashboard-current-streak">
            <Flame size={17} />
            <span>Current streak</span>
            <strong>{overallStreak}</strong>
            <small>days</small>
          </div>

          <Link to="/log" className="dashboard-log-button">
            Log today
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* TIME AND DAILY STATUS */}
      <TimeAmbient />

      <MissedDayBanner
        hasLoggedToday={!!today}
        overallStreak={overallStreak}
        hasHistory={(monthly?.totalEntries ?? 0) > 0}
      />

      <StreakAtRiskCard
        primary={streakRisk.primary}
        items={streakRisk.items}
      />

      {/* DASHBOARD NAVIGATION */}
      <nav
        role="tablist"
        aria-label="Dashboard sections"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`dashboard-panel-${id}`}
              onClick={() => selectTab(id)}
              className={`relative flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition-all duration-200 ${active
                ? 'bg-[var(--color-brand-600)] text-white shadow-md shadow-[var(--color-brand-600)]/20'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ================= TODAY TAB ================= */}
      {tab === 'today' && (
        <div
          id="dashboard-panel-today"
          role="tabpanel"
          className="space-y-4"
        >
          <div className="grid min-w-0 gap-4 lg:grid-cols-5 lg:items-start">

            {/* MAIN CONTENT */}
            <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-3">
              <DailyFocusBlock />
              <DailyRitualCard />

              {today && (
                <div className="flex justify-end">
                  <Link
                    to="/log"
                    className="group inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-400)] no-underline transition-all hover:border-[var(--color-brand-500)]/40 hover:bg-[var(--color-brand-600)]/5"
                  >
                    Edit today's log
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* DAILY OVERVIEW */}
            <div className="order-1 min-w-0 space-y-4 lg:order-2 lg:col-span-2">
              {!today ? (
                <div className="relative overflow-hidden rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/5 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/10 text-[var(--color-brand-400)]">
                    <Target className="h-6 w-6" />
                  </div>

                  <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
                    No log yet today
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    Two minutes. Check what you did — good and bad — then
                    close the day honestly.
                  </p>

                  <Link
                    to="/log"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-5 py-3 text-sm font-semibold text-white no-underline shadow-md shadow-[var(--color-brand-600)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--color-brand-500)]"
                  >
                    Log today
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <section>
                  <SectionHeading
                    icon={Activity}
                    title="Today's overview"
                    subtitle="A quick look at your performance"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      label="Today's score"
                      value={todayScore}
                      sub={`Grade ${todayGrade}`}
                      valueColor={GRADE_COLORS[todayGrade]}
                      icon={Target}
                    />

                    <StatCard
                      label="Monthly average"
                      value={monthly?.avgScore ?? '—'}
                      sub={`${monthly?.totalEntries ?? 0} entries`}
                      icon={TrendingUp}
                    />

                    <StatCard
                      label="Average mood"
                      value={monthly?.avgMood ?? '—'}
                      sub="Out of 5.0"
                      icon={Sparkles}
                    />

                    <StatCard
                      label="Best day"
                      value={
                        monthly?.bestDay
                          ? new Date(
                            monthly.bestDay + 'T12:00:00'
                          ).toLocaleDateString('en-PK', {
                            month: 'short',
                            day: 'numeric'
                          })
                          : '—'
                      }
                      sub="This month"
                      valueColor="var(--color-brand-400)"
                      icon={Trophy}
                    />
                  </div>
                </section>
              )}

              <ActiveReplacementStrip pairs={pairs} />
            </div>
          </div>
        </div>
      )}

      {/* ================= PROGRESS TAB ================= */}
      {tab === 'progress' && (
        <div id="dashboard-panel-progress" role="tabpanel" className="space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                This week’s progress
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Scores, streaks, and a short written review
              </p>
            </div>
            <Link
              to="/review"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-400)] no-underline hover:underline"
            >
              Weekly review & reflection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* STREAK OVERVIEW */}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <Flame className="h-6 w-6" />
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
                    Overall logging streak
                  </p>

                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Consecutive days you've logged
                  </p>

                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Consistency is built one day at a time.
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 sm:text-right">
                <span className="font-display text-5xl font-semibold tracking-tight text-[var(--color-brand-400)]">
                  {overallStreak}
                </span>

                <span className="text-sm text-[var(--color-text-secondary)]">
                  days
                </span>
              </div>
            </div>
          </section>
          {/* WEEKLY PERFORMANCE */}
          {weekly.length > 0 && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              <SectionHeading
                icon={TrendingUp}
                title="This week"
                subtitle="Your daily performance at a glance"
              />

              <div className="grid grid-cols-7 gap-2">
                {weekly.map((day) => {
                  const isToday = day.date === TODAY();

                  const label = new Date(
                    day.date + 'T12:00:00'
                  ).toLocaleDateString('en-PK', {
                    weekday: 'short'
                  });

                  return (
                    <div
                      key={day.date}
                      className={`rounded-xl border px-1 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 ${isToday
                        ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/10 shadow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)]/40 hover:border-[var(--color-brand-500)]/30'
                        }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {label}
                      </p>

                      <p
                        className="mt-2 font-display text-lg font-semibold"
                        style={{
                          color: day.grade
                            ? GRADE_COLORS[day.grade]
                            : 'var(--color-text-muted)'
                        }}
                      >
                        {day.netScore ?? '—'}
                      </p>

                      <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                        {day.grade ?? '—'}
                      </p>

                      {isToday && (
                        <div className="mx-auto mt-2 h-1 w-4 rounded-full bg-[var(--color-brand-400)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* WEEKLY SHARE */}
          <ShareWeeklyCard
            userName={user?.name}
            overallStreak={overallStreak}
            weekly={weekly}
          />

          {/* ACTIVITY HEATMAP */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <SectionHeading
              icon={CalendarDays}
              title="Activity history"
              subtitle="Your consistency over time"
            />

            <ActivityHeatmap weeks={53} />
          </section>

          {/* STREAK VISUALIZATION */}
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

      {/* ================= INSIGHTS TAB ================= */}
      {tab === 'insights' && (
        <div
          id="dashboard-panel-insights"
          role="tabpanel"
          className="space-y-4"
        >
          {/* PERSONALIZED INSIGHTS */}
          <ReplacementFocusCard focus={replacementFocus} />

          <PersonalFocusCard focus={personalFocus} />

          {insight && (
            <section className="relative overflow-hidden rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/5 p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--color-brand-500)]/10 blur-2xl" />

              <div className="relative flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <Lightbulb className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-brand-400)]">
                    {insight.title || 'Personal insight'}
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {insight.message}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* PERSONAL RECORDS */}
          <CollapsibleSection
            title="Personal records"
            subtitle="Longest streak, best score, milestones"
            icon={Medal}
            defaultOpen={false}
            storageKey="lt-collapse-records"
          >
            {records && records.totalEntries > 0 ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard
                  label="Longest streak"
                  value={records.longestStreak}
                  sub="Days"
                  icon={Flame}
                />

                <StatCard
                  label="Best score"
                  value={records.bestScore ?? '—'}
                  icon={Trophy}
                />

                <StatCard
                  label="Most habits / day"
                  value={records.mostHabitsInDay ?? '—'}
                  icon={Target}
                />

                <StatCard
                  label="First A grade"
                  value={
                    records.firstAGradeDate
                      ? new Date(
                        records.firstAGradeDate + 'T12:00:00'
                      ).toLocaleDateString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      : '—'
                  }
                  icon={Medal}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-center">
                <Medal className="mx-auto h-7 w-7 text-[var(--color-text-muted)]" />

                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Keep logging to unlock personal records.
                </p>
              </div>
            )}
          </CollapsibleSection>

          {/* HABIT REPLACEMENTS */}
          <CollapsibleSection
            title="Habit replacements"
            subtitle="Window progress — independent of today's letter grade"
            icon={RefreshCw}
            defaultOpen={true}
            storageKey="lt-collapse-replacements"
          >
            <div className="mb-4 flex justify-end">
              <Link
                to="/replacements"
                className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-brand-400)] no-underline transition-colors hover:bg-[var(--color-brand-600)]/10"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {pairs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-center">
                <RefreshCw className="mx-auto h-7 w-7 text-[var(--color-text-muted)]" />

                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  No pairs yet.
                </p>

                <Link
                  to="/replacements"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-400)] no-underline hover:underline"
                >
                  Create one
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AVERAGE SUCCESS RATE */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Average success rate
                      </p>

                      <p
                        className="mt-1 font-display text-3xl font-semibold"
                        style={{ color: rateColor(avgSuccess) }}
                      >
                        {avgSuccess}%
                      </p>
                    </div>

                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/10 text-[var(--color-brand-400)]">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, avgSuccess))}%`,
                        backgroundColor: rateColor(avgSuccess)
                      }}
                    />
                  </div>
                </div>

                {/* TOP REPLACEMENT PAIRS */}
                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Top performing pairs
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {topPairs.map((pair) => {
                      const successRate = pair.stats?.successRate || 0;

                      return (
                        <div
                          key={pair._id || pair.id}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-500)]/30"
                        >
                          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                            {pair.badHabitLabel ||
                              pair.badHabitName ||
                              pair.badHabit ||
                              'Bad'}{' '}
                            <span className="text-[var(--color-brand-400)]">
                              →
                            </span>{' '}
                            {pair.goodHabitLabel ||
                              pair.goodHabitName ||
                              pair.goodHabit ||
                              'Good'}
                          </p>

                          <p
                            className="mt-2 font-display text-2xl font-semibold"
                            style={{ color: rateColor(successRate) }}
                          >
                            {pair.stats?.successRate ?? 0}%
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, successRate))}%`,
                                backgroundColor: rateColor(successRate)
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
