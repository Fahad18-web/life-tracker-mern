import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Build a simple printable report from export JSON.
 * Accepts flexible shapes from /users/export?format=json
 */
function normalizeEntries(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.entries)) return payload.entries;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.data?.entries)) return payload.data.entries;
  return [];
}

export function downloadEntriesPdf({ userName, payload }) {
  const entries = normalizeEntries(payload);
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  doc.setFontSize(16);
  doc.setTextColor(20, 30, 28);
  doc.text('LifeTracker export', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(90, 100, 96);
  doc.text(
    `${userName || 'User'} · ${entries.length} entries · ${today}`,
    14,
    26
  );

  const rows = entries.map((e) => [
    e.date || '—',
    e.netScore != null ? String(e.netScore) : '—',
    e.grade || '—',
    e.mood != null ? String(e.mood) : '—'
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Date', 'Score', 'Grade', 'Mood']],
    body: rows.length > 0 ? rows : [['No entries', '—', '—', '—']],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: [19, 123, 95],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 248, 246] }
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`lifetracker-export-${stamp}.pdf`);
}