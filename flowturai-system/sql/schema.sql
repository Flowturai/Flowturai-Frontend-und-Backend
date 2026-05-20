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
