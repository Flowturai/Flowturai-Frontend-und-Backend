-- Flowturai Migration – idempotent (IF NOT EXISTS / IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       UUID NOT NULL REFERENCES contacts(id),
  offer_id         UUID REFERENCES offers(id),
  contract_number  TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL DEFAULT 'betreuung',
  status           TEXT NOT NULL DEFAULT 'aktiv',
  amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,
  notes            TEXT,
  cancelled_at     TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inbox_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   TEXT UNIQUE,
  from_email   TEXT,
  subject      TEXT,
  action       TEXT,
  contact_id   UUID REFERENCES contacts(id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS offer_id             UUID REFERENCES offers(id);
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS is_cancellation      BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS cancels_invoice_id   UUID REFERENCES invoices(id);
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS line_items           JSONB DEFAULT '[]';
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS archived             BOOLEAN DEFAULT FALSE;

ALTER TABLE offers    ADD COLUMN IF NOT EXISTS invoice_id           UUID REFERENCES invoices(id);
ALTER TABLE offers    ADD COLUMN IF NOT EXISTS archived             BOOLEAN DEFAULT FALSE;
ALTER TABLE offers    ADD COLUMN IF NOT EXISTS cancellation_number  TEXT;
ALTER TABLE offers    ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMP WITH TIME ZONE;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS archived             BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS cancellation_number  TEXT;

-- Kontakt-Spalten ergaenzen
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city    TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zip     TEXT;

-- Doppelte E-Mail erlauben (Unique-Constraint entfernen)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_key;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_unique;

SELECT 'Migration OK' AS status;
