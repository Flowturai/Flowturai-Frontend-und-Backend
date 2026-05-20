const router = require('express').Router();
const { query, getSetting, setSetting } = require('../lib/db');
const { generateDunningPDF }            = require('../lib/dunning-pdf');
const { generateEmail }                 = require('../lib/ai');
const { sendEmail }                     = require('../lib/email');

// ── Mahnwesen-Einstellungen laden ─────────────────────────────
router.get('/dunning/settings', async (_req, res) => {
  try {
    const keys = ['dunning_interval_1','dunning_interval_2','dunning_fee_1','dunning_fee_2','dunning_active'];
    const result = {};
    for (const key of keys) result[key] = await getSetting(key);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Mahnwesen-Einstellungen speichern ─────────────────────────
router.post('/dunning/settings', async (req, res) => {
  try {
    const allowed = ['dunning_interval_1','dunning_interval_2','dunning_fee_1','dunning_fee_2','dunning_active'];
    for (const [key, val] of Object.entries(req.body)) {
      if (allowed.includes(key)) await setSetting(key, val);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Mahnkandidaten anzeigen ───────────────────────────────────
// Gibt überfällige Rechnungen zurück, die noch keine Mahnung
// oder erst die 1. Mahnung erhalten haben.
router.get('/dunning/candidates', async (_req, res) => {
  try {
    const interval1 = parseInt(await getSetting('dunning_interval_1', '14'));
    const interval2 = parseInt(await getSetting('dunning_interval_2', '28'));

    const { rows } = await query(`
      SELECT
        i.*,
        c.name       AS contact_name,
        c.email      AS contact_email,
        c.company    AS contact_company,
        c.address    AS contact_address,
        c.city       AS contact_city,
        CURRENT_DATE - i.due_date AS days_overdue
      FROM invoices i
      LEFT JOIN contacts c ON c.id = i.contact_id
      WHERE i.status IN ('sent','overdue')
        AND i.due_date < CURRENT_DATE
        AND i.dunning_level < 2
      ORDER BY i.due_date ASC
    `);

    const enriched = rows.map(r => ({
      ...r,
      next_dunning_level: r.dunning_level + 1,
      eligible_for_level1: r.dunning_level === 0 && r.days_overdue >= interval1,
      eligible_for_level2: r.dunning_level === 1 && r.days_overdue >= interval2,
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Mahnung manuell versenden ─────────────────────────────────
router.post('/dunning/:invoiceId/send', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Rechnung + Kontakt laden
    const { rows: [invoice] } = await query(
      `SELECT i.*, c.name AS contact_name, c.email AS contact_email,
              c.company, c.address, c.city
       FROM invoices i
       LEFT JOIN contacts c ON c.id = i.contact_id
       WHERE i.id = $1`,
      [invoiceId]
    );
    if (!invoice) return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    if (invoice.dunning_level >= 2) {
      return res.status(409).json({ error: 'Maximale Mahnstufe bereits erreicht' });
    }

    const newLevel = invoice.dunning_level + 1;
    const fee      = parseFloat(await getSetting(`dunning_fee_${newLevel}`, '0'));

    const contact = {
      id:      invoice.contact_id,
      name:    invoice.contact_name,
      email:   invoice.contact_email,
      company: invoice.company,
      address: invoice.address,
      city:    invoice.city,
    };

    // PDF + E-Mail generieren
    const pdfBuffer = await generateDunningPDF({ invoice, contact, level: newLevel, fee });
    const emailType = newLevel === 1 ? 'dunning_1' : 'dunning_2';
    const emailBody = await generateEmail(emailType, contact, {
      rechnungsnummer: invoice.invoice_number,
      betrag:          invoice.amount,
      mahnstufe:       newLevel,
      gebuehr:         fee > 0 ? fee.toFixed(2) : null,
    });

    await sendEmail({
      to:      contact.email,
      subject: `${newLevel}. Zahlungserinnerung – Rechnung ${invoice.invoice_number}`,
      body:    emailBody,
      attachments: [{
        filename:     `Mahnung-${invoice.invoice_number}-Stufe${newLevel}.pdf`,
        content:      pdfBuffer.toString('base64'),
        content_type: 'application/pdf',
      }],
    });

    // Mahnungs-Log + Rechnung aktualisieren
    await query(
      `INSERT INTO dunning_logs (invoice_id, level, fee) VALUES ($1, $2, $3)`,
      [invoiceId, newLevel, fee]
    );
    await query(
      `UPDATE invoices SET dunning_level = $1, status = 'overdue' WHERE id = $2`,
      [newLevel, invoiceId]
    );

    res.json({ success: true, level: newLevel, fee });
  } catch (e) {
    console.error('[dunning send]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Mahnungs-Log laden ────────────────────────────────────────
router.get('/dunning/log', async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        dl.*,
        i.invoice_number,
        c.name AS contact_name
      FROM dunning_logs dl
      LEFT JOIN invoices i ON i.id = dl.invoice_id
      LEFT JOIN contacts c ON c.id = i.contact_id
      ORDER BY dl.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
