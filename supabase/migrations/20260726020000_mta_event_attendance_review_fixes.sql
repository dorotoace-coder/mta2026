-- ============================================================
-- MTA 2026 — event-day attendance marking: review-fix corrections
-- DOR-AIOS-MTA-06B, PR #8 review round 2
--
-- Applied AFTER 20260726010000_mta_event_attendance.sql, which is left
-- exactly as originally applied to staging (immutable migration
-- history — corrections land as a new migration, not an edit to an
-- already-applied one).
--
-- STAGING ONLY. NOT auto-applied to production. Apply against the
-- STAGING project (ylgjohnpxawwbyulwwdm) ONLY, in order, after
-- 20260726010000. Production rollout requires a separate, explicit
-- approval per the standing Decision 9 gate.
--
-- Fixes six issues found in PR #8 review:
--   1. Multi-day attendance: add event_date, scoped to Sept 4-6, 2026.
--   2. Atomic duplicate-safe check-in: partial unique index on
--      (registration_id, event_date) WHERE reversed = false, replacing
--      an application-level read-then-write race.
--   3. Removed unrestricted "authenticated" INSERT/UPDATE access.
--   4. Reversal-state consistency: reversed/reversed_at/reversed_by/note
--      must be all-null or all-set together.
--   5. Nonblank audit values: checked_in_by, reversed_by (when set),
--      and note (when set) may not be empty or whitespace-only.
--
-- KNOWN PRODUCTION BLOCKER — operator identity: no real Supabase Auth
-- operator accounts exist yet. All writes go through a single shared
-- secret (MTA_CHECKIN_OPERATOR_SECRET), optionally narrowed by an
-- allow-list (MTA_CHECKIN_OPERATOR_IDS, see api/_lib/mtaOperatorAuth.ts).
-- checked_in_by/reversed_by are NOT cryptographically bound to a
-- verified individual. Acceptable for a staging-only, supervised pilot;
-- must be resolved before any production rollout.
-- ============================================================

-- 1. Multi-day support. Added nullable first so the table (currently
--    empty on staging) can be altered safely even if it held rows; the
--    NOT NULL is applied as a separate step, which would fail loudly
--    (not silently) if any existing row lacked a value.
ALTER TABLE mta_event_attendance ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE mta_event_attendance ALTER COLUMN event_date SET NOT NULL;

ALTER TABLE mta_event_attendance
  ADD CONSTRAINT mta_event_attendance_event_date_range_chk
  CHECK (event_date BETWEEN DATE '2026-09-04' AND DATE '2026-09-06');

-- 2. Atomic, race-safe duplicate prevention: at most one ACTIVE
--    (non-reversed) check-in per registrant per event day. A concurrent
--    second INSERT for the same (registration_id, event_date) while one
--    is still active fails with a unique-violation (23505) at the
--    database layer.
CREATE UNIQUE INDEX IF NOT EXISTS mta_event_attendance_active_per_day_uidx
  ON mta_event_attendance (registration_id, event_date)
  WHERE reversed = false;

-- 3. Remove unrestricted authenticated-role write access. All writes
--    happen through a service-role-backed serverless function, which
--    bypasses RLS entirely and needs no grant. Granting INSERT/UPDATE
--    to "authenticated" let any Supabase Auth user who ever obtained a
--    session token write or alter attendance rows directly against the
--    REST API, bypassing the operator secret entirely.
DROP POLICY IF EXISTS "MTA attendance admin insert" ON mta_event_attendance;
DROP POLICY IF EXISTS "MTA attendance admin update" ON mta_event_attendance;
REVOKE INSERT, UPDATE ON TABLE public.mta_event_attendance FROM authenticated;

-- 4. Reversal fields are all-or-nothing: an active row has none of them
--    set; a reversed row has all three set, including a stated reason.
ALTER TABLE mta_event_attendance
  ADD CONSTRAINT mta_event_attendance_reversal_state_chk
  CHECK (
    (reversed = false AND reversed_at IS NULL AND reversed_by IS NULL AND note IS NULL)
    OR
    (reversed = true AND reversed_at IS NOT NULL AND reversed_by IS NOT NULL AND note IS NOT NULL)
  );

-- 5. Nonblank audit values — a value that is present must not be empty
--    or whitespace-only. Each field gets its own constraint for clear,
--    independent failure messages.
ALTER TABLE mta_event_attendance
  ADD CONSTRAINT mta_event_attendance_checked_in_by_nonblank_chk
  CHECK (btrim(checked_in_by) <> '');

ALTER TABLE mta_event_attendance
  ADD CONSTRAINT mta_event_attendance_reversed_by_nonblank_chk
  CHECK (reversed_by IS NULL OR btrim(reversed_by) <> '');

ALTER TABLE mta_event_attendance
  ADD CONSTRAINT mta_event_attendance_note_nonblank_chk
  CHECK (note IS NULL OR btrim(note) <> '');

CREATE INDEX IF NOT EXISTS idx_mta_event_attendance_event_date
  ON mta_event_attendance (event_date);
