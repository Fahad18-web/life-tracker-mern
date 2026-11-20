// backend/services/emailService.js
'use strict';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_EMAIL_FROM = 'LifeTracker <onboarding@fahad.engineer>';
const DEFAULT_TIMEOUT_MS = 10_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 30_000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 256;

class EmailDeliveryError extends Error {
  constructor(message, {
    code = 'EMAIL_DELIVERY_FAILED',
    statusCode = null,
    deliveryOutcome = 'uncertain',
    retryable = false
  } = {}) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.code = code;
    this.statusCode = statusCode;
    this.deliveryOutcome = deliveryOutcome;
    this.retryable = retryable;
  }
}

function getEmailTimeoutMs() {
  const configured = Number(process.env.EMAIL_TIMEOUT_MS);

  if (
    !Number.isInteger(configured) ||
    configured < MIN_TIMEOUT_MS ||
    configured > MAX_TIMEOUT_MS
  ) {
    return DEFAULT_TIMEOUT_MS;
  }

  return configured;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeLinkUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('A valid email link URL is required.');
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError('A valid email link URL is required.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TypeError('Email links must use HTTP or HTTPS.');
  }

  return parsed.href;
}

function getGreetingName(name) {
  return typeof name === 'string' && name.trim()
    ? escapeHtml(name.trim())
    : 'there';
}

function getMissingConfigurationResult(extra = {}) {
  return {
    queued: false,
    logged: false,
    reason: 'email_not_configured',
    ...extra
  };
}

function validateIdempotencyKey(idempotencyKey) {
  if (idempotencyKey === undefined || idempotencyKey === null) {
    return undefined;
  }

  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.length === 0 ||
    idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    throw new TypeError('Invalid email idempotency key.');
  }

  return idempotencyKey;
}

function classifyProviderFailure(statusCode) {
  // A timeout or conflict may occur after the provider has begun processing.
  if (statusCode === 408 || statusCode === 409) {
    return {
      deliveryOutcome: 'uncertain',
      retryable: true,
      code: 'EMAIL_PROVIDER_AMBIGUOUS'
    };
  }

  // These are explicit provider rejections. The message was not accepted
  // as a successful email request.
  if (statusCode === 429) {
    return {
      deliveryOutcome: 'rejected',
      retryable: true,
      code: 'EMAIL_RATE_LIMITED'
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return {
      deliveryOutcome: 'rejected',
      retryable: false,
      code: 'EMAIL_PROVIDER_REJECTED'
    };
  }

  // A 5xx response is conservatively treated as uncertain.
  return {
    deliveryOutcome: 'uncertain',
    retryable: true,
    code: 'EMAIL_PROVIDER_UNAVAILABLE'
  };
}

async function sendViaResend({
  to,
  subject,
  html,
  idempotencyKey
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

  if (!apiKey) {
    return getMissingConfigurationResult();
  }

  if (typeof to !== 'string' || !to.trim()) {
    throw new TypeError('Email recipient is required.');
  }

  if (typeof subject !== 'string' || !subject.trim()) {
    throw new TypeError('Email subject is required.');
  }

  if (typeof html !== 'string' || !html.trim()) {
    throw new TypeError('Email HTML content is required.');
  }

  const validatedIdempotencyKey =
    validateIdempotencyKey(idempotencyKey);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (validatedIdempotencyKey) {
    headers['Idempotency-Key'] = validatedIdempotencyKey;
  }

  let response;

  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from,
        to: [to.trim()],
        subject,
        html
      }),
      signal: AbortSignal.timeout(getEmailTimeoutMs())
    });
  } catch (error) {
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError';

    throw new EmailDeliveryError(
      isTimeout
        ? 'Email request timed out; delivery outcome is uncertain.'
        : 'Email request failed; delivery outcome is uncertain.',
      {
        code: isTimeout
          ? 'EMAIL_TIMEOUT'
          : 'EMAIL_NETWORK_ERROR',
        deliveryOutcome: 'uncertain',
        retryable: true
      }
    );
  }

  if (!response.ok) {
    const classification =
      classifyProviderFailure(response.status);

    throw new EmailDeliveryError(
      classification.deliveryOutcome === 'uncertain'
        ? 'Email provider returned an ambiguous delivery result.'
        : 'Email provider rejected the request.',
      {
        ...classification,
        statusCode: response.status
      }
    );
  }

  return { queued: true };
}

/**
 * Verification email.
 *
 * Missing email configuration is treated as unavailable delivery.
 * Verification URLs are never logged.
 */
async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
  idempotencyKey
}) {
  if (!process.env.RESEND_API_KEY) {
    return getMissingConfigurationResult();
  }

  const recipientName = getGreetingName(name);
  const url = escapeHtml(safeLinkUrl(verifyUrl));

  return sendViaResend({
    to,
    subject: 'Verify your LifeTracker email',
    idempotencyKey,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#1a222d;border-radius:16px;border:1px solid #2a3544;">
<tr><td style="padding:28px;text-align:center;">
<div style="font-size:22px;">🌿</div>
<h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${recipientName},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Confirm your email to start tracking calmer, more consistent days.</p>
<p style="text-align:center;padding:16px 0;">
<a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Verify email</a>
</p>
<p style="font-size:12px;color:#64748b;word-break:break-all;">
<a href="${url}" style="color:#2dd4bf;">${url}</a>
</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">If you did not sign up, ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body>
</html>`.trim()
  });
}

/**
 * Password reset email.
 *
 * Missing email configuration never logs sensitive reset URLs.
 */
async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  idempotencyKey
}) {
  if (!process.env.RESEND_API_KEY) {
    return getMissingConfigurationResult();
  }

  const recipientName = getGreetingName(name);
  const url = escapeHtml(safeLinkUrl(resetUrl));

  return sendViaResend({
    to,
    subject: 'Reset your LifeTracker password',
    idempotencyKey,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#1a222d;border-radius:16px;border:1px solid #2a3544;">
<tr><td style="padding:28px;text-align:center;">
<div style="font-size:22px;">🌿</div>
<h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${recipientName},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">Reset your password. This link expires in <strong>1 hour</strong>.</p>
<p style="text-align:center;padding:16px 0;">
<a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Reset password</a>
</p>
<p style="font-size:12px;color:#64748b;word-break:break-all;">
<a href="${url}" style="color:#2dd4bf;">${url}</a>
</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">If you did not request this, ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body>
</html>`.trim()
  });
}

/** Daily log reminder (cron). */
async function sendDailyReminderEmail({
  to,
  name,
  logUrl,
  variant = 'default',
  idempotencyKey
}) {
  const who = getGreetingName(name);
  const url = escapeHtml(safeLinkUrl(logUrl));

  const copy = {
    default: {
      subject: 'LifeTracker — log today (1 minute)',
      body: 'You have not logged today yet. One quick check-in keeps your record honest.'
    },
    protect: {
      subject: 'LifeTracker — keep today’s chain',
      body: 'You have been showing up. A short log today protects the rhythm you already built.'
    },
    comeback: {
      subject: 'LifeTracker — start a small comeback',
      body: 'It has been a little while. That is okay. One log today is enough to begin again — no guilt.'
    },
    gentle: {
      subject: 'LifeTracker — a quiet check-in',
      body: 'Whenever you are ready, a one-minute log helps you see the week clearly.'
    }
  };

  const selectedVariant =
    Object.prototype.hasOwnProperty.call(copy, variant)
      ? variant
      : 'default';

  const { subject, body } = copy[selectedVariant];

  if (!process.env.RESEND_API_KEY) {
    return getMissingConfigurationResult({
      variant: selectedVariant
    });
  }

  return sendViaResend({
    to,
    subject,
    idempotencyKey,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#1e293b;border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 28px 0;">
<p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2dd4bf;">Reminder</p>
<h1 style="margin:12px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
</td></tr>
<tr><td style="padding:0 28px 28px;">
<p style="color:#e2e8f0;font-size:16px;">Hi ${who},</p>
<p style="color:#94a3b8;font-size:15px;line-height:1.6;">${escapeHtml(body)}</p>
<p style="text-align:center;padding:16px 0;">
<a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">Log today</a>
</p>
<p style="font-size:12px;color:#64748b;">Change reminder time in Settings. Turn reminders off anytime.</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
<p style="margin:0;font-size:12px;color:#64748b;">LifeTracker · calm habit tracking</p>
</td></tr>
</table></td></tr></table>
</body>
</html>`.trim()
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDailyReminderEmail,
  sendViaResend,
  EmailDeliveryError
};