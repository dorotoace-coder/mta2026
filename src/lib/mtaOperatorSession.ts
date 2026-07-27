/**
 * Local, browser-only storage of the operator's shared secret and
 * identifier for this device's session. This is not real authentication
 * — no Supabase Auth account exists for volunteers yet (a known,
 * documented gap; see api/_lib/mtaOperatorAuth.ts). The secret and
 * operator name are entered once per device/session by a lead
 * volunteer, then reused for every check-in action so individual
 * volunteers never see or type raw API calls.
 *
 * sessionStorage (not localStorage) is used deliberately: it clears
 * when the browser tab closes, limiting how long a shared device
 * retains the secret.
 *
 * SECURITY NOTE — STAGING ONLY, NOT PRODUCTION-APPROVED:
 * This sessionStorage + shared-secret model is a staging/pilot
 * convenience, not a final authentication design. It is explicitly
 * NOT approved as the production operator authentication mechanism.
 * Every device sharing MTA_CHECKIN_OPERATOR_SECRET can act as any
 * allow-listed operator name with no per-individual verification, and
 * the secret sits in browser storage on volunteer devices for the
 * duration of the session. Before any production rollout, this must
 * be replaced with real per-operator identity (e.g. individual
 * Supabase Auth accounts) or a server-issued, short-lived, revocable
 * session token — not a long-lived shared secret typed into a
 * frontend form. See api/_lib/mtaOperatorAuth.ts for the equivalent
 * backend-side blocker.
 */

const SECRET_KEY = "mta_operator_secret";
const OPERATOR_ID_KEY = "mta_operator_id";

export type OperatorSession = {
  secret: string;
  operatorId: string;
};

export function loadOperatorSession(): OperatorSession | null {
  if (typeof window === "undefined") return null;
  const secret = window.sessionStorage.getItem(SECRET_KEY);
  const operatorId = window.sessionStorage.getItem(OPERATOR_ID_KEY);
  if (!secret || !operatorId) return null;
  return { secret, operatorId };
}

export function saveOperatorSession(session: OperatorSession): void {
  window.sessionStorage.setItem(SECRET_KEY, session.secret);
  window.sessionStorage.setItem(OPERATOR_ID_KEY, session.operatorId);
}

export function clearOperatorSession(): void {
  window.sessionStorage.removeItem(SECRET_KEY);
  window.sessionStorage.removeItem(OPERATOR_ID_KEY);
}

/** Fetch wrapper that attaches the operator's Authorization header. */
export async function operatorFetch(
  session: OperatorSession,
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${session.secret}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
}

export type OperatorSessionValidation =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Validates a candidate secret + operator ID against the backend
 * before ever storing them. Sign-in must never save an unverified
 * secret — a wrong secret or an operator ID that isn't on the
 * configured allow-list must be rejected here, not discovered later on
 * the first real check-in attempt.
 */
export async function validateOperatorSession(
  candidate: OperatorSession,
): Promise<OperatorSessionValidation> {
  try {
    const resp = await operatorFetch(candidate, "/api/operator/validate-session", {
      method: "POST",
      body: JSON.stringify({ operator: candidate.operatorId }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 200 && data.success) return { ok: true };
    if (resp.status === 503) {
      return { ok: false, status: 503, error: "System temporarily unavailable. Please try again shortly." };
    }
    if (resp.status === 401) {
      return { ok: false, status: 401, error: "Operator secret is incorrect." };
    }
    if (resp.status === 403) {
      return { ok: false, status: 403, error: "Operator ID is not recognized." };
    }
    return { ok: false, status: resp.status, error: data.error ?? "Sign-in failed." };
  } catch {
    return { ok: false, status: 0, error: "Sign-in failed. Check your connection and try again." };
  }
}
