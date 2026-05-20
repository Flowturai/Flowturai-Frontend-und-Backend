const router  = require('express').Router();
const { query, nextInvoiceNumber, nextCancellationNumber } = require('../lib/db');
const { generateInvoicePDF }       = require('../lib/pdf');
const { generateEmail }            = require('../lib/ai');
const { sendEmail }                = require('../lib/email');
const { sendWhatsApp, notify }     = require('../lib/whatsapp');

// Alle Rechnungen laden (Admin) – ?archived=true zeigt archivierte
router.get('/invoices', async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const result = await query(
      `SELECT i.*, c.name AS contact_name
       FROM invoices i
       LEFT JOIN contacts c ON c.id = i.contact_id
       WHERE (i.archived = false OR i.archived IS NULL OR $1)
       ORDER BY i.created_at DESC`,
      [showArchived]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[invoices GET]', err);
    res.status(500).json({ error: 'Fehler beim Laden der Rechnungen' });
  }
});

// Neue Rechnung erstellen & versenden (Admin)
router.post('/send-invoice', async (req, res) => {
  try {
    let { contactId, amount, description, dueInDays = 14, projectId = null, contractId = null } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId erforderlich' });
    }

    // Daten automatisch aus Vertrag übernehmen (wenn contractId gesetzt und Felder leer)
    if (contractId && (!amount || !description)) {
      const { rows: [ct] } = await query('SELECT * FROM contracts WHERE id = $1', [contractId]);
      if (ct) {
        if (!amount)      amount      = ct.amount;
        if (!description) description = ct.notes || `${ct.type === 'implementierung' ? 'Implementierungsprojekt' : 'Betreuungs-Abo'} – Flowturai`;
      }
    }

    if (!amount || !description) {
      return res.status(400).json({ error: 'amount und description erforderlich (oder contractId zum automatischen Befüllen)' });
    }

    const cr = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (!cr.rows.length) return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    const contact = cr.rows[0];

    const invoiceNumber = await nextInvoiceNumber();
    const dueDate       = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);

    const ir = await query(
      `INSERT INTO invoices (contact_id, project_id, invoice_number, amount, description, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent')
       RETURNING *`,
      [contactId, projectId, invoiceNumber, parseFloat(amount), description, dueDate.toISOString().split('T')[0]]
    );
    const invoice = ir.rows[0];

    const pdfBuffer = await generateInvoicePDF({ invoice, contact });
    const body      = await generateEmail('invoice_sent', contact, { betrag: amount });

    await sendEmail({
      to:      contact.email,
      subject: `Rechnung ${invoiceNumber} von Flowturai`,
      body,
      attachments: [{
        filename:     `Rechnung-${invoiceNumber}.pdf`,
        content:      pdfBuffer.toString('base64'),
        content_type: 'application/pdf',
      }],
    });

    res.json({ success: true, invoiceNumber });
  } catch (err) {
    console.error('[send-invoice]', err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Rechnung' });
  }
});

// Rechnung als bezahlt markieren (Admin)
router.post('/invoice/:id/paid', async (req, res) => {
  try {
    const { rows: [inv] } = await query(
      `SELECT i.*, c.name FROM invoices i JOIN contacts c ON c.id=i.contact_id WHERE i.id=$1`,
      [req.params.id]
    );
    await query(`UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1`, [req.params.id]);
    if (inv) await sendWhatsApp(notify.invoicePaid(inv.name, inv.invoice_number, parseFloat(inv.amount).toFixed(2)));
    res.json({ success: true });
  } catch (err) {
    console.error('[invoice paid]', err);
    res.status(500).json({ error: 'Fehler' });
  }
});

// Rechnung stornieren – erzeugt Stornorechnung + Stornonummer (GoBD-konform)
router.post('/invoice/:id/cancel', async (req, res) => {
  try {
    const { rows: [invoice] } = await query(
      `SELECT i.*, c.name AS contact_name, c.email AS contact_email,
              c.company, c.address, c.city
       FROM invoices i LEFT JOIN contacts c ON c.id = i.contact_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    if (invoice.status === 'cancelled') {
      return res.status(409).json({ error: 'Rechnung ist bereits storniert' });
    }

    const cancellationNumber = await nextCancellationNumber();
    const stornoNumber       = await nextInvoiceNumber();   // eigene Rechnungsnr. für Stornorechnung
    const now                = new Date().toISOString();

    // Original als storniert markieren
    await query(
      `UPDATE invoices
         SET status = 'cancelled', cancellation_number = $1, cancelled_at = $2
       WHERE id = $3`,
      [cancellationNumber, now, invoice.id]
    );

    // Stornorechnung anlegen (negativer Betrag, is_cancellation = TRUE)
    const { rows: [storno] } = await query(
      `INSERT INTO invoices
         (contact_id, invoice_number, amount, description, due_date,
          status, is_cancellation, cancels_invoice_id, cancellation_number, line_items)
       VALUES ($1, $2, $3, $4, $5, 'cancelled', TRUE, $6, $7, $8)
       RETURNING *`,
      [
        invoice.contact_id,
        stornoNumber,
        -Math.abs(parseFloat(invoice.amount)),
        `STORNO zu ${invoice.invoice_number}: ${invoice.description}`,
        now.split('T')[0],
        invoice.id,
        cancellationNumber,
        invoice.line_items || '[]',
      ]
    );

    res.json({ success: true, cancellationNumber, stornoInvoiceNumber: stornoNumber });
  } catch (err) {
    console.error('[invoice cancel]', err);
    res.status(500).json({ error: err.message });
  }
});

// Rechnung manuell versenden (Admin)
router.post('/invoice/:id/send', async (req, res) => {
  try {
    const { rows: [inv] } = await query(
      `SELECT i.*, c.name, c.email, c.company, c.address, c.city
       FROM invoices i JOIN contacts c ON c.id = i.contact_id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!inv) return res.status(404).json({ error: 'Rechnung nicht gefunden' });
    const contact = { id: inv.contact_id, name: inv.name, email: inv.email, company: inv.company, address: inv.address, city: inv.city };
    const pdfBuf  = await generateInvoicePDF({ invoice: inv, contact });
    const body    = await generateEmail('invoice_sent', contact, { betrag: inv.amount });
    await sendEmail({
      to: contact.email,
      subject: `Rechnung ${inv.invoice_number} von Flowturai`,
      body,
      attachments: [{ filename: `Rechnung-${inv.invoice_number}.pdf`, content: pdfBuf.toString('base64'), content_type: 'application/pdf' }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[invoice send]', err);
    res.status(500).json({ error: err.message });
  }
});

// Rechnung archivieren (Admin)
router.post('/invoice/:id/archive', async (req, res) => {
  try {
    const { archived = true } = req.body;
    await query(`UPDATE invoices SET archived = $1 WHERE id = $2`, [archived, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rechnung als PDF herunterladen (Admin)
router.get('/invoice/:id/pdf', async (req, res) => {
  try {
    const { rows: [inv] } = await query(
      `SELECT i.*, c.name, c.email, c.company, c.phone, c.address, c.city
       FROM invoices i
       JOIN contacts c ON c.id = i.contact_id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!inv) return res.status(404).json({ error: 'Rechnung nicht gefunden' });

    const contact = { id: inv.contact_id, name: inv.name, email: inv.email, company: inv.company, address: inv.address, city: inv.city };
    const invoice = { ...inv };
    const pdfBuf  = await generateInvoicePDF({ invoice, contact });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="Rechnung-${inv.invoice_number}.pdf"`,
    });
    res.send(pdfBuf);
  } catch (err) {
    console.error('[invoice pdf]', err);
    res.status(500).json({ error: err.message });
  }
});

// Abos laden
router.get('/subscriptions', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, c.name AS contact_name
       FROM subscriptions s
       LEFT JOIN contacts c ON c.id = s.contact_id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Fehler' });
  }
});

// Neues Abo anlegen (Admin)
router.post('/subscriptions', async (req, res) => {
  try {
    const { contactId, price, billingDay = 1 } = req.body;
    await query(
      `INSERT INTO subscriptions (contact_id, price, billing_day, status, start_date)
       VALUES ($1, $2, $3, 'active', CURRENT_DATE)`,
      [contactId, parseFloat(price), billingDay]
    );

    // Kontakt auf Stufe 4 setzen + Willkommens-Mail
    const cr = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (cr.rows.length) {
      await query('UPDATE contacts SET status = $1 WHERE id = $2', ['stufe4', contactId]);
      const body = await generateEmail('subscription_welcome', cr.rows[0]);
      await sendEmail({ to: cr.rows[0].email, subject: 'Willkommen im Betreuungs-Abo', body });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[subscriptions POST]', err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Abos' });
  }
});

// Abo kündigen (Admin)
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    await query(`UPDATE subscriptions SET status = 'cancelled' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Fehler' });
  }
});

module.exports = router;
