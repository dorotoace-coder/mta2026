import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isOperatorAuthorized, isKnownOperator } from "../_lib/mtaOperatorAuth.js";

const ATTENDANCE_TABLE = "mta_event_attendance";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

type Body = {
  attendanceId?: string;
  operator?: string;
  note?: string;
};

type ReversedRow = { id: string; reversed_at: string; reversed_by: string };

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
  const operatorId = operator.trim();

  const { allowed, enforced } = isKnownOperator(operatorId);
  if (enforced && !allowed) {
    return res.status(403).json({
      success: false,
      code: "UNKNOWN_OPERATOR",
      error: "operator is not on the configured allow-list.",
    });
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

  // Atomic, one-winner reversal: a single conditional UPDATE scoped to
  // "id = X AND reversed = false" is the entire write. Postgres row-level
  // locking guarantees that if two requests race to reverse the same
  // attendance row, exactly one UPDATE matches and returns a row; the
  // other matches zero rows. There is no separate read-then-write step
  // that could race — any lookup below is for error classification only,
  // after the atomic write has already happened (or not).
  const reversedAt = new Date().toISOString();
  let updatedRow: ReversedRow | undefined;
  try {
    const updateUrl =
      `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?id=eq.${encodeURIComponent(attendanceId)}` + "&reversed=eq.false";
    const updateResp = await fetch(updateUrl, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        reversed: true,
        reversed_at: reversedAt,
        reversed_by: operatorId,
        note: note.trim(),
      }),
    });

    if (!updateResp.ok) {
      const body = await updateResp.text();
      console.error("[operator/checkin-reverse] update failed", JSON.stringify({ status: updateResp.status, body }));
      return res.status(502).json({ success: false, error: "Reversal write failed." });
    }

    const updatedRows = (await updateResp.json()) as ReversedRow[];
    updatedRow = updatedRows[0];
  } catch (error) {
    console.error("[operator/checkin-reverse] update exception", error);
    return res.status(502).json({ success: false, error: "Reversal write failed." });
  }

  if (!updatedRow) {
    // The atomic UPDATE matched zero rows: either this ID doesn't exist,
    // or it was already reversed (possibly by a concurrent request that
    // won the race above). Classify for the response only.
    try {
      const lookupUrl =
        `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?id=eq.${encodeURIComponent(attendanceId)}` +
        "&select=id&limit=1";
      const lookup = await fetch(lookupUrl, { method: "GET", headers: authHeaders });
      const rows = lookup.ok ? ((await lookup.json()) as Array<{ id: string }>) : [];
      if (!rows[0]) {
        return res
          .status(404)
          .json({ success: false, code: "NOT_FOUND", error: "No attendance record found for this ID." });
      }
    } catch (error) {
      console.error("[operator/checkin-reverse] post-write classification lookup exception", error);
    }
    return res
      .status(409)
      .json({ success: false, code: "ALREADY_REVERSED", error: "This check-in was already reversed." });
  }

  return res.status(200).json({
    success: true,
    attendance_id: attendanceId,
    reversed_at: updatedRow.reversed_at,
    reversed_by: updatedRow.reversed_by,
  });
}
