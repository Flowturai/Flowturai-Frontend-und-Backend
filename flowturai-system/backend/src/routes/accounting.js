const router = require('express').Router();
const { query } = require('../lib/db');
const { generateEURPDF } = require('../lib/eur-pdf');

// ── Hilfsfunktionen ───────────────────────────────────────────
function toCSV(headers, rows) {
  const escape = v => {
    const s = String(v == null ? '' : v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ];
  return '﻿' + lines.join('\r\n');  // UTF-8 BOM für Excel-Kompatibilität
}

function sendCSV(res, filename, csv) {
  res.setHeader('Content-Type',        'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// ── EÜR – JSON-Daten ─────────────────────────────────────────
router.get('/accounting/eur/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);

    const [invoicesRes, expensesRes] = await Promise.all([
      query(`
        SELECT i.*, c.name AS contact_name
        FROM invoices i
        LEFT JOIN contacts c ON c.id = i.contact_id
        WHERE EXTRACT(YEAR FROM COALESCE(i.paid_at, i.created_at)) = $1
          AND (i.is_cancellation IS FALSE OR i.is_cancellation IS NULL)
        ORDER BY COALESCE(i.paid_at, i.created_at)
      `, [year]),
      query(`
        SELECT *
        FROM expenses
        WHERE EXTRACT(YEAR FROM expense_date) = $1
        ORDER BY expense_date
      `, [year]),
    ]);

    const invoices = invoicesRes.rows;
    const expenses = expensesRes.rows;

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalIncome  = paidInvoices.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    const catLabels = {
      software_tools:   'Software & Tools',
      fahrtkosten:      'Fahrtkosten',
      buero_material:   'Büro & Material',
      marketing_website:'Marketing & Website',
      sonstiges:        'Sonstiges',
    };
    const byCategory = {};
    expenses.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { label: catLabels[e.category], sum: 0, count: 0 };
      byCategory[e.category].sum   += parseFloat(e.amount);
      byCategory[e.category].count += 1;
    });

    // Monatsauflösung
    const months = {};
    for (let m = 1; m <= 12; m++) months[m] = { income: 0, expenses: 0 };
    paidInvoices.forEach(i => {
      const m = new Date(i.paid_at || i.created_at).getMonth() + 1;
      months[m].income += parseFloat(i.amount);
    });
    expenses.forEach(e => {
      const m = new Date(e.expense_date).getMonth() + 1;
      months[m].expenses += parseFloat(e.amount);
    });

    res.json({
      year,
      einnahmen: {
        total:    parseFloat(totalIncome.toFixed(2)),
        invoices: paidInvoices,
      },
      ausgaben: {
        total:      parseFloat(totalExpenses.toFixed(2)),
        byCategory,
        expenses,
      },
      gewinn: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      months,
    });
  } catch (e) {
    console.error('[accounting eur]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── EÜR – PDF-Download ────────────────────────────────────────
router.get('/accounting/eur/:year/pdf', async (req, res) => {
  try {
    const year = parseInt(req.params.year);

    const [invoicesRes, expensesRes] = await Promise.all([
      query(`
        SELECT i.*, c.name AS contact_name
        FROM invoices i
        LEFT JOIN contacts c ON c.id = i.contact_id
        WHERE EXTRACT(YEAR FROM COALESCE(i.paid_at, i.created_at)) = $1
          AND (i.is_cancellation IS FALSE OR i.is_cancellation IS NULL)
        ORDER BY COALESCE(i.paid_at, i.created_at)
      `, [year]),
      query(`
        SELECT * FROM expenses
        WHERE EXTRACT(YEAR FROM expense_date) = $1
        ORDER BY expense_date
      `, [year]),
    ]);

    const pdfBuffer = await generateEURPDF({
      year,
      invoices: invoicesRes.rows,
      expenses: expensesRes.rows,
    });

    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EÜR-Flowturai-${year}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error('[accounting eur pdf]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── CSV – Einnahmen (bezahlte Rechnungen) ─────────────────────
router.get('/accounting/export/einnahmen/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { rows } = await query(`
      SELECT i.invoice_number, i.paid_at, i.created_at, i.amount, i.description,
             i.status, c.name AS kunde, c.company
      FROM invoices i
      LEFT JOIN contacts c ON c.id = i.contact_id
      WHERE EXTRACT(YEAR FROM COALESCE(i.paid_at, i.created_at)) = $1
        AND i.status = 'paid'
        AND (i.is_cancellation IS FALSE OR i.is_cancellation IS NULL)
      ORDER BY COALESCE(i.paid_at, i.created_at)
    `, [year]);

    const fmtD = d => d ? new Date(d).toLocaleDateString('de-DE') : '';
    const csv = toCSV(
      ['Rechnungsnummer','Bezahlt am','Rechnungsdatum','Kunde','Unternehmen','Beschreibung','Betrag (€)'],
      rows.map(r => [
        r.invoice_number,
        fmtD(r.paid_at),
        fmtD(r.created_at),
        r.kunde || '',
        r.company || '',
        r.description || '',
        parseFloat(r.amount).toFixed(2).replace('.', ','),
      ])
    );

    sendCSV(res, `Einnahmen-Flowturai-${year}.csv`, csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CSV – Ausgaben ────────────────────────────────────────────
router.get('/accounting/export/ausgaben/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { rows } = await query(`
      SELECT * FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = $1
      ORDER BY expense_date
    `, [year]);

    const catLabels = {
      software_tools:   'Software & Tools',
      fahrtkosten:      'Fahrtkosten',
      buero_material:   'Büro & Material',
      marketing_website:'Marketing & Website',
      sonstiges:        'Sonstiges',
    };
    const fmtD = d => d ? new Date(d).toLocaleDateString('de-DE') : '';
    const csv = toCSV(
      ['Belegnummer (intern)','Datum','Kategorie','Beschreibung','Betrag (€)','Ext. Belegnummer','Notizen'],
      rows.map(r => [
        r.receipt_number || '',
        fmtD(r.expense_date),
        catLabels[r.category] || r.category,
        r.description,
        parseFloat(r.amount).toFixed(2).replace('.', ','),
        r.receipt_ref || '',
        r.notes || '',
      ])
    );

    sendCSV(res, `Ausgaben-Flowturai-${year}.csv`, csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CSV – Alle Rechnungen (Journal) ──────────────────────────
router.get('/accounting/export/rechnungsjournal/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { rows } = await query(`
      SELECT i.invoice_number, i.created_at, i.paid_at, i.due_date,
             i.amount, i.status, i.description,
             i.cancellation_number, i.is_cancellation,
             c.name AS kunde, c.company
      FROM invoices i
      LEFT JOIN contacts c ON c.id = i.contact_id
      WHERE EXTRACT(YEAR FROM i.created_at) = $1
      ORDER BY i.created_at
    `, [year]);

    const statusLabels = {
      paid:      'Bezahlt', sent:'Versendet', pending:'Ausstehend',
      overdue:   'Überfällig', cancelled:'Storniert',
    };
    const fmtD = d => d ? new Date(d).toLocaleDateString('de-DE') : '';
    const csv = toCSV(
      ['Rechnungsnummer','Erstellt am','Fällig am','Bezahlt am','Kunde','Unternehmen',
       'Betrag (€)','Status','Beschreibung','Stornonummer','Stornorechnung'],
      rows.map(r => [
        r.invoice_number,
        fmtD(r.created_at),
        fmtD(r.due_date),
        fmtD(r.paid_at),
        r.kunde || '',
        r.company || '',
        parseFloat(r.amount).toFixed(2).replace('.', ','),
        statusLabels[r.status] || r.status,
        r.description || '',
        r.cancellation_number || '',
        r.is_cancellation ? 'Ja' : 'Nein',
      ])
    );

    sendCSV(res, `Rechnungsjournal-Flowturai-${year}.csv`, csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CSV – Angebots-Journal ────────────────────────────────────
router.get('/accounting/export/angebotsjournal/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { rows } = await query(`
      SELECT o.offer_number, o.created_at, o.valid_until, o.amount, o.status,
             o.description, o.cancellation_number,
             c.name AS kunde, c.company
      FROM offers o
      LEFT JOIN contacts c ON c.id = o.contact_id
      WHERE EXTRACT(YEAR FROM o.created_at) = $1
      ORDER BY o.created_at
    `, [year]);

    const fmtD = d => d ? new Date(d).toLocaleDateString('de-DE') : '';
    const csv = toCSV(
      ['Angebotsnummer','Erstellt am','Gültig bis','Kunde','Unternehmen',
       'Betrag (€)','Status','Beschreibung','Stornonummer'],
      rows.map(r => [
        r.offer_number,
        fmtD(r.created_at),
        fmtD(r.valid_until),
        r.kunde || '',
        r.company || '',
        parseFloat(r.amount).toFixed(2).replace('.', ','),
        r.status,
        r.description || '',
        r.cancellation_number || '',
      ])
    );

    sendCSV(res, `Angebotsjournal-Flowturai-${year}.csv`, csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
