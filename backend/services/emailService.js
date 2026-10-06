/**
 * Email delivery via Resend (optional).
 * Without RESEND_API_KEY, logs verification URL (dev / misconfig safe).
 */
async function sendVerificationEmail({ to, name, verifyUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'LifeTracker <onboarding@fahad.engineer>';

  if (!apiKey) {
    console.info('[email] RESEND_API_KEY missing — verification URL:');
    console.info(verifyUrl);
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
      subject: 'Verify your LifeTracker email',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1419;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background-color:#1a222d;border-radius:16px;border:1px solid #2a3544;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:28px 28px 8px 28px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background-color:rgba(45,212,191,0.15);color:#2dd4bf;font-size:22px;">
                🌿
              </div>
              <h1 style="margin:16px 0 0 0;font-size:22px;font-weight:600;color:#f1f5f9;letter-spacing:-0.02em;">
                LifeTracker
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:1.5;color:#e2e8f0;">
                Hi ${name || 'there'},
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#94a3b8;">
                Thanks for signing up. Please confirm your email so we know it’s really you — then you can start building calmer, more consistent days.
              </p>

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background-color:#0d9488;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">
                      Verify email address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#64748b;">
                This link expires in <strong style="color:#94a3b8;">24 hours</strong>.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                If the button doesn’t work, copy and paste this URL into your browser:
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${verifyUrl}" style="color:#2dd4bf;text-decoration:underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                If you didn’t create a LifeTracker account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:20px 0 0 0;font-size:11px;color:#475569;text-align:center;">
          LifeTracker · Habit tracking for focused days
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[email] Resend error:', res.status, text);
    throw new Error('Failed to send verification email');
  }

  return { queued: true };
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'LifeTracker <onboarding@fahad.engineer>';

  if (!apiKey) {
    console.info('[email] RESEND_API_KEY missing — password reset URL:');
    console.info(resetUrl);
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
      subject: 'Reset your LifeTracker password',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0f1419;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f1419;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background-color:#1a222d;border-radius:16px;border:1px solid #2a3544;">
        <tr><td style="padding:28px;text-align:center;">
          <div style="font-size:22px;">🌿</div>
          <h1 style="margin:16px 0 0;font-size:22px;color:#f1f5f9;">LifeTracker</h1>
        </td></tr>
        <tr><td style="padding:0 28px 28px;">
          <p style="color:#e2e8f0;font-size:16px;">Hi ${name || 'there'},</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
            We received a request to reset your password. This link expires in <strong style="color:#94a3b8;">1 hour</strong>.
          </p>
          <p style="text-align:center;padding:16px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;">
              Reset password
            </a>
          </p>
          <p style="font-size:12px;color:#64748b;word-break:break-all;">
            <a href="${resetUrl}" style="color:#2dd4bf;">${resetUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #2a3544;text-align:center;">
          <p style="margin:0;font-size:12px;color:#64748b;">If you didn’t request this, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[email] Resend reset error:', res.status, text);
    throw new Error('Failed to send password reset email');
  }
  return { queued: true };
};

module.exports =  { sendVerificationEmail, sendPasswordResetEmail };
