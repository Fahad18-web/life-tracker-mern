import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Medal,
  Target,
  LayoutDashboard,
  LineChart,
  Sparkles,
  CalendarDays
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { getDateKey, normalizeTimeZone } from '../utils/dateKey';
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

/* Tonal tile for use inside an existing panel (no nested borders). */
function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="rounded-xl bg-[var(--color-bg)]/50 p-3.5">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </p>

      <p
        className="mt-1.5 font-display text-2xl font-semibold tracking-tight"
        style={{ color: valueColor || 'var(--color-text)' }}
      >
        {value}
      </p>

      {sub && (
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          {sub}
        </p>
      )}
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

function SectionHeading({ id, title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-sm font-semibold text-[var(--color-text)]">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function LoadingDashboard() {
  const panel =
    'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]';

  return (
    <div
      className="space-y-5 motion-safe:animate-pulse"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading your dashboard…</span>

      {/* Mirrors the welcome header */}
      <div className="space-y-2 border-b border-[var(--color-border)] pb-5">
        <div className="h-3 w-40 rounded bg-[var(--color-border)]" />
        <div className="h-8 w-56 rounded-lg bg-[var(--color-border)]" />
        <div className="h-4 w-44 rounded bg-[var(--color-border)]" />
      </div>

      {/* Mirrors the tab bar */}
      <div className="h-11 border-b border-[var(--color-border)]" />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className={`h-64 lg:col-span-3 ${panel}`} />
        <div className={`h-64 lg:col-span-2 ${panel}`} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const currentDate = new Date();
  const timeZone = normalizeTimeZone(user?.timezone);
  const todayDateKey = getDateKey(currentDate, timeZone);
  const formattedDate = currentDate.toLocaleDateString('en-PK', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
  const [loadError, setLoadError] = useState(false);

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
        setLoadError(true);
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

  // WAI-ARIA tabs: arrow keys / Home / End move between tabs.
  const handleTabKeyDown = (event) => {
    const currentIndex = TABS.findIndex((item) => item.id === tab);
    let nextIndex = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(TABS[nextIndex].id);
    document.getElementById(`dashboard-tab-${TABS[nextIndex].id}`)?.focus();
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
            {formattedDate}
          </p>
        </div>

        <div className="dashboard-welcome-actions">
          {!loadError && (
            <div className="dashboard-current-streak">
              <Flame size={17} aria-hidden="true" />
              <span>Current streak</span>
              <strong>{overallStreak}</strong>
              <small>days</small>
            </div>
          )}

          <Link to="/log" className="dashboard-log-button">
            {today ? "Edit today's log" : 'Log today'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* LOAD ERROR — avoids showing empty data as if it were real */}
      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              We couldn't load your latest data
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
              What you see below may be missing or out of date. Check your
              connection and try again.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-border-hover)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload
          </button>
        </div>
      )}

      {/* TIME AND DAILY STATUS */}
      <TimeAmbient />

      {!loadError && (
        <>
          <MissedDayBanner
            hasLoggedToday={!!today}
            overallStreak={overallStreak}
            hasHistory={(monthly?.totalEntries ?? 0) > 0}
          />

          <StreakAtRiskCard
            primary={streakRisk.primary}
            items={streakRisk.items}
          />
        </>
      )}

      {/* DASHBOARD NAVIGATION — underline tabs so the active tab never
          competes with the primary "Log today" action */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        onKeyDown={handleTabKeyDown}
        className="flex border-b border-[var(--color-border)]"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;

          return (
            <button
              key={id}
              id={`dashboard-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`dashboard-panel-${id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(id)}
              className={`-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:flex-none sm:px-6 ${active
                ? 'border-[var(--color-brand-500)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]'
                }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? 'text-[var(--color-brand-400)]' : ''}`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TODAY TAB ================= */}
      {tab === 'today' && (
        <div
          id="dashboard-panel-today"
          role="tabpanel"
          aria-labelledby="dashboard-tab-today"
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
              {/* Not shown when the fetch failed — the alert above explains */}
              {!today && !loadError && (
                <section
                  aria-labelledby="no-log-title"
                  className="rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/5 p-5"
                >
                  <h2
                    id="no-log-title"
                    className="font-display text-lg font-semibold text-[var(--color-text)]"
                  >
                    No log yet today
                  </h2>

                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    Two minutes. Check what you did — good and bad — then
                    close the day honestly.
                  </p>

                  <Link
                    to="/log"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-[var(--color-brand-500)]"
                  >
                    Log today
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </section>
              )}

              {today && (
                <section aria-labelledby="today-overview-title">
                  <SectionHeading
                    id="today-overview-title"
                    title="Today's overview"
                    subtitle="A quick look at your performance"
                  />

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                    {/* Lead metric */}
                    <div className="flex items-end justify-between gap-4 p-4 sm:p-5">
                      <div>
                        <p className="lt-section-label">Today's score</p>

                        <p
                          className="mt-1 font-display text-5xl font-semibold tracking-tight"
                          style={{
                            color:
                              GRADE_COLORS[todayGrade] || 'var(--color-text)'
                          }}
                        >
                          {todayScore ?? '—'}
                        </p>
                      </div>

                      {todayGrade && (
                        <p className="pb-1.5 text-sm text-[var(--color-text-secondary)]">
                          Grade{' '}
                          <span
                            className="font-display text-xl font-semibold"
                            style={{ color: GRADE_COLORS[todayGrade] }}
                          >
                            {todayGrade}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Supporting metrics */}
                    <dl className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                        <dt className="text-sm text-[var(--color-text-secondary)]">
                          Monthly average
                          <span className="block text-xs text-[var(--color-text-muted)]">
                            {monthly?.totalEntries ?? 0} entries
                          </span>
                        </dt>
                        <dd className="font-display text-lg font-semibold text-[var(--color-text)]">
                          {monthly?.avgScore ?? '—'}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                        <dt className="text-sm text-[var(--color-text-secondary)]">
                          Average mood
                          <span className="block text-xs text-[var(--color-text-muted)]">
                            Out of 5.0
                          </span>
                        </dt>
                        <dd className="font-display text-lg font-semibold text-[var(--color-text)]">
                          {monthly?.avgMood ?? '—'}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
                        <dt className="text-sm text-[var(--color-text-secondary)]">
                          Best day
                          <span className="block text-xs text-[var(--color-text-muted)]">
                            This month
                          </span>
                        </dt>
                        <dd className="font-display text-lg font-semibold text-[var(--color-text)]">
                          {monthly?.bestDay
                            ? new Date(
                              monthly.bestDay + 'T12:00:00'
                            ).toLocaleDateString('en-PK', {
                              month: 'short',
                              day: 'numeric'
                            })
                            : '—'}
                        </dd>
                      </div>
                    </dl>
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
        <div
          id="dashboard-panel-progress"
          role="tabpanel"
          aria-labelledby="dashboard-tab-progress"
          className="space-y-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
                This week’s progress
              </h2>
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
          <section
            aria-label="Overall logging streak"
            className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/5 p-4 sm:p-5"
          >
            <div className="min-w-0">
              <p className="lt-section-label">Overall logging streak</p>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Consecutive days you've logged
              </p>
            </div>

            <p className="flex shrink-0 items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold tracking-tight text-[var(--color-brand-400)]">
                {overallStreak}
              </span>

              <span className="text-sm text-[var(--color-text-secondary)]">
                days
              </span>
            </p>
          </section>
          {/* WEEKLY PERFORMANCE */}
          {weekly.length > 0 && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              <SectionHeading
                title="This week"
                subtitle="Your daily performance at a glance"
              />

              <ul className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekly.map((day) => {
                  const isToday = day.date === todayDateKey;

                  const label = new Date(
                    day.date + 'T12:00:00'
                  ).toLocaleDateString('en-PK', {
                    weekday: 'short'
                  });

                  return (
                    <li
                      key={day.date}
                      aria-current={isToday ? 'date' : undefined}
                      className={`rounded-xl px-1 py-2.5 text-center ${isToday
                        ? 'bg-[var(--color-brand-600)]/10 ring-1 ring-inset ring-[var(--color-brand-500)]'
                        : 'bg-[var(--color-bg)]/50'
                        }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {label}
                      </p>

                      <p
                        className="mt-1.5 font-display text-base font-semibold sm:text-lg"
                        style={{
                          color: day.grade
                            ? GRADE_COLORS[day.grade]
                            : 'var(--color-text-muted)'
                        }}
                      >
                        {day.netScore ?? '—'}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                        {day.grade ?? '—'}
                      </p>

                      {isToday && (
                        <div className="mx-auto mt-1.5 h-1 w-4 rounded-full bg-[var(--color-brand-400)]" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* WEEKLY SHARE */}
          <ShareWeeklyCard
            userName={user?.name}
            overallStreak={overallStreak}
            weekly={weekly}
          />

          {/* ACTIVITY HEATMAP — renders its own card + heading */}
          <ActivityHeatmap weeks={53} />

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
          aria-labelledby="dashboard-tab-insights"
          className="space-y-4"
        >
          {/* PERSONALIZED INSIGHTS */}
          <ReplacementFocusCard focus={replacementFocus} />

          <PersonalFocusCard focus={personalFocus} />

          {insight && (
            <section className="rounded-2xl border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Lightbulb
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-400)]"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    {insight.title || 'Personal insight'}
                  </h2>

                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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
                />

                <StatCard
                  label="Best score"
                  value={records.bestScore ?? '—'}
                />

                <StatCard
                  label="Most habits / day"
                  value={records.mostHabitsInDay ?? '—'}
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
              <div className="space-y-5">
                {/* AVERAGE SUCCESS RATE */}
                <div>
                  <p className="lt-section-label">Average success rate</p>

                  <p
                    className="mt-1 font-display text-3xl font-semibold"
                    style={{ color: rateColor(avgSuccess) }}
                  >
                    {avgSuccess}%
                  </p>

                  <div
                    role="progressbar"
                    aria-label="Average success rate"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, Math.max(0, avgSuccess))}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-border)]"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500 motion-reduce:transition-none"
                      style={{
                        width: `${Math.min(100, Math.max(0, avgSuccess))}%`,
                        backgroundColor: rateColor(avgSuccess)
                      }}
                    />
                  </div>
                </div>

                {/* TOP REPLACEMENT PAIRS */}
                <div>
                  <p className="lt-section-label">Top performing pairs</p>

                  <ul className="mt-2 divide-y divide-[var(--color-border)]">
                    {topPairs.map((pair) => {
                      const successRate = pair.stats?.successRate || 0;

                      return (
                        <li
                          key={pair._id || pair.id}
                          className="py-3 last:pb-0"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="min-w-0 text-sm leading-relaxed text-[var(--color-text-secondary)]">
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
                              className="shrink-0 font-display text-lg font-semibold"
                              style={{ color: rateColor(successRate) }}
                            >
                              {pair.stats?.successRate ?? 0}%
                            </p>
                          </div>

                          <div
                            role="progressbar"
                            aria-label="Success rate"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.min(100, Math.max(0, successRate))}
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]"
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, successRate))}%`,
                                backgroundColor: rateColor(successRate)
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}