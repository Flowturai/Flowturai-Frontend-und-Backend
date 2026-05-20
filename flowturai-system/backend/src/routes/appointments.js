const router = require('express').Router();
const { query } = require('../lib/db');

// GET /api/appointments/:contactId — alle Termine eines Kontakts
router.get('/appointments/:contactId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM appointments WHERE contact_id = $1 ORDER BY scheduled_at ASC`,
      [req.params.contactId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[appointments]', err);
    res.status(500).json({ error: 'Fehler beim Laden der Termine.' });
  }
});

module.exports = router;
