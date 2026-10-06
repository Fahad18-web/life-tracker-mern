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
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <Seo
        title="Sign in"
        description="Sign in to LifeTracker to log habits, track streaks, and view your dashboard."
        path="/login"
        noIndex
      />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            LifeTracker
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Sign in to continue your journey
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
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

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Password
              </label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)]"
              />
              <label htmlFor="remember-me" className="text-sm text-[var(--color-text-secondary)]">
                Remember me for 14 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)]"
          >
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}