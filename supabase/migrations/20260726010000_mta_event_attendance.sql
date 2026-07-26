-- ============================================================
-- MTA 2026 — event-day attendance marking (append-only, multi-day)
-- DOR-AIOS-MTA-06B (design: DOR-AIOS-MTA-03 attendance marking design,
-- approved: dee-control-room/briefs/DOR_AIOS_MTA_03_AMOS_DECISION_LOG.md,
-- Decisions 4-6 and 9)
--
-- Revised per PR #8 review to: (1) support one check-in per registrant
-- per event day (Sept 4-6, 2026, Africa/Lagos calendar date) instead of
-- a single lifetime check-in; (2) make duplicate detection atomic and
-- race-safe via a partial unique index, not an application-level
-- read-then-write; (3) remove unrestricted authenticated-role
-- INSERT/UPDATE access; (4) enforce reversal-field consistency at the
-- database layer.
--
-- STAGING ONLY at this stage. NOT auto-applied to production. Review,
-- then apply via Supabase dashboard SQL editor or `supabase db push`
-- against the STAGING project (ylgjohnpxawwbyulwwdm) ONLY. Production
-- rollout requires a separate, explicit approval per the standing
-- Decision 9 gate — unchanged from the composite-identity rollout.
--
-- Purely additive: does not alter mta_registrations, does not touch any
-- existing row, and is never read by any currently-deployed code path.
--
-- KNOWN PRODUCTION BLOCKER — operator identity: no real Supabase Auth
-- operator accounts exist yet (deferred by the original design as a
-- separate, subsequently approved action). All writes go through a
-- single shared secret (MTA_CHECKIN_OPERATOR_SECRET). checked_in_by /
-- reversed_by are optionally constrained to a configured allow-list
-- (MTA_CHECKIN_OPERATOR_IDS, see api/_lib/mtaOperatorAuth.ts) but are
-- NOT cryptographically bound to a verified individual — anyone holding
-- the shared secret can claim to be any allow-listed operator name.
-- This is acceptable for a staging-only, supervised pilot. It MUST be
-- resolved (real per-operator accounts or per-operator tokens) before
-- any production rollout.
-- ============================================================

CREATE TABLE IF NOT EXISTS mta_event_attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES mta_registrations(id),
  event_date      DATE NOT NULL,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by   TEXT NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('qr_scan', 'manual_lookup')),
  reversed        BOOLEAN NOT NULL DEFAULT false,
  reversed_at     TIMESTAMPTZ,
  reversed_by     TEXT,
  note            TEXT,
  CONSTRAINT mta_event_attendance_event_date_range_chk
    CHECK (event_date BETWEEN DATE '2026-09-04' AND DATE '2026-09-06'),
  -- Reversal fields are all-or-nothing: an active row has none of them
  -- set; a reversed row has all three set, including a stated reason.
  CONSTRAINT mta_event_attendance_reversal_state_chk
    CHECK (
      (reversed = false AND reversed_at IS NULL AND reversed_by IS NULL AND note IS NULL)
      OR
      (reversed = true AND reversed_at IS NOT NULL AND reversed_by IS NOT NULL AND note IS NOT NULL)
    )
);

-- Atomic, race-safe duplicate prevention: at most one ACTIVE (non-reversed)
-- check-in per registrant per event day. A concurrent second INSERT for
-- the same (registration_id, event_date) while one is still active fails
-- with a unique-violation (23505) at the database layer — the same
-- authoritative-constraint-over-application-precheck pattern already used
-- for composite registration-identity duplicate prevention. A deliberate
-- re-entry (e.g. stepping out and returning the same day) requires
-- reversing the existing row first, which is itself an atomic,
-- one-winner operation (see api/operator/checkin-reverse.ts) — this keeps
-- the invariant "at most one active row per registrant per day" always
-- true, with reversed rows preserved as full audit history.
CREATE UNIQUE INDEX IF NOT EXISTS mta_event_attendance_active_per_day_uidx
  ON mta_event_attendance (registration_id, event_date)
  WHERE reversed = false;

ALTER TABLE mta_event_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MTA attendance admin read" ON mta_event_attendance;
CREATE POLICY "MTA attendance admin read" ON mta_event_attendance
  FOR SELECT USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE policy for "authenticated" is created, and no
-- INSERT/UPDATE grant is issued to that role. All writes happen through
-- a service-role-backed serverless function gated by
-- MTA_CHECKIN_OPERATOR_SECRET; the service role bypasses RLS entirely
-- and needs no grant. Granting INSERT/UPDATE to "authenticated" here
-- would let any Supabase Auth user who ever obtains a session token
-- write or alter attendance rows directly against the REST API,
-- bypassing the operator secret entirely — this was removed per PR #8
-- review (previously granted unconditionally).
DROP POLICY IF EXISTS "MTA attendance admin insert" ON mta_event_attendance;
DROP POLICY IF EXISTS "MTA attendance admin update" ON mta_event_attendance;
REVOKE INSERT, UPDATE ON TABLE public.mta_event_attendance FROM authenticated;
GRANT SELECT ON TABLE public.mta_event_attendance TO authenticated;

CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_registration_id
  ON mta_event_attendance (registration_id);
CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_checked_in_at
  ON mta_event_attendance (checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_event_date
  ON mta_event_attendance (event_date);
