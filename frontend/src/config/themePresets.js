/**
 * Single source of truth for theme presets.
 * Add new presets here + matching CSS [data-accent="..."] block.
 */
export const THEME_PRESETS = [
  {
    id: 'teal',
    label: 'Calm Teal',
    description: 'Default — focus & growth',
    swatch: '#137b5f'
  },
  {
    id: 'ocean',
    label: 'Ocean Blue',
    description: 'Cool & clear',
    swatch: '#0284c7'
  },
  {
    id: 'amber',
    label: 'Warm Amber',
    description: 'Soft energy',
    swatch: '#d97706'
  },
  {
    id: 'forest',
    label: 'Deep Forest',
    description: 'Grounded & calm',
    swatch: '#16a34a'
  },
  {
    id: 'rose',
    label: 'Dusty Rose',
    description: 'Calm & human',
    swatch: '#e11d48'
  }
];

export const THEME_MODES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' }
];

export const DEFAULT_THEME = 'dark';
export const DEFAULT_PRESET = 'teal';

export const isValidPreset = (id) =>
  THEME_PRESETS.some((p) => p.id === id);

export const isValidMode = (id) =>
  id === 'dark' || id === 'light';