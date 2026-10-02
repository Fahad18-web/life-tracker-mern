import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sun,
  Dumbbell,
  BookOpen,
  Hand,
  Code2,
  Moon,
  Salad,
  Droplets,
  Smartphone,
  Clock3,
  Pizza,
  AlarmClock,
  Mosque,
  NotebookPen
} from 'lucide-react';
import { fetchEntryDate, saveEntry } from '../api/entriesAPI';
import { fetchCustomHabits } from '../api/customHabitsAPI';
import { useNotification } from '../contexts/NotificationContext';
import ReplacementCoach from '../components/log/ReplacementCoach';

const TODAY = () => new Date().toISOString().split('T')[0];

const INITIAL_GOOD = {
  morning: false,
  exercise: false,
  reading: false,
  prayer: false,
  coding: false,
  sleep: false,
  diet: false,
  hydration: false
};

const INITIAL_BAD = {
  social: false,
  procrastination: false,
  junk: false,
  late: false,
  fajr: false
};

const GOOD_META = {
  morning: { label: 'Morning Routine', icon: Sun },
  exercise: { label: 'Exercise', icon: Dumbbell },
  reading: { label: 'Quran & Reading', icon: BookOpen },
  prayer: { label: 'Daily Prayer', icon: Hand },
  coding: { label: 'Coding', icon: Code2 },
  sleep: { label: 'Quality Sleep', icon: Moon },
  diet: { label: 'Healthy Diet', icon: Salad },
  hydration: { label: 'Hydration', icon: Droplets }
};

const BAD_META = {
  social: { label: 'Social Media', icon: Smartphone },
  procrastination: { label: 'Procrastination', icon: Clock3 },
  junk: { label: 'Junk Food', icon: Pizza },
  late: { label: 'Sleeping Late', icon: AlarmClock },
  fajr: { label: 'Missing Fajr', icon: Mosque }
};

function calcScore(good, bad, customHabits, customStates) {
  const goodKeys = Object.keys(good);
  const badKeys = Object.keys(bad);
  const goodDone = goodKeys.filter((k) => good[k]).length;
  const badDone = badKeys.filter((k) => bad[k]).length;

  const customGoodTotal = customHabits.filter((h) => h.type === 'good').length;
  const customBadTotal = customHabits.filter((h) => h.type === 'bad').length;
  const customGoodDone = customHabits.filter((h) => h.type === 'good' && customStates[h._id]).length;
  const customBadDone = customHabits.filter((h) => h.type === 'bad' && customStates[h._id]).length;

  const totalGood = goodKeys.length + customGoodTotal;
  const totalBad = badKeys.length + customBadTotal;
  const gs = totalGood > 0 ? ((goodDone + customGoodDone) / totalGood) * 100 : 0;
  const bs = totalBad > 0 ? ((badDone + customBadDone) / totalBad) * 100 : 0;
  return Math.round(gs - bs * 0.5);
}

function scoreColor(score) {
  if (score >= 85) return 'text-[var(--color-success)]';
  if (score >= 70) return 'text-lime-400';
  if (score >= 55) return 'text-[var(--color-warning)]';
  if (score >= 40) return 'text-orange-400';
  return 'text-[var(--color-danger)]';
}

function HabitChip({ active, bad = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition ${active
          ? bad
            ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            : 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]'
        }`}
    >
      {children}
    </button>
  );
}

export default function Log() {
  const { markLogged } = useNotification();
  const navigate = useNavigate();

  const [good, setGood] = useState({ ...INITIAL_GOOD });
  const [bad, setBad] = useState({ ...INITIAL_BAD });
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState('');
  const [customHabits, setCustomHabits] = useState([]);
  const [customStates, setCustomStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);
  const today = TODAY();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [habitsRes, entryRes] = await Promise.allSettled([
        fetchCustomHabits(),
        fetchEntryDate(today)
      ]);

      const habits =
        habitsRes.status === 'fulfilled' ? habitsRes.value.data.habits : [];
      setCustomHabits(habits);

      if (entryRes.status === 'fulfilled' && entryRes.value.data.entry) {
        const e = entryRes.value.data.entry;
        setGood({ ...INITIAL_GOOD, ...e.good });
        setBad({ ...INITIAL_BAD, ...e.bad });
        setMood(e.mood);
        setNotes(e.notes || '');
        setExistingId(e._id);

        const savedMap = Object.fromEntries(
          (e.customHabits || []).map((h) => [h.habitId?.toString(), h.completed])
        );
        setCustomStates(
          Object.fromEntries(habits.map((h) => [h._id, savedMap[h._id] ?? false]))
        );
      } else {
        setCustomStates(Object.fromEntries(habits.map((h) => [h._id, false])));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleGood = (key) => setGood((p) => ({ ...p, [key]: !p[key] }));
  const toggleBad = (key) => setBad((p) => ({ ...p, [key]: !p[key] }));
  const toggleCustom = (id) =>
    setCustomStates((p) => ({ ...p, [id]: !p[id] }));

  const score = calcScore(good, bad, customHabits, customStates);

  const handleSave = async () => {
    setSaving(true);
    try {
      const customHabitsPayload = customHabits.map((h) => ({
        habitId: h._id,
        name: h.name,
        emoji: h.emoji,
        type: h.type,
        completed: customStates[h._id] ?? false
      }));

      await saveEntry({
        date: today,
        good,
        bad,
        mood,
        notes,
        customHabits: customHabitsPayload
      });

      toast.success(existingId ? 'Entry updated ✓' : 'Entry saved ✓');
      markLogged();
      navigate('/dashboard');
    } catch {
      toast.error('Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loader">Loading today's log…</div>;
  }

  const customGood = customHabits.filter((h) => h.type === 'good');
  const customBad = customHabits.filter((h) => h.type === 'bad');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
            <NotebookPen className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Log</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Today's Log
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Live score */}
        <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:mt-0 sm:min-w-[180px] sm:flex-col sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Live Score
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">Updates as you check</p>
          </div>
          <p className={`font-display text-3xl font-semibold ${scoreColor(score)}`}>{score}</p>
        </div>
      </div>
      <ReplacementCoach good={good} bad={bad} customStates={customStates} />
      {/* Good habits */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Good Habits{' '}
          <span className="font-normal text-[var(--color-text-muted)]">— what you did</span>
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(INITIAL_GOOD).map((key) => {
            const Icon = GOOD_META[key].icon;
            return (
              <HabitChip
                key={key}
                active={good[key]}
                onClick={() => toggleGood(key)}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="font-medium">{GOOD_META[key].label}</span>
              </HabitChip>
            );
          })}
        </div>

        {customGood.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Custom Good
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {customGood.map((h) => (
                <HabitChip
                  key={h._id}
                  active={!!customStates[h._id]}
                  onClick={() => toggleCustom(h._id)}
                >
                  <span className="text-base leading-none">{h.emoji}</span>
                  <span className="font-medium">{h.name}</span>
                </HabitChip>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Bad habits */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Bad Habits{' '}
          <span className="font-normal text-[var(--color-text-muted)]">— what you slipped on</span>
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(INITIAL_BAD).map((key) => {
            const Icon = BAD_META[key].icon;
            return (
              <HabitChip
                key={key}
                bad
                active={bad[key]}
                onClick={() => toggleBad(key)}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="font-medium">{BAD_META[key].label}</span>
              </HabitChip>
            );
          })}
        </div>

        {customBad.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Custom Bad
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {customBad.map((h) => (
                <HabitChip
                  key={h._id}
                  bad
                  active={!!customStates[h._id]}
                  onClick={() => toggleCustom(h._id)}
                >
                  <span className="text-base leading-none">{h.emoji}</span>
                  <span className="font-medium">{h.name}</span>
                </HabitChip>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Mood */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Mood</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMood(n)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl transition ${mood === n
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/15 scale-105'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)]'
                }`}
            >
              {['😞', '😕', '😐', '🙂', '😄'][n - 1]}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Notes <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="How was your day? Any reflections…"
          className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
        />
        <p className="mt-1.5 text-right text-xs text-[var(--color-text-muted)]">
          {notes.length}/1000
        </p>
      </section>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : existingId ? '✓ Update Entry' : '✓ Save Entry'}
      </button>
    </div>
  );
}