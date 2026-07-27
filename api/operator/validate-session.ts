import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isOperatorAuthorized, isKnownOperator } from "../_lib/mtaOperatorAuth.js";

/**
 * Narrow credential-only check used by the operator sign-in screen.
 * Validates the bearer secret and the operator ID against the
 * allow-list (when configured) without touching any registration or
 * attendance data — sign-in should never depend on, or leak anything
 * about, participant records.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { authorized, configured } = isOperatorAuthorized(req.headers.authorization);
  if (!configured) {
    return res.status(503).json({
      success: false,
      error: "Operator check-in is temporarily unavailable (server not configured).",
    });
  }
  if (!authorized) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { operator } = (req.body ?? {}) as { operator?: string };
  if (typeof operator !== "string" || operator.trim().length === 0) {
    return res.status(400).json({ success: false, error: "operator is required" });
  }

  const { allowed, enforced } = isKnownOperator(operator.trim());
  if (enforced && !allowed) {
    return res.status(403).json({
      success: false,
      code: "UNKNOWN_OPERATOR",
      error: "operator is not on the configured allow-list.",
    });
  }

  return res.status(200).json({ success: true });
}
