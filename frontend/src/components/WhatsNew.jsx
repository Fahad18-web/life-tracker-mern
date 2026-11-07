import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  WHATS_NEW_VERSION,
  WHATS_NEW_ITEMS,
  WHATS_NEW_STORAGE_KEY
} from '../config/whatsNew';

function hasSeenCurrent() {
  try {
    return localStorage.getItem(WHATS_NEW_STORAGE_KEY) === WHATS_NEW_VERSION;
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
  } catch {
    /* ignore */
  }
}

/**
 * One-shot modal when WHATS_NEW_VERSION is newer than last seen.
 */
export default function WhatsNew() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenCurrent()) setOpen(true);
  }, []);

  const dismiss = () => {
    markSeen();
    setOpen(false);
  };

  if (!open || !WHATS_NEW_ITEMS.length) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      onClick={dismiss}
    >
      <div
        className="lt-card max-h-[min(85vh,560px)] w-full max-w-md overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-brand-600)]/15 text-[var(--color-brand-400)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="whats-new-title"
                className="text-base font-semibold text-[var(--color-text)]"
              >
                What&apos;s new
              </h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                Version {WHATS_NEW_VERSION}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="space-y-3">
          {WHATS_NEW_ITEMS.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2.5"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-[var(--radius-control)] bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-500)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}