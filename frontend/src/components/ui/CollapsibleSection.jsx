import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Accessible collapse for secondary dashboard blocks.
 * defaultOpen=false → less noise on first paint.
 */
export default function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  defaultOpen = false,
  children,
  storageKey
}) {
  const reactId = useId();
  const panelId = `collapse-panel-${reactId}`;
  const buttonId = `collapse-btn-${reactId}`;

  const [open, setOpen] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const v = localStorage.getItem(storageKey);
        if (v === '1') return true;
        if (v === '0') return false;
      } catch {
        /* ignore */
      }
    }
    return defaultOpen;
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? '1' : '0');
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        id={buttonId}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--color-bg)]/40"
      >
        {Icon ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          {subtitle ? (
            <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-[var(--color-border)] px-4 py-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}