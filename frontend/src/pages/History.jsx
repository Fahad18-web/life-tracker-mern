
import { Trash2, ScrollText, ClipboardList } from 'lucide-react';
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
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        {entries.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <ClipboardList className="h-4 w-4 text-[var(--color-brand-400)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Your activity records
            </span>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-500)]/10">
            <ScrollText className="h-7 w-7 text-[var(--color-brand-400)]" />
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            No entries yet. Start logging today.
          </p>
        </div>
      ) : (
        /* History Table */
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/60 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Score</th>
                  <th className="px-4 py-4 font-semibold">Grade</th>
                  <th className="px-4 py-4 font-semibold">Mood</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                  <th className="px-4 py-4 font-semibold" />
                </tr>
              </thead>

              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e._id}
                    className="border-b border-[var(--color-border)]/70 transition-colors duration-200 last:border-0 hover:bg-[var(--color-bg)]/60"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-[var(--color-text)]">
                      {e.date}
                    </td>

                    <td className="px-4 py-4 font-semibold text-[var(--color-text)]">
                      {e.netScore}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className="inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white"
                        style={{ background: GRADE_COLOR[e.grade] || '#666' }}
                      >
                        {e.grade}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg)] text-lg">
                        {MOOD[e.mood - 1] || '—'}
                      </span>
                    </td>

                    <td className="max-w-[220px] truncate px-4 py-4 text-[var(--color-text-secondary)]">
                      {e.notes?.slice(0, 60) || '—'}
                      {e.notes?.length > 60 ? '…' : ''}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this entry?')) remove(e._id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors duration-200 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-danger)]"
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
        </div>
      )}
    </div>
  );
}
