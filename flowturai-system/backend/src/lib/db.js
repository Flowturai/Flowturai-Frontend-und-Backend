const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('[DB] Unerwarteter Fehler:', err.message));

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (Date.now() - start > 1000) console.warn(`[DB] Langsame Query (${Date.now()-start}ms)`);
    return res;
  } catch (err) {
    console.error('[DB] Fehler:', err.message, '|', text.substring(0, 80));
    throw err;
  }
}

// ── Atomare, lückenlose Sequenzvergabe ────────────────────────
// INSERT … ON CONFLICT DO UPDATE ist in PostgreSQL atomar –
// kein SELECT+UPDATE, kein Risiko für Lücken oder Race-Conditions.
async function _nextSeq(type, year) {
  const key = `${type}_${year}`;
  const { rows } = await pool.query(
    `INSERT INTO doc_sequences (key, val)
       VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE
       SET val = doc_sequences.val + 1,
           updated_at = NOW()
     RETURNING val`,
    [key]
  );
  return rows[0].val;
}

/** Rechnungsnummer: FT-YYYY-NNN  (lückenlos, GoBD-konform) */
async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const n    = await _nextSeq('invoice', year);
  return `FT-${year}-${String(n).padStart(3, '0')}`;
}

/** Angebotsnummer: AN-YYYY-NNN  (lückenlos) */
async function nextOfferNumber() {
  const year = new Date().getFullYear();
  const n    = await _nextSeq('offer', year);
  return `AN-${year}-${String(n).padStart(3, '0')}`;
}

/** Interne Belegnummer für Ausgaben: B-YYYY-NNN */
async function nextExpenseReceiptNumber() {
  const year = new Date().getFullYear();
  const n    = await _nextSeq('expense', year);
  return `B-${year}-${String(n).padStart(3, '0')}`;
}

/** Stornonummer für stornierte Dokumente: ST-YYYY-NNN */
async function nextCancellationNumber() {
  const year = new Date().getFullYear();
  const n    = await _nextSeq('storno', year);
  return `ST-${year}-${String(n).padStart(3, '0')}`;
}

/** Einstellung aus DB lesen */
async function getSetting(key, fallback = null) {
  const { rows } = await query(`SELECT value FROM settings WHERE key = $1`, [key]);
  return rows.length ? rows[0].value : fallback;
}

/** Einstellung in DB schreiben */
async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, String(value)]
  );
}

module.exports = {
  query,
  pool,
  nextInvoiceNumber,
  nextOfferNumber,
  nextExpenseReceiptNumber,
  nextCancellationNumber,
  getSetting,
  setSetting,
};
