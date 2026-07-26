import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isOperatorAuthorized } from "../_lib/mtaOperatorAuth.js";

const ATTENDANCE_TABLE = "mta_event_attendance";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

type Body = {
  attendanceId?: string;
  operator?: string;
  note?: string;
};

type AttendanceRow = { id: string; reversed: boolean };

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

  const { attendanceId, operator, note } = (req.body ?? {}) as Body;

  if (typeof attendanceId !== "string" || !UUID_RE.test(attendanceId)) {
    return res.status(400).json({ success: false, error: "Invalid attendanceId" });
  }
  if (typeof operator !== "string" || operator.trim().length === 0) {
    return res.status(400).json({ success: false, error: "operator is required" });
  }
  if (typeof note !== "string" || note.trim().length === 0) {
    return res.status(400).json({ success: false, error: "note is required to reverse a check-in" });
  }

  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[operator/checkin-reverse] Missing server-side Supabase service-role configuration");
    return res.status(503).json({ success: false, error: "Operator check-in is temporarily unavailable." });
  }

  const authHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
  };

  try {
    const lookupUrl =
      `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?id=eq.${encodeURIComponent(attendanceId)}` +
      "&select=id,reversed&limit=1";
    const lookup = await fetch(lookupUrl, { method: "GET", headers: authHeaders });
    if (!lookup.ok) {
      const body = await lookup.text();
      console.error("[operator/checkin-reverse] lookup failed", JSON.stringify({ status: lookup.status, body }));
      return res.status(502).json({ success: false, error: "Attendance lookup failed." });
    }
    const rows = (await lookup.json()) as AttendanceRow[];
    const row = rows[0];
    if (!row) {
      return res
        .status(404)
        .json({ success: false, code: "NOT_FOUND", error: "No attendance record found for this ID." });
    }
    if (row.reversed) {
      return res
        .status(409)
        .json({ success: false, code: "ALREADY_REVERSED", error: "This check-in was already reversed." });
    }
  } catch (error) {
    console.error("[operator/checkin-reverse] lookup exception", error);
    return res.status(502).json({ success: false, error: "Attendance lookup failed." });
  }

  const reversedAt = new Date().toISOString();
  const operatorId = operator.trim();
  try {
    const updateResp = await fetch(
      `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?id=eq.${encodeURIComponent(attendanceId)}`,
      {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          reversed: true,
          reversed_at: reversedAt,
          reversed_by: operatorId,
          note: note.trim(),
        }),
      }
    );

    if (!updateResp.ok) {
      const body = await updateResp.text();
      console.error("[operator/checkin-reverse] update failed", JSON.stringify({ status: updateResp.status, body }));
      return res.status(502).json({ success: false, error: "Reversal write failed." });
    }
  } catch (error) {
    console.error("[operator/checkin-reverse] update exception", error);
    return res.status(502).json({ success: false, error: "Reversal write failed." });
  }

  return res.status(200).json({
    success: true,
    attendance_id: attendanceId,
    reversed_at: reversedAt,
    reversed_by: operatorId,
  });
}
