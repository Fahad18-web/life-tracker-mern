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
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition ${
          scrolled
            ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold text-[var(--color-text)]">
              LifeTracker
            </span>
          </button>

          {/* Desktop */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => go('/register')}
              className="rounded-xl bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-black/45 sm:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              className="relative z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-lg sm:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
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
                  className="w-full rounded-2xl bg-[var(--color-brand-600)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="w-full rounded-2xl border-2 border-[var(--color-brand-600)] bg-transparent px-4 py-3 text-center text-sm font-semibold text-[var(--color-brand-600)] transition hover:bg-[var(--color-brand-600)]/10 dark:border-[var(--color-brand-400)] dark:text-[var(--color-brand-400)]"
                >
                  Sign in
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand-400)]">
          Islamic lifestyle · Habit tracking
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl">
          Build better days with{' '}
          <span className="text-[var(--color-brand-400)]">calm, consistent habits</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg">
          Log good and bad habits, track streaks, mood, and daily scores — designed for focus, not noise.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go('/register')}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)]"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go('/login')}
            className="rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            Sign in
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
            Everything you need to stay consistent
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Built for daily use — simple logging, clear feedback, real progress.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Habits */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
              What you track each day
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Default good & bad habits — plus your own custom ones.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--color-success)]">Good Habits</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GOOD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)]"
                  >
                    <span className="text-base">{h.emoji}</span>
                    {h.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--color-danger)]">Bad Habits</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BAD_HABITS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)]"
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
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Three simple steps. No complicated setup.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-xs font-semibold tracking-widest text-[var(--color-brand-400)]">
                {s.num}
              </p>
              <h3 className="mt-2 text-base font-semibold text-[var(--color-text)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Grades */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <div className="mb-6 text-center">
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
                className="min-w-[88px] rounded-xl border px-4 py-3 text-center"
                style={{
                  borderColor: `${g.color}44`,
                  background: `${g.color}14`
                }}
              >
                <p className="text-2xl font-semibold" style={{ color: g.color }}>
                  {g.grade}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{g.range}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-6 py-12 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
            Start building better days today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-text-secondary)]">
            Free to use. Log once a day. Watch your streaks and scores grow.
          </p>
          <button
            type="button"
            onClick={() => go('/register')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)]"
          >
            Create free account <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        LifeTracker · Build consistency, one day at a time
      </footer>
    </div>
  );
}