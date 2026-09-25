import { useState } from 'react';
import { useCustomHabits }  from '../hooks/useCustomHabits';
import { useNotification }  from '../contexts/NotificationContext';

const EMOJI_SUGGESTIONS = {
  good: ['🌅','🏃','📖','🤲','💻','😴','🥗','💧','🎯','📝','🧘','🚶','🌿','⭐','🎵','🏋️'],
  bad:  ['📱','⏰','🍔','🌙','🎮','☕','🍺','😤','💸','🛌','🍕','🚬']
};

export default function ManageHabits() {
  const { habits, loading, saving, addHabit, removeHabit } = useCustomHabits();
  const { reminderTime, updateReminderTime } = useNotification();

  const [form, setForm]         = useState({ name: '', emoji: '⭐', type: 'good' });
  const [deleteId, setDeleteId] = useState(null);

  const goodHabits   = habits.filter(h => h.type === 'good');
  const badHabits    = habits.filter(h => h.type === 'bad');
  const canAddMore   = habits.length < 10;

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
    <>
      <style>{`
        .mh-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .mh-card   { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; transition: background-color 0.25s ease; }
        .mh-card h3 { font-size: 15px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

        /* Form */
        .mh-form          { display: flex; flex-direction: column; gap: 14px; }
        .mh-type-tabs     { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .mh-type-tab      { padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: all 0.15s; }
        .mh-type-tab.good.active { background: rgba(34,197,94,0.12);  border-color: rgba(34,197,94,0.4);  color: var(--success); }
        .mh-type-tab.bad.active  { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.4);  color: var(--danger);  }

        .mh-emoji-row    { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .mh-emoji-preview { font-size: 28px; flex-shrink: 0; }
        .mh-emoji-input  { width: 68px; text-align: center; font-size: 18px; }
        .mh-emoji-pills  { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; }
        .mh-emoji-pill   { font-size: 18px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px; padding: 4px 6px; cursor: pointer; transition: background 0.1s; }
        .mh-emoji-pill:hover { background: var(--bg-card); border-color: var(--accent); }

        .mh-name-row     { display: flex; gap: 8px; }
        .mh-name-row input { flex: 1; }
        .mh-limit        { font-size: 12px; color: var(--text-muted); text-align: right; }

        /* Habit list */
        .mh-list         { display: flex; flex-direction: column; gap: 8px; }
        .mh-habit-row    { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); transition: background-color 0.2s; }
        .mh-habit-emoji  { font-size: 18px; flex-shrink: 0; }
        .mh-habit-name   { font-size: 14px; font-weight: 500; color: var(--text-primary); flex: 1; }
        .mh-habit-type   { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .mh-habit-type.good { background: rgba(34,197,94,0.12); color: var(--success); }
        .mh-habit-type.bad  { background: rgba(239,68,68,0.12);  color: var(--danger);  }
        .mh-habit-del    { background: transparent; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: color 0.15s; }
        .mh-habit-del:hover { color: var(--danger); }
        .mh-empty        { text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px; }

        /* Reminder */
        .mh-reminder     { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .mh-reminder input[type="time"] { width: auto; padding: 8px 12px; }
        .mh-reminder-hint { font-size: 12px; color: var(--text-muted); }

        @media (max-width: 720px) { .mh-grid { grid-template-columns: 1fr; } }
      `}</style>

      <main className="page">
        <div className="page-header">
          <h1>⚙️ Manage Habits</h1>
          <p className="text-muted">Add up to 10 custom habits and configure your daily reminder.</p>
        </div>

        <div className="mh-grid">
          {/* ── Add New Habit ── */}
          <div className="mh-card">
            <h3>➕ Add Custom Habit</h3>
            {!canAddMore && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                Maximum 10 custom habits reached. Delete one to add another.
              </div>
            )}
            <form className="mh-form" onSubmit={handleAdd}>

              {/* Type selector */}
              <div className="form-group">
                <label>Type</label>
                <div className="mh-type-tabs">
                  <button type="button"
                    className={`mh-type-tab good ${form.type === 'good' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, type: 'good' })}>
                    ✅ Good Habit
                  </button>
                  <button type="button"
                    className={`mh-type-tab bad ${form.type === 'bad' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, type: 'bad' })}>
                    ❌ Bad Habit
                  </button>
                </div>
              </div>

              {/* Emoji picker */}
              <div className="form-group">
                <label>Emoji</label>
                <div className="mh-emoji-row">
                  <span className="mh-emoji-preview">{form.emoji || '⭐'}</span>
                  <input
                    className="mh-emoji-input"
                    type="text"
                    value={form.emoji}
                    onChange={e => setForm({ ...form, emoji: e.target.value })}
                    placeholder="⭐"
                    maxLength={2}
                  />
                  <div className="mh-emoji-pills">
                    {EMOJI_SUGGESTIONS[form.type].map(em => (
                      <button key={em} type="button" className="mh-emoji-pill"
                        onClick={() => setForm({ ...form, emoji: em })}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>Habit Name</label>
                <div className="mh-name-row">
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={form.type === 'good' ? 'e.g. Journaling' : 'e.g. Skipping lunch'}
                    maxLength={50}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || !canAddMore || !form.name.trim()}>
                    {saving ? '…' : 'Add'}
                  </button>
                </div>
                <div className="mh-limit">{habits.length}/10 habits used</div>
              </div>
            </form>
          </div>

          {/* ── Current Custom Habits ── */}
          <div className="mh-card">
            <h3>📋 Your Custom Habits</h3>
            {loading ? (
              <div className="mh-empty">Loading habits…</div>
            ) : habits.length === 0 ? (
              <div className="mh-empty">No custom habits yet.<br />Add one on the left!</div>
            ) : (
              <>
                {goodHabits.length > 0 && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ✅ Good Habits
                    </p>
                    <div className="mh-list" style={{ marginBottom: 16 }}>
                      {goodHabits.map(h => (
                        <div key={h._id} className="mh-habit-row">
                          <span className="mh-habit-emoji">{h.emoji}</span>
                          <span className="mh-habit-name">{h.name}</span>
                          <span className="mh-habit-type good">good</span>
                          <button className="mh-habit-del"
                            onClick={() => handleDelete(h._id)}
                            disabled={deleteId === h._id}
                            title="Remove habit">
                            {deleteId === h._id ? '…' : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {badHabits.length > 0 && (
                  <>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ❌ Bad Habits
                    </p>
                    <div className="mh-list">
                      {badHabits.map(h => (
                        <div key={h._id} className="mh-habit-row">
                          <span className="mh-habit-emoji">{h.emoji}</span>
                          <span className="mh-habit-name">{h.name}</span>
                          <span className="mh-habit-type bad">bad</span>
                          <button className="mh-habit-del"
                            onClick={() => handleDelete(h._id)}
                            disabled={deleteId === h._id}
                            title="Remove habit">
                            {deleteId === h._id ? '…' : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Reminder Time Settings ── */}
        <div className="mh-card">
          <h3>🔔 Daily Reminder</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            A reminder banner will appear in the app after this time if you haven't logged today.
          </p>
          <div className="mh-reminder">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => updateReminderTime(e.target.value)}
              />
            </div>
            <p className="mh-reminder-hint">
              Currently set to <strong>{reminderTime}</strong>. Changes are saved automatically.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}