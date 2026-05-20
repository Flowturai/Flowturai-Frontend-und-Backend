const { query, nextInvoiceNumber, getSetting } = require('../lib/db');
const { generateInvoicePDF }                  = require('../lib/pdf');
const { generateDunningPDF }                  = require('../lib/dunning-pdf');
const { generateEmail }                       = require('../lib/ai');
const { sendEmail }                           = require('../lib/email');

// ── Monatliche Abo-Abrechnung ─────────────────────────────────
async function monthlyBilling() {
  const today      = new Date();
  const currentDay = today.getDate();
  const monthName  = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  console.log(`[Billing] Starte monatliche Abrechnung für Tag ${currentDay}…`);

  const { rows: subscriptions } = await query(
    `SELECT s.*, c.name, c.email, c.company, c.address, c.city, c.industry
     FROM subscriptions s
     JOIN contacts c ON c.id = s.contact_id
     WHERE s.status = 'active' AND s.billing_day = $1`,
    [currentDay]
  );

  if (!subscriptions.length) {
    console.log('[Billing] Keine fälligen Abos heute.');
    return;
  }

  const results = [];

  for (const sub of subscriptions) {
    const contact = {
      id: sub.contact_id, name: sub.name, email: sub.email,
      company: sub.company, address: sub.address, city: sub.city, industry: sub.industry,
    };
    try {
      const invoiceNumber = await nextInvoiceNumber();
      const dueDate       = new Date(today);
      dueDate.setDate(dueDate.getDate() + 14);

      const { rows: [invoice] } = await query(
        `INSERT INTO invoices (contact_id, subscription_id, invoice_number, amount, description, due_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'sent') RETURNING *`,
        [contact.id, sub.id, invoiceNumber, sub.price,
         `Betreuungs-Abo Flowturai – ${monthName}`,
         dueDate.toISOString().split('T')[0]]
      );

      const pdfBuffer = await generateInvoicePDF({ invoice, contact });
      const emailBody = await generateEmail('invoice_sent', contact, { betrag: sub.price });

      await sendEmail({
        to:      contact.email,
        subject: `Monatliche Rechnung ${invoiceNumber} – Flowturai Betreuungs-Abo`,
        body:    emailBody,
        attachments: [{
          filename:     `Rechnung-${invoiceNumber}.pdf`,
          content:      pdfBuffer.toString('base64'),
          content_type: 'application/pdf',
        }],
      });

      // Nächstes Abrechnungsdatum
      const next = new Date(today);
      next.setMonth(next.getMonth() + 1);
      await query(
        `UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2`,
        [next.toISOString().split('T')[0], sub.id]
      );

      results.push({ name: contact.name, status: 'ok', invoice: invoiceNumber });
      console.log(`[Billing] ✓ ${contact.name} → ${invoiceNumber}`);
    } catch (err) {
      console.error(`[Billing] ✗ ${contact.name}:`, err.message);
      results.push({ name: contact.name, status: 'fehler', error: err.message });
    }
  }

  // Admin-Zusammenfassung
  const ok   = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status === 'fehler').length;

  await sendEmail({
    to:      process.env.ADMIN_EMAIL,
    subject: `💰 Abrechnung ${monthName}: ${ok}/${results.length} erfolgreich`,
    body: [
      `Monatliche Abrechnung für ${monthName} abgeschlossen.`,
      ``,
      ...results.map(r =>
        r.status === 'ok' ? `✅ ${r.name} – ${r.invoice}` : `❌ ${r.name} – ${r.error}`
      ),
      ``,
      fail > 0 ? `⚠️  ${fail} Fehler – bitte prüfen!` : `Alles reibungslos!`,
    ].join('\n'),
  });
}

// ── Automatisches Mahnwesen ───────────────────────────────────
async function autoDunning() {
  const active    = await getSetting('dunning_active', 'true');
  if (active !== 'true') {
    console.log('[Dunning] Automatisches Mahnwesen deaktiviert.');
    return;
  }

  const interval1 = parseInt(await getSetting('dunning_interval_1', '14'));
  const interval2 = parseInt(await getSetting('dunning_interval_2', '28'));
  const fee1      = parseFloat(await getSetting('dunning_fee_1', '0'));
  const fee2      = parseFloat(await getSetting('dunning_fee_2', '0'));

  // Alle überfälligen Rechnungen, die noch keine Mahnung bekommen haben
  const { rows: candidates } = await query(`
    SELECT
      i.*,
      c.name    AS contact_name,
      c.email   AS contact_email,
      c.company, c.address, c.city,
      CURRENT_DATE - i.due_date AS days_overdue
    FROM invoices i
    LEFT JOIN contacts c ON c.id = i.contact_id
    WHERE i.status IN ('sent', 'overdue')
      AND i.due_date < CURRENT_DATE
      AND i.dunning_level < 2
    ORDER BY i.due_date ASC
  `);

  let sent = 0, skipped = 0;

  for (const inv of candidates) {
    const daysOver = parseInt(inv.days_overdue);
    let level = null;
    let fee   = 0;

    if (inv.dunning_level === 0 && daysOver >= interval1) { level = 1; fee = fee1; }
    if (inv.dunning_level === 1 && daysOver >= interval2) { level = 2; fee = fee2; }

    if (!level) { skipped++; continue; }

    const contact = {
      id:      inv.contact_id,
      name:    inv.contact_name,
      email:   inv.contact_email,
      company: inv.company,
      address: inv.address,
      city:    inv.city,
    };

    try {
      const pdfBuffer = await generateDunningPDF({ invoice: inv, contact, level, fee });
      const emailType = level === 1 ? 'dunning_1' : 'dunning_2';
      const emailBody = await generateEmail(emailType, contact, {
        rechnungsnummer: inv.invoice_number,
        betrag:          inv.amount,
        mahnstufe:       level,
        gebuehr:         fee > 0 ? fee.toFixed(2) : null,
      });

      await sendEmail({
        to:      contact.email,
        subject: `${level}. Zahlungserinnerung – Rechnung ${inv.invoice_number}`,
        body:    emailBody,
        attachments: [{
          filename:     `Mahnung-${inv.invoice_number}-Stufe${level}.pdf`,
          content:      pdfBuffer.toString('base64'),
          content_type: 'application/pdf',
        }],
      });

      await query(
        `INSERT INTO dunning_logs (invoice_id, level, fee) VALUES ($1, $2, $3)`,
        [inv.id, level, fee]
      );
      await query(
        `UPDATE invoices SET dunning_level = $1, status = 'overdue' WHERE id = $2`,
        [level, inv.id]
      );

      console.log(`[Dunning] ✓ Stufe ${level} → ${inv.invoice_number} (${contact.name})`);
      sent++;
    } catch (err) {
      console.error(`[Dunning] ✗ ${inv.invoice_number}:`, err.message);
    }
  }

  console.log(`[Dunning] Abgeschlossen: ${sent} versendet, ${skipped} noch nicht fällig.`);

  // Admin-Benachrichtigung nur wenn tatsächlich Mahnungen versendet wurden
  if (sent > 0) {
    await sendEmail({
      to:      process.env.ADMIN_EMAIL,
      subject: `📬 Mahnwesen: ${sent} Mahnung(en) automatisch versendet`,
      body: `Das automatische Mahnwesen hat heute ${sent} Mahnung(en) versendet.\n\nBitte prüfe das Dashboard für Details.`,
    }).catch(() => {});
  }
}

module.exports = { monthlyBilling, autoDunning };
