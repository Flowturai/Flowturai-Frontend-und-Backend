const router       = require('express').Router();
const { query }    = require('../lib/db');
const { checkInbox } = require('../cron/inbox');

// GET /inbox – Protokoll aller verarbeiteten Mails
router.get('/inbox', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT il.*, c.name AS contact_name
       FROM inbox_log il
       LEFT JOIN contacts c ON c.id = il.contact_id
       ORDER BY il.processed_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error('[inbox GET]', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /inbox/check – Posteingang manuell prüfen (Admin)
router.post('/inbox/check', async (req, res) => {
  try {
    // Non-blocking: starten, sofort antworten
    checkInbox().catch(e => console.error('[inbox/check]', e));
    res.json({ success: true, message: 'Posteingang-Prüfung gestartet' });
  } catch (e) {
    console.error('[inbox/check]', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
