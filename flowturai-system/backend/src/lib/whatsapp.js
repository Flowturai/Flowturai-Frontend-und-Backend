/**
 * Twilio WhatsApp-Benachrichtigungen
 * Benötigt: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_WHATSAPP_TO
 * TWILIO_WHATSAPP_FROM = whatsapp:+14155238886  (Twilio Sandbox oder verifizierte Nummer)
 * TWILIO_WHATSAPP_TO   = whatsapp:+49DEINENUMMER
 */

async function sendWhatsApp(message) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;
  const to    = process.env.TWILIO_WHATSAPP_TO;

  if (!sid || !token || !from || !to) {
    console.log('[WhatsApp] Twilio nicht konfiguriert – Nachricht übersprungen:', message);
    return;
  }

  try {
    const twilio = require('twilio')(sid, token);
    await twilio.messages.create({ from, to, body: message });
    console.log('[WhatsApp] Nachricht gesendet');
  } catch (e) {
    console.warn('[WhatsApp] Sendefehler:', e.message);
  }
}

// Vordefinierte Nachrichten
const notify = {
  newContact:       (name, company) =>
    `🔔 Neue Anfrage: ${name}${company ? ` (${company})` : ''} – flowturai.de/admin`,

  offerAccepted:    (name, offerNr, invoiceNr, contractNr) =>
    `✅ Angebot angenommen!\nKunde: ${name}\nAngebot: ${offerNr}\nRechnung: ${invoiceNr}\nVertrag: ${contractNr}`,

  invoicePaid:      (name, invoiceNr, amount) =>
    `💰 Zahlung eingegangen!\nKunde: ${name}\nRechnung: ${invoiceNr}\nBetrag: ${amount} €`,

  invoiceOverdue:   (name, invoiceNr, days) =>
    `⚠️ Überfällige Rechnung!\nKunde: ${name}\nRechnung: ${invoiceNr}\n${days} Tage überfällig`,

  inboxAction:      (fromEmail, action) =>
    `📬 Neue Mail verarbeitet\nVon: ${fromEmail}\nAktion: ${action}`,
};

module.exports = { sendWhatsApp, notify };
