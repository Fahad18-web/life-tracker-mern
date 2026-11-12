const User = require('../models/User');
const Entry = require('../models/Entry');
const { sendDailyReminderEmail } = require('./emailService');
const pushService = require('./pushService');

function clientBaseUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/** YYYY-MM-DD in a given IANA timezone */
function dateInTimezone(timeZone = 'Asia/Karachi') {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function hourInTimezone(timeZone = 'Asia/Karachi') {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value;
    return Number(h);
  } catch {
    return new Date().getUTCHours();
  }
}

function addDaysToDateStr(dateStr, delta) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split('T')[0];
}

/**
 * Pick calm email/push variant from recent logging pattern.
 * Does not change streak math — display/copy only.
 */
async function resolveReminderVariant(userId, localDate) {
  const from = addDaysToDateStr(localDate, -7);
  const yesterday = addDaysToDateStr(localDate, -1);

  const recent = await Entry.find({
    userId,
    date: { $gte: from, $lte: localDate }
  })
    .select('date')
    .lean();

  if (!recent.length) {
    return 'gentle';
  }

  const dates = new Set(recent.map((e) => e.date));
  if (dates.has(yesterday)) {
    return 'protect';
  }

  // Has history in the window but not yesterday → soft comeback
  return 'comeback';
}

function pushPayload(variant, logUrl) {
  const map = {
    default: {
      title: 'Log today',
      body: 'One minute keeps your record honest.'
    },
    protect: {
      title: 'Keep the chain',
      body: 'A short log today protects the rhythm you built.'
    },
    comeback: {
      title: 'Small comeback',
      body: 'One log today is enough to begin again.'
    },
    gentle: {
      title: 'Quiet check-in',
      body: 'Whenever you are ready — one minute is enough.'
    }
  };
  const { title, body } = map[variant] || map.default;
  return {
    title,
    body,
    url: logUrl,
    variant
  };
}

/**
 * Remind opted-in users who have not logged "today" in their timezone.
 */
async function runDailyReminders({ strictHour = false } = {}) {
  const users = await User.find({
    emailVerified: true,
    'preferences.dailyReminderEnabled': true
  })
    .select('name email timezone preferences pushSubscription')
    .lean();

  // pushSubscription may be select:false on schema — re-fetch with + if needed
  const logUrl = `${clientBaseUrl()}/log`;
  let sent = 0;
  let pushSent = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const user of users) {
    const tz = user.timezone || 'Asia/Karachi';
    const localDate = dateInTimezone(tz);
    const localHour = hourInTimezone(tz);
    const preferredHour = Number(user.preferences?.dailyReminderHour ?? 20);

    if (strictHour && localHour !== preferredHour) {
      skipped++;
      continue;
    }

    const hasEntry = await Entry.exists({
      userId: user._id,
      date: localDate
    });

    if (hasEntry) {
      skipped++;
      continue;
    }

    let variant = 'default';
    try {
      variant = await resolveReminderVariant(user._id, localDate);
    } catch {
      variant = 'default';
    }

    try {
      await sendDailyReminderEmail({
        to: user.email,
        name: user.name,
        logUrl,
        variant
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push({ email: user.email, channel: 'email', message: err.message });
    }

    // Best-effort push (same moment, same variant). Ignore if not configured / no sub.
    try {
      const result = await pushService.sendToUser(
        user._id,
        pushPayload(variant, logUrl)
      );
      if (result?.sent) pushSent++;
    } catch {
      // push optional — do not fail the whole job
    }
  }

  return {
    candidates: users.length,
    sent,
    pushSent,
    skipped,
    failed,
    errors: errors.slice(0, 10)
  };
}

module.exports = { runDailyReminders, dateInTimezone };