
import { useState } from 'react';
import {
  Plus,
  Settings2,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock3
} from 'lucide-react';
import { useCustomHabits } from '../hooks/useCustomHabits';
import { useNotification } from '../contexts/NotificationContext';

const EMOJI_SUGGESTIONS = {
  good: ['🌅', '🏃', '📖', '🤲', '💻', '😴', '🥗', '💧', '🎯', '📝', '🧘', '🚶', '🌿', '⭐', '🎵', '🏋️'],
  bad: ['📱', '⏰', '🍔', '🌙', '🎮', '☕', '🍺', '😤', '💸', '🛌', '🍕', '🚬']
};

export default function ManageHabits() {
  const { habits, loading, saving, addHabit, removeHabit } = useCustomHabits();
  const { reminderTime, updateReminderTime } = useNotification();

  const [form, setForm] = useState({ name: '', emoji: '⭐', type: 'good' });
  const [deleteId, setDeleteId] = useState(null);

  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits = habits.filter((h) => h.type === 'bad');
  const canAddMore = habits.length < 10;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const ok = await addHabit(form);
    if (ok) setForm({ name: '', emoji: '⭐', type: 'good' });
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    await removeHabit(id);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <Settings2 className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Habits</span>
        </div>

        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Manage Habits
        </h1>

        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Add up to 10 custom habits and set your daily reminder.
        </p>
      </div>

      {/* Habit Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-success)]">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Good</span>
          </div>
          <p className="text-xl font-semibold text-[var(--color-text)]">{goodHabits.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-danger)]">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Bad</span>
          </div>
          <p className="text-xl font-semibold text-[var(--color-text)]">{badHabits.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--color-brand-400)]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-xl font-semibold text-[var(--color-text)]">{habits.length}/10</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Add Habit */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Plus className="h-4 w-4 text-[var(--color-brand-400)]" />
              Add Custom Habit
            </h2>

            <span className="rounded-lg bg-[var(--color-brand-500)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-brand-400)]">
              {habits.length}/10
            </span>
          </div>

          {!canAddMore && (
            <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              Maximum 10 custom habits reached.
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">Type</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'good' })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    form.type === 'good'
                      ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-success)]/40'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Good Habit
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'bad' })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    form.type === 'bad'
                      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:border-[var(--color-danger)]/40'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  Bad Habit
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">Emoji</p>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface)] text-2xl">
                    {form.emoji || '⭐'}
                  </span>

                  <input
                    type="text"
                    value={form.emoji}
                    maxLength={2}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-center text-sm outline-none focus:border-[var(--color-brand-500)]"
                  />

                  <span className="text-xs text-[var(--color-text-muted)]">
                    Choose an emoji
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_SUGGESTIONS[form.type].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm({ ...form, emoji: em })}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition ${
                        form.emoji === em
                          ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10'
                          : 'border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="habit-name"
                className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Habit Name
              </label>

              <div className="flex gap-2">
                <input
                  id="habit-name"
                  name="habitName"
                  type="text"
                  required
                  maxLength={50}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={form.type === 'good' ? 'e.g. Journaling' : 'e.g. Skipping lunch'}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
                />

                <button
                  type="submit"
                  disabled={saving || !canAddMore || !form.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {saving ? '…' : 'Add'}
                </button>
              </div>

              <p className="mt-2 text-right text-xs text-[var(--color-text-muted)]">
                {habits.length}/10 habits used
              </p>
            </div>
          </form>
        </section>

        {/* Habit List */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Your Custom Habits
            </h2>

            <span className="text-xs text-[var(--color-text-muted)]">
              {habits.length} total
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              Loading…
            </p>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-500)]/10">
                <Sparkles className="h-6 w-6 text-[var(--color-brand-400)]" />
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                No custom habits yet. Add one on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {[
                {
                  title: 'Good Habits',
                  items: goodHabits,
                  color: 'var(--color-success)',
                  icon: CheckCircle2
                },
                {
                  title: 'Bad Habits',
                  items: badHabits,
                  color: 'var(--color-danger)',
                  icon: AlertCircle
                }
              ].map(({ title, items, color, icon: Icon }) => (
                items.length > 0 && (
                  <div key={title}>
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color }}
                      >
                        {title}
                      </p>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({items.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {items.map((h) => (
                        <div
                          key={h._id}
                          className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 transition-colors hover:border-[var(--color-brand-500)]/40"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-lg">
                            {h.emoji}
                          </span>

                          <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                            {h.name}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDelete(h._id)}
                            disabled={deleteId === h._id}
                            aria-label={`Delete ${h.name}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Daily Reminder */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-500)]/10">
            <Bell className="h-5 w-5 text-[var(--color-brand-400)]" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Daily Reminder
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Configure your daily logging reminder.
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          A banner appears after this time if you haven&apos;t logged today.
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Clock3 className="h-4 w-4 text-[var(--color-brand-400)]" />
            <label htmlFor="reminder-time" className="text-sm">
              Reminder Time
            </label>
          </div>

          <input
            id="reminder-time"
            name="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => updateReminderTime(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-brand-500)]"
          />

          <span className="text-xs text-[var(--color-text-muted)]">
            Currently <strong className="text-[var(--color-text-secondary)]">{reminderTime}</strong>
          </span>
        </div>
      </section>
    </div>
  );
}
