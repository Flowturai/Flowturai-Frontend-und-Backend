const router = require('express').Router();
const { query }               = require('../lib/db');
const { generateContractPDF } = require('../lib/contract-pdf');
const { generateEmail }       = require('../lib/ai');
const { sendEmail }           = require('../lib/email');

// ── Hilfsfunktion: Vertragsnummer generieren VT-YYYY-NNN ──────
async function nextContractNumber() {
  const year = new Date().getFullYear();
  const key  = `contract_${year}`;
  const { rows } = await query(
    `INSERT INTO doc_sequences (key, val)
       VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE
       SET val = doc_sequences.val + 1, updated_at = NOW()
     RETURNING val`,
    [key]
  );
  return `VT-${year}-${String(rows[0].val).padStart(3, '0')}`;
}

// ── GET /contracts ─────────────────────────────────────────────
// ?archived=true zeigt archivierte Verträge
router.get('/contracts', async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const { rows } = await query(
      `SELECT ct.*, c.name AS contact_name, c.company
       FROM contracts ct
       LEFT JOIN contacts c ON c.id = ct.contact_id
       WHERE (ct.archived = false OR ct.archived IS NULL OR $1)
       ORDER BY ct.created_at DESC`,
      [showArchived]
    );
    res.json(rows);
  } catch (e) {
    console.error('[contracts GET]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /contracts/:id/pdf ─────────────────────────────────────
router.get('/contracts/:id/pdf', async (req, res) => {
  try {
    const { rows: [ct] } = await query(
      `SELECT ct.*, c.name, c.email, c.company, c.phone, c.address, c.city,
              o.line_items AS offer_line_items
       FROM contracts ct
       JOIN contacts c ON c.id = ct.contact_id
       LEFT JOIN offers o ON o.id = ct.offer_id
       WHERE ct.id = $1`,
      [req.params.id]
    );
    if (!ct) return res.status(404).json({ error: 'Vertrag nicht gefunden' });

    const contact  = { id: ct.contact_id, name: ct.name, email: ct.email, company: ct.company, address: ct.address, city: ct.city };
    const contract = { ...ct };
    const offerLineItems = ct.offer_line_items
      ? (typeof ct.offer_line_items === 'string' ? JSON.parse(ct.offer_line_items) : ct.offer_line_items)
      : [];
    const pdfBuf   = await generateContractPDF({ contract, contact, offerLineItems });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="Vertrag-${ct.contract_number}.pdf"`,
    });
    res.send(pdfBuf);
  } catch (e) {
    console.error('[contracts pdf]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /contracts ─────────────────────────────────────────────
// Body: { contactId, type, amount, startDate?, notes?, offerId?, sendEmail? }
router.post('/contracts', async (req, res) => {
  try {
    const {
      contactId,
      type       = 'betreuung',
      amount     = 0,
      startDate,
      notes,
      offerId,
      sendEmail: doSend = true,
    } = req.body;

    if (!contactId) return res.status(400).json({ error: 'contactId erforderlich' });

    const { rows: [contact] } = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (!contact) return res.status(404).json({ error: 'Kontakt nicht gefunden' });

    const contractNumber = await nextContractNumber();
    const sd = startDate || new Date().toISOString().split('T')[0];

    const { rows: [contract] } = await query(
      `INSERT INTO contracts
         (contact_id, offer_id, contract_number, type, amount, start_date, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'aktiv')
       RETURNING *`,
      [contactId, offerId || null, contractNumber, type,
       parseFloat(amount), sd, notes || null]
    );

    // Angebots-Positionen laden (wenn Angebot verknüpft)
    let offerLineItems = [];
    if (offerId) {
      const { rows: [offerRow] } = await query('SELECT line_items FROM offers WHERE id = $1', [offerId]);
      if (offerRow?.line_items) {
        offerLineItems = typeof offerRow.line_items === 'string'
          ? JSON.parse(offerRow.line_items)
          : offerRow.line_items;
      }
    }

    if (doSend) {
      try {
        const pdfBuf  = await generateContractPDF({ contract, contact, offerLineItems });
        const typeLabel = type === 'implementierung' ? 'Implementierungsvertrag' : 'Betreuungsvertrag';
        const body    = `Sehr geehrte/r ${contact.name},\n\nanbei erhalten Sie Ihren ${typeLabel} mit Flowturai.\n\nBitte prüfen Sie den Vertrag und senden Sie uns eine unterschriebene Kopie zurück – per E-Mail als Foto/Scan genügt.\n\nBei Fragen stehe ich Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\nJeremy Jung\nFlowturai`;
        await sendEmail({
          to:      contact.email,
          subject: `Ihr ${typeLabel} – ${contractNumber}`,
          body,
          attachments: [{
            filename:     `Vertrag-${contractNumber}.pdf`,
            content:      pdfBuf.toString('base64'),
            content_type: 'application/pdf',
          }],
        });
      } catch (mailErr) {
        console.warn('[contracts POST] E-Mail-Fehler:', mailErr.message);
      }
    }

    res.json({ success: true, contractNumber, contractId: contract.id });
  } catch (e) {
    console.error('[contracts POST]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /contracts/:id/archive ────────────────────────────────
router.post('/contracts/:id/archive', async (req, res) => {
  try {
    const { archived = true } = req.body;
    await query(`UPDATE contracts SET archived = $1 WHERE id = $2`, [archived, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /contracts/:id/send ────────────────────────────────────
router.post('/contracts/:id/send', async (req, res) => {
  try {
    const { rows: [ct] } = await query(
      `SELECT ct.*, c.name, c.email, c.company, c.address, c.city,
              o.line_items AS offer_line_items
       FROM contracts ct
       JOIN contacts c ON c.id = ct.contact_id
       LEFT JOIN offers o ON o.id = ct.offer_id
       WHERE ct.id = $1`,
      [req.params.id]
    );
    if (!ct) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
    const contact  = { id: ct.contact_id, name: ct.name, email: ct.email, company: ct.company, address: ct.address, city: ct.city };
    const offerLineItems = ct.offer_line_items
      ? (typeof ct.offer_line_items === 'string' ? JSON.parse(ct.offer_line_items) : ct.offer_line_items)
      : [];
    const pdfBuf   = await generateContractPDF({ contract: ct, contact, offerLineItems });
    const typeLabel = ct.type === 'implementierung' ? 'Implementierungsvertrag' : 'Betreuungsvertrag';
    const body = `Liebes${ct.company ? ` ${ct.company} Team` : 'r Kunde'},\n\nanbei erhalten Sie Ihren ${typeLabel} mit Flowturai.\n\nBitte prüfen Sie den Vertrag und senden Sie uns eine unterschriebene Kopie zurück.\n\nDein Flowturai Team`;
    await sendEmail({
      to: contact.email,
      subject: `Ihr ${typeLabel} – ${ct.contract_number}`,
      body,
      attachments: [{ filename: `Vertrag-${ct.contract_number}.pdf`, content: pdfBuf.toString('base64'), content_type: 'application/pdf' }],
    });
    res.json({ success: true });
  } catch (e) {
    console.error('[contracts send]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /contracts/:id/cancel ──────────────────────────────────
router.post('/contracts/:id/cancel', async (req, res) => {
  try {
    const { rows: [ct] } = await query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (!ct)                    return res.status(404).json({ error: 'Vertrag nicht gefunden' });
    if (ct.status === 'beendet') return res.status(409).json({ error: 'Vertrag bereits beendet' });

    await query(
      `UPDATE contracts SET status = 'beendet', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[contracts cancel]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /contacts/:id/documents ────────────────────────────────
// Alle Dokumente eines Kontakts (für Kunden-Detailansicht)
router.get('/contacts/:id/documents', async (req, res) => {
  try {
    const cid = req.params.id;

    const [invRes, offerRes, contractRes] = await Promise.all([
      query(
        `SELECT i.*, c.name AS contact_name
         FROM invoices i
         LEFT JOIN contacts c ON c.id = i.contact_id
         WHERE i.contact_id = $1
         ORDER BY i.created_at DESC`,
        [cid]
      ),
      query(
        `SELECT o.*, c.name AS contact_name
         FROM offers o
         LEFT JOIN contacts c ON c.id = o.contact_id
         WHERE o.contact_id = $1
         ORDER BY o.created_at DESC`,
        [cid]
      ),
      query(
        `SELECT ct.*, c.name AS contact_name
         FROM contracts ct
         LEFT JOIN contacts c ON c.id = ct.contact_id
         WHERE ct.contact_id = $1
         ORDER BY ct.created_at DESC`,
        [cid]
      ),
    ]);

    res.json({
      invoices:  invRes.rows,
      offers:    offerRes.rows,
      contracts: contractRes.rows,
    });
  } catch (e) {
    console.error('[contacts documents]', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
