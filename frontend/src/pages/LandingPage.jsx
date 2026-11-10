
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

      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 shadow-sm backdrop-blur-md'
            : 'border-b border-transparent bg-[var(--color-bg)]/70 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
            aria-label="LifeTracker home"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-600)]/12 text-[var(--color-brand-400)]">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold text-[var(--color-text)]">
              LifeTracker
            </span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            <a href="#features" className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]">
              Features
            </a>
            <a href="#habits" className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]">
              Habits
            </a>
            <a href="#how-it-works" className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]">
              How it works
            </a>
            <a href="#faq" className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]">
              FAQs
            </a>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-brand-500)]/40 hover:text-[var(--color-brand-400)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => go('/login')}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => go('/register')}
              className="rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition hover:border-[var(--color-brand-500)]/40 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-40 bg-black/40 sm:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <div
              id="landing-mobile-menu"
              className="relative z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <nav className="mb-3 flex flex-col" aria-label="Mobile navigation">
                {[
                  ['Features', '#features'],
                  ['Habits', '#habits'],
                  ['How it works', '#how-it-works'],
                  ['FAQs', '#faq']
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="border-b border-[var(--color-border)] py-3 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]"
                  >
                    {label}
                  </a>
                ))}
              </nav>

              <button
                type="button"
                onClick={toggleTheme}
                className="mb-3 flex w-full items-center gap-2.5 py-2.5 text-left text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-text)]"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="flex-1 rounded-lg bg-[var(--color-brand-600)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
                >
                  Get Started
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-400)]">
                <span className="h-px w-8 bg-[var(--color-brand-500)]" />
                PERSONAL GROWTH, MADE PRACTICAL
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl">
                Build better days with{' '}
                <span className="text-[var(--color-brand-400)]">
                  calm, consistent habits
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg">
                Log good and bad habits, track streaks, mood, and daily scores — designed for focus,
                not noise. Replace bad habits with good ones over real multi-day progress.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="group inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
                >
                  Start free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
                >
                  Sign in
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)]">
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

            {/* Editorial product preview */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="border-y border-[var(--color-border)] py-5 sm:py-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
                      A DAY IN YOUR LIFE
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--color-text)]">
                      Small steps, meaningful progress
                    </h3>
                  </div>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-600)]/12 text-[var(--color-brand-400)]">
                    <Leaf className="h-5 w-5" />
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Good habits</p>
                  <span className="text-xs text-[var(--color-text-muted)]">Build consistency</span>
                </div>

                <div className="grid grid-cols-2 gap-x-5">
                  {GOOD_HABITS.slice(0, 4).map((habit, index) => (
                    <div
                      key={habit.label}
                      className="flex items-center gap-2 border-b border-[var(--color-border)] py-3"
                    >
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {habit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Habits to improve</p>
                  <span className="text-xs text-[var(--color-text-muted)]">Build awareness</span>
                </div>

                <div className="space-y-0">
                  {BAD_HABITS.slice(0, 3).map((habit) => (
                    <div
                      key={habit.label}
                      className="flex items-center gap-3 border-b border-[var(--color-border)] py-3"
                    >
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {habit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-400)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      Progress starts with awareness
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Track your actions and learn from each day.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 top-8 -z-10 h-24 w-24 border-r border-t border-[var(--color-brand-500)]/25 sm:-right-6" />
              <div className="absolute -bottom-5 -left-3 -z-10 h-20 w-20 border-b border-l border-[var(--color-brand-500)]/25 sm:-left-6" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-24 border-t border-[var(--color-border)] px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                  WHAT YOU GET
                </p>
                <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
                  Everything you need to stay consistent
                </h2>
              </div>
              <p className="max-w-xl text-sm text-[var(--color-text-secondary)] md:justify-self-end">
                Built for daily use — simple logging, clear feedback, real progress. A practical
                system for understanding the small decisions that shape your days.
              </p>
            </div>

            <div className="grid border-t border-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, desc }, index) => (
                <article
                  key={title}
                  className="border-b border-[var(--color-border)] py-6 sm:px-5 sm:odd:border-r sm:odd:pr-7 sm:even:pl-7 lg:px-6 lg:nth-[3n+1]:border-r lg:nth-[3n+2]:border-r lg:nth-[3n+1]:pl-0 lg:nth-[3n+2]:px-6 lg:nth-[3n]:pr-0"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <Icon className="h-5 w-5 text-[var(--color-brand-400)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Habits */}
        <section
          id="habits"
          className="scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-surface)]/35 px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                AWARENESS IS THE FIRST STEP
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
                What you track each day
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Default good & bad habits — plus your own custom ones.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-success)]">
                      Good Habits
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Habits worth strengthening
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                </div>

                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {GOOD_HABITS.map((habit, index) => (
                    <div
                      key={habit.label}
                      className="flex items-center gap-3 border-b border-[var(--color-border)] py-3"
                    >
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {habit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-danger)]">
                      Bad Habits
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Patterns to become aware of
                    </p>
                  </div>
                  <Flame className="h-5 w-5 text-[var(--color-danger)]" />
                </div>

                <div>
                  {BAD_HABITS.map((habit) => (
                    <div
                      key={habit.label}
                      className="flex items-center gap-3 border-b border-[var(--color-border)] py-3"
                    >
                      <span className="text-base">{habit.emoji}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {habit.label}
                      </span>
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
          <div className="mb-10 grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                A SIMPLE DAILY PROCESS
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
                How it works
              </h2>
            </div>
            <p className="max-w-xl text-sm text-[var(--color-text-secondary)] md:justify-self-end">
              Three simple steps. No complicated setup. Just a clearer way to understand how
              your everyday choices add up.
            </p>
          </div>

          <div className="grid border-t border-[var(--color-border)] md:grid-cols-3">
            {STEPS.map((step) => (
              <article
                key={step.num}
                className="border-b border-[var(--color-border)] py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <span className="mb-5 block text-xs font-semibold tracking-widest text-[var(--color-brand-400)]">
                  {step.num}
                </span>
                <h3 className="text-base font-semibold text-[var(--color-text)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Grade system */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/35 px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                UNDERSTAND YOUR PROGRESS
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                Daily grade system
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your net score turns into a clear grade every day.
              </p>
            </div>

            <div className="grid grid-cols-5 border-y border-[var(--color-border)]">
              {GRADES.map((grade) => (
                <div
                  key={grade.grade}
                  className="py-4 text-center"
                  style={{
                    borderRight: grade.grade === 'F' ? 'none' : '1px solid var(--color-border)'
                  }}
                >
                  <p className="text-2xl font-semibold" style={{ color: grade.color }}>
                    {grade.grade}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {grade.range}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-b border-[var(--color-border)] px-4 py-20 sm:px-6"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                GOOD TO KNOW
              </p>
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

            <div className="border-t border-[var(--color-border)]">
              {LANDING_FAQS.map((item) => (
                <details
                  key={item.question}
                  className="group border-b border-[var(--color-border)] py-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-text)] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.question}
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition group-open:border-[var(--color-brand-500)] group-open:text-[var(--color-brand-400)]">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-6 border-b border-[var(--color-border)] pb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-brand-400)]">
                YOUR NEXT CHAPTER STARTS HERE
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
                Start building better days today
              </h2>
              <p className="mt-3 max-w-md text-sm text-[var(--color-text-secondary)]">
                Free to use. Log once a day. Watch your streaks and scores grow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => go('/register')}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-600)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)]"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-brand-400)]"
          >
            Back to top
            <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </footer>
    </div>
  );
}
