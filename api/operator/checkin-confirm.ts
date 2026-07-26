import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { isOperatorAuthorized, isKnownOperator } from "../_lib/mtaOperatorAuth.js";
import { EVENT_DATES, isValidEventDate, todayInLagos } from "../_lib/mtaEventCalendar.js";

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
  eventDate?: string;
};

type SafeRegistration = { id: string; full_name: string; attendance_mode: string };
type ExistingAttendance = { id: string; checked_in_at: string; checked_in_by: string; event_date: string };

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

  const { registrationId, method, operator, eventDate } = (req.body ?? {}) as Body;

  if (typeof registrationId !== "string" || !UUID_RE.test(registrationId)) {
    return res.status(400).json({ success: false, error: "Invalid registrationId" });
  }
  if (typeof method !== "string" || !METHODS.includes(method as Method)) {
    return res.status(400).json({ success: false, error: "Invalid method" });
  }
  if (typeof operator !== "string" || operator.trim().length === 0) {
    return res.status(400).json({ success: false, error: "operator is required" });
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

  // Multi-day: default to today in Africa/Lagos, but allow (and require,
  // outside the live event window) an explicit event_date.
  const resolvedEventDate = eventDate !== undefined ? eventDate : todayInLagos();
  if (!isValidEventDate(resolvedEventDate)) {
    return res.status(400).json({
      success: false,
      error: `eventDate must be one of ${EVENT_DATES.join(", ")}`,
      valid_event_dates: EVENT_DATES,
    });
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

  // 2. Atomic, duplicate-safe write. The database's partial unique index
  //    on (registration_id, event_date) WHERE reversed = false is the
  //    sole authority on whether this is a duplicate — there is no
  //    separate read-then-write pre-check to race against. A concurrent
  //    second confirm for the same registrant/day fails here with a
  //    unique-violation (23505), which is interpreted as an expected,
  //    already-checked-in outcome rather than a server error.
  const attendanceId = randomUUID();
  const checkedInAt = new Date().toISOString();
  try {
    const insertResp = await fetch(`${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        id: attendanceId,
        registration_id: registrationId,
        event_date: resolvedEventDate,
        checked_in_at: checkedInAt,
        checked_in_by: operatorId,
        method,
      }),
    });

    if (!insertResp.ok) {
      const body = await insertResp.text();
      let parsedCode: string | undefined;
      try {
        parsedCode = JSON.parse(body)?.code;
      } catch {
        // body wasn't JSON — fall through to the generic failure path below.
      }

      if (insertResp.status === 409 && parsedCode === "23505") {
        // Authoritative unique-index rejection: this registrant already
        // has an active check-in for this event_date. Fetch it for a
        // useful response — this read is for messaging only, it does
        // not participate in the atomicity guarantee above.
        const existingUrl =
          `${supabaseUrl}/rest/v1/${ATTENDANCE_TABLE}?registration_id=eq.${encodeURIComponent(registrationId)}` +
          `&event_date=eq.${resolvedEventDate}&reversed=eq.false` +
          "&select=id,checked_in_at,checked_in_by,event_date&limit=1";
        const existingResp = await fetch(existingUrl, { method: "GET", headers: authHeaders });
        const existingRows = existingResp.ok ? ((await existingResp.json()) as ExistingAttendance[]) : [];
        return res.status(200).json({
          success: false,
          code: "ALREADY_CHECKED_IN",
          already: existingRows[0] ?? { event_date: resolvedEventDate },
        });
      }

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
      event_date: resolvedEventDate,
      full_name: registration.full_name,
      attendance_mode: registration.attendance_mode,
      checked_in_at: checkedInAt,
      checked_in_by: operatorId,
      method,
    },
  });
}
