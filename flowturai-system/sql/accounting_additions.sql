-- ============================================================
-- FLOWTURAI – Buchhaltungs-Erweiterungen
-- Ausführen NACH schema.sql: psql $DATABASE_URL -f accounting_additions.sql
-- ============================================================

-- ── Angebote (AN-YYYY-NNN) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW(),
  contact_id      UUID          REFERENCES contacts(id) ON DELETE CASCADE,
  offer_number    TEXT          UNIQUE NOT NULL,       -- AN-2026-001
  amount          NUMERIC(10,2) NOT NULL,
  description     TEXT,
  line_items      JSONB         DEFAULT '[]',          -- [{pos, desc, qty, price}]
  valid_until     DATE,                                -- Gültig bis
  status          TEXT          DEFAULT 'offen'
    CHECK (status IN ('offen','angenommen','abgelehnt','abgelaufen','storniert')),
  notes           TEXT,
  invoice_id      UUID          REFERENCES invoices(id) ON DELETE SET NULL  -- nach Umwandlung
);

-- ── Ausgaben / Betriebsausgaben ──────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  expense_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  category    TEXT          NOT NULL
    CHECK (category IN ('software_tools','fahrtkosten','buero_material','marketing_website','sonstiges')),
  description TEXT          NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  receipt_ref TEXT,                                    -- Belegnummer / Dateiname
  notes       TEXT
);

-- ── System-Einstellungen (Key-Value) ─────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  label       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Mahnwesen-Einstellungen (beim ersten Start)
INSERT INTO settings (key, value, label) VALUES
  ('dunning_interval_1',  '14', '1. Mahnung nach X Tagen (ab Fälligkeitsdatum)'),
  ('dunning_interval_2',  '28', '2. Mahnung nach X Tagen (ab Fälligkeitsdatum)'),
  ('dunning_fee_1',        '0', '1. Mahngebühr (€, 0 = keine)'),
  ('dunning_fee_2',        '0', '2. Mahngebühr (€, 0 = keine)'),
  ('dunning_active',    'true', 'Automatisches Mahnwesen aktiv')
ON CONFLICT (key) DO NOTHING;

-- ── Mahnungs-Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dunning_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  invoice_id  UUID        REFERENCES invoices(id) ON DELETE CASCADE,
  level       INTEGER     NOT NULL CHECK (level IN (1, 2)),
  fee         NUMERIC(10,2) DEFAULT 0,
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Invoice-Tabelle erweitern ─────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS offer_id      UUID REFERENCES offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dunning_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_items    JSONB DEFAULT '[]';

-- ── Offers: updated_at Trigger ────────────────────────────────
DROP TRIGGER IF EXISTS offers_updated_at ON offers;
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indizes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offers_status    ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_contact   ON offers(contact_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cat     ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_dunning_invoice  ON dunning_logs(invoice_id);
