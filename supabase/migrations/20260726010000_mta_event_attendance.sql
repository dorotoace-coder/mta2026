-- ============================================================
-- MTA 2026 — event-day attendance marking (append-only)
-- DOR-AIOS-MTA-06B (design: DOR-AIOS-MTA-03 attendance marking design,
-- approved: dee-control-room/briefs/DOR_AIOS_MTA_03_AMOS_DECISION_LOG.md,
-- Decisions 4-6 and 9)
--
-- STAGING ONLY at this stage. NOT auto-applied to production. Review,
-- then apply via Supabase dashboard SQL editor or `supabase db push`
-- against the STAGING project (ylgjohnpxawwbyulwwdm) ONLY. Production
-- rollout requires a separate, explicit approval per the standing
-- Decision 9 gate — unchanged from the composite-identity rollout.
--
-- Purely additive: does not alter mta_registrations, does not touch any
-- existing row, and is never read by any currently-deployed code path.
-- ============================================================

CREATE TABLE IF NOT EXISTS mta_event_attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES mta_registrations(id),
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by   TEXT NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('qr_scan', 'manual_lookup')),
  reversed        BOOLEAN NOT NULL DEFAULT false,
  reversed_at     TIMESTAMPTZ,
  reversed_by     TEXT,
  note            TEXT
);

ALTER TABLE mta_event_attendance ENABLE ROW LEVEL SECURITY;

-- Mirrors mta_registrations' existing "authenticated"-role admin pattern.
-- Actual writes in this implementation go through a service-role-backed
-- serverless function (matching api/checkin.ts's existing precedent), so
-- these policies are a defense-in-depth safety net, not the primary
-- access-control mechanism.
DROP POLICY IF EXISTS "MTA attendance admin read" ON mta_event_attendance;
CREATE POLICY "MTA attendance admin read" ON mta_event_attendance
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "MTA attendance admin insert" ON mta_event_attendance;
CREATE POLICY "MTA attendance admin insert" ON mta_event_attendance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "MTA attendance admin update" ON mta_event_attendance;
CREATE POLICY "MTA attendance admin update" ON mta_event_attendance
  FOR UPDATE USING (auth.role() = 'authenticated');

GRANT SELECT, INSERT, UPDATE ON TABLE public.mta_event_attendance TO authenticated;

CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_registration_id
  ON mta_event_attendance (registration_id);
CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_checked_in_at
  ON mta_event_attendance (checked_in_at DESC);
