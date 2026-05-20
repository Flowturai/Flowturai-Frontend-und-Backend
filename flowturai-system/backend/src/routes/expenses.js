const router = require('express').Router();
const { query, nextExpenseReceiptNumber } = require('../lib/db');

const CATEGORIES = {
  software_tools:    'Software & Tools',
  fahrtkosten:       'Fahrtkosten',
  buero_material:    'Buero & Material',
  marketing_website: 'Marketing & Website',
  sonstiges:         'Sonstiges',
};

// Alle Ausgaben laden (optional gefiltert nach Jahr/Monat/Kategorie)
router.get('/expenses', async (req, res) => {
  try {
    const { year, month, category } = req.query;
    const conditions = [];
    const params     = [];

    if (year)     { params.push(year);     conditions.push('EXTRACT(YEAR  FROM expense_date) = $' + params.length); }
    if (month)    { params.push(month);    conditions.push('EXTRACT(MONTH FROM expense_date) = $' + params.length); }
    if (category) { params.push(category); conditions.push('category = $' + params.length); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await query(
      'SELECT * FROM expenses ' + where + ' ORDER BY expense_date DESC, created_at DESC',
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Neue Ausgabe erfassen
router.post('/expenses', async (req, res) => {
  try {
    const { expenseDate, category, description, amount, receiptRef, notes } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'Kategorie, Beschreibung und Betrag erforderlich' });
    }
    if (!CATEGORIES[category]) {
      return res.status(400).json({ error: 'Ungueltige Kategorie: ' + category });
    }

    const receiptNumber = await nextExpenseReceiptNumber();

    const { rows: [expense] } = await query(
      'INSERT INTO expenses (expense_date, category, description, amount, receipt_ref, receipt_number, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [expenseDate || new Date().toISOString().split('T')[0],
       category, description, parseFloat(amount),
       receiptRef || null, receiptNumber, notes || null]
    );

    res.json({ success: true, expense });
  } catch (e) {
    console.error('[expenses POST]', e);
    res.status(500).json({ error: e.message });
  }
});

// Ausgabe loeschen
router.delete('/expenses/:id', async (req, res) => {
  try {
    await query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ausgabe aktualisieren
router.put('/expenses/:id', async (req, res) => {
  try {
    const { expenseDate, category, description, amount, receiptRef, notes } = req.body;
    await query(
      'UPDATE expenses SET expense_date=$1, category=$2, description=$3, amount=$4, receipt_ref=$5, notes=$6 WHERE id=$7',
      [expenseDate, category, description, parseFloat(amount), receiptRef, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Kategorienliste
router.get('/expenses/categories', (_req, res) => res.json(CATEGORIES));

module.exports = router;
