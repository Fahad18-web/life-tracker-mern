/** Must match backend/config/avatarPresets.js ids */
export const AVATAR_STYLE = 'avataaars';
export const AVATAR_VERSION = '9.x';

export const AVATAR_PRESETS = [
  { id: 'alex', seed: 'Alex', label: 'Alex' },
  { id: 'sabina', seed: 'Sabina', label: 'Sabina' },
  { id: 'omar', seed: 'Omar', label: 'Omar' },
  { id: 'layla', seed: 'Layla', label: 'Layla' },
  { id: 'noah', seed: 'Noah', label: 'Noah' },
  { id: 'amina', seed: 'Amina', label: 'Amina' },
  { id: 'yusuf', seed: 'Yusuf', label: 'Yusuf' },
  { id: 'sara', seed: 'Sara', label: 'Sara' },
  { id: 'hassan', seed: 'Hassan', label: 'Hassan' },
  { id: 'zara', seed: 'Zara', label: 'Zara' },
  { id: 'ibrahim', seed: 'Ibrahim', label: 'Ibrahim' },
  { id: 'fatima', seed: 'Fatima', label: 'Fatima' },
  { id: 'adam', seed: 'Adam', label: 'Adam' },
  { id: 'maryam', seed: 'Maryam', label: 'Maryam' },
  { id: 'khalid', seed: 'Khalid', label: 'Khalid' },
  { id: 'noor', seed: 'Noor', label: 'Noor' }
];

export function getAvatarUrl(seedOrId) {
  if (!seedOrId) return null;

  const preset = AVATAR_PRESETS.find(
    (p) => p.id === seedOrId || p.seed === seedOrId
  );
  const seed = encodeURIComponent(preset?.seed || seedOrId);

  // png = sharper in <img>; svg also fine
  return `https://api.dicebear.com/${AVATAR_VERSION}/${AVATAR_STYLE}/png?seed=${seed}&size=128`;
}

export function isValidAvatarId(id) {
  if (id == null || id === '') return true;
  return AVATAR_PRESETS.some((p) => p.id === id);
}