-- ============================================================
-- DOR-AIOS-MTA-04-WA — MTA composite registration identity
-- Part 2 of 2: the composite unique index.
--
-- NOT auto-applied. Review, then apply explicitly per environment
-- (staging first; production requires a separate approval gate).
--
-- Depends on 20260725010000_mta_registration_composite_identity_functions.sql
-- (normalize_full_name()) already being applied.
--
-- Enforces: a registration is rejected only when BOTH
--   lower(trim(email))          -- normalized email
--   normalize_full_name(full_name) -- normalized full name
-- match an existing row. Sharing only one of the two remains
-- permitted (no single-column UNIQUE(email) or UNIQUE(full_name)
-- is created here).
--
-- Apply only after any pre-existing composite duplicates have been
-- identified and resolved (see DOR-AIOS-MTA-04B / DOR-AIOS-MTA-04-WA
-- staging audit evidence) — this index will fail to create if any
-- duplicate composite identity still exists in the target table.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS mta_registrations_composite_identity_uidx
  ON public.mta_registrations (
    (lower(trim(email))),
    (public.normalize_full_name(full_name))
  );
