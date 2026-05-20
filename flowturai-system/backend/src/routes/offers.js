const router = require('express').Router();
const { query, nextOfferNumber, nextInvoiceNumber, nextCancellationNumber } = require('../lib/db');
const { generateOfferPDF }  = require('../lib/offer-pdf');
const { generateEmail }     = require('../lib/ai');
const { sendEmail }         = require('../lib/email');

// Alle Angebote laden – ?archived=true zeigt archivierte
router.get('/offers', async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const { rows } = await query(
      `SELECT o.*, c.name AS contact_name, c.company
       FROM offers o
       LEFT JOIN contacts c ON c.id = o.contact_id
       WHERE (o.archived = false OR o.archived IS NULL OR $1)
       ORDER BY o.created_at DESC`,
      [showArchived]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Neues Angebot erstellen
router.post('/offers', async (req, res) => {
  try {
    const { contactId, lineItems = [], notes, validDays = 30 } = req.body;

    if (!contactId || !lineItems.length) {
      return res.status(400).json({ error: 'Kontakt und mindestens eine Position erforderlich' });
    }

    const amount = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.qty || 1) * parseFloat(item.price || 0));
    }, 0);

    const description = lineItems.map(i => i.desc).filter(Boolean).join(', ');
    const validUntil  = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const offerNumber = await nextOfferNumber();

    const { rows: [offer] } = await query(
      `INSERT INTO offers (contact_id, offer_number, amount, description, line_items, valid_until, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'offen', $7)
       RETURNING *`,
      [contactId, offerNumber, amount, description,
       JSON.stringify(lineItems), validUntil.toISOString().split('T')[0], notes || null]
    );

    const { rows: [contact] } = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);

    const pdfBuffer = await generateOfferPDF({ offer, contact });
    const emailBody = await generateEmail('offer_sent', contact, { betrag: amount.toFixed(2) });

    await sendEmail({
      to:      contact.email,
      subject: `Angebot ${offerNumber} von Flowturai`,
      body:    emailBody,
      attachments: [{
        filename:     `Angebot-${offerNumber}.pdf`,
        content:      pdfBuffer.toString('base64'),
        content_type: 'application/pdf',
      }],
    });

    res.json({ success: true, offerNumber, offerId: offer.id });
  } catch (e) {
    console.error('[offers POST]', e);
    res.status(500).json({ error: e.message });
  }
});

// Angebot -> Rechnung umwandeln
router.post('/offers/:id/convert', async (req, res) => {
  try {
    const { rows: [offer] } = await query(
      `SELECT o.*, c.* FROM offers o JOIN contacts c ON c.id = o.contact_id WHERE o.id = $1`,
      [req.params.id]
    );
    if (!offer) return res.status(404).json({ error: 'Angebot nicht gefunden' });
    if (offer.status !== 'offen') {
      return res.status(409).json({ error: 'Angebot ist bereits ' + offer.status });
    }

    const invoiceNumber = await nextInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const { rows: [invoice] } = await query(
      `INSERT INTO invoices
         (contact_id, offer_id, invoice_number, amount, description, line_items, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
       RETURNING *`,
      [offer.contact_id, offer.id, invoiceNumber, offer.amount,
       offer.description, offer.line_items,
       dueDate.toISOString().split('T')[0]]
    );

    await query(
      `UPDATE offers SET status = 'angenommen', invoice_id = $1 WHERE id = $2`,
      [invoice.id, offer.id]
    );

    const { generateInvoicePDF } = require('../lib/pdf');
    const contact = {
      id:      offer.contact_id,
      name:    offer.name,
      email:   offer.email,
      company: offer.company,
      address: offer.address,
      city:    offer.city,
    };
    const pdfBuffer = await generateInvoicePDF({ invoice, contact });
    const emailBody = await generateEmail('invoice_sent', contact, { betrag: offer.amount });

    await sendEmail({
      to:      contact.email,
      subject: 'Rechnung ' + invoiceNumber + ' von Flowturai (aus Angebot ' + offer.offer_number + ')',
      body:    emailBody,
      attachments: [{
        filename:     'Rechnung-' + invoiceNumber + '.pdf',
        content:      pdfBuffer.toString('base64'),
        content_type: 'application/pdf',
      }],
    });

    res.json({ success: true, invoiceNumber, invoiceId: invoice.id });
  } catch (e) {
    console.error('[offers/convert]', e);
    res.status(500).json({ error: e.message });
  }
});

// Angebot archivieren (Admin)
router.post('/offers/:id/archive', async (req, res) => {
  try {
    const { archived = true } = req.body;
    await query(`UPDATE offers SET archived = $1 WHERE id = $2`, [archived, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Angebot als PDF herunterladen (Admin)
router.get('/offers/:id/pdf', async (req, res) => {
  try {
    const { rows: [offer] } = await query(
      `SELECT o.*, c.name, c.email, c.company, c.phone, c.address, c.city
       FROM offers o
       JOIN contacts c ON c.id = o.contact_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!offer) return res.status(404).json({ error: 'Angebot nicht gefunden' });

    const contact = { id: offer.contact_id, name: offer.name, email: offer.email, company: offer.company, address: offer.address, city: offer.city };
    const pdfBuf  = await generateOfferPDF({ offer, contact });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="Angebot-${offer.offer_number}.pdf"`,
    });
    res.send(pdfBuf);
  } catch (err) {
    console.error('[offers pdf]', err);
    res.status(500).json({ error: err.message });
  }
});

// Angebot manuell versenden (Admin)
router.post('/offers/:id/send', async (req, res) => {
  try {
    const { rows: [offer] } = await query(
      `SELECT o.*, c.name, c.email, c.company, c.address, c.city
       FROM offers o JOIN contacts c ON c.id = o.contact_id WHERE o.id = $1`,
      [req.params.id]
    );
    if (!offer) return res.status(404).json({ error: 'Angebot nicht gefunden' });
    const contact = { id: offer.contact_id, name: offer.name, email: offer.email, company: offer.company, address: offer.address, city: offer.city };
    const pdfBuf  = await generateOfferPDF({ offer, contact });
    const body    = await generateEmail('offer_sent', contact, { betrag: parseFloat(offer.amount).toFixed(2) });
    await sendEmail({
      to: contact.email,
      subject: `Angebot ${offer.offer_number} von Flowturai`,
      body,
      attachments: [{ filename: `Angebot-${offer.offer_number}.pdf`, content: pdfBuf.toString('base64'), content_type: 'application/pdf' }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[offers send]', err);
    res.status(500).json({ error: err.message });
  }
});

// Angebot stornieren (GoBD-konform, mit Stornonummer)
router.post('/offers/:id/cancel', async (req, res) => {
  try {
    const { rows: [offer] } = await query('SELECT * FROM offers WHERE id = $1', [req.params.id]);
    if (!offer) return res.status(404).json({ error: 'Angebot nicht gefunden' });
    if (offer.status === 'storniert') return res.status(409).json({ error: 'Bereits storniert' });

    const cancellationNumber = await nextCancellationNumber();
    await query(
      'UPDATE offers SET status = $1, cancellation_number = $2, cancelled_at = NOW() WHERE id = $3',
      ['storniert', cancellationNumber, req.params.id]
    );
    res.json({ success: true, cancellationNumber });
  } catch (e) {
    console.error('[offers cancel]', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
