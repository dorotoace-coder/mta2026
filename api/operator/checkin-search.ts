import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isOperatorAuthorized } from "../_lib/mtaOperatorAuth.js";

const REG_TABLE = "mta_registrations";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SafeRegistration = {
  id: string;
  full_name: string;
  attendance_mode: string;
};

type SearchRow = SafeRegistration & { email?: string | null; phone?: string | null };
type SafeSearchResult = SafeRegistration & { masked_contact: string | null };

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

/** Strip characters that would break PostgREST's or=(...) filter grouping. */
const sanitizeSearchTerm = (value: string) => value.replace(/[,()]/g, "");

/** j***@example.com — enough to disambiguate duplicate names, nothing more. */
const maskEmail = (email: string): string => {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "•••";
  return `${user.slice(0, 1)}${"•".repeat(Math.max(user.length - 1, 2))}@${domain}`;
};

/** •••-•••-1234 — last four digits only. */
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  return `•••-•••-${digits.slice(-4)}`;
};

/**
 * Adds a privacy-safe masked identifier for disambiguating duplicate
 * names in fuzzy search results, then strips the raw email/phone that
 * were only fetched to compute it — the client never receives full
 * contact details from this endpoint.
 */
const toSafeSearchResults = (rows: SearchRow[]): SafeSearchResult[] =>
  rows.map(({ id, full_name, attendance_mode, email, phone }) => ({
    id,
    full_name,
    attendance_mode,
    masked_contact: email ? maskEmail(email) : phone ? maskPhone(phone) : null,
  }));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
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

  const rawRegistrationId = Array.isArray(req.query.registrationId)
    ? req.query.registrationId[0]
    : req.query.registrationId;
  const registrationId = typeof rawRegistrationId === "string" ? rawRegistrationId.trim() : "";

  const rawQuery = Array.isArray(req.query.query) ? req.query.query[0] : req.query.query;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  if (!registrationId && query.length < 2) {
    return res.status(400).json({ success: false, error: "query must be at least 2 characters" });
  }
  if (registrationId && !UUID_RE.test(registrationId)) {
    return res.status(400).json({ success: false, error: "Invalid registrationId" });
  }

  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[operator/checkin-search] Missing server-side Supabase service-role configuration");
    return res.status(503).json({ success: false, error: "Operator check-in is temporarily unavailable." });
  }

  // Exact-ID lookup (used to resolve a scanned QR code to a name for the
  // confirmation screen) already identifies a single, unique registrant,
  // so no disambiguation field is needed. The fuzzy name/email/phone
  // search can return multiple same-named people, so it additionally
  // fetches email/phone server-side only to compute a masked
  // disambiguation string — never to expose full contact details.
  const isExactLookup = Boolean(registrationId);
  const lookupUrl = isExactLookup
    ? `${supabaseUrl}/rest/v1/${REG_TABLE}?id=eq.${encodeURIComponent(registrationId)}` +
      "&select=id,full_name,attendance_mode&limit=1"
    : (() => {
        const term = encodeURIComponent(sanitizeSearchTerm(query));
        const orFilter = `or=(full_name.ilike.*${term}*,email.ilike.*${term}*,phone.ilike.*${term}*)`;
        return `${supabaseUrl}/rest/v1/${REG_TABLE}?${orFilter}&select=id,full_name,attendance_mode,email,phone&limit=10`;
      })();

  try {
    const lookup = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });

    if (!lookup.ok) {
      const body = await lookup.text();
      console.error(
        "[operator/checkin-search] Supabase lookup failed",
        JSON.stringify({ status: lookup.status, body })
      );
      return res.status(502).json({ success: false, error: "Search failed." });
    }

    if (isExactLookup) {
      const rows = (await lookup.json()) as SafeRegistration[];
      return res.status(200).json({ success: true, results: rows });
    }

    const rows = (await lookup.json()) as SearchRow[];
    return res.status(200).json({ success: true, results: toSafeSearchResults(rows) });
  } catch (error) {
    console.error("[operator/checkin-search] Lookup exception", error);
    return res.status(502).json({ success: false, error: "Search failed." });
  }
}
