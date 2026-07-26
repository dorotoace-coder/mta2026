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
