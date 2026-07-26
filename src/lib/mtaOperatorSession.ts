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
