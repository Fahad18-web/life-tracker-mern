const TOKEN_KEY = 'lt_token';
const USER_KEY = 'lt_user';
const PERSIST_KEY = 'lt_persist'; // '1' = localStorage (remember me)

function primaryStore() {
  try {
    if (localStorage.getItem(PERSIST_KEY) === '1') return localStorage;
  } catch {
    /* ignore */
  }
  return sessionStorage;
}

export function getToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 * @param {object} user
 * @param {boolean} rememberMe
 */
export function persistSession(token, user, rememberMe = false) {
  clearSession();

  const store = rememberMe ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));

  if (rememberMe) {
    localStorage.setItem(PERSIST_KEY, '1');
  } else {
    localStorage.removeItem(PERSIST_KEY);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERSIST_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function updateStoredUser(user) {
  const raw = JSON.stringify(user);
  try {
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(USER_KEY, raw);
    }
    if (sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(USER_KEY, raw);
    }
  } catch {
    /* ignore */
  }
}