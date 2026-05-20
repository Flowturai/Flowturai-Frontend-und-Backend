/**
 * monthly-billing.js
 * Läuft automatisch jeden 1. des Monats um 08:00 Uhr (netlify.toml cron).
 * Erstellt für alle aktiven Abos eine Rechnung und verschickt sie.
 */

const { supabase }           = require('./lib/supabase');
const { generateInvoicePDF } = require('./lib/pdf');
const { sendEmail }          = require('./lib/email');

exports.handler = async () => {
  const today      = new Date();
  const currentDay = today.getDate();
  const monthName  = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Alle aktiven Abos die heute fällig sind
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*, contacts(*)')
    .eq('status', 'active')
    .eq('billing_day', currentDay);

  if (error) {
    console.error('[monthly-billing] Fehler beim Laden der Abos:', error);
    return { statusCode: 500, body: 'Datenbankfehler' };
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('[monthly-billing] Keine fälligen Abos heute.');
    return { statusCode: 200, body: 'Keine fälligen Abos' };
  }

  const results = [];

  for (const sub of subscriptions) {
    const contact = sub.contacts;
    try {
      // Rechnungsnummer
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      const invoiceNumber = `FT-${today.getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 14);

      // Rechnung anlegen
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          contact_id:     contact.id,
          subscription_id: sub.id,
          invoice_number:  invoiceNumber,
          amount:          sub.price,
          description:     `Betreuungs-Abo Flowturai – ${monthName}`,
          due_date:        dueDate.toISOString().split('T')[0],
          status:          'sent',
        })
        .select()
        .single();

      if (invErr) throw invErr;

      // PDF generieren & senden
      const pdfBuffer = await generateInvoicePDF({ invoice, contact });

      await sendEmail({
        to:      contact.email,
        subject: `Monatliche Rechnung ${invoiceNumber} – Flowturai Betreuungs-Abo`,
        body:    [
          `Hallo ${contact.name},`,
          ``,
          `beiliegend finden Sie Ihre monatliche Rechnung für das Betreuungs-Abo (${monthName}).`,
          ``,
          `Bei Fragen bin ich jederzeit erreichbar.`,
          ``,
          `Viele Grüße`,
          `Jeremy von Flowturai`,
        ].join('\n'),
        attachments: [{
          filename:     `Rechnung-${invoiceNumber}.pdf`,
          content:      pdfBuffer.toString('base64'),
          content_type: 'application/pdf',
        }],
      });

      // Nächstes Abrechnungsdatum setzen
      const nextBilling = new Date(today);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      await supabase
        .from('subscriptions')
        .update({ next_billing_date: nextBilling.toISOString().split('T')[0] })
        .eq('id', sub.id);

      results.push({ contact: contact.name, status: 'ok', invoice: invoiceNumber });
    } catch (err) {
      console.error(`[monthly-billing] Fehler bei ${contact?.name}:`, err);
      results.push({ contact: contact?.name || sub.id, status: 'fehler', error: err.message });
    }
  }

  // Admin-Zusammenfassung
  const ok    = results.filter(r => r.status === 'ok').length;
  const fail  = results.filter(r => r.status === 'fehler').length;

  await sendEmail({
    to:      process.env.ADMIN_EMAIL || 'jungjeremy28@gmail.com',
    subject: `💰 Monatliche Abrechnung abgeschlossen – ${ok}/${results.length} erfolgreich`,
    body:    [
      `Monatliche Abrechnung für ${monthName}:`,
      ``,
      ...results.map(r =>
        r.status === 'ok'
          ? `✅ ${r.contact} – ${r.invoice}`
          : `❌ ${r.contact} – FEHLER: ${r.error}`
      ),
      ``,
      fail > 0 ? `⚠️ ${fail} Fehler – bitte im Dashboard prüfen.` : `Alles reibungslos gelaufen!`,
    ].join('\n'),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, processed: results.length, ok, fail }),
  };
};
