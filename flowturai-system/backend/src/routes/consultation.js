const router  = require('express').Router();
const { query }         = require('../lib/db');
const { generateEmail } = require('../lib/ai');
const { sendEmail }     = require('../lib/email');

router.post('/book-consultation', async (req, res) => {
  try {
    const { name, email, phone, company, industry, message,
            selectedPackage, preferredDate, address, city } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name und E-Mail sind erforderlich.' });
    }

    const notes = selectedPackage ? `Paketinteresse: ${selectedPackage}` : null;

    // Kontakt anlegen (address + city bereits im Schema)
    const result = await query(
      `INSERT INTO contacts (name, email, phone, company, industry, message, status, source, notes, address, city)
       VALUES ($1, $2, $3, $4, $5, $6, 'lead', 'website', $7, $8, $9)
       RETURNING *`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone    || null,
        company  || null,
        industry || null,
        message  || null,
        notes,
        address  || null,
        city     || null,
      ]
    );
    const contact = result.rows[0];

    // Wunschtermin als Appointment speichern (status: pending)
    if (preferredDate) {
      await query(
        `INSERT INTO appointments (contact_id, type, scheduled_at, status, notes)
         VALUES ($1, 'erstgespraech', $2, 'pending', 'Wunschtermin vom Kunden (unbestätigt)')`,
        [contact.id, new Date(preferredDate)]
      ).catch(() => {});
    }

    // KI-Bestätigungs-Mail an Kunden
    const body = await generateEmail('confirmation', contact);
    await sendEmail({
      to:      contact.email,
      subject: 'Ihre Anfrage bei Flowturai – wir melden uns bald!',
      body,
    });

    // Interne Benachrichtigung (ohne Dashboard-Link)
    const lines = [
      `<strong>Neue Website-Anfrage!</strong>`,
      ``,
      `<strong>Name:</strong> ${contact.name}`,
      `<strong>E-Mail:</strong> ${contact.email}`,
      `<strong>Telefon:</strong> ${contact.phone   || '—'}`,
      `<strong>Betrieb:</strong> ${contact.company || '—'}`,
      `<strong>Anschrift:</strong> ${contact.address ? `${contact.address}, ${contact.city || ''}` : '—'}`,
    ];
    if (selectedPackage) lines.push(`<strong>Paket:</strong> ${selectedPackage}`);
    if (preferredDate)   lines.push(`<strong>Wunschtermin:</strong> ${new Date(preferredDate).toLocaleDateString('de-DE')} (unbestätigt)`);
    lines.push(``, `<strong>Nachricht:</strong>`, contact.message || '(keine)');

    await sendEmail({
      to:      process.env.ADMIN_EMAIL,
      subject: `📥 Neue Anfrage: ${contact.name}${contact.company ? ` (${contact.company})` : ''}${selectedPackage ? ` – ${selectedPackage}` : ''}`,
      body:    lines.join('\n'),
    });

    res.json({ success: true, message: 'Anfrage erhalten! Wir melden uns innerhalb von 24 Stunden.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
    }
    console.error('[consultation]', err);
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' });
  }
});

module.exports = router;
