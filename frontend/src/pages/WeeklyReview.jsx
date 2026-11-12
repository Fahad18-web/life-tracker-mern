import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  fetchWeeklyReview,
  saveWeeklyReview
} from '../api/weeklyReviewAPI';

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

/** ISO week number (UTC), for display only */
function isoWeekParts(weekStart) {
  const d = new Date(`${weekStart}T12:00:00.000Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return {
    year: d.getUTCFullYear(),
    week: weekNo
  };
}

function formatRange(start, end) {
  const a = new Date(`${start}T12:00:00.000Z`);
  const b = new Date(`${end}T12:00:00.000Z`);
  const opts = { month: 'short', day: 'numeric' };
  return `${a.toLocaleDateString('en-PK', opts)} – ${b.toLocaleDateString(
    'en-PK',
    { ...opts, year: 'numeric' }
  )}`;
}

const PROMPTS = [
  {
    key: 'wentWell',
    label: 'What went well this week?',
    placeholder: 'Wins, consistency, moments you are proud of…'
  },
  {
    key: 'challenges',
    label: 'What challenges did I face?',
    placeholder: 'Friction, slips, energy, time…'
  },
  {
    key: 'improve',
    label: 'What should I improve next week?',
    placeholder: 'One or two concrete adjustments…'
  },
  {
    key: 'priority',
    label: 'What is my main priority for next week?',
    placeholder: 'The single focus that matters most…'
  }
];

export default function WeeklyReview() {
  const [weekStart, setWeekStart] = useState(null);
  const [weekEnd, setWeekEnd] = useState(null);
  const [overview, setOverview] = useState(null);
  const [form, setForm] = useState({
    wentWell: '',
    challenges: '',
    improve: '',
    priority: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (ws) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWeeklyReview(ws || undefined);
      const data = res.data?.data ?? res.data;
      setWeekStart(data.weekStart);
      setWeekEnd(data.weekEnd);
      setOverview(data.overview);
      const r = data.reflection || {};
      setForm({
        wentWell: r.wentWell || '',
        challenges: r.challenges || '',
        improve: r.improve || '',
        priority: r.priority || '',
        status: r.status || 'draft'
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not load weekly review.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  const shiftWeek = (delta) => {
    if (!weekStart) return;
    load(addDays(weekStart, delta * 7));
  };

  const fieldsComplete = useMemo(() => {
    return PROMPTS.every(({ key }) => String(form[key] || '').trim().length > 0);
  }, [form]);

  const weekMeta = useMemo(() => {
    if (!weekStart) return null;
    return isoWeekParts(weekStart);
  }, [weekStart]);

  const handleSave = async (nextStatus) => {
    if (!weekStart) return;

    if (nextStatus === 'completed' && !fieldsComplete) {
      toast.error('Fill all four reflection fields before marking complete.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveWeeklyReview(weekStart, {
        wentWell: form.wentWell,
        challenges: form.challenges,
        improve: form.improve,
        priority: form.priority,
        status: nextStatus
      });
      const data = res.data?.data ?? res.data;
      const r = data.reflection || {};
      setForm((f) => ({
        ...f,
        status: r.status || nextStatus
      }));
      setOverview(data.overview);
      toast.success(
        nextStatus === 'completed' ? 'Review completed' : 'Draft saved'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !weekStart) {
    return <div className="page-loader">Loading weekly review…</div>;
  }

  if (error && !overview) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
        <button
          type="button"
          onClick={() => load(weekStart)}
          className="text-sm font-semibold text-[var(--color-brand-400)]"
        >
          Retry
        </button>
      </div>
    );
  }

  const o = overview || {};
  const comparison = o.comparison;

  return (
    <div className="space-y-8 pb-10">
      <header className="border-b border-[var(--color-border)] pb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-brand-400)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-400)]">
          Weekly review
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Reflect on your week
            </h1>

            {/* Clear year + week label */}
            {weekStart && weekEnd && weekMeta && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {weekMeta.year} · Week {weekMeta.week}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {formatRange(weekStart, weekEnd)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Week starts Monday · {weekStart}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text)]"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => load(null)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]"
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text)]"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Status:{' '}
          <span className="font-semibold text-[var(--color-text-secondary)]">
            {form.status === 'completed' ? 'Completed' : 'Draft'}
          </span>
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Week overview
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          From your habit logs — not a separate score engine
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] text-[var(--color-text-muted)]">Days logged</p>
            <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
              {o.daysLogged ?? 0}
              <span className="text-sm font-normal text-[var(--color-text-muted)]">
                /7
              </span>
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] text-[var(--color-text-muted)]">Consistency</p>
            <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
              {o.consistencyPct ?? 0}%
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] text-[var(--color-text-muted)]">Avg score</p>
            <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
              {o.avgScore ?? '—'}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Good habits done
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
              {o.goodCompleted ?? 0}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
          Hard moments marked: {o.badMarked ?? 0}
          {o.goodCompletionPct != null
            ? ` · Good completion ${o.goodCompletionPct}%`
            : ''}
          {comparison
            ? ` · vs last week: score ${comparison.avgScoreDelta >= 0 ? '+' : ''}${comparison.avgScoreDelta}, days ${comparison.daysLoggedDelta >= 0 ? '+' : ''}${comparison.daysLoggedDelta}`
            : ''}
        </p>
        {o.daily?.length > 0 && (
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {o.daily.map((day) => (
              <div
                key={day.date}
                className={`rounded-[var(--radius-control)] border px-1 py-2 text-center ${
                  day.logged
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    : 'border-dashed border-[var(--color-border)] opacity-60'
                }`}
              >
                <p className="text-[9px] uppercase text-[var(--color-text-muted)]">
                  {new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString(
                    'en',
                    { weekday: 'narrow' }
                  )}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">
                  {day.netScore ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-[var(--color-border)] pt-8">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Reflection
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Draft can be partial. All four answers are required to mark complete.
        </p>

        <div className="mt-6 space-y-5">
          {PROMPTS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                htmlFor={`review-${key}`}
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                {label}
                <span className="text-[var(--color-danger)]"> *</span>
              </label>
              <textarea
                id={`review-${key}`}
                rows={3}
                maxLength={1000}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full resize-y rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20"
              />
            </div>
          ))}
        </div>

        {!fieldsComplete && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Fill all four fields to enable Mark completed.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={saving || !fieldsComplete}
            onClick={() => handleSave('completed')}
            className="rounded-[var(--radius-control)] bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Mark completed'}
          </button>
        </div>
      </section>
    </div>
  );
}