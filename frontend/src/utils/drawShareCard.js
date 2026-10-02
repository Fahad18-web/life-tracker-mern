/**
 * Draw a LifeTracker weekly share card on canvas (no external libs).
 * @returns {HTMLCanvasElement}
 */
export function drawShareCard({
  userName = 'You',
  overallStreak = 0,
  weekly = [],
  brandUrl = 'lifetracker.app'
}) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f1419';
  ctx.fillRect(0, 0, W, H);

  // Soft brand glow
  const glow = ctx.createRadialGradient(W * 0.5, 180, 20, W * 0.5, 200, 420);
  glow.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
  glow.addColorStop(1, 'rgba(13, 148, 136, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 520);

  // Card panel
  roundRect(ctx, 64, 64, W - 128, H - 128, 40);
  ctx.fillStyle = '#1a222d';
  ctx.fill();
  ctx.strokeStyle = '#2a3544';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Brand
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '600 36px system-ui, sans-serif';
  ctx.fillText('🌿 LifeTracker', 110, 150);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 28px system-ui, sans-serif';
  ctx.fillText('This week’s progress', 110, 200);

  // Name
  const first = String(userName).split(' ')[0] || 'You';
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 52px system-ui, sans-serif';
  ctx.fillText(first, 110, 290);

  // Streak badge
  roundRect(ctx, 110, 330, 280, 88, 20);
  ctx.fillStyle = 'rgba(13, 148, 136, 0.2)';
  ctx.fill();
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '600 40px system-ui, sans-serif';
  ctx.fillText(`${overallStreak}`, 140, 388);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 26px system-ui, sans-serif';
  ctx.fillText('day streak', 140 + ctx.measureText(String(overallStreak)).width + 24, 388);

  // Week strip
  const days = normalizeWeek(weekly);
  const boxW = 110;
  const gap = 18;
  const totalW = days.length * boxW + (days.length - 1) * gap;
  let x = (W - totalW) / 2;
  const y = 480;

  days.forEach((d) => {
    roundRect(ctx, x, y, boxW, 160, 18);
    ctx.fillStyle = d.isToday ? 'rgba(13, 148, 136, 0.25)' : '#121821';
    ctx.fill();
    ctx.strokeStyle = d.isToday ? '#0d9488' : '#2a3544';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + boxW / 2, y + 40);

    const scoreColor = gradeColor(d.grade);
    ctx.fillStyle = d.score != null ? scoreColor : '#475569';
    ctx.font = '600 36px system-ui, sans-serif';
    ctx.fillText(d.score != null ? String(d.score) : '—', x + boxW / 2, y + 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText(d.grade || '—', x + boxW / 2, y + 130);

    ctx.textAlign = 'left';
    x += boxW + gap;
  });

  // Footer message
  const logged = days.filter((d) => d.score != null).length;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    logged > 0 ? `Logged ${logged} of ${days.length} days` : 'Building the habit',
    W / 2,
    720
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText('Replace bad habits. Track the week — not one checkbox.', W / 2, 780);

  // Bottom brand bar
  roundRect(ctx, 110, H - 220, W - 220, 100, 24);
  ctx.fillStyle = '#121821';
  ctx.fill();
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.fillText(brandUrl, W / 2, H - 158);

  ctx.textAlign = 'left';
  return canvas;
}

function normalizeWeek(weekly) {
  const today = new Date().toISOString().split('T')[0];
  if (!Array.isArray(weekly) || weekly.length === 0) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const date = d.toISOString().split('T')[0];
      return {
        label: d.toLocaleDateString('en-PK', { weekday: 'short' }),
        score: null,
        grade: null,
        isToday: date === today
      };
    });
  }

  return weekly.slice(-7).map((d) => {
    const date = d.date;
    return {
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-PK', {
        weekday: 'short'
      }),
      score: d.netScore ?? d.score ?? null,
      grade: d.grade ?? null,
      isToday: date === today
    };
  });
}

function gradeColor(grade) {
  const map = {
    A: '#22c55e',
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    F: '#ef4444'
  };
  return map[grade] || '#2dd4bf';
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Trigger download of canvas as PNG.
 */
export function downloadCanvasPng(canvas, filename = 'lifetracker-week.png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create image'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

/**
 * Share via Web Share API when supported (mobile), else download.
 */
export async function shareOrDownloadCanvas(canvas, filename = 'lifetracker-week.png') {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png');
  });

  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'My LifeTracker week',
      text: 'My habit week on LifeTracker'
    });
    return 'shared';
  }

  await downloadCanvasPng(canvas, filename);
  return 'downloaded';
}