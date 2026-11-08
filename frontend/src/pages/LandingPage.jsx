
import { useState, useEffect } from 'react';
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
  ArrowRight
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
  { emoji: '🌅', label: 'Morning Routine' },
  { emoji: '🏃', label: 'Exercise' },
  { emoji: '📖', label: 'Quran & Reading' },
  { emoji: '🤲', label: 'Daily Prayer' },
  { emoji: '💻', label: 'Coding Practice' },
  { emoji: '😴', label: 'Quality Sleep' },
  { emoji: '🥗', label: 'Healthy Diet' },
  { emoji: '💧', label: 'Hydration' }
];

const BAD_HABITS = [
  { emoji: '📱', label: 'Excessive Social Media' },
  { emoji: '⏰', label: 'Procrastination' },
  { emoji: '🍔', label: 'Junk Food' },
  { emoji: '🌙', label: 'Sleeping Late' },
  { emoji: '🕌', label: 'Missing Fajr' }
];

const GRADES = [
  { grade: 'A', range: '85+', color: '#22c55e' },
  { grade: 'B', range: '70–84', color: '#84cc16' },
  { grade: 'C', range: '55–69', color: '#f59e0b' },
  { grade: 'D', range: '40–54', color: '#f97316' },
  { grade: 'F', range: '<40', color: '#ef4444' }
];

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Daily Habit Logging',
    desc: 'Log 8 good habits and track 5 bad habits every day. One clean form, built for consistency.'
  },
  {
    icon: Calculator,
    title: 'Automatic Net Score',
    desc: 'Good habits add points, bad habits subtract. Your daily score is calculated the moment you save.'
  },
  {
    icon: Smile,
    title: 'Mood Journal',
    desc: 'Rate your mood from 1 to 5 each day and discover patterns in your emotional well-being over time.'
  },
  {
    icon: TrendingUp,
    title: 'Weekly & Monthly Trends',
    desc: 'Clear charts show your progress over 7 days and 30 days at a glance.'
  },
  {
    icon: Flame,
    title: 'Live Streak Counter',
    desc: 'Every habit has its own streak. Watching them grow is the motivation you need.'
  },
  {
    icon: CalendarDays,
    title: 'Full Entry History',
    desc: 'Review past days, notes, grades, and learn from your patterns over time.'
  }
];

const STEPS = [
  {
    num: '01',
    title: 'Log Your Day',
    desc: 'Every evening, open the Log page and check off what you did — good habits completed, bad habits slipped, and your mood.'
  },
  {
    num: '02',
    title: 'Get Your Grade',
    desc: 'Your net score is calculated instantly. The Dashboard shows your grade (A–F) and how you compare to your weekly average.'
  },
  {
    num: '03',
    title: 'Track Your Growth',
    desc: 'Visit Trends to see 7-day and 30-day charts. Watch your average rise as habits compound over weeks.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let last = false;

    const onScroll = () => {
      const y = window.scrollY;
      const next = last ? y > 12 : y > 40;

      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <Seo title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" />
      <JsonLd id="ld-webapp" data={buildWebAppJsonLd()} />
      <JsonLd id="ld-faq" data={buildFaqJsonLd()} />
      <JsonLd id="ld-org" data={buildOrganizationJsonLd()} />

      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)] ring-1 ring-[var(--color-brand-500)]/15">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold text-[var(--color-text)]">
              LifeTracker
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            <a
              href="#features"
              className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]"
            >
              FAQs
            </a>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-500)]/40 hover:text-[var(--color-brand-400)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => go('/register')}
              className="rounded-xl bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-500)]"
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:border-[var(--color-brand-500)]/40 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-40 bg-black/45 sm:hidden"
              onClick={closeMenu}
              aria-hidden
            />

            <div
              className="relative z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-xl sm:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="mb-3 flex flex-col gap-1">
                <a
                  href="#features"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  How it works
                </a>
                <a
                  href="#faq"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  FAQs
                </a>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="mb-3 flex w-full items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-left text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
                >
                  Get Started
                </button>

                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg)]"
                >
                  Sign in
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 top-12 h-80 w-80 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />
          <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-[var(--color-brand-400)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-[var(--color-brand-500)]/5 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-brand-400)] shadow-sm">
              <Leaf className="h-3.5 w-3.5" />
              Islamic lifestyle · Habit tracking
            </div>

            <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl lg:mx-0">
              Build better days with{' '}
              <span className="text-[var(--color-brand-400)]">
                calm, consistent habits
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg lg:mx-0">
              Log good and bad habits, track streaks, mood, and daily scores — designed for focus,
              not noise. Replace bad habits with good ones over real multi-day progress.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={() => go('/register')}
                className="group inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-1 hover:bg-[var(--color-brand-500)] hover:shadow-xl"
              >
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => go('/login')}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-brand-500)]/40 hover:bg-[var(--color-surface)]"
              >
                Sign in
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)] lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                Free to use
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                Simple daily tracking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
                Progress over time
              </span>
            </div>
          </div>

          {/* Decorative habit preview */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-[var(--color-brand-500)]/10 blur-2xl" />

            <div className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl shadow-black/10 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">
                    YOUR DAILY ROUTINE
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--color-text)]">
                    Small steps, meaningful progress
                  </h3>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <Leaf className="h-5 w-5" />
                </span>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Good habits
                  </p>
                  <span className="rounded-full bg-[var(--color-success)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                    Build consistency
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GOOD_HABITS.slice(0, 4).map((habit) => (
                    <div
                      key={habit.label}
                      className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-3 transition hover:border-[var(--color-brand-500)]/30"
                    >
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {habit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Habits to improve
                  </p>
                  <span className="rounded-full bg-[var(--color-danger)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
                    Build awareness
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BAD_HABITS.slice(0, 3).map((habit) => (
                    <span
                      key={habit.label}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-secondary)]"
                    >
                      <span>{habit.emoji}</span>
                      {habit.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--color-brand-500)]/20 bg-[var(--color-brand-600)]/10 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Progress starts with awareness
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    Track your actions and learn from each day.
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-3 -top-5 -z-10 h-20 w-20 rounded-2xl border border-[var(--color-brand-500)]/20 bg-[var(--color-brand-500)]/5 sm:-right-6" />
            <div className="pointer-events-none absolute -bottom-5 -left-4 -z-10 h-24 w-24 rounded-full border border-[var(--color-brand-500)]/20 bg-[var(--color-brand-500)]/5 sm:-left-7" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Everything in one place
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              Everything you need to stay consistent
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Built for daily use — simple logging, clear feedback, real progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-500)]/40 hover:shadow-xl hover:shadow-[var(--color-brand-500)]/5"
              >
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--color-brand-500)]/5 blur-2xl transition group-hover:bg-[var(--color-brand-500)]/10" />

                <div className="relative">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)] transition group-hover:bg-[var(--color-brand-600)] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="mb-2 block text-xs text-[var(--color-text-muted)]">
                    0{index + 1}
                  </span>

                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    {title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Habits */}
      <section
        id="habits"
        className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Awareness is the first step
            </span>
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              What you track each day
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Default good & bad habits — plus your own custom ones.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-success)]">
                    Good Habits
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Habits worth strengthening
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GOOD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/5"
                  >
                    <span className="text-base">{h.emoji}</span>
                    {h.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-danger)]">
                    Bad Habits
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Patterns to become aware of
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                  <Flame className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BAD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5"
                  >
                    <span className="text-base">{h.emoji}</span>
                    {h.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 mx-auto max-w-6xl px-4 py-20 sm:px-6"
      >
        <div className="mb-10 text-center">
          <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
            A simple daily process
          </span>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Three simple steps. No complicated setup.
          </p>
        </div>

        <div className="relative grid gap-4 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden border-t border-dashed border-[var(--color-brand-500)]/30 md:block" />

          {STEPS.map((s) => (
            <div
              key={s.num}
              className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--color-brand-500)]/40 hover:shadow-lg sm:p-6"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-brand-500)]/20 bg-[var(--color-brand-600)]/10 text-[var(--color-brand-400)]">
                <span className="text-xs font-semibold tracking-widest">{s.num}</span>
              </div>

              <h3 className="text-base font-semibold text-[var(--color-text)]">
                {s.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Grade system */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />

          <div className="relative">
            <div className="mb-7 text-center">
              <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
                Understand your progress
              </span>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                Daily grade system
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your net score turns into a clear grade every day.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {GRADES.map((g) => (
                <div
                  key={g.grade}
                  className="min-w-[88px] rounded-xl border px-4 py-3 text-center transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  style={{
                    borderColor: `${g.color}44`,
                    background: `${g.color}14`
                  }}
                >
                  <p className="text-2xl font-semibold" style={{ color: g.color }}>
                    {g.grade}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {g.range}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30 px-4 py-20 sm:px-6"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex rounded-full border border-[var(--color-brand-500)]/25 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
              Need to know more?
            </span>
            <h2
              id="faq-heading"
              className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl"
            >
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Plain answers about LifeTracker, scores, and habit replacement.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {LANDING_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-[var(--color-brand-500)]/30"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text)] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.question}
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-text-muted)] transition group-open:rotate-45 group-open:bg-[var(--color-brand-600)]/10 group-open:text-[var(--color-brand-400)]">
                      +
                    </span>
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

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-6 py-12 text-center sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[var(--color-brand-500)]/10 blur-3xl" />

          <div className="relative">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
              <Leaf className="h-6 w-6" />
            </span>

            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              Start building better days today
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-text-secondary)]">
              Free to use. Log once a day. Watch your streaks and scores grow.
            </p>

            <button
              type="button"
              onClick={() => go('/register')}
              className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--color-brand-600)]/20 transition hover:-translate-y-1 hover:bg-[var(--color-brand-500)]"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text-secondary)]">LifeTracker</strong> — free
              habit tracker and habit replacement app for daily scores, streaks, and focused
              routines.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Build consistency, one day at a time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-500)]/40 hover:text-[var(--color-brand-400)]"
          >
            Back to top
            <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </footer>
    </div>
  );
}
