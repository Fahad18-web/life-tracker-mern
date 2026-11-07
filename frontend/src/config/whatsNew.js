/**
 * App changelog. Bump CURRENT_VERSION when you ship user-visible changes.
 * id should stay stable once published.
 */
export const WHATS_NEW_VERSION = '2026.11.07';

export const WHATS_NEW_ITEMS = [
  {
    id: 'pwa',
    title: 'Install LifeTracker',
    body: 'Add the app to your home screen for a faster, focused daily open.'
  },
  {
    id: 'pdf-export',
    title: 'PDF export',
    body: 'Download a printable report of your logs from Settings — CSV and JSON still available.'
  },
  {
    id: 'push',
    title: 'Push notifications',
    body: 'Enable browser push in Settings for log reminders (works best on the installed app).'
  },
  {
    id: 'heatmap',
    title: 'Activity heatmap',
    body: 'See a year of logging on the Progress tab — GitHub-style, score-aware.'
  },
  {
    id: 'design',
    title: 'Clearer Today & Log',
    body: 'Calmer layout and clearer hierarchy so the next action is obvious.'
  }
];

export const WHATS_NEW_STORAGE_KEY = 'lt_whats_new_seen_version';