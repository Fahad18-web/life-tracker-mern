import { useCallback, useEffect, useState } from 'react';
import { Sunrise, Moon, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRitual, saveRitual } from '../api/ritualAPI';

const TODAY = () => new Date().toISOString().split('T')[0];

const empty = {
  morningPlan: '',
  nightWin: '',
  nightBlocker: '',
  tomorrowTarget: ''
};

export default function DailyRitualCard({ date = TODAY() }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [savingMorning, setSavingMorning] = useState(false);
  const [savingNight, setSavingNight] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getRitual(date);
      const r = res.data?.ritual ?? res.data?.data?.ritual ?? res.data ?? {};
      setForm({
        morningPlan: r.morningPlan || '',
        nightWin: r.nightWin || '',
        nightBlocker: r.nightBlocker || '',
        tomorrowTarget: r.tomorrowTarget || ''
      });
    } catch {
      setForm(empty);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const saveMorning = async (e) => {
    e.preventDefault();
    setSavingMorning(true);
    try {
      const res = await saveRitual(date, { morningPlan: form.morningPlan });
      const r = res.data?.ritual ?? res.data?.data?.ritual;
      if (r) {
        setForm((prev) => ({ ...prev, morningPlan: r.morningPlan || '' }));
      }
      toast.success('Morning plan saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save plan');
    } finally {
      setSavingMorning(false);
    }
  };

  const saveNight = async (e) => {
    e.preventDefault();
    setSavingNight(true);
    try {
      const res = await saveRitual(date, {
        nightWin: form.nightWin,
        nightBlocker: form.nightBlocker,
        tomorrowTarget: form.tomorrowTarget
      });
      const r = res.data?.ritual ?? res.data?.data?.ritual;
      if (r) {
        setForm((prev) => ({
          ...prev,
          nightWin: r.nightWin || '',
          nightBlocker: r.nightBlocker || '',
          tomorrowTarget: r.tomorrowTarget || ''
        }));
      }
      toast.success('Night review saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save review');
    } finally {
      setSavingNight(false);
    }
  };

  const fieldClass =
    'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)]';

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
        Loading ritual…
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Morning */}
      <form
        onSubmit={saveMorning}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
            <Sunrise className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Morning plan
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              One intention for today (2 minutes)
            </p>
          </div>
        </div>
        <label htmlFor="morning-plan" className="text-xs font-medium text-[var(--color-text-secondary)]">
          Today I will…
        </label>
        <textarea
          id="morning-plan"
          rows={2}
          maxLength={300}
          value={form.morningPlan}
          onChange={onChange('morningPlan')}
          placeholder="e.g. Ship focus API + 45 min deep coding"
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={savingMorning}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {savingMorning ? 'Saving…' : 'Save plan'}
        </button>
      </form>

      {/* Night */}
      <form
        onSubmit={saveNight}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Moon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Night review
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Close the day in 2 minutes
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="night-win" className="text-xs font-medium text-[var(--color-text-secondary)]">
              What went well?
            </label>
            <textarea
              id="night-win"
              rows={2}
              maxLength={300}
              value={form.nightWin}
              onChange={onChange('nightWin')}
              placeholder="One win, even small"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="night-blocker" className="text-xs font-medium text-[var(--color-text-secondary)]">
              What got in the way?
            </label>
            <textarea
              id="night-blocker"
              rows={2}
              maxLength={300}
              value={form.nightBlocker}
              onChange={onChange('nightBlocker')}
              placeholder="Distraction, energy, unclear task…"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="tomorrow-target" className="text-xs font-medium text-[var(--color-text-secondary)]">
              Tomorrow&apos;s #1 target
            </label>
            <input
              id="tomorrow-target"
              type="text"
              maxLength={200}
              value={form.tomorrowTarget}
              onChange={onChange('tomorrowTarget')}
              placeholder="Single most important outcome"
              className={fieldClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingNight}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-600)] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {savingNight ? 'Saving…' : 'Save review'}
        </button>
      </form>
    </section>
  );
}