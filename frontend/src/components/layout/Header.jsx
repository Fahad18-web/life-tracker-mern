import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  LayoutDashboard,
  NotebookPen,
  CalendarDays,
  TrendingUp,
  Settings2,
  RefreshCw,
  Sun,
  Moon,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import Avatar from '../Avatar';

const NAV = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/log', label: "Today's Log", icon: NotebookPen },
  { path: '/history', label: 'History', icon: CalendarDays },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/habits', label: 'Habits', icon: Settings2 },
  { path: '/replacements', label: 'Replace', icon: RefreshCw }
];

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hasPendingLog } = useNotification();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const onKey = useCallback((e) => {
    if (e.key === 'Escape') setMenuOpen(false);
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const iconBtn =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-[var(--color-text)] no-underline"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              LifeTracker
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ path, label }) => {
              const active = pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => navigate('/log')}
              className={`relative ${iconBtn}`}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {hasPendingLog && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={iconBtn}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link to="/settings" className={iconBtn} aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Link>

            <Link
              to="/profile"
              className="inline-flex rounded-full no-underline transition hover:scale-105"
              title={user?.name || 'Profile'}
            >
              <Avatar avatar={user?.avatar} name={user?.name} size={36} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className={iconBtn}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)]"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed bottom-0 right-0 top-0 z-[151] flex w-[290px] max-w-[85vw] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
              <span className="font-display text-sm font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 no-underline"
            >
              <Avatar avatar={user?.avatar} name={user?.name} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {user?.email || ''}
                </p>
              </div>
              <User className="ml-auto h-4 w-4 text-[var(--color-text-muted)]" />
            </Link>

            <nav className="flex flex-1 flex-col gap-1 p-3">
              {NAV.map(({ path, label, icon: Icon }) => {
                const active = pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition ${
                      active
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}

              <Link
                to="/settings"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition ${
                  pathname === '/settings'
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              {hasPendingLog && (
                <button
                  type="button"
                  onClick={() => navigate('/log')}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
                >
                  <Bell className="h-4 w-4" />
                  Log pending
                  <span className="ml-auto rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[10px] font-bold text-white">
                    1
                  </span>
                </button>
              )}
            </nav>

            <div className="border-t border-[var(--color-border)] p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}