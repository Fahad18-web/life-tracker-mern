import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchEntryDate, saveEntry } from '../api/entriesAPI';
import { fetchCustomHabits } from '../api/customHabitsAPI';
import { useNotification } from '../contexts/NotificationContext';

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

const GOOD_LABELS = {
  morning: '🌅 Morning Routine',
  exercise: '🏃 Exercise',
  reading: '📖 Quran & Reading',
  prayer: '🤲 Daily Prayer',
  coding: '💻 Coding',
  sleep: '😴 Quality Sleep',
  diet: '🥗 Healthy Diet',
  hydration: '💧 Hydration'
};

const BAD_LABELS = {
  social: '📱 Social Media',
  procrastination: '⏰ Procrastination',
  junk: '🍔 Junk Food',
  late: '🌙 Sleeping Late',
  fajr: '🕌 Missing Fajr'
};

function calcScore(good, bad, customHabits, customStates) {
  const goodKeys = Object.keys(good);
  const badKeys = Object.keys(bad);
  const goodDone = goodKeys.filter(k => good[k]).length;
  const badDone = badKeys.filter(k => bad[k]).length;

  const customGoodTotal = customHabits.filter(h => h.type === 'good').length;
  const customBadTotal = customHabits.filter(h => h.type === 'bad').length;
  const customGoodDone = customHabits.filter(h => h.type === 'good' && customStates[h._id]).length;
  const customBadDone = customHabits.filter(h => h.type === 'bad' && customStates[h._id]).length;

  const totalGood = goodKeys.length + customGoodTotal;
  const totalBad = badKeys.length + customBadTotal;
  const gs = totalGood > 0 ? (goodDone + customGoodDone) / totalGood * 100 : 0;
  const bs = totalBad > 0 ? (badDone + customBadDone) / totalBad * 100 : 0;
  return Math.round(gs - bs * 0.5);
}

function gradeColor(score) {
  if (score >= 85) return 'var(--success)';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return 'var(--warning)';
  if (score >= 40) return '#f97316';
  return 'var(--danger)';
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

      const habits = habitsRes.status === 'fulfilled'
        ? habitsRes.value.data.habits
        : [];
      setCustomHabits(habits);

      if (entryRes.status === 'fulfilled' && entryRes.value.data.entry) {
        const e = entryRes.value.data.entry;
        setGood({ ...INITIAL_GOOD, ...e.good });
        setBad({ ...INITIAL_BAD, ...e.bad });
        setMood(e.mood);
        setNotes(e.notes || '');
        setExistingId(e._id);

        const savedMap = Object.fromEntries(
          (e.customHabits || []).map(h => [h.habitId?.toString(), h.completed])
        );
        setCustomStates(
          Object.fromEntries(habits.map(h => [h._id, savedMap[h._id] ?? false]))
        );
      } else {
        setCustomStates(Object.fromEntries(habits.map(h => [h._id, false])));
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

  const toggleGood = (key) => {
    setGood(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBad = (key) => {
    setBad(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCustom = (id) => {
    setCustomStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const score = calcScore(good, bad, customHabits, customStates);

  const handleSave = async () => {
    setSaving(true);
    try {
      const customHabitsPayload = customHabits.map(h => ({
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

  const customGood = customHabits.filter(h => h.type === 'good');
  const customBad = customHabits.filter(h => h.type === 'bad');

  return (
    <main className="page">
      <div className="page-header">
        <h1>📝 Today's Log</h1>
        <p className="text-muted">
          {new Date().toLocaleDateString('en-PK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Live Score */}
      <div className="live-score-card">
        <div>
          <div className="live-score-label">Live Score</div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
            Updates as you check habits
          </div>
        </div>
        <div className="live-score-value" style={{ color: gradeColor(score) }}>
          {score}
        </div>
      </div>

      <div className="log-form">
        {/* Good Habits */}
        <div className="log-section">
          <div className="section-title">
            ✅ Good Habits{' '}
            <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
              — check what you did
            </span>
          </div>
          <div className="habits-grid">
            {Object.keys(INITIAL_GOOD).map(key => (
              <div
                key={key}
                role="button"
                tabIndex={0}
                className={`habit-toggle ${good[key] ? 'checked' : ''}`}
                onClick={() => toggleGood(key)}
                onKeyDown={(e) => e.key === 'Enter' && toggleGood(key)}
              >
                <span>{GOOD_LABELS[key]}</span>
              </div>
            ))}
          </div>

          {customGood.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                  letterSpacing: '0.04em'
                }}
              >
                CUSTOM GOOD HABITS
              </div>
              <div className="habits-grid">
                {customGood.map(h => (
                  <div
                    key={h._id}
                    role="button"
                    tabIndex={0}
                    className={`habit-toggle ${customStates[h._id] ? 'checked' : ''}`}
                    onClick={() => toggleCustom(h._id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCustom(h._id)}
                  >
                    <span>
                      {h.emoji} {h.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bad Habits */}
        <div className="log-section">
          <div className="section-title">
            ❌ Bad Habits{' '}
            <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
              — check what you did
            </span>
          </div>
          <div className="habits-grid">
            {Object.keys(INITIAL_BAD).map(key => (
              <div
                key={key}
                role="button"
                tabIndex={0}
                className={`habit-toggle bad ${bad[key] ? 'checked' : ''}`}
                onClick={() => toggleBad(key)}
                onKeyDown={(e) => e.key === 'Enter' && toggleBad(key)}
              >
                <span>{BAD_LABELS[key]}</span>
              </div>
            ))}
          </div>

          {customBad.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                  letterSpacing: '0.04em'
                }}
              >
                CUSTOM BAD HABITS
              </div>
              <div className="habits-grid">
                {customBad.map(h => (
                  <div
                    key={h._id}
                    role="button"
                    tabIndex={0}
                    className={`habit-toggle bad ${customStates[h._id] ? 'checked' : ''}`}
                    onClick={() => toggleCustom(h._id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCustom(h._id)}
                  >
                    <span>
                      {h.emoji} {h.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mood */}
        <div className="log-section">
          <div className="section-title">😊 Mood</div>
          <div className="mood-picker">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`mood-btn ${mood === n ? 'selected' : ''}`}
                onClick={() => setMood(n)}
              >
                {['😞', '😕', '😐', '🙂', '😄'][n - 1]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="log-section">
          <div className="section-title">📝 Notes (optional)</div>
          <textarea
            className="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your day? Any reflections…"
            maxLength={1000}
          />
          <div className="char-count">{notes.length}/1000</div>
        </div>

        {/* Save */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : existingId ? '✓ Update Entry' : '✓ Save Entry'}
        </button>
      </div>
    </main>
  );
}