import { useState } from 'react';
import toast from 'react-hot-toast';
import { Share2, Download } from 'lucide-react';
import { drawShareCard, shareOrDownloadCanvas } from '../utils/drawShareCard';

/**
 * Client-side weekly share card — no backend, no AI.
 */
export default function ShareWeeklyCard({
  userName,
  overallStreak = 0,
  weekly = []
}) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const canvas = drawShareCard({
        userName,
        overallStreak,
        weekly,
        brandUrl: typeof window !== 'undefined' ? window.location.host : 'LifeTracker'
      });
      const mode = await shareOrDownloadCanvas(canvas);
      toast.success(mode === 'shared' ? 'Shared!' : 'Image downloaded');
    } catch (err) {
      if (err?.name === 'AbortError') {
        // user cancelled share sheet
        return;
      }
      console.error(err);
      toast.error('Could not create share image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">Share this week</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          Download or share a card with your streak and daily scores.
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-500)] disabled:opacity-50"
      >
        {busy ? (
          'Creating…'
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share card
            <Download className="h-3.5 w-3.5 opacity-80" />
          </>
        )}
      </button>
    </div>
  );
}