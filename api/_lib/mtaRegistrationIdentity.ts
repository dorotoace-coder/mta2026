// Composite registration identity: (normalized_email, normalized_full_name).
// Mirrors supabase/migrations/20260725010000_mta_registration_composite_identity_functions.sql
// exactly, so the application pre-check and the database's authoritative
// unique index agree on what counts as a duplicate.

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeFullName(fullName: string): string {
  return fullName
    .normalize("NFC")
    .replace(/’/g, "'")
    .replace(/‑/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
