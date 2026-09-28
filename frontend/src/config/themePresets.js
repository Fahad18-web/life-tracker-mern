/**
 * Single source of truth for theme presets.
 * Add new presets here + matching CSS [data-accent="..."] block.
 */
export const THEME_PRESETS = [
  {
    id: 'teal',
    label: 'Calm Teal',
    description: 'Default — focus & growth',
    swatch: '#1f9f7a'
  },
  {
    id: 'ocean',
    label: 'Ocean Blue',
    description: 'Cool & clear',
    swatch: '#0284c7'
  },
  {
    id: 'sunset',
    label: 'Sunset Warm',
    description: 'Energy & warmth',
    swatch: '#ea580c'
  },
  {
    id: 'forest',
    label: 'Deep Forest',
    description: 'Grounded & calm',
    swatch: '#15803d'
  },
  {
    id: 'violet',
    label: 'Soft Violet',
    description: 'Creative evening',
    swatch: '#7c3aed'
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