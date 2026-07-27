/**
 * Frontend enable flags. VITE_* variables are embedded at build time,
 * so this is a per-deployment (not per-request) gate.
 *
 * VITE_ENABLE_OPERATOR_UI defaults to disabled. Preview/branch builds
 * may set it to "true" to exercise /operator/checkin. Production must
 * never set it — merging this route to main does not, by itself,
 * expose it there. This is a build-time convenience gate, not a
 * security boundary: the route's actual protection is the backend's
 * MTA_CHECKIN_OPERATOR_SECRET check, which is separately never
 * provisioned in production.
 */
export function isOperatorUiEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OPERATOR_UI === "true";
}
