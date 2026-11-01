export function getLocalHour(timeZone) {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone || undefined,
      hour: 'numeric',
      hour12: false
    });
    const parts = fmt.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    let h = parseInt(hourPart?.value ?? '0', 10);
    if (h === 24) h = 0;
    return Number.isFinite(h) ? h : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

export function getLocalDateKey(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/** morning: 05–08 · night: 23–03 */
export function resolveAmbientWindow(timeZone) {
  const hour = getLocalHour(timeZone);
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 23 || hour < 4) return 'night';
  return null;
}

const storageKey = (w, dateKey) => `lt-ambient-${w}-${dateKey}`;

export function shouldShowAmbient(w, timeZone) {
  if (!w) return false;
  try {
    return localStorage.getItem(storageKey(w, getLocalDateKey(timeZone))) !== '1';
  } catch {
    return true;
  }
}

export function markAmbientShown(w, timeZone) {
  if (!w) return;
  try {
    localStorage.setItem(storageKey(w, getLocalDateKey(timeZone)), '1');
  } catch {
    /* ignore */
  }
}

export function ambientCopy(w, firstName) {
  const name = firstName || 'there';
  if (w === 'morning') {
    return {
      eyebrow: 'Sunrise hours',
      title: `Good morning, ${name}`,
      body: 'Quiet start beats a perfect plan. One clear focus is enough.'
    };
  }
  if (w === 'night') {
    return {
      eyebrow: 'Late hours',
      title: `Still here, ${name}`,
      body: 'One small honest log is enough. Protect tomorrow’s energy.'
    };
  }
  return null;
}