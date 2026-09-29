/**
 * DiceBear human presets — id is what we store on User.avatar
 * Keep in sync with frontend/src/config/avatarPresets.js
 */
const AVATAR_PRESETS = [
  { id: 'alex', seed: 'Alex' },
  { id: 'sabina', seed: 'Sabina' },
  { id: 'omar', seed: 'Omar' },
  { id: 'layla', seed: 'Layla' },
  { id: 'noah', seed: 'Noah' },
  { id: 'amina', seed: 'Amina' },
  { id: 'yusuf', seed: 'Yusuf' },
  { id: 'sara', seed: 'Sara' },
  { id: 'hassan', seed: 'Hassan' },
  { id: 'zara', seed: 'Zara' },
  { id: 'ibrahim', seed: 'Ibrahim' },
  { id: 'fatima', seed: 'Fatima' },
  { id: 'adam', seed: 'Adam' },
  { id: 'maryam', seed: 'Maryam' },
  { id: 'khalid', seed: 'Khalid' },
  { id: 'noor', seed: 'Noor' }
];

const AVATAR_IDS = new Set(AVATAR_PRESETS.map((p) => p.id));

function isValidAvatar(value) {
  if (value === null || value === '') return true; // clear
  return AVATAR_IDS.has(value);
}

module.exports = { AVATAR_PRESETS, isValidAvatar };