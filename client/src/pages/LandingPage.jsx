import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useTheme }     from '../contexts/ThemeContext';

// ── Static Data ───────────────────────────────────────────────────────────────

const GOOD_HABITS = [
  { emoji: '🌅', label: 'Morning Routine'   },
  { emoji: '🏃', label: 'Exercise'          },
  { emoji: '📖', label: 'Quran & Reading'   },
  { emoji: '🤲', label: 'Daily Prayer'      },
  { emoji: '💻', label: 'Coding Practice'   },
  { emoji: '😴', label: 'Quality Sleep'     },
  { emoji: '🥗', label: 'Healthy Diet'      },
  { emoji: '💧', label: 'Hydration'         },
];

const BAD_HABITS = [
  { emoji: '📱', label: 'Excessive Social Media' },
  { emoji: '⏰', label: 'Procrastination'        },
  { emoji: '🍔', label: 'Junk Food'              },
  { emoji: '🌙', label: 'Sleeping Late'          },
  { emoji: '🕌', label: 'Missing Fajr'           },
];

const GRADES = [
  { grade: 'A', range: '85+',   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.22)'   },
  { grade: 'B', range: '70–84', color: '#84cc16', bg: 'rgba(132,204,22,0.08)',  border: 'rgba(132,204,22,0.22)'  },
  { grade: 'C', range: '55–69', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)'  },
  { grade: 'D', range: '40–54', color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.22)'  },
  { grade: 'F', range: '<40',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)'   },
];

const FEATURES = [
  { icon: '✅', title: 'Daily Habit Logging',    desc: 'Log 8 good habits and track 5 bad habits every day. One clean form, built for consistency.' },
  { icon: '🧮', title: 'Automatic Net Score',     desc: 'Good habits add points, bad habits subtract. Your daily score is calculated the moment you save.' },
  { icon: '😊', title: 'Mood Journal',            desc: 'Rate your mood from 1 to 5 each day and discover patterns in your emotional well-being over time.' },
  { icon: '📈', title: 'Weekly & Monthly Trends', desc: 'Beautiful Chart.js visualizations show your progress over 7 days and 30 days at a glance.' },
  { icon: '🔥', title: 'Live Streak Counter',     desc: 'Every habit has its own streak. Watching them grow is exactly the motivation you need.' },
  { icon: '📅', title: 'Full Entry History',      desc: 'Navigate back to any past day, review your notes, and learn from your patterns over time.' },
];

const STEPS = [
  { num: '01', title: 'Log Your Day',      desc: 'Every evening, open the Log page and check off what you did — good habits completed, bad habits avoided, and your mood for the day.' },
  { num: '02', title: 'Get Your Grade',    desc: 'Your net score is calculated instantly using a weighted formula. The Dashboard shows your grade (A–F) and how you compare to your weekly average.' },
  { num: '03', title: 'Track Your Growth', desc: 'Visit Trends to see your 7-day and 30-day charts. Watch your average score rise as your habits compound over weeks.' },
];

const WEEKLY_MOCK = [
  { day: 'Mon', score: 72, grade: 'B', color: '#84cc16' },
  { day: 'Tue', score: 58, grade: 'C', color: '#f59e0b' },
  { day: 'Wed', score: 85, grade: 'A', color: '#22c55e' },
  { day: 'Thu', score: 63, grade: 'C', color: '#f59e0b' },
  { day: 'Fri', score: 90, grade: 'A', color: '#22c55e' },
  { day: 'Sat', score: 45, grade: 'D', color: '#f97316' },
  { day: 'Sun', score: 78, grade: 'B', color: '#84cc16' },
];

const STREAK_MOCK = [
  { habit: 'Prayer',   count: 14, color: '#6366f1' },
  { habit: 'Coding',   count: 9,  color: '#22c55e' },
  { habit: 'Exercise', count: 5,  color: '#f59e0b' },
  { habit: 'Reading',  count: 21, color: '#84cc16' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate               = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Scoped Styles — all colors use CSS variables ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .lp-root {
          background: var(--bg-primary);
          color:      var(--text-primary);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          transition: background-color 0.25s ease, color 0.2s ease;
        }

        /* ── Navbar ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 64px; display: flex; align-items: center;
          transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
        }
        .lp-nav.scrolled {
          background:      var(--bg-header-glass);
          backdrop-filter: blur(20px) saturate(160%);
          border-bottom:   1px solid var(--border);
        }
        .lp-nav-inner {
          max-width: 1160px; margin: 0 auto; padding: 0 24px;
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          position: relative;
        }
        .lp-logo {
          font-size: 17px; font-weight: 700; color: var(--text-primary);
          letter-spacing: -0.02em; cursor: pointer; user-select: none;
        }
        .lp-nav-actions { display: flex; align-items: center; gap: 8px; }
        .lp-nav-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .lp-nav-toggle:hover {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--border-hover);
        }
        .lp-nav-toggle svg { display: block; }
        .lp-nav-link {
          color: var(--text-secondary); font-size: 14px; font-weight: 500;
          padding: 7px 13px; border-radius: 8px;
          background: none; border: none; cursor: pointer;
          font-family: inherit; transition: color 0.15s, background 0.15s;
        }
        .lp-nav-link:hover { color: var(--text-primary); background: var(--bg-card); }

        /* ── Buttons ── */
        .lp-btn-primary {
          background: var(--accent); color: #fff; border: none;
          padding: 8px 18px; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .lp-btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 18px var(--accent-glow); }

        .lp-btn-ghost {
          background: transparent; color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 11px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: border-color 0.15s, background 0.15s;
        }
        .lp-btn-ghost:hover { border-color: var(--border-hover); background: var(--bg-hover); }

        .lp-btn-cta {
          background: var(--accent); color: #fff; border: none;
          padding: 13px 30px; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          letter-spacing: -0.01em;
        }
        .lp-btn-cta:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 8px 28px var(--accent-glow); }

        /* Theme toggle in navbar */
        .lp-btn-theme {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; padding: 0;
          border: 1px solid var(--border); border-radius: 8px;
          background: transparent; color: var(--text-secondary);
          cursor: pointer; transition: all 0.15s;
        }
        .lp-btn-theme:hover { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-hover); }
        .lp-btn-theme svg { display: block; }

        /* ── Hero ── */
        .lp-hero { padding: 160px 24px 96px; text-align: center; position: relative; }
        .lp-hero-glow {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 800px; height: 700px; pointer-events: none;
          background: radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 65%);
        }
        .lp-hero-inner { position: relative; z-index: 1; }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 999px; padding: 5px 15px;
          font-size: 12px; font-weight: 600; color: #818cf8;
          margin-bottom: 28px; letter-spacing: 0.04em;
        }
        .lp-hero h1 {
          font-size: clamp(40px, 6.5vw, 70px); font-weight: 800;
          line-height: 1.07; letter-spacing: -0.045em;
          color: var(--text-primary); max-width: 840px; margin: 0 auto 22px;
        }
        .lp-hero h1 .accent { color: var(--accent); }
        .lp-hero-sub {
          font-size: clamp(15px, 1.8vw, 17px); color: var(--text-secondary);
          max-width: 520px; margin: 0 auto 40px; line-height: 1.7;
        }
        .lp-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 72px; }

        /* ── Mock Dashboard ── */
        .lp-mock {
          max-width: 900px; margin: 0 auto;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
          box-shadow: var(--shadow-lg), 0 0 0 1px var(--border);
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .lp-mock-topbar {
          height: 44px; background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; padding: 0 18px; gap: 7px;
          transition: background-color 0.25s ease;
        }
        .lp-mock-dot        { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .lp-mock-topbar-ttl { margin-left: 14px; font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .lp-mock-body       { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .lp-mock-greeting   { font-size: 18px; font-weight: 700; color: var(--text-primary); text-align: left; }
        .lp-mock-greeting span { color: var(--text-muted); font-size: 12px; font-weight: 400; margin-left: 8px; }
        .lp-mock-stats   { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .lp-mock-stat    {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .lp-mock-stat-lbl  { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }
        .lp-mock-stat-val  { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.04em; line-height: 1; }
        .lp-mock-badge     { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 999px; color: #fff; margin-top: 6px; }
        .lp-mock-sub       { font-size: 11px; color: var(--text-muted); margin-top: 5px; }
        .lp-mock-streaks   { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .lp-mock-streak    {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 14px;
          transition: background-color 0.25s ease;
        }
        .lp-mock-streak-habit { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
        .lp-mock-streak-cnt   { font-size: 22px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.03em; margin-top: 2px; }
        .lp-mock-streak-days  { font-size: 10px; color: var(--text-muted); font-weight: 500; }
        .lp-mock-week-title   { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
        .lp-mock-week  { display: grid; grid-template-columns: repeat(7,1fr); gap: 8px; }
        .lp-mock-day   {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 6px;
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .lp-mock-day.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-glow); }
        .lp-mock-day-lbl    { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .lp-mock-day-score  { font-size: 17px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .lp-mock-day-grade  { font-size: 10px; color: var(--text-secondary); font-weight: 600; }

        /* ── Stats Strip ── */
        .lp-strip {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 56px 24px;
          transition: border-color 0.25s ease;
        }
        .lp-strip-inner { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); }
        .lp-strip-item  { text-align: center; padding: 0 16px; border-right: 1px solid var(--border); }
        .lp-strip-item:last-child { border-right: none; }
        .lp-strip-num   { display: block; font-size: 44px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--accent); letter-spacing: -0.05em; line-height: 1.1; }
        .lp-strip-label { display: block; font-size: 13px; color: var(--text-secondary); font-weight: 500; margin-top: 6px; }

        /* ── Section ── */
        .lp-section { max-width: 1160px; margin: 0 auto; padding: 96px 24px; }
        .lp-eyebrow { font-size: 12px; font-weight: 600; color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
        .lp-heading { font-size: clamp(28px, 3.5vw, 40px); font-weight: 800; letter-spacing: -0.035em; color: var(--text-primary); line-height: 1.13; }
        .lp-split   { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; flex-wrap: wrap; margin-bottom: 52px; }
        .lp-desc    { font-size: 15px; color: var(--text-secondary); line-height: 1.7; max-width: 400px; }

        /* ── Features ── */
        .lp-features-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
        }
        .lp-feature        { background: var(--bg-primary); padding: 32px 28px; display: flex; flex-direction: column; gap: 12px; transition: background 0.2s; }
        .lp-feature:hover  { background: var(--bg-hover); }
        .lp-feature-icon   { font-size: 24px; line-height: 1; }
        .lp-feature-title  { font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }
        .lp-feature-desc   { font-size: 13px; color: var(--text-secondary); line-height: 1.65; }

        /* ── Habits ── */
        .lp-habits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .lp-habits-col  {
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .lp-habits-hd   { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin-bottom: 18px; }
        .lp-habit-pill  {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 600; margin-bottom: 8px;
          border: 1px solid transparent;
          color: var(--text-primary);
        }
        .lp-habit-pill.good {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.22);
        }
        .lp-habit-pill.bad {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.22);
        }
        .lp-habit-pill-emoji {
          width: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-habit-pill-label {
          color: inherit;
        }
        [data-theme='light'] .lp-habit-pill.good {
          color: #14532d;
        }
        [data-theme='light'] .lp-habit-pill.bad {
          color: #7f1d1d;
        }
        [data-theme='dark'] .lp-habit-pill.good {
          color: #dcfce7;
        }
        [data-theme='dark'] .lp-habit-pill.bad {
          color: #fee2e2;
        }
        .lp-habit-pill:last-child { margin-bottom: 0; }

        /* ── Grades ── */
        .lp-grades-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .lp-grade-card { flex: 1; min-width: 130px; border-radius: 14px; padding: 26px 18px; text-align: center; border: 1px solid transparent; transition: transform 0.2s; }
        .lp-grade-card:hover { transform: translateY(-4px); }
        .lp-grade-letter { display: block; font-size: 46px; font-weight: 800; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.03em; line-height: 1; }
        .lp-grade-range  { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-top: 5px; font-family: 'JetBrains Mono', monospace; }
        .lp-grade-desc   { display: block; font-size: 11px; color: var(--text-muted); margin-top: 8px; font-weight: 500; }

        /* ── Steps ── */
        .lp-steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; }
        .lp-step       { display: flex; flex-direction: column; gap: 14px; }
        .lp-step-num   { font-size: 52px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: rgba(99,102,241,0.2); letter-spacing: -0.04em; line-height: 1; }
        .lp-step-div   { width: 40px; height: 2px; background: rgba(99,102,241,0.35); border-radius: 999px; }
        .lp-step-title { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }
        .lp-step-desc  { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }

        /* ── Final CTA ── */
        .lp-cta-wrap { padding: 32px 24px 96px; }
        .lp-cta-box  {
          max-width: 1160px; margin: 0 auto;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 24px; padding: 80px 48px;
          text-align: center; position: relative; overflow: hidden;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }
        .lp-cta-glow  { position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 600px; height: 500px; pointer-events: none; background: radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.1) 0%, transparent 65%); }
        .lp-cta-title { font-size: clamp(28px, 4vw, 46px); font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); line-height: 1.12; margin-bottom: 18px; position: relative; }
        .lp-cta-sub   { font-size: 15px; color: var(--text-secondary); margin-bottom: 40px; line-height: 1.65; position: relative; }
        .lp-cta-acts  { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; }

        /* ── Footer ── */
        .lp-footer { border-top: 1px solid var(--border); padding: 32px 24px; transition: border-color 0.25s ease; }
        .lp-footer-inner { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .lp-footer-logo  { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .lp-footer-meta  { font-size: 12px; color: var(--text-muted); }
        .lp-footer-stack { font-size: 12px; color: var(--text-muted); text-align: right; }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .lp-mock-stats   { grid-template-columns: repeat(2,1fr); }
          .lp-mock-streaks { grid-template-columns: repeat(2,1fr); }
          .lp-strip-inner  { grid-template-columns: repeat(2,1fr); gap: 32px 0; }
          .lp-strip-item   { border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 28px; }
          .lp-strip-item:nth-child(2n) { border-bottom: none; }
          .lp-features-grid { grid-template-columns: repeat(2,1fr); }
          .lp-habits-grid   { grid-template-columns: 1fr; }
          .lp-steps-grid    { grid-template-columns: 1fr; gap: 40px; }
          .lp-mock-week     { grid-template-columns: repeat(4,1fr); }
          .lp-footer-inner  { flex-direction: column; text-align: center; }
          .lp-footer-stack  { text-align: center; }
        }
        @media (max-width: 640px) {
          .lp-nav { height: 60px; }
          .lp-nav-inner { padding: 0 16px; }
          .lp-nav-toggle { display: inline-flex; }
          .lp-nav-actions {
            display: none;
            position: absolute;
            top: calc(100% + 12px);
            left: 16px;
            right: 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
            background: var(--bg-header-glass);
            backdrop-filter: blur(20px) saturate(160%);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: var(--shadow-lg);
          }
          .lp-nav-actions.open { display: flex; }
          .lp-nav-link,
          .lp-btn-theme,
          .lp-btn-primary {
            width: 100%;
          }
          .lp-nav-link,
          .lp-btn-primary {
            justify-content: center;
          }
          .lp-btn-theme {
            height: 42px;
          }
          .lp-hero          { padding: 120px 16px 64px; }
          .lp-features-grid { grid-template-columns: 1fr; }
          .lp-grades-row    { flex-direction: column; }
          .lp-strip-inner   { grid-template-columns: 1fr 1fr; }
          .lp-cta-box       { padding: 52px 24px; }
          .lp-section       { padding: 64px 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div className="lp-root">

        {/* ══════════════════════════════════════
            NAVBAR
        ══════════════════════════════════════ */}
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
          <div className="lp-nav-inner">
            <span className="lp-logo">🌿 Life Tracker</span>
            <button
              className="lp-nav-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="lp-mobile-menu"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>

            <div className={`lp-nav-actions${mobileMenuOpen ? ' open' : ''}`} id="lp-mobile-menu">
              <button className="lp-nav-link" onClick={() => goTo('/login')}>Sign In</button>

              {/* Theme Toggle */}
              <button
                className="lp-btn-theme"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>

              <button className="lp-btn-primary" onClick={() => goTo('/register')}>Get Started</button>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-inner">
            <div className="lp-badge">🌙 Built for Islamic Lifestyle</div>
            <h1>
              Track Every Habit.<br />
              <span className="accent">Grade Every Day.</span>
            </h1>
            <p className="lp-hero-sub">
              A personal accountability platform for Muslims who want to
              level up their Deen and Dunya — one logged day at a time.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-cta"   onClick={() => goTo('/register')}>Start Tracking Free</button>
              <button className="lp-btn-ghost" onClick={() => goTo('/login')}>Sign In</button>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="lp-mock">
              <div className="lp-mock-topbar">
                <div className="lp-mock-dot" style={{ background: '#ef4444' }} />
                <div className="lp-mock-dot" style={{ background: '#f59e0b' }} />
                <div className="lp-mock-dot" style={{ background: '#22c55e' }} />
                <span className="lp-mock-topbar-ttl">Life Tracker — Dashboard</span>
              </div>
              <div className="lp-mock-body">
                <div className="lp-mock-greeting">
                  Welcome back, Ahmed 👋
                  <span>Sunday, 22 September 2024</span>
                </div>
                <div className="lp-mock-stats">
                  <div className="lp-mock-stat">
                    <div className="lp-mock-stat-lbl">Today's Score</div>
                    <div className="lp-mock-stat-val" style={{ color: '#22c55e' }}>87</div>
                    <span className="lp-mock-badge" style={{ background: '#22c55e' }}>Grade A</span>
                  </div>
                  <div className="lp-mock-stat">
                    <div className="lp-mock-stat-lbl">Monthly Avg</div>
                    <div className="lp-mock-stat-val">71</div>
                    <div className="lp-mock-sub">24 entries logged</div>
                  </div>
                  <div className="lp-mock-stat">
                    <div className="lp-mock-stat-lbl">Avg Mood</div>
                    <div className="lp-mock-stat-val">3.8</div>
                    <div className="lp-mock-sub">out of 5.0</div>
                  </div>
                  <div className="lp-mock-stat">
                    <div className="lp-mock-stat-lbl">Best Day</div>
                    <div className="lp-mock-stat-val" style={{ color: '#6366f1' }}>92</div>
                    <div className="lp-mock-sub">this month</div>
                  </div>
                </div>
                <div className="lp-mock-streaks">
                  {STREAK_MOCK.map(s => (
                    <div key={s.habit} className="lp-mock-streak">
                      <div className="lp-mock-streak-habit">{s.habit}</div>
                      <div className="lp-mock-streak-cnt" style={{ color: s.color }}>{s.count}</div>
                      <div className="lp-mock-streak-days">day streak 🔥</div>
                    </div>
                  ))}
                </div>
                <div className="lp-mock-week-title">This Week</div>
                <div className="lp-mock-week">
                  {WEEKLY_MOCK.map((d, i) => (
                    <div key={d.day} className={`lp-mock-day${i === 6 ? ' active' : ''}`}>
                      <span className="lp-mock-day-lbl">{d.day}</span>
                      <span className="lp-mock-day-score" style={{ color: d.color }}>{d.score}</span>
                      <span className="lp-mock-day-grade">{d.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            STATS STRIP
        ══════════════════════════════════════ */}
        <div className="lp-strip">
          <div className="lp-strip-inner">
            <div className="lp-strip-item"><span className="lp-strip-num">8</span><span className="lp-strip-label">Good habits tracked daily</span></div>
            <div className="lp-strip-item"><span className="lp-strip-num">5</span><span className="lp-strip-label">Bad habits to eliminate</span></div>
            <div className="lp-strip-item"><span className="lp-strip-num">A–F</span><span className="lp-strip-label">Grade calculated instantly</span></div>
            <div className="lp-strip-item"><span className="lp-strip-num">∞</span><span className="lp-strip-label">Days of history, always saved</span></div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            FEATURES
        ══════════════════════════════════════ */}
        <div className="lp-section">
          <div className="lp-split">
            <div>
              <div className="lp-eyebrow">Features</div>
              <h2 className="lp-heading">Everything you need to hold<br />yourself accountable.</h2>
            </div>
            <p className="lp-desc">Built with React, Node.js, and MongoDB — simple, fast, and designed around your real daily life.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature">
                <span className="lp-feature-icon">{f.icon}</span>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            HABIT SHOWCASE
        ══════════════════════════════════════ */}
        <div className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-eyebrow">What You Track</div>
          <h2 className="lp-heading" style={{ marginBottom: '48px' }}>
            Honest about what helps.<br />Honest about what hurts.
          </h2>
          <div className="lp-habits-grid">
            <div className="lp-habits-col">
              <div className="lp-habits-hd" style={{ color: 'var(--success)' }}>
                <span>✅</span> Good Habits
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 'auto' }}>+points</span>
              </div>
              {GOOD_HABITS.map(h => (
                <div key={h.label} className="lp-habit-pill good">
                  <span className="lp-habit-pill-emoji">{h.emoji}</span>
                  <span className="lp-habit-pill-label">{h.label}</span>
                </div>
              ))}
            </div>
            <div className="lp-habits-col">
              <div className="lp-habits-hd" style={{ color: 'var(--danger)' }}>
                <span>❌</span> Bad Habits
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 'auto' }}>−points (×0.5)</span>
              </div>
              {BAD_HABITS.map(h => (
                <div key={h.label} className="lp-habit-pill bad">
                  <span className="lp-habit-pill-emoji">{h.emoji}</span>
                  <span className="lp-habit-pill-label">{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            GRADING SYSTEM
        ══════════════════════════════════════ */}
        <div className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-eyebrow">Scoring System</div>
          <h2 className="lp-heading" style={{ marginBottom: '12px' }}>
            Every day gets a grade.<br />No hiding from your data.
          </h2>
          <p className="lp-desc" style={{ marginBottom: '48px' }}>
            Your net score subtracts bad-habit weight (×0.5) from good-habit percentage. Clean, fair, honest.
          </p>
          <div className="lp-grades-row">
            {GRADES.map(g => (
              <div key={g.grade} className="lp-grade-card" style={{ background: g.bg, borderColor: g.border }}>
                <span className="lp-grade-letter" style={{ color: g.color }}>{g.grade}</span>
                <span className="lp-grade-range">{g.range}</span>
                <span className="lp-grade-desc">{g.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════ */}
        <div className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-eyebrow">How It Works</div>
          <h2 className="lp-heading" style={{ marginBottom: '52px' }}>
            Three minutes a day.<br />Compound results over time.
          </h2>
          <div className="lp-steps-grid">
            {STEPS.map(s => (
              <div key={s.num} className="lp-step">
                <span className="lp-step-num">{s.num}</span>
                <div className="lp-step-div" />
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════ */}
        <div className="lp-cta-wrap">
          <div className="lp-cta-box">
            <div className="lp-cta-glow" aria-hidden="true" />
            <h2 className="lp-cta-title">Build the life you want,<br />one logged day at a time.</h2>
            <p className="lp-cta-sub">Join Life Tracker today. Your streak starts the moment you log your first day.</p>
            <div className="lp-cta-acts">
              <button className="lp-btn-cta"   onClick={() => navigate('/register')}>Create Free Account</button>
              <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Already have an account?</button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            FOOTER
        ══════════════════════════════════════ */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <span className="lp-footer-logo">🌿 Life Tracker</span>
            <span className="lp-footer-meta">© {new Date().getFullYear()} Life Tracker · All rights reserved</span>
            <span className="lp-footer-stack">Life Tracker islamic style</span>
          </div>
        </footer>

      </div>
    </>
  );
}