import { Trash2, ScrollText } from 'lucide-react';
import { useEntries } from '../hooks/useEntries';

const GRADE_COLOR = {
  A: 'var(--color-success)',
  B: '#84cc16',
  C: 'var(--color-warning)',
  D: '#f97316',
  F: 'var(--color-danger)'
};

const MOOD = ['😞', '😐', '🙂', '😊', '🤩'];

export default function History() {
  const { entries, loading, remove } = useEntries();

  if (loading) return <div className="page-loader">Loading history…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <ScrollText className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">History</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Entry History
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} logged
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
          No entries yet. Start logging today.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Mood</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e._id}
                  className="border-b border-[var(--color-border)]/70 last:border-0 hover:bg-[var(--color-bg)]/50"
                >
                  <td className="px-4 py-3 text-[var(--color-text)]">{e.date}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{e.netScore}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ background: GRADE_COLOR[e.grade] || '#666' }}
                    >
                      {e.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lg">{MOOD[e.mood - 1] || '—'}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[var(--color-text-secondary)]">
                    {e.notes?.slice(0, 60) || '—'}
                    {e.notes?.length > 60 ? '…' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this entry?')) remove(e._id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}