import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PasswordStrength from '../../components/PasswordStrength';
import { validatePassword } from '../../utils/passwordStrength';
import Seo from '../../components/seo/Seo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      if (data?.requiresVerification) {
        navigate(`/check-email?email=${encodeURIComponent(form.email)}`);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-4 py-10">
      <Seo
        title="Create account"
        description="Create a free LifeTracker account to start daily habit logging, streaks, and habit replacement."
        path="/register"
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Free to start. Verify your email, then log your first day.
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
              htmlFor="register-name"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Full name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Email
            </label>
            <input
              id="register-email"
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
            <label
              htmlFor="register-password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Min 8 characters"
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
            <PasswordStrength password={form.password} />
          </div>

          <button
            type="submit"
            disabled={loading || !validatePassword(form.password).ok}
            className="w-full rounded-[var(--radius-control)] bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-10 border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[var(--color-brand-400)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}