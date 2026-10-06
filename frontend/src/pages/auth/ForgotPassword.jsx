import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/seo/Seo';
import { forgotPassword } from '../../api/authAPI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      const msg =
        res.data?.message ||
        res.data?.data?.message ||
        'If an account exists, we sent instructions.';
      toast.success(msg);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <Seo title="Forgot password" path="/forgot-password" noIndex />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            We’ll email you a reset link if that account exists.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          {sent ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Check your inbox (and spam). The link expires in 1 hour.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-brand-600)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)] disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link to="/login" className="text-[var(--color-brand-400)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}