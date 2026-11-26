import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  Sun,
  Moon,
  Menu,
  X,
  CheckCircle2,
  Calculator,
  Smile,
  TrendingUp,
  Flame,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  BarChart3,
  Check,
  RotateCcw,
  Compass,
  Award,
  Target
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Seo from '../components/seo/Seo';
import JsonLd from '../components/seo/JsonLd';
import {
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  LANDING_FAQS,
  buildWebAppJsonLd,
  buildFaqJsonLd,
  buildOrganizationJsonLd
} from '../config/seo';

const GOOD_HABITS = [
  { emoji: '🌅', label: 'Morning Routine', category: 'Routine' },
  { emoji: '🏃', label: 'Exercise', category: 'Health' },
  { emoji: '📖', label: 'Quran & Reading', category: 'Spirit' },
  { emoji: '🤲', label: 'Daily Prayer', category: 'Spirit' },
  { emoji: '💻', label: 'Coding Practice', category: 'Focus' },
  { emoji: '😴', label: 'Quality Sleep', category: 'Health' },
  { emoji: '🥗', label: 'Healthy Diet', category: 'Health' },
  { emoji: '💧', label: 'Hydration', category: 'Health' }
];

const BAD_HABITS = [
  { emoji: '📱', label: 'Excessive Social Media', impact: 'Attention' },
  { emoji: '⏰', label: 'Procrastination', impact: 'Time' },
  { emoji: '🍔', label: 'Junk Food', impact: 'Health' },
  { emoji: '🌙', label: 'Sleeping Late', impact: 'Energy' },
  { emoji: '🕌', label: 'Missing Fajr', impact: 'Spirit' }
];

const GRADES = [
  {
    grade: 'A',
    range: '85+',
    tone: 'success',
    label: 'Exceptional Day',
    desc: 'Deep focus, spiritual connection, and consistent positive momentum.'
  },
  {
    grade: 'B',
    range: '70–84',
    tone: 'brand',
    label: 'Strong Progress',
    desc: 'Most healthy habits completed; minor slips with solid recovery.'
  },
  {
    grade: 'C',
    range: '55–69',
    tone: 'warning',
    label: 'Balanced Day',
    desc: 'Baseline consistency maintained, with clear areas to strengthen tomorrow.'
  },
  {
    grade: 'D',
    range: '40–54',
    tone: 'warning',
    label: 'Challenging Day',
    desc: 'Off-track on key habits; honest awareness is the first step to reset.'
  },
  {
    grade: 'F',
    range: '<40',
    tone: 'danger',
    label: 'Reset & Rebuild',
    desc: 'A tough day without judgment. Tomorrow is a completely fresh page.'
  }
];

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😐', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😌', label: 'Calm' },
  { value: 5, emoji: '🌟', label: 'Great' }
];

const STEPS = [
  {
    num: '01',
    time: 'Evening · 60s',
    title: 'Daily Evening Check-in',
    desc: 'Open your clean daily log. Check off positive routines you maintained, acknowledge any slips, and record your mood in under a minute.'
  },
  {
    num: '02',
    time: 'Instant Calculation',
    title: 'Transparent Net Score & Grade',
    desc: 'Good habits add points, bad habits apply an honest penalty. Your net score (0–100) instantly maps to a clear letter grade (A–F) without vanity metrics.'
  },
  {
    num: '03',
    time: 'Long-term Momentum',
    title: 'Compound Habits & Replacement',
    desc: 'Monitor multi-day habit replacement windows, cultivate streaks that inspire genuine pride, and review 7-day and 30-day trajectory curves.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Interactive Demo State
  const [demoGood, setDemoGood] = useState(['Morning Routine', 'Daily Prayer', 'Hydration']);
  const [demoBad, setDemoBad] = useState([]);
  const [demoMood, setDemoMood] = useState(4);

  // Calculate live demo score matching LifeTracker formula
  const demoScore = useMemo(() => {
    const totalGood = 8;
    const totalBad = 5;
    const goodDone = demoGood.length;
    const badDone = demoBad.length;

    const gs = (goodDone / totalGood) * 100;
    const bs = (badDone / totalBad) * 100;
    const score = Math.max(0, Math.min(100, Math.round(gs - bs * 0.5)));
    return score;
  }, [demoGood, demoBad]);

  const demoGrade = useMemo(() => {
    if (demoScore >= 85) return { grade: 'A', tone: 'success', label: 'Grade A' };
    if (demoScore >= 70) return { grade: 'B', tone: 'brand', label: 'Grade B' };
    if (demoScore >= 55) return { grade: 'C', tone: 'warning', label: 'Grade C' };
    if (demoScore >= 40) return { grade: 'D', tone: 'warning', label: 'Grade D' };
    return { grade: 'F', tone: 'danger', label: 'Grade F' };
  }, [demoScore]);

  const toggleDemoGood = (label) => {
    setDemoGood((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const toggleDemoBad = (label) => {
    setDemoBad((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const resetDemo = () => {
    setDemoGood(['Morning Routine', 'Daily Prayer', 'Hydration']);
    setDemoBad([]);
    setDemoMood(4);
  };

  useEffect(() => {
    let last = false;

    const onScroll = () => {
      const y = window.scrollY;
      const next = last ? y > 12 : y > 30;

      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200">
      <Seo title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" />
      <JsonLd id="ld-webapp" data={buildWebAppJsonLd()} />
      <JsonLd id="ld-faq" data={buildFaqJsonLd()} />
      <JsonLd id="ld-org" data={buildOrganizationJsonLd()} />

      {/* ── HEADER NAVIGATION ─────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left transition"
            aria-label="LifeTracker Home"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)] ring-1 ring-[var(--color-brand-500)]/20 transition group-hover:scale-105 group-hover:bg-[var(--color-brand-600)]/25">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-[var(--color-text)]">
              LifeTracker
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-4 py-1.5 backdrop-blur-md md:flex" aria-label="Landing Page Navigation">
            <a
              href="#features"
              className="rounded-lg px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              Features
            </a>
            <a
              href="#habits"
              className="rounded-lg px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              Habits
            </a>
            <a
              href="#how-it-works"
              className="rounded-lg px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              How it works
            </a>
            <a
              href="#grades"
              className="rounded-lg px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              Grades
            </a>
            <a
              href="#faq"
              className="rounded-lg px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              FAQs
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-500)]/40 hover:text-[var(--color-brand-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => go('/register')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-500)] active:translate-y-0"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <div
              className="relative z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-2xl sm:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
            >
              <div className="mb-4 flex flex-col gap-1">
                <a
                  href="#features"
                  onClick={closeMenu}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  Features
                </a>
                <a
                  href="#habits"
                  onClick={closeMenu}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  Habits
                </a>
                <a
                  href="#how-it-works"
                  onClick={closeMenu}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  How it works
                </a>
                <a
                  href="#grades"
                  onClick={closeMenu}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  Daily Grades
                </a>
                <a
                  href="#faq"
                  onClick={closeMenu}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  FAQs
                </a>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-4">
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
                >
                  Create Free Account
                </button>

                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
                >
                  Sign in
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Left Column: Mission & CTAs */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-brand-400)] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-400)] animate-pulse" />
              <span>Mindful Lifestyle & Islamic Habit Tracking</span>
            </div>

            <h1 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-[1.12] tracking-tight text-[var(--color-text)] sm:text-5xl lg:mx-0">
              Build better days with{' '}
              <span className="text-[var(--color-brand-400)]">
                calm, consistent habits.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg lg:mx-0">
              Log daily positive actions, stay conscious of slipping patterns, and watch your
              genuine net score and streaks grow. Replace bad habits through real multi-day progress — with no ads or social noise.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <button
                type="button"
                onClick={() => go('/register')}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[var(--color-brand-600)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-500)] hover:shadow-xl active:translate-y-0"
              >
                Start Your Free Streak
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => go('/login')}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-brand-500)]/40 hover:bg-[var(--color-surface-2)]"
              >
                Sign in to Today's Log
              </button>
            </div>

            {/* Credibility and Reassurance Trust Signals */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-medium text-[var(--color-text-muted)] lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                100% Free to use
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                Private & exportable data
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                No ads or vanity feeds
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive Demo Preview */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-black/20 sm:p-6">
              {/* Card Header with Live Score Preview */}
              <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Interactive Preview
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-base font-semibold text-[var(--color-text)]">
                    Today's Evening Check-in
                  </h3>
                </div>

                {/* Dynamic Net Score Badge */}
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-3.5 py-1.5">
                  <div className="text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Net Score
                    </div>
                    <div className="font-display text-lg font-bold leading-none text-[var(--color-brand-400)]">
                      {demoScore}
                    </div>
                  </div>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${
                      demoGrade.tone === 'success'
                        ? 'bg-[var(--color-success)]'
                        : demoGrade.tone === 'brand'
                          ? 'bg-[var(--color-brand-600)]'
                          : demoGrade.tone === 'warning'
                            ? 'bg-[var(--color-warning)] text-stone-900'
                            : 'bg-[var(--color-danger)]'
                    }`}
                  >
                    {demoGrade.grade}
                  </span>
                </div>
              </div>

              {/* Good Habits Interactive Toggles */}
              <div className="mb-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text)]">
                    Good Habits Completed
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-success)]">
                    +{demoGood.length * 12} pts earned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GOOD_HABITS.slice(0, 4).map((habit) => {
                    const isChecked = demoGood.includes(habit.label);
                    return (
                      <button
                        key={habit.label}
                        type="button"
                        onClick={() => toggleDemoGood(habit.label)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                          isChecked
                            ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-text)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{habit.emoji}</span>
                          <span className="truncate">{habit.label}</span>
                        </span>
                        <span
                          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            isChecked
                              ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                              : 'border-[var(--color-border)] bg-transparent'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Habits to Avoid Toggles */}
              <div className="mb-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text)]">
                    Habits to Avoid (Honest Slips)
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    {demoBad.length > 0 ? `-${demoBad.length * 10} penalty` : 'Clean day!'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {BAD_HABITS.slice(0, 2).map((habit) => {
                    const isChecked = demoBad.includes(habit.label);
                    return (
                      <button
                        key={habit.label}
                        type="button"
                        onClick={() => toggleDemoBad(habit.label)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                          isChecked
                            ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-text)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{habit.emoji}</span>
                          <span className="truncate">{habit.label}</span>
                        </span>
                        <span
                          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            isChecked
                              ? 'border-[var(--color-danger)] bg-[var(--color-danger)] text-white'
                              : 'border-[var(--color-border)] bg-transparent'
                          }`}
                        >
                          {isChecked && <X className="h-3 w-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mood Journal Mini Selector */}
              <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  Today's Mood
                </span>
                <div className="flex items-center gap-1.5">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setDemoMood(m.value)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition ${
                        demoMood === m.value
                          ? 'bg-[var(--color-brand-600)]/20 ring-1 ring-[var(--color-brand-500)] scale-110'
                          : 'opacity-65 hover:opacity-100 hover:bg-[var(--color-surface)]'
                      }`}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Card Footer with Reset helper */}
              <div className="mt-3.5 flex items-center justify-between pt-1 text-[11px] text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-[var(--color-warning)]" />
                  <strong>14-day streak</strong> on Daily Prayer
                </span>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand-400)]"
                  title="Reset demo check-in"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESIGN THESIS / CALM QUOTE CALLOUT ─────────────────── */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/25 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-display text-lg font-medium text-[var(--color-text)] sm:text-xl">
            "Consistency is not about flawless perfection. It is about honest awareness every evening."
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)] sm:text-sm">
            LifeTracker pairs positive routines with negative habit replacement, producing genuine accountability without guilt.
          </p>
        </div>
      </section>

      {/* ── BENTO FEATURES SHOWCASE ───────────────────────────── */}
      <section
        id="features"
        className="scroll-mt-24 border-b border-[var(--color-border)] px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Designed for Honest Consistency
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              Everything built for real personal transformation
            </h2>
            <p className="mx-auto mt-2.5 max-w-xl text-sm text-[var(--color-text-secondary)]">
              No bloated gamification or vanity badges. Only the tools that genuinely help you reflect and compound better habits.
            </p>
          </div>

          {/* Asymmetrical Bento Grid */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Spotlight Feature 1: The Dual Habit Balance Engine */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40 md:col-span-2">
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)] sm:text-xl">
                  The Dual Habit Balance Engine
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Most trackers only measure what you checked off. LifeTracker measures both sides:
                  good habits elevate your score, while slipped bad habits apply an honest penalty. The resulting net score reflects your true day.
                </p>
              </div>

              {/* Visual Breakdown Strip */}
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                  <span className="font-medium text-[var(--color-text)]">Completed Good Habits</span>
                  <span className="rounded-md bg-[var(--color-success)]/10 px-2 py-0.5 font-semibold text-[var(--color-success)]">+100% max</span>
                </div>
                <div className="text-[var(--color-text-muted)]">—</div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                  <span className="font-medium text-[var(--color-text)]">Bad Habit Penalty</span>
                  <span className="rounded-md bg-[var(--color-danger)]/10 px-2 py-0.5 font-semibold text-[var(--color-danger)]">-50% weight</span>
                </div>
                <div className="text-[var(--color-text-muted)]">=</div>
                <span className="font-bold text-[var(--color-brand-400)]">Authentic Net Grade</span>
              </div>
            </div>

            {/* Spotlight Feature 2: Habit Replacement Architecture */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40">
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
                  Habit Replacement
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Willpower alone is fragile. LifeTracker lets you link one bad habit to a constructive substitute, evaluating progress over a rolling multi-day window.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Active Replacement Pair
                </div>
                <div className="mt-2 flex items-center justify-between gap-1 text-[var(--color-text)]">
                  <span className="truncate">📱 Screen Time</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-400)]" />
                  <span className="truncate font-semibold text-[var(--color-brand-400)]">📖 Reading</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Mood & Emotional Well-being */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <Smile className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                Mood & Reflection Journal
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Track how daily habits correlate with your peace of mind. Add optional notes to capture thoughts, gratitude, or daily obstacles.
              </p>
            </div>

            {/* Feature 4: Momentum & Streak Psychology */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                Streak Motivation Without Anxiety
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Watch streaks grow for each individual habit. Receive timely gentle reminders so you maintain momentum without burnout.
              </p>
            </div>

            {/* Feature 5: Trends & Privacy */}
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                7 & 30-Day Trends & Export
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Clean visual charts illustrate your trajectory over weeks. Export your entire history to JSON or CSV anytime for complete data ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HABITS SHOWCASE SECTION ───────────────────────────── */}
      <section
        id="habits"
        className="scroll-mt-24 border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Curated Daily Catalog
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              What you track and improve every day
            </h2>
            <p className="mx-auto mt-2 text-sm text-[var(--color-text-secondary)]">
              Pre-configured with core Islamic lifestyle and productivity habits, plus full support for custom habits.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Good Habits Card */}
            <div className="rounded-3xl border border-[var(--color-success)]/25 bg-[var(--color-surface)] p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-success)]">
                    Good Habits to Strengthen
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Contributes positive points to your daily score
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-success)]/10 text-[var(--color-success)]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GOOD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{h.emoji}</span>
                      <span className="font-medium text-xs sm:text-sm">{h.label}</span>
                    </div>
                    <span className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {h.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bad Habits Card */}
            <div className="rounded-3xl border border-[var(--color-danger)]/25 bg-[var(--color-surface)] p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-danger)]">
                    Habits to Acknowledge & Overcome
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Brings awareness to patterns you want to reduce
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                  <Flame className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {BAD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{h.emoji}</span>
                      <span className="font-medium text-xs sm:text-sm">{h.label}</span>
                    </div>
                    <span className="rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {h.impact}
                    </span>
                  </div>
                ))}
              </div>

              {/* Custom Habits Note */}
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-xs text-[var(--color-text-secondary)]">
                <Sparkles className="h-5 w-5 shrink-0 text-[var(--color-brand-400)]" />
                <span>
                  <strong>Need custom tracking?</strong> You can add unlimited custom good and bad habits (e.g. gym splits, language lessons, fasting) in your settings.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3-STEP TIMELINE) ────────────────────── */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-b border-[var(--color-border)] px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              A 60-Second Daily Rhythm
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              How LifeTracker works
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              No complicated onboarding or tedious spreadsheets. Three simple steps each day.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="group relative flex flex-col justify-between rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition duration-200 hover:border-[var(--color-brand-500)]/40 sm:p-7"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-[var(--color-brand-400)]">
                      {s.num}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-muted)]">
                      <Clock className="h-3 w-3" />
                      {s.time}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                    {s.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-xs font-semibold text-[var(--color-brand-400)]">
                  Step {s.num} of 03
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAILY GRADE SYSTEM EXPLANATION ─────────────────────── */}
      <section
        id="grades"
        className="scroll-mt-24 border-b border-[var(--color-border)] bg-[var(--color-surface)]/30 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Transparent Evaluation
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              Daily Grade Breakdown (A–F)
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Every day earns an honest letter grade based on your net score. No hidden calculations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {GRADES.map((g) => (
              <div
                key={g.grade}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 ${
                  g.tone === 'success'
                    ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10'
                    : g.tone === 'brand'
                      ? 'border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10'
                      : g.tone === 'warning'
                        ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10'
                        : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10'
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`font-display text-3xl font-bold ${
                        g.tone === 'success'
                          ? 'text-[var(--color-success)]'
                          : g.tone === 'brand'
                            ? 'text-[var(--color-brand-400)]'
                            : g.tone === 'warning'
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-danger)]'
                      }`}
                    >
                      {g.grade}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {g.range} pts
                    </span>
                  </div>

                  <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                    {g.label}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {g.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
            💡 Remember: A grade is simply data, not a moral judgment. Use low-score days to identify triggers and bounce back immediately.
          </p>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ─────────────── */}
      <section
        id="faq"
        className="scroll-mt-24 border-b border-[var(--color-border)] px-4 py-20 sm:px-6"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Clear & Honest Answers
            </span>
            <h2
              id="faq-heading"
              className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl"
            >
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Everything you need to know about the scores, privacy, and habit replacement methodology.
            </p>
          </div>

          <div className="space-y-3.5">
            {LANDING_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition hover:border-[var(--color-brand-500)]/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--color-text)] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)] transition group-open:rotate-45 group-open:bg-[var(--color-brand-600)]/15 group-open:text-[var(--color-brand-400)]">
                    +
                  </span>
                </summary>

                <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION ──────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-6 py-14 text-center sm:px-12 sm:py-16">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)] ring-1 ring-[var(--color-brand-500)]/20">
            <Leaf className="h-6 w-6" />
          </span>

          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-4xl">
            Start building peaceful, disciplined days
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            Join individuals tracking their daily habits, spiritual routines, and personal growth with clarity and purpose.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => go('/register')}
              className="group inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-500)] hover:shadow-xl active:translate-y-0"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
            >
              Sign in to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <Leaf className="h-3.5 w-3.5" />
              </span>
              <span className="font-display text-sm font-semibold text-[var(--color-text)]">
                LifeTracker
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Daily habit tracking, net scoring, and habit replacement for mindful progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[var(--color-text-secondary)]">
            <a href="#features" className="hover:text-[var(--color-brand-400)] transition">
              Features
            </a>
            <a href="#habits" className="hover:text-[var(--color-brand-400)] transition">
              Habits
            </a>
            <a href="#how-it-works" className="hover:text-[var(--color-brand-400)] transition">
              How it works
            </a>
            <a href="#grades" className="hover:text-[var(--color-brand-400)] transition">
              Grades
            </a>
            <a href="#faq" className="hover:text-[var(--color-brand-400)] transition">
              FAQs
            </a>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-500)]/40 hover:text-[var(--color-brand-400)]"
          >
            Back to top
            <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} LifeTracker. Built for calm and consistent days.
        </div>
      </footer>
    </div>
  );
}
