const router  = require('express').Router();
const { query }         = require('../lib/db');
const { generateEmail } = require('../lib/ai');
const { sendEmail }     = require('../lib/email');

const STAGE_EMAIL = {
  stufe1:        { subject: 'Nächste Schritte mit Flowturai',       type: 'followup_stufe1' },
  stufe2:        { subject: 'Ihre Vor-Ort-Analyse ist bestätigt',   type: 'confirmation_analyse' },
  stufe3:        { subject: 'Ihr Implementierungsprojekt startet',  type: 'project_start' },
  stufe4:        { subject: 'Willkommen im Betreuungs-Abo',         type: 'subscription_welcome' },
  abgeschlossen: null,
  verloren:      null,
};

// Alle Kontakte laden (Admin)
router.get('/contacts', async (req, res) => {
  try {
    const { status } = req.query;
    const params     = status ? [status] : [];
    const where      = status ? 'WHERE status = $1' : '';
    const result     = await query(
      `SELECT * FROM contacts ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[contacts GET]', err);
    res.status(500).json({ error: 'Fehler beim Laden der Kontakte' });
  }
});

// Kontakt manuell anlegen (Admin)
router.post('/contacts', async (req, res) => {
  try {
    const { name, email, phone, company, industry, address, city, status = 'lead', notes, sendEmail: doSend = false } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }

    const result = await query(
      `INSERT INTO contacts (name, email, phone, company, industry, address, city, status, notes, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual')
       RETURNING *`,
      [
        name.trim(),
        email ? email.trim().toLowerCase() : null,
        phone   || null,
        company || null,
        industry || null,
        address || null,
        city    || null,
        status,
        notes   || null,
      ]
    );
    const contact = result.rows[0];

    if (doSend && contact.email) {
      try {
        const body = await generateEmail('confirmation', contact);
        await sendEmail({
          to:      contact.email,
          subject: 'Ihre Anfrage bei Flowturai – wir melden uns bald!',
          body,
        });
      } catch (mailErr) {
        console.warn('[contacts POST] E-Mail konnte nicht gesendet werden:', mailErr.message);
      }
    }

    res.json(contact);
  } catch (err) {
    console.error('[contacts POST]', err);
    res.status(500).json({ error: 'Fehler beim Anlegen des Kontakts' });
  }
});

// Kontakt bearbeiten (Admin)
router.put('/contacts/:id', async (req, res) => {
  try {
    const { name, email, phone, company, industry, address, city, notes, status } = req.body;
    const { rows: [contact] } = await query(
      `UPDATE contacts
       SET name=$1, email=$2, phone=$3, company=$4, industry=$5,
           address=$6, city=$7, notes=$8, status=COALESCE($9, status), updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [
        name?.trim()  || null,
        email ? email.trim().toLowerCase() : null,
        phone   || null,
        company || null,
        industry || null,
        address || null,
        city    || null,
        notes   || null,
        status  || null,
        req.params.id,
      ]
    );
    if (!contact) return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    res.json(contact);
  } catch (err) {
    console.error('[contacts PUT]', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kontakts' });
  }
});

// Status eines Kontakts ändern (Admin)
router.post('/update-stage', async (req, res) => {
  try {
    const { contactId, newStage, note, sendNotification = true } = req.body;

    if (!contactId || !newStage) {
      return res.status(400).json({ error: 'contactId und newStage erforderlich' });
    }

    const cr = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (!cr.rows.length) return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    const contact = cr.rows[0];

    // Notiz anhängen
    const updatedNotes = note
      ? `${contact.notes ? contact.notes + '\n' : ''}[${new Date().toLocaleDateString('de-DE')}] ${note}`
      : contact.notes;

    await query(
      'UPDATE contacts SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3',
      [newStage, updatedNotes, contactId]
    );

    // Automatische E-Mail
    const cfg = STAGE_EMAIL[newStage];
    if (sendNotification && cfg) {
      const body = await generateEmail(cfg.type, { ...contact, notes: updatedNotes });
      await sendEmail({ to: contact.email, subject: cfg.subject, body });
    }

    res.json({ success: true, message: `${contact.name} → ${newStage}` });
  } catch (err) {
    console.error('[update-stage]', err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

module.exports = router;
