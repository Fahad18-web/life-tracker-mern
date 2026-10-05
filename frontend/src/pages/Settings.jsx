import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Check,
  Moon,
  Sun,
  Download,
  Bell
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { updatePrefs } from '../api/authAPI';
import { exportMyData } from '../api/userAPI';
import { downloadBlob } from '../utils/downloadBlob';
import { THEME_PRESETS, THEME_MODES } from '../config/themePresets';

export default function Settings() {
  const { theme, preset, setTheme, setPreset } = useTheme();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reminderOn = Boolean(user?.preferences?.dailyReminderEnabled);
  const reminderHour = Number(user?.preferences?.dailyReminderHour ?? 20);

  const persist = async (partial, successMsg = 'Saved') => {
    if (!user) return;

    setSaving(true);
    try {
      const res = await updatePrefs(partial);
      const preferences = res.data.preferences || res.data;
      if (updateUser && user) {
        updateUser({ ...user, preferences });
      }
      toast.success(successMsg);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleMode = async (mode) => {
    setTheme(mode);
    await persist({ theme: mode }, 'Theme saved');
  };

  const handlePreset = async (id) => {
    setPreset(id);
    await persist({ themePreset: id }, 'Theme saved');
  };

  const handleReminderToggle = async () => {
    await persist(
      { dailyReminderEnabled: !reminderOn },
      !reminderOn ? 'Daily reminder on' : 'Daily reminder off'
    );
  };

  const handleReminderHour = async (hour) => {
    await persist({ dailyReminderHour: Number(hour) }, 'Reminder time saved');
  };

  const handleExport = async (format) => {
    if (!user) {
      toast.error('Please sign in to export data');
      return;
    }

    setExporting(true);
    try {
      const res = await exportMyData(format);
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename =
        match?.[1] ||
        `life-tracker-export.${format === 'csv' ? 'csv' : 'json'}`;

      downloadBlob(res.data, filename);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <SettingsIcon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Settings</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Appearance, reminders, and your data
          {user ? ' — changes sync to your account.' : '.'}
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Mode</h2>
        <div className="grid grid-cols-2 gap-3">
          {THEME_MODES.map((m) => {
            const active = theme === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={saving}
                onClick={() => handleMode(m.id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${active
                    ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/15 text-[var(--color-text)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                  }`}
              >
                {m.id === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="font-medium">{m.label}</span>
                {active && (
                  <Check className="ml-auto h-4 w-4 text-[var(--color-brand-400)]" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-text)]">Color vibe</h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Accent color across buttons, links, and highlights
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_PRESETS.map((p) => {
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                disabled={saving}
                onClick={() => handlePreset(p.id)}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${active
                    ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  }`}
              >
                <span
                  className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-black/10 shadow-sm"
                  style={{ background: p.swatch }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--color-text)]">
                    {p.label}
                  </span>
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {p.description}
                  </span>
                </span>
                {active && (
                  <Check className="h-4 w-4 shrink-0 text-[var(--color-brand-400)]" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily reminder */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--color-brand-400)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Daily log reminder</h2>
        </div>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Email once a day if you have not logged yet. Uses your account timezone (
          {user?.timezone || 'Asia/Karachi'}). Requires verified email.
        </p>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3">
          <span className="text-sm text-[var(--color-text)]">Enable daily reminder</span>
          <input
            type="checkbox"
            checked={reminderOn}
            disabled={saving || !user}
            onChange={handleReminderToggle}
            className="h-4 w-4 rounded"
          />
        </label>

        {reminderOn && (
          <div className="mt-3">
            <label
              htmlFor="reminder-hour"
              className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Preferred local time
            </label>
            <select
              id="reminder-hour"
              value={reminderHour}
              disabled={saving}
              onChange={(e) => handleReminderHour(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)]"
            >
              {Array.from({ length: 24 }, (_, h) => {
                const hour12 = h % 12 === 0 ? 12 : h % 12;
                const period = h < 12 ? 'AM' : 'PM';
                return (
                  <option key={h} value={h}>
                    {hour12}:00 {period}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              e.g. 9:00 AM, 8:00 PM — uses your account timezone (
              {user?.timezone || 'Asia/Karachi'}).
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-text)]">Your data</h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          Download a copy of your habit logs. On-demand only.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting || !user}
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing…' : 'Download JSON'}
          </button>
          <button
            type="button"
            disabled={exporting || !user}
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
      </section>
    </div>
  );
}