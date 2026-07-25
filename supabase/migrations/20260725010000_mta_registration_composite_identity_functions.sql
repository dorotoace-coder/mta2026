-- ============================================================
-- DOR-AIOS-MTA-04-WA — MTA composite registration identity
-- (normalized_email, normalized_full_name)
--
-- NOT auto-applied. Review, then apply explicitly per environment
-- (staging first; production requires a separate approval gate).
--
-- Part 1 of 2: normalization + privacy-safe duplicate-check RPC.
-- The composite unique index is a separate, later migration
-- (20260725020000_mta_registration_composite_identity_index.sql),
-- applied only after any pre-existing composite duplicates are
-- identified and resolved.
-- ============================================================

-- Deterministic, null-safe, immutable full-name normalization:
-- trim outer whitespace, collapse repeated internal whitespace,
-- lowercase, Unicode NFC, canonicalize apostrophe/hyphen variants.
-- Preserves all other meaningful letters, accents, and punctuation.
-- No fuzzy matching, no spelling correction, no reordering, no
-- indiscriminate punctuation stripping.
CREATE OR REPLACE FUNCTION public.normalize_full_name(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    lower(
      regexp_replace(
        replace(
          replace(normalize(input, NFC), U&'\2019', ''''),
          U&'\2011', '-'
        ),
        '\s+', ' ', 'g'
      )
    )
  )
$$;

-- Privacy-safe composite duplicate pre-check.
-- The application's public/anon role can INSERT into
-- mta_registrations but cannot SELECT existing rows (RLS restricts
-- read to `authenticated`). This function lets the registration
-- endpoint check "does this exact composite identity already
-- exist?" as a boolean only, via SECURITY DEFINER, without ever
-- exposing row contents, and without granting broader read access.
-- It intentionally does not report whether the email alone or the
-- name alone matches — only the joint composite identity.
CREATE OR REPLACE FUNCTION public.mta_registration_composite_exists(
  p_email text,
  p_full_name text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mta_registrations
    WHERE lower(trim(email)) = lower(trim(p_email))
      AND public.normalize_full_name(full_name) = public.normalize_full_name(p_full_name)
  )
$$;

REVOKE ALL ON FUNCTION public.mta_registration_composite_exists(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mta_registration_composite_exists(text, text) TO anon, authenticated;
