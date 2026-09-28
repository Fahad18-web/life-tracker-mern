import { useState } from 'react';
import { Plus, Settings2, Bell, Trash2 } from 'lucide-react';
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Add form */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Plus className="h-4 w-4" /> Add Custom Habit
          </h2>

          {!canAddMore && (
            <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              Maximum 10 custom habits reached.
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]">Type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'good' })}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    form.type === 'good'
                      ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Good Habit
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'bad' })}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    form.type === 'bad'
                      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Bad Habit
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]">Emoji</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">{form.emoji || '⭐'}</span>
                <input
                  type="text"
                  value={form.emoji}
                  maxLength={2}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-center text-sm outline-none focus:border-[var(--color-brand-500)]"
                />
                <div className="flex flex-wrap gap-1">
                  {EMOJI_SUGGESTIONS[form.type].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm({ ...form, emoji: em })}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-1 text-base hover:border-[var(--color-brand-500)]"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="habit-name" className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
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
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
                />
                <button
                  type="submit"
                  disabled={saving || !canAddMore || !form.name.trim()}
                  className="rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? '…' : 'Add'}
                </button>
              </div>
              <p className="mt-1.5 text-right text-xs text-[var(--color-text-muted)]">
                {habits.length}/10 habits used
              </p>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Your Custom Habits</h2>

          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              No custom habits yet. Add one on the left.
            </p>
          ) : (
            <div className="space-y-4">
              {goodHabits.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-success)]">
                    Good
                  </p>
                  <div className="space-y-2">
                    {goodHabits.map((h) => (
                      <div
                        key={h._id}
                        className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
                      >
                        <span className="text-lg">{h.emoji}</span>
                        <span className="flex-1 text-sm font-medium text-[var(--color-text)]">{h.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(h._id)}
                          disabled={deleteId === h._id}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {badHabits.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-danger)]">
                    Bad
                  </p>
                  <div className="space-y-2">
                    {badHabits.map((h) => (
                      <div
                        key={h._id}
                        className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
                      >
                        <span className="text-lg">{h.emoji}</span>
                        <span className="flex-1 text-sm font-medium text-[var(--color-text)]">{h.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(h._id)}
                          disabled={deleteId === h._id}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Reminder */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <Bell className="h-4 w-4" /> Daily Reminder
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          A banner appears after this time if you haven&apos;t logged today.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="reminder-time" className="text-sm text-[var(--color-text-secondary)]">
            Reminder Time
          </label>
          <input
            id="reminder-time"
            name="reminderTime"
            type="time"
            value={reminderTime}
            onChange={(e) => updateReminderTime(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-500)]"
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            Currently <strong className="text-[var(--color-text-secondary)]">{reminderTime}</strong>
          </span>
        </div>
      </section>
    </div>
  );
}