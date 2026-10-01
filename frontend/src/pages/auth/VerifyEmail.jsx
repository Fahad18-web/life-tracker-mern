import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '../../api/authAPI';
import { useAuth } from '../../contexts/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeVerification } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        const { token: jwt, user, message: msg } = res.data;
        if (jwt && user && completeVerification) {
          completeVerification(jwt, user);
        }
        setStatus('ok');
        setMessage(msg || 'Email verified successfully.');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Invalid or expired verification link.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, completeVerification, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
          <Leaf className="h-6 w-6" />
        </div>

        {status === 'loading' && (
          <p className="text-sm text-[var(--color-text-secondary)]">Verifying your email…</p>
        )}

        {status === 'ok' && (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--color-success)]" />
            <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">Redirecting to dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-3 h-10 w-10 text-[var(--color-danger)]" />
            <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex text-sm font-medium text-[var(--color-brand-400)] no-underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}