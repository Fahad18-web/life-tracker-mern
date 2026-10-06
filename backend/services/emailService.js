/**
 * Email delivery via Resend (optional).
 * Without RESEND_API_KEY, logs URLs (dev / misconfig safe).
 */

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'LifeTracker <onboarding@fahad.engineer>';

  if (!apiKey) {
    console.info('[email] RESEND_API_KEY missing — subject:', subject, 'to:', to);
    return { queued: false, logged: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[email] Resend error:', res.status, text);
    throw new Error(`Failed to send email: ${subject}`);
  }

  return { queued: true };
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!process.env.RESEND_API_KEY) {
    console.info('[email] verification URL:', verifyUrl);
    return { queued: false, logged: true };
  }

  return sendViaResend({
    to,
    subject: 'Verify your LifeTracker email',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#1a222d;border-radius:16px;border:1px solid #2a3544;">
<tr><td style="padding:28px;text-align:center;">
<div style="font-size:22px;">🌿</div>
<h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${name || 'there'},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Confirm your email to start tracking calmer, more consistent days.</p>
<p style="text-align:center;padding:16px 0;">
<a href="${verifyUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Verify email</a>
</p>
<p style="font-size:12px;color:#64748b;word-break:break-all;"><a href="${verifyUrl}" style="color:#2dd4bf;">${verifyUrl}</a></p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">If you did not sign up, ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body></html>`.trim()
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!process.env.RESEND_API_KEY) {
    console.info('[email] password reset URL:', resetUrl);
    return { queued: false, logged: true };
  }

  return sendViaResend({
    to,
    subject: 'Reset your LifeTracker password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#1a222d;border-radius:16px;border:1px solid #2a3544;">
<tr><td style="padding:28px;text-align:center;">
<div style="font-size:22px;">🌿</div>
<h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${name || 'there'},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Reset your password. This link expires in <strong>1 hour</strong>.</p>
<p style="text-align:center;padding:16px 0;">
<a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Reset password</a>
</p>
<p style="font-size:12px;color:#64748b;word-break:break-all;"><a href="${resetUrl}" style="color:#2dd4bf;">${resetUrl}</a></p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">If you did not request this, ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body></html>`.trim()
  });
}

/** Daily log reminder (cron) */
async function sendDailyReminderEmail({ to, name, logUrl }) {
  if (!process.env.RESEND_API_KEY) {
    console.info('[email] daily reminder for', to, 'logUrl:', logUrl);
    return { queued: false, logged: true };
  }

  return sendViaResend({
    to,
    subject: 'LifeTracker — log today (1 minute)',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#1a222d;border-radius:16px;border:1px solid #2a3544;">
<tr><td style="padding:28px;text-align:center;">
<div style="font-size:22px;">🌿</div>
<h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${name || 'there'},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">
You have not logged today yet. One quick check-in keeps your streak and score honest.
</p>
<p style="text-align:center;padding:16px 0;">
<a href="${logUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Log today</a>
</p>
<p style="font-size:12px;color:#64748b;">You can change reminder time in Settings. Turn reminders off anytime.</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">LifeTracker · calm habit tracking</p>
</td></tr>
</table></td></tr></table>
</body></html>`.trim()
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDailyReminderEmail
};