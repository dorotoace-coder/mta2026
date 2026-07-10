import type { VercelRequest, VercelResponse } from "@vercel/node";

const REG_TABLE = "mta_registrations";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SafeRegistration = {
  full_name: string;
  attendance_mode: string;
};

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const registrationId = typeof rawId === "string" ? rawId.trim() : "";

  if (!UUID_RE.test(registrationId)) {
    return res.status(200).json({ found: false });
  }

  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[checkin] Missing server-side Supabase service-role configuration");
    return res.status(503).json({
      found: false,
      error: "Check-in lookup is temporarily unavailable.",
    });
  }

  const lookupUrl =
    `${supabaseUrl}/rest/v1/${REG_TABLE}` +
    `?id=eq.${encodeURIComponent(registrationId)}` +
    "&select=full_name,attendance_mode&limit=1";

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
        "[checkin] Supabase lookup failed",
        JSON.stringify({ status: lookup.status, body })
      );
      return res.status(502).json({
        found: false,
        error: "Check-in lookup failed.",
      });
    }

    const rows = (await lookup.json()) as SafeRegistration[];
    const registration = rows[0];

    if (!registration) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({
      found: true,
      registration: {
        full_name: registration.full_name,
        attendance_mode: registration.attendance_mode,
      },
    });
  } catch (error) {
    console.error("[checkin] Lookup exception", error);
    return res.status(502).json({
      found: false,
      error: "Check-in lookup failed.",
    });
  }
}
