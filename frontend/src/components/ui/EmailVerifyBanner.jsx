import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { resendVerification } from '../../api/authAPI';

export default function EmailVerifyBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent. Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-b border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-2.5">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-text)]">
          Please verify <strong>{user.email}</strong> to secure your account.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      </div>
    </div>
  );
}