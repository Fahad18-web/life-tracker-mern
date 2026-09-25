import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchPairs, createPair, deletePair } from '../api/habitReplacementAPI';
import { fetchCustomHabits }                  from '../api/customHabitsAPI';

// ── Default habits ────────────────────────────────────────────────
const DEFAULT_BAD = [
  { key: 'social',          label: 'Social Media',      emoji: '📱' },
  { key: 'procrastination', label: 'Procrastination',   emoji: '⏰' },
  { key: 'junk',            label: 'Junk Food',         emoji: '🍔' },
  { key: 'late',            label: 'Sleeping Late',     emoji: '🌙' },
  { key: 'fajr',            label: 'Missing Fajr',      emoji: '🕌' },
];
const DEFAULT_GOOD = [
  { key: 'morning',   label: 'Morning Routine', emoji: '🌅' },
  { key: 'exercise',  label: 'Exercise',        emoji: '🏃' },
  { key: 'reading',   label: 'Quran & Reading', emoji: '📖' },
  { key: 'prayer',    label: 'Daily Prayer',    emoji: '🤲' },
  { key: 'coding',    label: 'Coding',          emoji: '💻' },
  { key: 'sleep',     label: 'Quality Sleep',   emoji: '😴' },
  { key: 'diet',      label: 'Healthy Diet',    emoji: '🥗' },
  { key: 'hydration', label: 'Hydration',       emoji: '💧' },
];

// ── Stat color ────────────────────────────────────────────────────
const rateColor = (r) => r >= 70 ? '#22c55e' : r >= 45 ? '#f59e0b' : '#ef4444';

// ── Last-7 dot ───────────────────────────────────────────────────
const DOT_COLORS = { success: '#22c55e', partial: '#f59e0b', failed: '#ef4444', skip: '#3f3f46' };
const DOT_TITLES = { success: 'Replaced ✓', partial: 'Avoided but no replacement', failed: 'Bad habit done', skip: 'No data' };

// ── Component ─────────────────────────────────────────────────────
export default function HabitReplacementPage() {
  const [pairs,        setPairs]        = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);

  // Form state
  const [selectedBad,  setSelectedBad]  = useState('');
  const [selectedGood, setSelectedGood] = useState('');

  // Build combined option lists
  const badOptions = [
    ...DEFAULT_BAD,
    ...customHabits.filter(h => h.type === 'bad').map(h => ({
      key: h._id, label: h.name, emoji: h.emoji, isCustom: true
    }))
  ];
  const goodOptions = [
    ...DEFAULT_GOOD,
    ...customHabits.filter(h => h.type === 'good').map(h => ({
      key: h._id, label: h.name, emoji: h.emoji, isCustom: true
    }))
  ];

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [pairsRes, habitsRes] = await Promise.allSettled([
          fetchPairs(),
          fetchCustomHabits()
        ]);
        if (pairsRes.status  === 'fulfilled') setPairs(pairsRes.value.data.pairs);
        if (habitsRes.status === 'fulfilled') setCustomHabits(habitsRes.value.data.habits);
      } catch { toast.error('Could not load data.'); }
      finally  { setLoading(false); }
    };
    load();
  }, []);

  // ── Create pair ────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedBad || !selectedGood) return toast.error('Select both habits.');

    const badOpt  = badOptions.find(o => o.key === selectedBad);
    const goodOpt = goodOptions.find(o => o.key === selectedGood);
    if (!badOpt || !goodOpt) return;

    setSaving(true);
    try {
      const res = await createPair({
        badHabit:       badOpt.key,
        badHabitLabel:  badOpt.label,
        badHabitEmoji:  badOpt.emoji,
        isCustomBad:    !!badOpt.isCustom,
        goodHabit:      goodOpt.key,
        goodHabitLabel: goodOpt.label,
        goodHabitEmoji: goodOpt.emoji,
        isCustomGood:   !!goodOpt.isCustom,
      });
      setPairs(p => [...p, { ...res.data.pair, stats: { successRate: 0, streak: 0, last7: [], totalEntries: 0 } }]);
      setSelectedBad('');
      setSelectedGood('');
      toast.success(`Replacement pair added!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add pair.');
    } finally { setSaving(false); }
  };

  // ── Delete pair ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await deletePair(id);
      setPairs(p => p.filter(pair => pair._id !== id));
      toast.success('Pair removed.');
    } catch { toast.error('Could not remove pair.'); }
    finally  { setDeleteId(null); }
  };

  // ── Summary stats ──────────────────────────────────────────────
  const avgSuccess = pairs.length
    ? Math.round(pairs.reduce((s, p) => s + (p.stats?.successRate || 0), 0) / pairs.length) : 0;
  const bestPair   = pairs.length
    ? pairs.reduce((a, b) => (a.stats?.successRate > b.stats?.successRate ? a : b), pairs[0]) : null;

  if (loading) return <div className="page-loader">Loading replacement map…</div>;

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .rm-grid     { display: grid; grid-template-columns: 1fr 1.6fr; gap: 24px; align-items: start; }

        /* ── Form card ── */
        .rm-form-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px;
          display: flex; flex-direction: column; gap: 18px;
          transition: background-color .25s;
        }
        .rm-form-card h2 { font-size: 15px; font-weight: 700; color: var(--text-primary); }

        /* Select */
        .rm-select {
          width: 100%; padding: 10px 14px;
          background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-family: var(--font); font-size: 14px;
          outline: none; cursor: pointer;
          transition: var(--transition);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .rm-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

        /* Arrow between selects */
        .rm-arrow {
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: var(--accent); padding: 4px 0;
        }

        /* ── Summary bar ── */
        .rm-summary {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        .rm-sum-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 14px 16px;
          transition: background-color .25s;
        }
        .rm-sum-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
        .rm-sum-value { font-size: 26px; font-weight: 800; font-family: var(--font-mono); letter-spacing: -.03em; margin-top: 4px; }
        .rm-sum-sub   { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        /* ── Pair cards ── */
        .rm-pairs    { display: flex; flex-direction: column; gap: 12px; }
        .rm-pair-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          transition: background-color .25s, border-color .2s;
        }
        .rm-pair-card:hover { border-color: var(--border-card-hover); }

        /* Pair header row */
        .rm-pair-hd   { display: flex; align-items: center; gap: 10px; }
        .rm-habit-tag {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
        }
        .rm-habit-tag.bad  { background: rgba(239,68,68,.1);  color: #fca5a5; }
        .rm-habit-tag.good { background: rgba(34,197,94,.1);  color: #86efac; }
        .rm-arrow-sm { font-size: 16px; color: var(--accent); flex-shrink: 0; }
        .rm-del-btn  {
          margin-left: auto; background: transparent; border: none;
          color: var(--text-muted); cursor: pointer; font-size: 16px;
          padding: 4px 8px; border-radius: 6px; transition: color .15s;
        }
        .rm-del-btn:hover:not(:disabled) { color: var(--danger); }

        /* Success rate bar */
        .rm-rate-row  { display: flex; align-items: center; gap: 10px; }
        .rm-rate-lbl  { font-size: 12px; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .rm-bar-bg    { flex: 1; height: 6px; background: var(--bg-hover); border-radius: 999px; overflow: hidden; }
        .rm-bar-fill  { height: 100%; border-radius: 999px; transition: width .6s ease; }
        .rm-rate-pct  { font-size: 14px; font-weight: 700; font-family: var(--font-mono); min-width: 36px; text-align: right; }

        /* Stats row */
        .rm-stats-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .rm-stat-item { display: flex; flex-direction: column; gap: 2px; }
        .rm-stat-lbl  { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
        .rm-stat-val  { font-size: 16px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary); }

        /* Last 7 days dots */
        .rm-dots      { display: flex; align-items: center; gap: 5px; margin-left: auto; }
        .rm-dot       { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; cursor: default; }

        /* Empty state */
        .rm-empty {
          background: var(--bg-card); border: 1px dashed var(--border);
          border-radius: var(--radius-lg); padding: 40px 24px;
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 10px;
        }
        .rm-empty-icon { font-size: 36px; }
        .rm-empty-text { font-size: 14px; color: var(--text-muted); }

        /* Limit badge */
        .rm-limit { font-size: 12px; color: var(--text-muted); text-align: right; }

        @media (max-width: 820px) {
          .rm-grid    { grid-template-columns: 1fr; }
          .rm-summary { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .rm-summary { grid-template-columns: 1fr 1fr; }
          .rm-dots    { display: none; }
        }
      `}</style>

      <main className="page">
        <div className="page-header">
          <h1>🔁 Habit Replacement Map</h1>
          <p className="text-muted">Link a bad habit to a good one. Track how often you successfully replace it.</p>
        </div>

        {/* ── Summary ── */}
        {pairs.length > 0 && (
          <div className="rm-summary">
            <div className="rm-sum-card">
              <div className="rm-sum-label">Active Pairs</div>
              <div className="rm-sum-value" style={{ color: 'var(--accent)' }}>{pairs.length}</div>
              <div className="rm-sum-sub">of 8 max</div>
            </div>
            <div className="rm-sum-card">
              <div className="rm-sum-label">Avg Success Rate</div>
              <div className="rm-sum-value" style={{ color: rateColor(avgSuccess) }}>{avgSuccess}%</div>
              <div className="rm-sum-sub">across all pairs</div>
            </div>
            <div className="rm-sum-card">
              <div className="rm-sum-label">Best Pair</div>
              <div className="rm-sum-value" style={{ color: '#22c55e', fontSize: 18, marginTop: 6 }}>
                {bestPair ? `${bestPair.badHabitEmoji}→${bestPair.goodHabitEmoji}` : '—'}
              </div>
              <div className="rm-sum-sub">{bestPair ? `${bestPair.stats?.successRate}% success` : ''}</div>
            </div>
          </div>
        )}

        <div className="rm-grid">
          {/* ── Create form ── */}
          <div className="rm-form-card">
            <h2>➕ New Replacement Pair</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="form-group">
                <label>❌ Bad Habit to Replace</label>
                <select className="rm-select" value={selectedBad} onChange={e => setSelectedBad(e.target.value)} required>
                  <option value="">Select bad habit…</option>
                  <optgroup label="Default Bad Habits">
                    {DEFAULT_BAD.map(h => (
                      <option key={h.key} value={h.key}>{h.emoji} {h.label}</option>
                    ))}
                  </optgroup>
                  {customHabits.filter(h => h.type === 'bad').length > 0 && (
                    <optgroup label="Your Custom Bad Habits">
                      {customHabits.filter(h => h.type === 'bad').map(h => (
                        <option key={h._id} value={h._id}>{h.emoji} {h.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="rm-arrow">↓ replace with</div>

              <div className="form-group">
                <label>✅ Good Habit to Build</label>
                <select className="rm-select" value={selectedGood} onChange={e => setSelectedGood(e.target.value)} required>
                  <option value="">Select good habit…</option>
                  <optgroup label="Default Good Habits">
                    {DEFAULT_GOOD.map(h => (
                      <option key={h.key} value={h.key}>{h.emoji} {h.label}</option>
                    ))}
                  </optgroup>
                  {customHabits.filter(h => h.type === 'good').length > 0 && (
                    <optgroup label="Your Custom Good Habits">
                      {customHabits.filter(h => h.type === 'good').map(h => (
                        <option key={h._id} value={h._id}>{h.emoji} {h.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <button type="submit" className="btn btn-primary"
                disabled={saving || pairs.length >= 8 || !selectedBad || !selectedGood}>
                {saving ? 'Adding…' : 'Add Replacement Pair'}
              </button>
              <div className="rm-limit">{pairs.length}/8 pairs used</div>
            </form>

            {/* Legend */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>HOW SUCCESS IS MEASURED</div>
              {[
                { color: '#22c55e', label: 'Success — bad avoided + good done' },
                { color: '#f59e0b', label: 'Partial — bad avoided, good missed' },
                { color: '#ef4444', label: 'Failed — bad habit done' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pairs list ── */}
          <div>
            {pairs.length === 0 ? (
              <div className="rm-empty">
                <span className="rm-empty-icon">🔁</span>
                <strong style={{ color: 'var(--text-primary)' }}>No replacement pairs yet</strong>
                <p className="rm-empty-text">Add your first pair on the left to start tracking replacement success.</p>
              </div>
            ) : (
              <div className="rm-pairs">
                {pairs.map(pair => {
                  const s = pair.stats || {};
                  const rc = rateColor(s.successRate || 0);
                  return (
                    <div key={pair._id} className="rm-pair-card">

                      {/* Header */}
                      <div className="rm-pair-hd">
                        <span className="rm-habit-tag bad">
                          {pair.badHabitEmoji} {pair.badHabitLabel}
                        </span>
                        <span className="rm-arrow-sm">→</span>
                        <span className="rm-habit-tag good">
                          {pair.goodHabitEmoji} {pair.goodHabitLabel}
                        </span>
                        <button className="rm-del-btn" onClick={() => handleDelete(pair._id)}
                          disabled={deleteId === pair._id} title="Remove pair" aria-label="Remove">
                          {deleteId === pair._id ? '…' : '✕'}
                        </button>
                      </div>

                      {/* Success rate bar */}
                      <div>
                        <div className="rm-rate-row">
                          <span className="rm-rate-lbl">Replacement Rate</span>
                          <div className="rm-bar-bg">
                            <div className="rm-bar-fill"
                              style={{ width: `${s.successRate || 0}%`, background: rc }} />
                          </div>
                          <span className="rm-rate-pct" style={{ color: rc }}>{s.successRate || 0}%</span>
                        </div>
                      </div>

                      {/* Stats + dots */}
                      <div className="rm-stats-row">
                        <div className="rm-stat-item">
                          <span className="rm-stat-lbl">Streak</span>
                          <span className="rm-stat-val" style={{ color: 'var(--warning)' }}>
                            {s.streak || 0} 🔥
                          </span>
                        </div>
                        <div className="rm-stat-item">
                          <span className="rm-stat-lbl">Success Days</span>
                          <span className="rm-stat-val">{s.successDays || 0}</span>
                        </div>
                        <div className="rm-stat-item">
                          <span className="rm-stat-lbl">Total Logged</span>
                          <span className="rm-stat-val">{s.totalEntries || 0}</span>
                        </div>

                        {/* Last 7 dots (newest → oldest, left → right) */}
                        {(s.last7 || []).length > 0 && (
                          <div className="rm-dots" title="Last 7 days (newest → oldest)">
                            {(s.last7 || []).map((status, i) => (
                              <div key={i} className="rm-dot"
                                style={{ background: DOT_COLORS[status] || '#3f3f46' }}
                                title={DOT_TITLES[status] || ''} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* No data hint */}
                      {s.totalEntries === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          Start logging daily to see your replacement stats here.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}