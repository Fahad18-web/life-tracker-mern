import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { resendVerification } from '../../api/authAPI';

export default function CheckEmail() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is missing. Register again or open the link from your inbox.');
      return;
    }
    setSending(true);
    try {
      const res = await resendVerification(email);
      toast.success(res.data?.message || 'If an account exists, a new link was sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          We sent a verification link
          {email ? (
            <>
              {' '}
              to <strong className="text-[var(--color-text)]">{email}</strong>
            </>
          ) : null}
          . Verify your email to access LifeTracker.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || !email}
          className="mt-6 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Resend verification link'}
        </button>
        <Link
          to="/login"
          className="mt-4 inline-block text-sm font-medium text-[var(--color-brand-400)] no-underline hover:text-[var(--color-brand-300)]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}