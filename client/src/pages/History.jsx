import { useEntries } from '../hooks/useEntries';

const GRADE_COLOR = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

export default function History() {
  const { entries, loading, remove } = useEntries();

  if (loading) return <div className="page-loader">Loading history...</div>;

  return (
    <main className="page">
      <div className="page-header">
        <h1>📜 History</h1>
        <p className="text-muted">{entries.length} entries logged</p>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th><th>Score</th><th>Grade</th><th>Mood</th><th>Notes</th><th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e._id}>
                <td>{e.date}</td>
                <td className="score-cell">{e.netScore}</td>
                <td>
                  <span className="grade-badge" style={{ background: GRADE_COLOR[e.grade] }}>{e.grade}</span>
                </td>
                <td>{['😞','😐','🙂','😊','🤩'][e.mood - 1]}</td>
                <td className="notes-cell">{e.notes?.slice(0, 60) || '—'}{e.notes?.length > 60 ? '...' : ''}</td>
                <td>
                  <button className="btn btn-ghost btn-sm danger"
                    onClick={() => { if (confirm('Delete this entry?')) remove(e._id); }}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && <p className="empty-state">No entries yet. Start logging today! 🌱</p>}
      </div>
    </main>
  );
}
