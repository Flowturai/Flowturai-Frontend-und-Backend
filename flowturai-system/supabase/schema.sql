-- ============================================================
-- FLOWTURAI – Datenbankschema
-- Einmalig in Supabase SQL-Editor ausführen
-- ============================================================

-- Kunden & Leads
CREATE TABLE contacts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  company         TEXT,
  industry        TEXT,
  message         TEXT,
  address         TEXT,
  city            TEXT,
  status          TEXT DEFAULT 'lead' CHECK (status IN (
                    'lead', 'stufe1', 'stufe2', 'stufe3', 'stufe4', 'abgeschlossen', 'verloren'
                  )),
  notes           TEXT,
  source          TEXT DEFAULT 'website'
);

-- Termine (Erstgespräch / Analyse)
CREATE TABLE appointments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('erstgespraech', 'analyse')),
  scheduled_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes           TEXT
);

-- Projekte (Stufe 2 + 3)
CREATE TABLE projects (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  stufe           INTEGER CHECK (stufe IN (2, 3)),
  title           TEXT,
  price           DECIMAL(10,2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date      DATE,
  end_date        DATE,
  notes           TEXT
);

-- Betreuungs-Abos (Stufe 4)
CREATE TABLE subscriptions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  contact_id          UUID REFERENCES contacts(id) ON DELETE CASCADE,
  price               DECIMAL(10,2) NOT NULL,
  billing_day         INTEGER DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date   DATE
);

-- Rechnungen
CREATE TABLE invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number  TEXT UNIQUE NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  pdf_url         TEXT,
  description     TEXT
);

-- Indizes für Performance
CREATE INDEX idx_contacts_status   ON contacts(status);
CREATE INDEX idx_contacts_email    ON contacts(email);
CREATE INDEX idx_invoices_status   ON invoices(status);
CREATE INDEX idx_subscriptions_billing ON subscriptions(billing_day, status);

-- Row-Level Security aktivieren
ALTER TABLE contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;

-- Service-Role hat vollen Zugriff (wird von Netlify Functions genutzt)
CREATE POLICY "service_role_all" ON contacts     FOR ALL USING (true);
CREATE POLICY "service_role_all" ON appointments FOR ALL USING (true);
CREATE POLICY "service_role_all" ON projects     FOR ALL USING (true);
CREATE POLICY "service_role_all" ON subscriptions FOR ALL USING (true);
CREATE POLICY "service_role_all" ON invoices     FOR ALL USING (true);
