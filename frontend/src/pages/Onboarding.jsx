import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, ArrowRight, Check } from 'lucide-react';
import { createPair } from '../api/habitReplacementAPI';
import { completeOnboarding } from '../api/userAPI';
import { useAuth } from '../contexts/AuthContext';

const STEPS = ['Welcome', 'Replace', 'Log'];

const QUICK_BAD = [
  { key: 'social', label: 'Social Media', emoji: '📱' },
  { key: 'procrastination', label: 'Procrastination', emoji: '⏰' },
  { key: 'late', label: 'Sleeping Late', emoji: '🌙' }
];

const QUICK_GOOD = [
  { key: 'reading', label: 'Quran & Reading', emoji: '📖' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
  { key: 'morning', label: 'Morning Routine', emoji: '🌅' }
];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bad, setBad] = useState(QUICK_BAD[0].key);
  const [good, setGood] = useState(QUICK_GOOD[0].key);
  const [busy, setBusy] = useState(false);

  const markDone = async () => {
    const res = await completeOnboarding();
    const next = res.data.user;
    if (next) updateUser(next);
  };

  const finish = async ({ withPair, goTo }) => {
    setBusy(true);
    try {
      if (withPair) {
        const b = QUICK_BAD.find((x) => x.key === bad);
        const g = QUICK_GOOD.find((x) => x.key === good);
        try {
          await createPair({
            badHabit: b.key,
            badHabitLabel: b.label,
            badHabitEmoji: b.emoji,
            isCustomBad: false,
            goodHabit: g.key,
            goodHabitLabel: g.label,
            goodHabitEmoji: g.emoji,
            isCustomGood: false,
            rules: { windowDays: 7, requireBoth: true, minLoggedDays: 1 }
          });
        } catch (err) {
          if (err?.response?.status !== 400) throw err;
        }
      }

      await markDone();
      toast.success('You are set. Log today when ready.');
      navigate(goTo, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not finish setup');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-[var(--color-brand-400)]">
          <Leaf className="h-5 w-5" />
          <span className="text-sm font-semibold">LifeTracker setup</span>
        </div>

        <div className="mb-6 flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  i <= step ? 'bg-[var(--color-brand-600)]' : 'bg-[var(--color-border)]'
                }`}
              />
              <p className="mt-1.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                {label}
              </p>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
              Track habits. Replace the ones that hold you back.
            </h1>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Each day, log what you did well and where you slipped. Link one bad habit to one
              good habit — progress is measured over days, not a single checkbox.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
              Pick your first replacement pair
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              You can add more later under Replacements.
            </p>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Bad habit
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_BAD.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setBad(o.key)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      bad === o.key
                        ? 'border-[var(--color-danger)]/50 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Replace with
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_GOOD.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setGood(o.key)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      good === o.key
                        ? 'border-[var(--color-success)]/50 bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => finish({ withPair: true, goTo: '/log' })}
                className="flex-1 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save pair & go to log'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep(2)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
              Log once a day
            </h2>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                Tick good habits you did and bad ones you slipped on.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                Replacement pairs update when you avoid the bad and do the good.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                Miss a day? Come back — no shame, just start again.
              </li>
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={() => finish({ withPair: false, goTo: '/log' })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Finishing…' : 'Go to today’s log'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => finish({ withPair: false, goTo: '/dashboard' })}
              className="w-full text-center text-xs text-[var(--color-brand-400)]"
            >
              Open dashboard instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}