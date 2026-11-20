
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GOOD_HABIT_LABELS = {
  morning: 'Morning',
  exercise: 'Exercise',
  reading: 'Reading',
  prayer: 'Prayer',
  coding: 'Coding',
  sleep: 'Sleep',
  diet: 'Diet',
  hydration: 'Hydration'
};

const BAD_HABIT_LABELS = {
  social: 'Social',
  procrastination: 'Procrastination',
  junk: 'Junk food',
  late: 'Late',
  fajr: 'Fajr'
};

const TABLE_HEADERS = [
  'Date',
  'Score',
  'Grade',
  'Mood',
  'Completed good habits',
  'Recorded bad habits',
  'Custom habits',
  'Daily notes'
];

/**
 * Safely normalize supported export response shapes.
 */
export function normalizeEntries(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.entries)) return payload.entries;
  if (Array.isArray(payload.logs)) return payload.logs;
  if (Array.isArray(payload.data?.entries)) return payload.data.entries;

  return [];
}

/**
 * Format a habit key for display when no explicit label exists.
 */
function formatHabitLabel(value) {
  if (typeof value !== 'string' || !value.trim()) return '';

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCompletedHabits(habits, labels) {
  if (!habits || typeof habits !== 'object' || Array.isArray(habits)) {
    return [];
  }

  return Object.entries(habits)
    .filter(([, completed]) => completed === true)
    .map(([key]) => labels[key] || formatHabitLabel(key))
    .filter(Boolean);
}

function getCustomHabitDescriptions(customHabits) {
  if (!Array.isArray(customHabits)) return [];

  return customHabits
    .filter((habit) => habit && typeof habit === 'object')
    .map((habit) => {
      const name =
        typeof habit.name === 'string' && habit.name.trim()
          ? habit.name.trim()
          : 'Unnamed habit';

      const type = habit.type === 'good' ? 'Good' : 'Bad';
      const status = habit.completed === true ? 'Completed' : 'Not completed';

      return `${type}: ${name} (${status})`;
    });
}

/**
 * Build the table rows independently from PDF rendering.
 * Exported to make the data transformation straightforward to test.
 */
export function buildEntryRows(entries) {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => {
    const safeEntry = entry && typeof entry === 'object' ? entry : {};

    const goodHabits = getCompletedHabits(
      safeEntry.good,
      GOOD_HABIT_LABELS
    );

    const badHabits = getCompletedHabits(
      safeEntry.bad,
      BAD_HABIT_LABELS
    );

    const customHabits = getCustomHabitDescriptions(
      safeEntry.customHabits
    );

    const mood =
      typeof safeEntry.mood === 'number' && Number.isFinite(safeEntry.mood)
        ? `${safeEntry.mood}/5`
        : '—';

    const score =
      typeof safeEntry.netScore === 'number' &&
      Number.isFinite(safeEntry.netScore)
        ? String(safeEntry.netScore)
        : '—';

    const grade =
      typeof safeEntry.grade === 'string' && safeEntry.grade.trim()
        ? safeEntry.grade.trim()
        : '—';

    const date =
      typeof safeEntry.date === 'string' && safeEntry.date.trim()
        ? safeEntry.date
        : '—';

    const notes =
      typeof safeEntry.notes === 'string' && safeEntry.notes.trim()
        ? safeEntry.notes.trim()
        : '—';

    return [
      date,
      score,
      grade,
      mood,
      goodHabits.length ? goodHabits.join(', ') : 'None',
      badHabits.length ? badHabits.join(', ') : 'None',
      customHabits.length ? customHabits.join('\n') : 'None',
      notes
    ];
  });
}

/**
 * Calculate lightweight report statistics.
 */
export function buildReportSummary(entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  const scores = safeEntries
    .map((entry) => entry?.netScore)
    .filter((score) => typeof score === 'number' && Number.isFinite(score));

  const moods = safeEntries
    .map((entry) => entry?.mood)
    .filter((mood) => typeof mood === 'number' && Number.isFinite(mood));

  const gradeCounts = safeEntries.reduce((counts, entry) => {
    const grade =
      typeof entry?.grade === 'string' ? entry.grade.trim().toUpperCase() : '';

    if (grade) {
      counts[grade] = (counts[grade] || 0) + 1;
    }

    return counts;
  }, {});

  const average = (values) =>
    values.length
      ? Math.round(
          (values.reduce((total, value) => total + value, 0) / values.length) *
            10
        ) / 10
      : null;

  return {
    entryCount: safeEntries.length,
    averageScore: average(scores),
    averageMood: average(moods),
    gradeCounts
  };
}

/**
 * Use the browser's local calendar date for the PDF filename.
 * Avoids UTC date shifts around midnight.
 */
export function getLocalDateStamp(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('A valid Date instance is required.');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatExportDate(exportedAt) {
  if (typeof exportedAt === 'string' && exportedAt.trim()) {
    const parsed = new Date(exportedAt);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  return new Date().toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatAverage(value, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

/**
 * Generate a printable activity report from the JSON export payload.
 *
 * Expected call:
 * downloadEntriesPdf({ userName, payload });
 */
export function downloadEntriesPdf({ userName, payload } = {}) {
  const entries = normalizeEntries(payload);
  const summary = buildReportSummary(entries);
  const rows = buildEntryRows(entries);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  const displayName =
    typeof userName === 'string' && userName.trim()
      ? userName.trim()
      : 'User';

  const exportedAt = formatExportDate(payload?.exportedAt);
  const truncated = payload?.truncated === true;

  doc.setProperties({
    title: 'LifeTracker Activity Report',
    subject: 'Personal habit tracking activity report',
    author: displayName,
    creator: 'LifeTracker'
  });

  // Report heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(20, 30, 28);
  doc.text('LifeTracker Activity Report', margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 96);

  doc.text(`Prepared for: ${displayName}`, margin, 24);
  doc.text(`Exported: ${exportedAt}`, margin, 29);

  // Summary metrics
  const summaryY = 37;
  const summaryHeight = 19;
  const summaryWidth = (pageWidth - margin * 2 - 9) / 4;

  const summaryCards = [
    { label: 'TOTAL ENTRIES', value: String(summary.entryCount) },
    {
      label: 'AVERAGE SCORE',
      value: formatAverage(summary.averageScore)
    },
    {
      label: 'AVERAGE MOOD',
      value: formatAverage(summary.averageMood, '/5')
    },
    {
      label: 'GRADES RECORDED',
      value: String(Object.keys(summary.gradeCounts).length)
    }
  ];

  summaryCards.forEach((card, index) => {
    const x = margin + index * (summaryWidth + 3);

    doc.setDrawColor(220, 226, 222);
    doc.setFillColor(248, 250, 248);
    doc.roundedRect(x, summaryY, summaryWidth, summaryHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 105);
    doc.text(card.label, x + 3, summaryY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(25, 45, 36);
    doc.text(card.value, x + 3, summaryY + 14);
  });

  let tableStartY = summaryY + summaryHeight + 7;

  if (truncated) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(160, 75, 35);
    doc.text(
      'Warning: The export reached the 5,000-entry limit. Newer entries may be omitted.',
      margin,
      tableStartY
    );

    tableStartY += 7;
  }

  // Activity table
  autoTable(doc, {
    startY: tableStartY,
    head: [TABLE_HEADERS],
    body: rows.length
      ? rows
      : [['—', '—', '—', '—', 'No entries', 'No entries', 'No entries', 'No daily notes available.']],
    theme: 'grid',
    margin: {
      top: 12,
      right: margin,
      bottom: 17,
      left: margin
    },
    tableWidth: 'auto',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'top',
      textColor: [40, 48, 44],
      lineColor: [225, 230, 226],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [19, 123, 95],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [247, 249, 247]
    },
    columnStyles: {
      0: { cellWidth: 21 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 38 },
      5: { cellWidth: 35 },
      6: { cellWidth: 54 },
      7: { cellWidth: 80 }
    },
    rowPageBreak: 'auto',
    showHead: 'everyPage',
    didDrawPage: () => {
      const pageNumber = doc.internal.getNumberOfPages();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 128, 123);

      doc.text(
        'LifeTracker · Personal Activity Report',
        margin,
        pageHeight - 7
      );

      doc.text(
        `Page ${pageNumber}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    }
  });

  const stamp = getLocalDateStamp();
  doc.save(`lifetracker-activity-report-${stamp}.pdf`);
}
