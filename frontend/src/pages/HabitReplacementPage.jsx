import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Plus, Trash2, ArrowRight } from 'lucide-react';
import {
  fetchPairs,
  createPair,
  deletePair,
  updatePairRules
} from '../api/habitReplacementAPI';
import { fetchCustomHabits } from '../api/customHabitsAPI';

const DEFAULT_BAD = [
  { key: 'social', label: 'Social Media', emoji: '📱' },
  { key: 'procrastination', label: 'Procrastination', emoji: '⏰' },
  { key: 'junk', label: 'Junk Food', emoji: '🍔' },
  { key: 'late', label: 'Sleeping Late', emoji: '🌙' },
  { key: 'fajr', label: 'Missing Fajr', emoji: '🕌' }
];

const DEFAULT_GOOD = [
  { key: 'morning', label: 'Morning Routine', emoji: '🌅' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
  { key: 'reading', label: 'Quran & Reading', emoji: '📖' },
  { key: 'prayer', label: 'Daily Prayer', emoji: '🤲' },
  { key: 'coding', label: 'Coding', emoji: '💻' },
  { key: 'sleep', label: 'Quality Sleep', emoji: '😴' },
  { key: 'diet', label: 'Healthy Diet', emoji: '🥗' },
  { key: 'hydration', label: 'Hydration', emoji: '💧' }
];

const WINDOW_OPTIONS = [7, 14, 21, 30];

const rateColor = (r) => {
  if (r == null) return 'var(--color-text-muted)';
  return r >= 70
    ? 'var(--color-success)'
    : r >= 45
      ? 'var(--color-warning)'
      : 'var(--color-danger)';
};

const DOT_COLORS = {
  success: '#22c55e',
  partial: '#f59e0b',
  failed: '#ef4444',
  skip: '#3f3f46'
};

export default function HabitReplacementPage() {
  const [pairs, setPairs] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedBad, setSelectedBad] = useState('');
  const [selectedGood, setSelectedGood] = useState('');
  const [windowDays, setWindowDays] = useState(7);
  const [requireBoth, setRequireBoth] = useState(true);
  const [rulesSavingId, setRulesSavingId] = useState(null);

  const badOptions = [
    ...DEFAULT_BAD,
    ...customHabits
      .filter((h) => h.type === 'bad')
      .map((h) => ({
        key: h._id,
        label: h.name,
        emoji: h.emoji || '❌',
        isCustom: true
      }))
  ];

  const goodOptions = [
    ...DEFAULT_GOOD,
    ...customHabits
      .filter((h) => h.type === 'good')
      .map((h) => ({
        key: h._id,
        label: h.name,
        emoji: h.emoji || '✅',
        isCustom: true
      }))
  ];

  const reloadPairs = async () => {
    const res = await fetchPairs();
    setPairs(res.data.pairs || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [pairsRes, habitsRes] = await Promise.allSettled([
          fetchPairs(),
          fetchCustomHabits()
        ]);
        if (pairsRes.status === 'fulfilled') {
          setPairs(pairsRes.value.data.pairs || []);
        }
        if (habitsRes.status === 'fulfilled') {
          setCustomHabits(habitsRes.value.data.habits || []);
        }
      } catch {
        toast.error('Could not load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedBad || !selectedGood) {
      return toast.error('Select both habits.');
    }

    const badOpt = badOptions.find((o) => o.key === selectedBad);
    const goodOpt = goodOptions.find((o) => o.key === selectedGood);
    if (!badOpt || !goodOpt) return;

    setSaving(true);
    try {
      await createPair({
        badHabit: badOpt.key,
        badHabitLabel: badOpt.label,
        badHabitEmoji: badOpt.emoji,
        isCustomBad: !!badOpt.isCustom,
        goodHabit: goodOpt.key,
        goodHabitLabel: goodOpt.label,
        goodHabitEmoji: goodOpt.emoji,
        isCustomGood: !!goodOpt.isCustom,
        rules: {
          windowDays,
          requireBoth,
          minLoggedDays: 1
        }
      });
      await reloadPairs();
      setSelectedBad('');
      setSelectedGood('');
      setWindowDays(7);
      setRequireBoth(true);
      toast.success('Replacement pair added!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add pair.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await deletePair(id);
      setPairs((p) => p.filter((pair) => pair._id !== id));
      toast.success('Pair removed.');
    } catch {
      toast.error('Could not remove pair.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleRulesChange = async (pairId, nextRules) => {
    setRulesSavingId(pairId);
    try {
      await updatePairRules(pairId, nextRules);
      await reloadPairs();
      toast.success('Rules updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update rules');
    } finally {
      setRulesSavingId(null);
    }
  };

  const ratesWithData = pairs
    .map((p) => p.stats?.successRate)
    .filter((r) => r != null && Number.isFinite(r));

  const avgSuccess = ratesWithData.length
    ? Math.round(ratesWithData.reduce((s, r) => s + r, 0) / ratesWithData.length)
    : null;

  const bestPair =
    pairs.length === 0
      ? null
      : pairs.reduce((a, b) => {
          const ar = a.stats?.successRate;
          const br = b.stats?.successRate;
          if (br == null) return a;
          if (ar == null) return b;
          return br > ar ? b : a;
        });

  if (loading) {
    return <div className="page-loader">Loading replacement map…</div>;
  }

  const selectClass =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20';

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <RefreshCw className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Replace</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Habit Replacement Map
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Link a bad habit to a good one. Progress is measured over your chosen window — not a
          single day.
        </p>
      </div>

      {pairs.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Active Pairs
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-[var(--color-brand-400)]">
              {pairs.length}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">of 8 max</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Avg Success
            </p>
            <p
              className="mt-1 font-display text-3xl font-semibold"
              style={{ color: rateColor(avgSuccess) }}
            >
              {avgSuccess == null ? '—' : `${avgSuccess}%`}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Best Pair
            </p>
            <p className="mt-2 text-lg">
              {bestPair
                ? `${bestPair.badHabitEmoji} → ${bestPair.goodHabitEmoji}`
                : '—'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {bestPair?.stats?.successRate != null
                ? `${bestPair.stats.successRate}% · ${bestPair.stats.progressLabel || ''}`
                : bestPair?.stats?.progressLabel || ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Plus className="h-4 w-4" /> New Replacement Pair
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="bad-habit"
                className="mb-1.5 block text-sm text-[var(--color-text-secondary)]"
              >
                Bad Habit
              </label>
              <select
                id="bad-habit"
                value={selectedBad}
                onChange={(e) => setSelectedBad(e.target.value)}
                className={selectClass}
              >
                <option value="">Select bad habit…</option>
                {badOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.emoji} {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-[var(--color-brand-400)]">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div>
              <label
                htmlFor="good-habit"
                className="mb-1.5 block text-sm text-[var(--color-text-secondary)]"
              >
                Good Habit
              </label>
              <select
                id="good-habit"
                value={selectedGood}
                onChange={(e) => setSelectedGood(e.target.value)}
                className={selectClass}
              >
                <option value="">Select good habit…</option>
                {goodOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.emoji} {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="window-days"
                className="mb-1.5 block text-sm text-[var(--color-text-secondary)]"
              >
                Progress window
              </label>
              <select
                id="window-days"
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value))}
                className={selectClass}
              >
                {WINDOW_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    Last {n} days
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                Success % = successful days ÷ window (e.g. 1/7 ≈ 14%).
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={requireBoth}
                onChange={(e) => setRequireBoth(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
              />
              <span>
                Require both: avoid bad habit <strong>and</strong> do good habit
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || pairs.length >= 8}
              className="w-full rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add Pair'}
            </button>
            <p className="text-right text-xs text-[var(--color-text-muted)]">
              {pairs.length}/8 pairs
            </p>
          </form>
        </section>

        <section className="space-y-3">
          {pairs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
              No replacement pairs yet. Create one on the left.
            </div>
          ) : (
            pairs.map((pair) => {
              const rate = pair.stats?.successRate;
              const displayRate = rate == null ? 0 : rate;
              const rules = pair.rules || {};
              const busy = rulesSavingId === pair._id;

              return (
                <div
                  key={pair._id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[var(--color-danger)]/10 px-2.5 py-1 text-sm font-medium text-[var(--color-danger)]">
                      {pair.badHabitEmoji} {pair.badHabitLabel}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--color-brand-400)]" />
                    <span className="rounded-lg bg-[var(--color-success)]/10 px-2.5 py-1 text-sm font-medium text-[var(--color-success)]">
                      {pair.goodHabitEmoji} {pair.goodHabitLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(pair._id)}
                      disabled={deleteId === pair._id}
                      className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                      aria-label="Delete pair"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">Progress</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${displayRate}%`,
                          background: rateColor(rate)
                        }}
                      />
                    </div>
                    <span
                      className="min-w-[40px] text-right text-sm font-semibold"
                      style={{ color: rateColor(rate) }}
                    >
                      {rate == null ? '…' : `${rate}%`}
                    </span>
                  </div>
                  {pair.stats?.progressLabel && (
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      {pair.stats.progressLabel}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <label className="flex items-center gap-1.5">
                      <span>Window</span>
                      <select
                        disabled={busy}
                        value={rules.windowDays || 7}
                        onChange={(e) =>
                          handleRulesChange(pair._id, {
                            ...rules,
                            windowDays: Number(e.target.value)
                          })
                        }
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]"
                      >
                        {WINDOW_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}d
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={rules.requireBoth !== false}
                        onChange={(e) =>
                          handleRulesChange(pair._id, {
                            ...rules,
                            requireBoth: e.target.checked
                          })
                        }
                        className="h-3.5 w-3.5 rounded"
                      />
                      Both required
                    </label>
                    <span>
                      Streak:{' '}
                      <strong className="text-[var(--color-text)]">
                        {pair.stats?.streak || 0}
                      </strong>
                    </span>
                    <span>
                      Logged:{' '}
                      <strong className="text-[var(--color-text)]">
                        {pair.stats?.totalEntries || 0}
                      </strong>
                    </span>
                    <div className="ml-auto flex gap-1">
                      {(pair.stats?.last7 || pair.stats?.lastN || []).map((d, i) => (
                        <span
                          key={i}
                          title={d}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: DOT_COLORS[d] || DOT_COLORS.skip }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}