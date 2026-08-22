import { env } from '@/lib/env'

/* ------------------------------------------------------------------
   Mail has exactly one job right now: deliver password-reset links.

   With RESEND_API_KEY set it goes out over Resend's HTTP API (no SMTP
   socket, which serverless does not like). Without it, the link is
   printed to the server log so the flow is testable on a laptop with
   no mail account configured.
   ------------------------------------------------------------------ */

export interface Mail {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  if (!env.RESEND_API_KEY) {
    console.info(
      [
        '',
        '──────────────── DGS mail (not sent — no RESEND_API_KEY) ────────────────',
        `to:      ${mail.to}`,
        `subject: ${mail.subject}`,
        '',
        mail.text,
        '─────────────────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    )
    return { delivered: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    })
    if (!res.ok) {
      console.error('[mail] provider rejected the message:', res.status, await res.text())
      return { delivered: false }
    }
    return { delivered: true }
  } catch (err) {
    // Never fail the request because mail is down — the caller returns the
    // same generic response either way.
    console.error('[mail] send failed:', err)
    return { delivered: false }
  }
}

export function passwordResetMail(to: string, link: string, minutes: number): Mail {
  const text = [
    'Reset your DGS password',
    '',
    `Open this link to choose a new password. It expires in ${minutes} minutes and works once:`,
    link,
    '',
    'If you did not ask for this, you can ignore this email — your password will not change.',
  ].join('\n')

  const html = `<!doctype html>
<html><body style="margin:0;background:#f6f5f8;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(16,12,26,.08)">
        <tr><td>
          <p style="margin:0 0 4px;font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#9333c9">DGS</p>
          <h1 style="margin:0 0 12px;font-size:22px;color:#17131f">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5b5468">
            Choose a new password with the button below. The link expires in ${minutes} minutes and can only be used once.
          </p>
          <a href="${link}" style="display:inline-block;background:#9333c9;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9px">Choose a new password</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8b8398">
            If the button does not work, paste this into your browser:<br>
            <span style="word-break:break-all;color:#5b5468">${link}</span>
          </p>
          <hr style="border:none;border-top:1px solid #eceaf0;margin:24px 0">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8b8398">
            Did not ask for this? Ignore this email — your password stays as it is.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { to, subject: 'Reset your DGS password', html, text }
}
