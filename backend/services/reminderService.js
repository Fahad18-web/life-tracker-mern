const User = require('../models/User');
const Entry = require('../models/Entry');
const { sendDailyReminderEmail } = require('./emailService');

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

/**
 * Send reminders to opted-in users who have not logged "today" in their timezone.
 * Optional hour window: only if local hour matches preference (±0) when strictHour=true.
 */
async function runDailyReminders({ strictHour = false } = {}) {
  const users = await User.find({
    emailVerified: true,
    'preferences.dailyReminderEnabled': true
  })
    .select('name email timezone preferences')
    .lean();

  const logUrl = `${clientBaseUrl()}/log`;
  let sent = 0;
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

    try {
      await sendDailyReminderEmail({
        to: user.email,
        name: user.name,
        logUrl
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push({ email: user.email, message: err.message });
    }
  }

  return {
    candidates: users.length,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 10)
  };
}

module.exports = { runDailyReminders, dateInTimezone };