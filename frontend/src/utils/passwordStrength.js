/** Keep rules aligned with backend/utils/passwordPolicy.js */
export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password) {
  if (!password) {
    return { ok: false, message: 'Password is required' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: 'Password must include at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must include at least one number' };
  }
  return { ok: true, message: null };
}

/**
 * @returns {{ score: 0|1|2|3|4, label: string, color: string, checks: object }}
 */
export function getPasswordStrength(password = '') {
  const checks = {
    length: password.length >= MIN_PASSWORD_LENGTH,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  let score = 0;
  if (checks.length) score += 1;
  if (checks.letter && checks.number) score += 1;
  if (checks.upper && checks.lower) score += 1;
  if (checks.special) score += 1;
  if (password.length >= 12) score = Math.min(4, score + 1);

  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'var(--color-border)',
      checks
    };
  }

  const levels = [
    { label: 'Too weak', color: 'var(--color-danger)' },
    { label: 'Weak', color: 'var(--color-danger)' },
    { label: 'Fair', color: 'var(--color-warning)' },
    { label: 'Good', color: '#84cc16' },
    { label: 'Strong', color: 'var(--color-success)' }
  ];

  const level = levels[Math.min(score, 4)];

  return {
    score: Math.min(score, 4),
    label: level.label,
    color: level.color,
    checks
  };
}