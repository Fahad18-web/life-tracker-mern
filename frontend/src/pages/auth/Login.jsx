import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Seo from '../../components/seo/Seo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-4 py-10">
      <Seo
        title="Sign in"
        description="Sign in to LifeTracker to log habits, track streaks, and view your dashboard."
        path="/login"
        noIndex
      />

      <div className="mx-auto w-full max-w-md flex-1">
        <div className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[var(--color-text)] no-underline"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-600)]/12 text-[var(--color-brand-400)]">
              <Leaf className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold">LifeTracker</span>
          </Link>

          <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Continue building better days — one honest log at a time.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-[var(--radius-control)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[var(--color-brand-400)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Remember me for 14 days
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius-control)] bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-10 border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-[var(--color-brand-400)] hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}