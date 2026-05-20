const nodemailer = require('nodemailer');

// IONOS SMTP-Transporter
const transporter = nodemailer.createTransport({
  host:   process.env.IONOS_SMTP_HOST || 'smtp.ionos.de',
  port:   parseInt(process.env.IONOS_SMTP_PORT || '587'),
  secure: false, // STARTTLS
  auth: {
    user: process.env.IONOS_EMAIL,
    pass: process.env.IONOS_PASSWORD,
  },
  tls: { rejectUnauthorized: true },
});

transporter.verify().then(() => {
  console.log('[Email] IONOS SMTP verbunden ✓');
}).catch(err => {
  console.error('[Email] SMTP-Verbindungsfehler:', err.message);
});

function buildHtml(body) {
  const ADDR    = process.env.BUSINESS_ADDRESS || 'Efeuweg 37, 22299 Hamburg';
  const TEL     = '+49 (0) 15228352609';
  const EMAIL   = process.env.IONOS_EMAIL || 'info@flowturai.de';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F8FF;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#040c1a;padding:28px 32px;border-radius:12px 12px 0 0;">
          <table width="100%"><tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;background:#2563EB;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex-shrink:0;">
                  <svg viewBox="0 0 20 20" fill="none" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 10L8 5L13 10L18 5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 15L8 10L13 15L18 10" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.5"/>
                  </svg>
                </div>
                <div>
                  <div style="font-size:22px;font-weight:800;color:#F5F7FA;letter-spacing:-0.5px;font-family:'Segoe UI',Arial,sans-serif;line-height:1.1;">Flowturai</div>
                  <div style="font-size:12px;color:#93c5fd;margin-top:2px;">KI-Beratung &amp; Automatisierung f&uuml;r den Mittelstand</div>
                </div>
              </div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Accent line -->
        <tr><td style="background:#2563EB;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 32px;border:1px solid #DBEAFE;border-top:none;">
          <div style="font-size:15px;line-height:1.9;color:#1C1C1E;">
            ${body.replace(/\n/g, '<br>')}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F0F8FF;padding:20px 32px;border:1px solid #DBEAFE;border-top:none;border-radius:0 0 12px 12px;">
          <table width="100%"><tr>
            <td>
              <div style="font-size:12px;color:#475569;line-height:1.8;">
                <strong style="color:#1e40af;">Flowturai &ndash; Jeremy Jung</strong><br>
                ${ADDR}<br>
                Tel: ${TEL} &nbsp;&middot;&nbsp;
                <a href="mailto:${EMAIL}" style="color:#2563EB;text-decoration:none;">${EMAIL}</a><br>
                <span style="color:#94a3b8;font-size:11px;">Kleinunternehmer gem&auml;&szlig; &sect; 19 UStG</span>
              </div>
            </td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * E-Mail senden via IONOS
 * @param {Object} opts - { to, subject, body, attachments? }
 */
async function sendEmail({ to, subject, body, attachments = [] }) {
  const mailOptions = {
    from: `"Flowturai" <${process.env.IONOS_EMAIL}>`,
    to,
    subject,
    html: buildHtml(body),
    text: body.replace(/<[^>]+>/g, ''),
  };

  if (attachments.length > 0) {
    mailOptions.attachments = attachments.map(a => ({
      filename:    a.filename,
      content:     Buffer.from(a.content, 'base64'),
      contentType: a.content_type || 'application/octet-stream',
    }));
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Gesendet an ${to}: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail };
