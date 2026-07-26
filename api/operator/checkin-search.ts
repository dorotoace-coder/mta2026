import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isOperatorAuthorized } from "../_lib/mtaOperatorAuth.js";

const REG_TABLE = "mta_registrations";

type SafeRegistration = {
  id: string;
  full_name: string;
  attendance_mode: string;
};

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

/** Strip characters that would break PostgREST's or=(...) filter grouping. */
const sanitizeSearchTerm = (value: string) => value.replace(/[,()]/g, "");

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

  const rawQuery = Array.isArray(req.query.query) ? req.query.query[0] : req.query.query;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (query.length < 2) {
    return res.status(400).json({ success: false, error: "query must be at least 2 characters" });
  }

  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[operator/checkin-search] Missing server-side Supabase service-role configuration");
    return res.status(503).json({ success: false, error: "Operator check-in is temporarily unavailable." });
  }

  const term = encodeURIComponent(sanitizeSearchTerm(query));
  const orFilter = `or=(full_name.ilike.*${term}*,email.ilike.*${term}*,phone.ilike.*${term}*)`;
  const lookupUrl =
    `${supabaseUrl}/rest/v1/${REG_TABLE}?${orFilter}` + "&select=id,full_name,attendance_mode&limit=10";

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

    const rows = (await lookup.json()) as SafeRegistration[];
    return res.status(200).json({ success: true, results: rows });
  } catch (error) {
    console.error("[operator/checkin-search] Lookup exception", error);
    return res.status(502).json({ success: false, error: "Search failed." });
  }
}
