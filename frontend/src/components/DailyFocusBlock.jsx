import { useCallback, useEffect, useState } from 'react';
import { Target, Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFocus, setFocus, toggleFocusItem } from '../api/focusAPI';

const MAX = 3;
const TODAY = () => new Date().toISOString().split('T')[0];

export default function DailyFocusBlock({ date = TODAY() }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getFocus(date);
      const focus = res.data?.focus ?? res.data?.data?.focus ?? res.data;
      setItems(Array.isArray(focus?.items) ? focus.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (nextItems) => {
    setSaving(true);
    try {
      const payload = nextItems.map((it) => ({
        text: it.text,
        completed: Boolean(it.completed)
      }));
      const res = await setFocus(date, payload);
      const focus = res.data?.focus ?? res.data?.data?.focus ?? res.data;
      setItems(Array.isArray(focus?.items) ? focus.items : payload);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save focus');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (items.length >= MAX) {
      toast.error(`Maximum ${MAX} focus items`);
      return;
    }
    setDraft('');
    await persist([...items, { text, completed: false }]);
  };

  const handleRemove = async (id) => {
    const next = items.filter((it) => String(it._id) !== String(id));
    await persist(next);
  };

  const handleToggle = async (it) => {
    if (!it._id) return;
    setSaving(true);
    try {
      const res = await toggleFocusItem(date, it._id, !it.completed);
      const focus = res.data?.focus ?? res.data?.data?.focus ?? res.data;
      setItems(Array.isArray(focus?.items) ? focus.items : items);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update item');
    } finally {
      setSaving(false);
    }
  };

  const done = items.filter((x) => x.completed).length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
        Loading focus…
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      aria-labelledby="daily-focus-title"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="daily-focus-title"
              className="text-sm font-semibold text-[var(--color-text)]"
            >
              Daily focus
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Up to {MAX} must-dos · {done}/{items.length || 0} done
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it._id || it.text}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 px-3 py-2"
          >
            <button
              type="button"
              disabled={saving || !it._id}
              onClick={() => handleToggle(it)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                it.completed
                  ? 'border-[var(--color-success)] bg-[var(--color-success)]/20 text-[var(--color-success)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
              aria-label={it.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {it.completed ? <Check className="h-4 w-4" /> : null}
            </button>
            <span
              className={`min-w-0 flex-1 text-sm ${
                it.completed
                  ? 'text-[var(--color-text-muted)] line-through'
                  : 'text-[var(--color-text)]'
              }`}
            >
              {it.text}
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleRemove(it._id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
              aria-label="Remove focus item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {items.length < MAX && (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <label htmlFor="focus-draft" className="sr-only">
            New focus item
          </label>
          <input
            id="focus-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={120}
            placeholder="e.g. Finish API docs 45 min"
            disabled={saving}
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)]"
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-brand-600)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      )}
    </section>
  );
}