const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <table width="100%"><tr>
            <td>
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Flowturai</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:3px;">KI-Automatisierung für Ihren Betrieb</div>
            </td>
            <td align="right">
              <div style="width:36px;height:36px;background:#1e40af;border-radius:8px;display:inline-block;"></div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          <div style="font-size:15px;line-height:1.7;color:#1e293b;">
            ${body.replace(/\n/g, '<br>')}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <div style="font-size:12px;color:#94a3b8;line-height:1.6;">
            Jeremy Jung · Flowturai ·
            <a href="mailto:hallo@flowturai.de" style="color:#64748b;text-decoration:none;">hallo@flowturai.de</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail({ to, subject, body, attachments }) {
  const payload = {
    from: process.env.FROM_EMAIL || 'Flowturai <hallo@flowturai.de>',
    to,
    subject,
    html: wrapHtml(body),
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments;
  }

  return resend.emails.send(payload);
}

module.exports = { sendEmail };
