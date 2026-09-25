import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation }   from 'react-router-dom';
import { useAuth }         from '../../contexts/AuthContext';
import { useTheme }        from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

const NAV = [
  { path: '/dashboard',   label: 'Overview'    },
  { path: '/log',         label: "Today's Log" },
  { path: '/history',     label: 'History'     },
  { path: '/trends',      label: 'Trends'      },
  { path: '/habits',      label: 'Habits'      },
  { path: '/replacements', label: 'Replace'    },
];

const NAV_MOB = [
  { path: '/dashboard',    label: '🏠 Overview'    },
  { path: '/log',          label: "📝 Today's Log" },
  { path: '/history',      label: '📅 History'     },
  { path: '/trends',       label: '📈 Trends'      },
  { path: '/habits',       label: '⚙️ Habits'      },
  { path: '/replacements', label: '🔁 Replace'     },
];

/* ── Icons ── */
const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ── Component ── */
export default function Header() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hasPendingLog }      = useNotification();
  const { pathname }           = useLocation();
  const navigate               = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Escape key + body scroll lock
  const onKey = useCallback((e) => { if (e.key === 'Escape') setMenuOpen(false); }, []);
  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, onKey]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <style>{`
        /* ── Icon button (shared) ── */
        .hdr-icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; padding: 0;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          flex-shrink: 0;
        }
        .hdr-icon-btn:hover { color: var(--text-primary); background: var(--bg-hover); border-color: var(--border-hover); }
        .hdr-icon-btn svg   { display: block; }

        /* ── Bell dot ── */
        .bell-wrap { position: relative; display: inline-flex; }
        .bell-dot  {
          position: absolute; top: 3px; right: 3px;
          width: 7px; height: 7px;
          background: var(--danger); border-radius: 50%;
          border: 1.5px solid var(--bg-primary);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }

        /* ── Desktop right section (hidden on mobile) ── */
        .hdr-desktop { display: flex; align-items: center; gap: 8px; margin-left: auto; }

        /* ── Mobile right section (hidden on desktop) ── */
        .hdr-mobile { display: none; align-items: center; gap: 8px; margin-left: auto; }

        /* ── Profile Avatar (desktop + mobile drawer) ── */
        .hdr-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-glow);
          border: 1.5px solid var(--accent);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: var(--accent);
          text-decoration: none; cursor: pointer;
          transition: var(--transition);
        }
        .hdr-avatar:hover {
          background: rgba(99,102,241,0.22);
          border-color: var(--accent-hover);
          transform: scale(1.08);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        /* ── Clickable user pill in mobile drawer ── */
        .mob-user {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-bottom: 1px solid var(--border);
          flex-shrink: 0; text-decoration: none;
          transition: background .15s;
        }
        .mob-user:hover { background: var(--bg-hover); }
        .mob-user-arrow {
          margin-left: auto; font-size: 13px;
          color: var(--text-muted); flex-shrink: 0;
        }

        /* ── Hamburger ── */
        .hamburger {
          display: inline-flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 5px;
          width: 34px; height: 34px; padding: 0;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer; flex-shrink: 0;
          transition: border-color 0.2s;
        }
        .hamburger:hover { border-color: var(--border-hover); }
        .h-bar {
          width: 16px; height: 2px;
          background: var(--text-primary); border-radius: 2px;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s;
          transform-origin: center;
        }
        .hamburger.open .h-bar:nth-child(1) { transform: translateY(7px) rotate(45deg);  }
        .hamburger.open .h-bar:nth-child(2) { opacity: 0; transform: scaleX(0);          }
        .hamburger.open .h-bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── Switch at 768px ── */
        @media (max-width: 768px) {
          .nav         { display: none !important; }
          .hdr-desktop { display: none !important; }
          .hdr-mobile  { display: flex !important; }
        }

        /* ── Backdrop ── */
        .mob-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px);
          z-index: 150;
          animation: bdIn .22s ease;
        }
        @keyframes bdIn { from{opacity:0} to{opacity:1} }

        /* ── Drawer ── */
        .mob-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 290px; max-width: 85vw;
          background: var(--bg-card);
          border-left: 1px solid var(--border);
          box-shadow: -10px 0 36px rgba(0,0,0,0.3);
          z-index: 151;
          display: flex; flex-direction: column;
          overflow-y: auto;
          animation: drawerIn .28s cubic-bezier(.4,0,.2,1);
          transition: background-color .25s ease;
        }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

        /* Drawer header row */
        .mob-dwr-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px; height: 60px; flex-shrink: 0;
          border-bottom: 1px solid var(--border);
        }
        .mob-dwr-logo { font-size: 15px; font-weight: 700; color: var(--text-primary); text-decoration: none; }
        .mob-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: transparent; color: var(--text-secondary);
          font-size: 16px; cursor: pointer; transition: var(--transition);
        }
        .mob-close:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* User pill */
        .mob-user {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .mob-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--accent-glow); border: 1.5px solid var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: var(--accent); flex-shrink: 0;
        }
        .mob-uname { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .mob-uemail{ font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        /* Nav links */
        .mob-nav { display: flex; flex-direction: column; gap: 2px; padding: 10px 10px; flex: 1; }
        .mob-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 500;
          color: var(--text-secondary); text-decoration: none;
          transition: var(--transition); position: relative;
        }
        .mob-link:hover  { color: var(--text-primary); background: var(--bg-hover); }
        .mob-link.active { color: var(--text-primary); background: var(--bg-secondary); font-weight: 600; }
        .mob-link.active::before {
          content: ''; position: absolute; left: 0;
          top: 50%; transform: translateY(-50%);
          width: 3px; height: 20px;
          background: var(--accent); border-radius: 0 2px 2px 0;
        }

        /* Notification row */
        .mob-notif {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; transition: var(--transition);
        }
        .mob-notif:hover { background: var(--bg-hover); color: var(--text-primary); }
        .mob-notif-badge {
          margin-left: auto;
          background: var(--danger); color: #fff;
          font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 999px;
        }

        /* Footer */
        .mob-footer { padding: 10px; border-top: 1px solid var(--border); flex-shrink: 0; }
        .mob-action {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 13px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 500; color: var(--text-secondary);
          background: transparent; border: none; font-family: var(--font);
          width: 100%; cursor: pointer; transition: var(--transition); text-align: left;
        }
        .mob-action:hover { background: var(--bg-hover); color: var(--text-primary); }
        .mob-action-lbl { display: flex; align-items: center; gap: 10px; }
        .mob-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; color: var(--danger);
          background: transparent; border: none; font-family: var(--font);
          width: 100%; cursor: pointer; transition: var(--transition);
        }
        .mob-logout:hover { background: rgba(239,68,68,0.09); }
      `}</style>

      {/* ════════════════════════════
          HEADER BAR
      ════════════════════════════ */}
      <header className="header">
        <div className="header-inner">

          <Link to="/dashboard" className="logo">🌿 LifeTracker</Link>

          {/* Desktop nav */}
          <nav className="nav">
            {NAV.map(n => (
              <Link key={n.path} to={n.path}
                className={`nav-link ${pathname === n.path ? 'active' : ''}`}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* ── DESKTOP right actions (hidden ≤768px) ── */}
          <div className="hdr-desktop">
            <Link to="/profile" className="hdr-avatar" title={`${user?.name} — View Profile`} aria-label="View Profile">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </Link>

            <div className="bell-wrap">
              <button className="hdr-icon-btn" onClick={() => navigate('/log')}
                title={hasPendingLog ? "Haven't logged today!" : "Today's Log"}
                aria-label="Today's Log">
                <BellIcon />
              </button>
              {hasPendingLog && <span className="bell-dot" aria-hidden="true" />}
            </div>

            <button className="hdr-icon-btn" onClick={toggleTheme}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              aria-label="Toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Logout
            </button>
          </div>

          {/* ── MOBILE right actions (hidden >768px) ── */}
          <div className="hdr-mobile">
            <div className="bell-wrap">
              <button className="hdr-icon-btn" onClick={() => navigate('/log')}
                title="Today's Log" aria-label="Today's Log">
                <BellIcon />
              </button>
              {hasPendingLog && <span className="bell-dot" aria-hidden="true" />}
            </div>

            <button
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}>
              <span className="h-bar" />
              <span className="h-bar" />
              <span className="h-bar" />
            </button>
          </div>

        </div>
      </header>

      {/* ════════════════════════════
          MOBILE DRAWER
      ════════════════════════════ */}
      {menuOpen && (
        <>
          <div className="mob-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />

          <aside className="mob-drawer" role="dialog" aria-modal="true" aria-label="Navigation">

            {/* Header */}
            <div className="mob-dwr-hd">
              <Link to="/dashboard" className="mob-dwr-logo">🌿 LifeTracker</Link>
              <button className="mob-close" onClick={() => setMenuOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* User pill → clickable to /profile */}
            <Link to="/profile" className="mob-user" aria-label="View Profile">
              <div className="mob-avatar">{user?.name?.charAt(0).toUpperCase() ?? 'U'}</div>
              <div>
                <div className="mob-uname">{user?.name}</div>
                <div className="mob-uemail">Tap to view profile</div>
              </div>
              <span className="mob-user-arrow">›</span>
            </Link>

            {/* Nav */}
            <nav className="mob-nav">
              {NAV_MOB.map(n => (
                <Link key={n.path} to={n.path}
                  className={`mob-link ${pathname === n.path ? 'active' : ''}`}>
                  {n.label}
                </Link>
              ))}

              <div className="mob-notif" onClick={() => { navigate('/log'); setMenuOpen(false); }}>
                <BellIcon />
                <span>Daily Reminder</span>
                {hasPendingLog && <span className="mob-notif-badge">Log Now</span>}
              </div>
            </nav>

            {/* Footer */}
            <div className="mob-footer">
              <button className="mob-action" onClick={toggleTheme}>
                <span className="mob-action-lbl">
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </span>
              </button>
              <button className="mob-logout" onClick={handleLogout}>
                <LogoutIcon /> Logout
              </button>
            </div>

          </aside>
        </>
      )}
    </>
  );
}