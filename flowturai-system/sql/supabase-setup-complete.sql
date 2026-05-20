-- ============================================================
-- FLOWTURAI – PostgreSQL Schema v2
-- Einmalig ausführen: psql $DATABASE_URL -f schema.sql
-- (Docker führt dies automatisch beim ersten Start aus)
-- ============================================================

-- Kunden & Leads
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  phone       TEXT,
  company     TEXT,
  industry    TEXT,
  message     TEXT,
  address     TEXT,
  city        TEXT,
  status      TEXT        DEFAULT 'lead'
    CHECK (status IN ('lead','stufe1','stufe2','stufe3','stufe4','abgeschlossen','verloren')),
  notes       TEXT,
  source      TEXT        DEFAULT 'website'
);

-- Termine
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  contact_id    UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  type          TEXT        CHECK (type IN ('erstgespraech','analyse')),
  scheduled_at  TIMESTAMPTZ,
  status        TEXT        DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes         TEXT
);

-- Projekte (Stufe 2 + 3)
CREATE TABLE IF NOT EXISTS projects (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  contact_id  UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  stufe       INTEGER     CHECK (stufe IN (2,3)),
  title       TEXT,
  price       NUMERIC(10,2),
  status      TEXT        DEFAULT 'active'
    CHECK (status IN ('active','completed','paused')),
  start_date  DATE,
  end_date    DATE,
  notes       TEXT
);

-- Betreuungs-Abos (Stufe 4)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  contact_id        UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  price             NUMERIC(10,2) NOT NULL,
  billing_day       INTEGER     DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  status            TEXT        DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled')),
  start_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date DATE
);

-- Rechnungen
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  contact_id      UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
  subscription_id UUID        REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number  TEXT        UNIQUE NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  status          TEXT        DEFAULT 'pending'
    CHECK (status IN ('pending','sent','paid','overdue','cancelled')),
  description     TEXT
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_contacts_status    ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created   ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status    ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created   ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subs_billing       ON subscriptions(billing_day, status);

-- updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_updated_at ON contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
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
