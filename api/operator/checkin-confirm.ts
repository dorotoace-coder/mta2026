import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { isOperatorAuthorized } from "../_lib/mtaOperatorAuth.js";

const REG_TABLE = "mta_registrations";
const ATTENDANCE_TABLE = "mta_event_attendance";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METHODS = ["qr_scan", "manual_lookup"] as const;
type Method = (typeof METHODS)[number];

const cleanSupabaseUrl = (value: string | undefined) => value?.replace(/\/+$/, "");

type Body = {
  registrationId?: string;
  method?: string;
  operator?: string;
  confirmDuplicate?: boolean;
};

type SafeRegistration = { id: string; full_name: string; attendance_mode: string };
type ExistingAttendance = { id: string; checked_in_at: string; checked_in_by: string };

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

  const { registrationId, method, operator, confirmDuplicate } = (req.body ?? {}) as Body;

  if (typeof registrationId !== "string" || !UUID_RE.test(registrationId)) {
    return res.status(400).json({ success: false, error: "Invalid registrationId" });
  }
  if (typeof method !== "string" || !METHODS.includes(method as Method)) {
    return res.status(400).json({ success: false, error: "Invalid method" });
  }
  if (typeof operator !== "string" || operator.trim().length === 0) {
    return res.status(400).json({ success: false, error: "operator is required" });
  }

  const supabaseUrl = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[operator/checkin-confirm] Missing server-side Supabase service-role configuration");
    return res.status(503).json({ success: false, error: "Operator check-in is temporarily unavailable." });
  }

  const authHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
  };

  // 1. Confirm the registration exists (minimum identity fields only —
  //    no email/phone/desire exposed, mirroring api/checkin.ts).
  let registration: SafeRegistration | undefined;
  try {
    const regLookupUrl =
      `${supabaseUrl}/rest/v1/${REG_TABLE}?id=eq.${encodeURIComponent(registrationId)}` +
      "&select=id,full_name,attendance_mode&limit=1";
    const lookup = await fetch(regLookupUrl, { method: "GET", headers: authHeaders });
    if (!lookup.ok) {
      const body = await lookup.text();
      console.error(
        "[operator/checkin-confirm] registration lookup failed",
        JSON.stringify({ status: lookup.status, body })
      );
      return res.status(502).json({ success: false, error: "Registration lookup failed." });
    }
    const rows = (await lookup.json()) as SafeRegistration[];
    registration = rows[0];
  } catch (error) {
    console.error("[operator/checkin-confirm] registration lookup exception", error);
    return res.status(502).json({ success: false, error: "Registration lookup failed." });
  }

  if (!registration) {
    return res.status(404).json({ success: false, code: "NOT_FOUND", error: "No registration found for this ID." });
  }

  // 2. Duplicate-scan check — an existing, non-reversed attendance row means
  //    this person is already checked in. Surface that distinctly instead of
  //    silently inserting a second row, unless the operator explicitly
  //    confirms a deliberate second entry (e.g. re-entry after stepping out).
  try {
    const existingUrl =
      `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?registration_id=eq.${encodeURIComponent(registrationId)}` +
      "&reversed=eq.false&select=id,checked_in_at,checked_in_by&order=checked_in_at.desc&limit=1";
    const existingResp = await fetch(existingUrl, { method: "GET", headers: authHeaders });
    if (!existingResp.ok) {
      const body = await existingResp.text();
      console.error(
        "[operator/checkin-confirm] attendance lookup failed",
        JSON.stringify({ status: existingResp.status, body })
      );
      return res.status(502).json({ success: false, error: "Attendance lookup failed." });
    }
    const existingRows = (await existingResp.json()) as ExistingAttendance[];
    const existing = existingRows[0];
    if (existing && confirmDuplicate !== true) {
      return res.status(200).json({ success: false, code: "ALREADY_CHECKED_IN", already: existing });
    }
  } catch (error) {
    console.error("[operator/checkin-confirm] attendance lookup exception", error);
    return res.status(502).json({ success: false, error: "Attendance lookup failed." });
  }

  // 3. Write the attendance row.
  const attendanceId = randomUUID();
  const checkedInAt = new Date().toISOString();
  const operatorId = operator.trim();
  try {
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        id: attendanceId,
        registration_id: registrationId,
        checked_in_at: checkedInAt,
        checked_in_by: operatorId,
        method,
      }),
    });

    if (!insertResp.ok) {
      const body = await insertResp.text();
      console.error(
        "[operator/checkin-confirm] attendance insert failed",
        JSON.stringify({ status: insertResp.status, body })
      );
      return res.status(502).json({ success: false, error: "Check-in write failed." });
    }
  } catch (error) {
    console.error("[operator/checkin-confirm] attendance insert exception", error);
    return res.status(502).json({ success: false, error: "Check-in write failed." });
  }

  return res.status(201).json({
    success: true,
    attendance: {
      id: attendanceId,
      registration_id: registrationId,
      full_name: registration.full_name,
      attendance_mode: registration.attendance_mode,
      checked_in_at: checkedInAt,
      checked_in_by: operatorId,
      method,
    },
  });
}
