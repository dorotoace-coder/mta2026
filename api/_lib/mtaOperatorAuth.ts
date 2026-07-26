/**
 * Shared bearer-secret check for the event-day operator check-in endpoints
 * (api/operator/*). Mirrors the CRON_SECRET pattern already used by
 * api/cron/mta-devotional.ts. No Supabase Auth user accounts exist for
 * volunteers yet — provisioning real operator accounts is a separate,
 * subsequently approved action per DOR_AIOS_MTA_03_ATTENDANCE_MARKING_DESIGN.md.
 */
export function isOperatorAuthorized(authHeader: string | undefined): {
  authorized: boolean;
  configured: boolean;
} {
  const secret = process.env.MTA_CHECKIN_OPERATOR_SECRET;
  if (!secret) return { authorized: false, configured: false };
  return { authorized: authHeader === `Bearer ${secret}`, configured: true };
}

/**
 * KNOWN PRODUCTION BLOCKER — operator identity.
 *
 * All operator requests share one secret (MTA_CHECKIN_OPERATOR_SECRET);
 * there is no per-individual credential. The `operator` field on every
 * write is caller-supplied free text with no cryptographic binding to a
 * real person — anyone holding the shared secret can claim to be any
 * name. This function adds the strongest mitigation available without
 * provisioning real per-operator accounts: an optional allow-list
 * (MTA_CHECKIN_OPERATOR_IDS, comma-separated) that the supplied operator
 * identifier must exactly match when configured.
 *
 * This constrains `checked_in_by`/`reversed_by` to a pre-agreed set of
 * names — it does NOT verify that the specific request actually came
 * from that person. Real identity binding (per-operator Supabase Auth
 * accounts or per-operator tokens) remains required before any
 * production rollout; this allow-list is a staging-appropriate interim
 * control, not a substitute.
 *
 * When MTA_CHECKIN_OPERATOR_IDS is not set at all, `enforced` is false
 * and any non-empty operator string is accepted — the blocker above
 * applies in full.
 */
export function isKnownOperator(operatorId: string): { allowed: boolean; enforced: boolean } {
  const raw = process.env.MTA_CHECKIN_OPERATOR_IDS;
  if (!raw) return { allowed: true, enforced: false };
  const allowList = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return { allowed: allowList.includes(operatorId), enforced: true };
}
