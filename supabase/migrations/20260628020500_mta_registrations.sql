-- ============================================================
-- MTA 2026 — first-class registration capture table
-- DOR-152 (Linear id DOR-138)
-- System of record: HBG Supabase project xnhgonceplerxhrecghw
--
-- NOT auto-applied. Review, then apply via Supabase dashboard
-- SQL editor or `supabase db push` against the HBG project.
-- Replaces the previous pattern of packing extra fields into
-- the generic `inquiries.message` JSON blob.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS mta_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  whatsapp        TEXT,
  ministry        TEXT,
  designation     TEXT,
  attendance_mode TEXT NOT NULL CHECK (attendance_mode IN ('in_person', 'online')),
  desire          TEXT,
  source          TEXT NOT NULL DEFAULT 'mta2026',
  status          TEXT NOT NULL DEFAULT 'new',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mta_registrations ENABLE ROW LEVEL SECURITY;

-- Public registration form may INSERT (anon key); only authenticated/admin may read.
DROP POLICY IF EXISTS "MTA registrations insert open" ON mta_registrations;
CREATE POLICY "MTA registrations insert open" ON mta_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "MTA registrations admin read" ON mta_registrations;
CREATE POLICY "MTA registrations admin read" ON mta_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_mta_registrations_created_at ON mta_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mta_registrations_email      ON mta_registrations (email);
