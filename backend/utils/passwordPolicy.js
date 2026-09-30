/**
 * Shared password policy — keep in sync with frontend/src/utils/passwordStrength.js
 */
const MIN_LENGTH = 8;

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { ok: false, message: 'Password is required' };
  }

  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_LENGTH} characters`
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      ok: false,
      message: 'Password must include at least one letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      ok: false,
      message: 'Password must include at least one number'
    };
  }

  return { ok: true, message: null };
}

module.exports = {
  MIN_LENGTH,
  validatePassword
};