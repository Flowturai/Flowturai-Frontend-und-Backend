-- ============================================================
-- FLOWTURAI – Lückenlose Nummernkreise + Storno + Belege
-- Ausführen: psql $DATABASE_URL -f sequences_and_storno.sql
-- ============================================================

-- ── Sequenz-Tabelle (atomar, lückenlos) ──────────────────────
-- Schlüssel-Schema: 'invoice_2026', 'offer_2026', 'expense_2026', 'storno_2026'
CREATE TABLE IF NOT EXISTS doc_sequences (
  key        TEXT    PRIMARY KEY,  -- '{type}_{year}'
  val        INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Storno-Felder ─────────────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cancellation_number TEXT,   -- ST-YYYY-NNN
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_cancellation     BOOLEAN DEFAULT FALSE,  -- TRUE = Stornorechnung
  ADD COLUMN IF NOT EXISTS cancels_invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS cancellation_number TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ;

-- ── Belegnummer für Ausgaben ──────────────────────────────────
-- Interne fortlaufende Nummer, unabhängig von receipt_ref (manuell)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;  -- B-YYYY-NNN

-- ── Index ─────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_cancellation_number
  ON invoices(cancellation_number) WHERE cancellation_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_receipt_number
  ON expenses(receipt_number) WHERE receipt_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_cancellation_number
  ON offers(cancellation_number) WHERE cancellation_number IS NOT NULL;

-- ── Vorhandene Nummern in Sequences-Tabelle einpflegen ────────
-- (Einmalig beim ersten Ausführen: aktuelle Counts übernehmen)
INSERT INTO doc_sequences (key, val)
SELECT 'invoice_' || EXTRACT(YEAR FROM created_at)::TEXT, COUNT(*)
FROM invoices
WHERE NOT is_cancellation
GROUP BY EXTRACT(YEAR FROM created_at)
ON CONFLICT (key) DO NOTHING;

INSERT INTO doc_sequences (key, val)
SELECT 'offer_' || EXTRACT(YEAR FROM created_at)::TEXT, COUNT(*)
FROM offers
GROUP BY EXTRACT(YEAR FROM created_at)
ON CONFLICT (key) DO NOTHING;

INSERT INTO doc_sequences (key, val)
SELECT 'expense_' || EXTRACT(YEAR FROM created_at)::TEXT, COUNT(*)
FROM expenses
GROUP BY EXTRACT(YEAR FROM created_at)
ON CONFLICT (key) DO NOTHING;
