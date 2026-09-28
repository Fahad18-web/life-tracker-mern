import { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Check, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { updatePrefs } from '../api/authAPI';
import { THEME_PRESETS, THEME_MODES } from '../config/themePresets';

export default function Settings() {
  const { theme, preset, setTheme, setPreset } = useTheme();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const persist = async (partial) => {
    if (!user) return; // guest / not logged — localStorage already updated by ThemeContext

    setSaving(true);
    try {
      const res = await updatePrefs(partial);
      const preferences = res.data.preferences || res.data;
      if (updateUser && user) {
        updateUser({ ...user, preferences });
      }
      toast.success('Theme saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleMode = async (mode) => {
    setTheme(mode);
    await persist({ theme: mode });
  };

  const handlePreset = async (id) => {
    setPreset(id);
    await persist({ themePreset: id });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 text-[var(--color-brand-400)]">
          <SettingsIcon className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Settings</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
          Appearance
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Choose a mode and vibe. Changes apply instantly
          {user ? ' and sync to your account.' : '.'}
        </p>
      </div>

      {/* Mode */}
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
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/15 text-[var(--color-text)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {m.id === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="font-medium">{m.label}</span>
                {active && <Check className="ml-auto h-4 w-4 text-[var(--color-brand-400)]" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Presets */}
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
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
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
                {active && <Check className="h-4 w-4 shrink-0 text-[var(--color-brand-400)]" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}