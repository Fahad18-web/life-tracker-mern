/**
 * Email delivery via Resend (optional).
 * Without RESEND_API_KEY, logs verification URL (dev / misconfig safe).
 */
async function sendVerificationEmail({ to, name, verifyUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'LifeTracker <onboarding@resend.dev>';

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
        <p>Hi ${name || 'there'},</p>
        <p>Please verify your email for LifeTracker:</p>
        <p><a href="${verifyUrl}">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not sign up, ignore this email.</p>
      `
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[email] Resend error:', res.status, text);
    throw new Error('Failed to send verification email');
  }

  return { queued: true };
}

module.exports = { sendVerificationEmail };