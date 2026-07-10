-- ============================================================
-- DOR-155 — MTA 2026 Fast Commitment fields
-- Adds non-breaking fast commitment capture to existing rows.
-- ============================================================

ALTER TABLE public.mta_registrations
  ADD COLUMN IF NOT EXISTS fast_commitment TEXT NOT NULL DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS joining_fast BOOLEAN NOT NULL DEFAULT false;

UPDATE public.mta_registrations
SET
  fast_commitment = CASE
    WHEN fast_commitment IN ('yes', 'try', 'no') THEN fast_commitment
    ELSE 'no'
  END,
  joining_fast = CASE
    WHEN fast_commitment IN ('yes', 'try') THEN true
    ELSE false
  END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mta_registrations_fast_commitment_check'
  ) THEN
    ALTER TABLE public.mta_registrations
      ADD CONSTRAINT mta_registrations_fast_commitment_check
      CHECK (fast_commitment IN ('yes', 'try', 'no'));
  END IF;
END $$;
