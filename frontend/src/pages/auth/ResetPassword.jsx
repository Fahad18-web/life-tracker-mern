import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/seo/Seo';
import { resetPassword } from '../../api/authAPI';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Missing reset token');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      toast.success(
        res.data?.message || res.data?.data?.message || 'Password updated'
      );
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <Seo title="Reset password" path="/reset-password" noIndex />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Set new password
          </h1>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          {!token ? (
            <p className="text-sm text-[var(--color-danger)]">
              Invalid link. Request a new reset from the sign-in page.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    aria-label="Toggle password"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-brand-600)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)] disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[var(--color-brand-400)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}