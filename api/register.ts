import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import QRCode from "qrcode";

// ── MTA 2026 — EXPLOITS ────────────────────────────────────────
const ADMIN_EMAIL = "heartbeatofgodf@gmail.com";
const FROM = "MTA 2026 <noreply@heartbeatofgod.ca>";
const EVENT_NAME = "MTA 2026 — EXPLOITS";
const EVENT_TAGLINE = "Mighty Turn Around Assembly";
const EVENT_DATES = "September 4–6, 2026";
const EVENT_LOCATION = "HBG Ministry, Akute, Nigeria & Online";
const REG_TABLE = "mta_registrations";
const CHECKIN_QR_CONTENT_ID = "mta-checkin-qr@hbg";

const safeSupabaseHost = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
};

const safeKeyDiagnostics = (value: string | undefined) => ({
  present: Boolean(value),
  length: value?.length ?? 0,
  prefix6: value ? value.slice(0, 6) : null,
});

const getAppOrigin = () => {
  const configuredBaseUrl = process.env.MTA_PUBLIC_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/+$/, "");

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Missing MTA_PUBLIC_BASE_URL for production registration emails");
  }

  const deploymentHost = process.env.VERCEL_URL || process.env.VERCEL_BRANCH_URL;
  if (deploymentHost) return `https://${deploymentHost}`;

  throw new Error("Missing public base URL for registration emails");
};

type Registration = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  ministry: string;
  designation: string;
  attendanceMode: "in_person" | "online";
  desire: string;
  submittedAt: string;
};

/** Write the registration to Supabase as first-class columns. Throws on failure. */
async function saveToSupabase(data: Registration): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const isPreview = process.env.VERCEL_ENV === "preview";
  // Caller guarantees these are set (env health check runs first).
  const payload = {
    id: data.id,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp || null,
    ministry: data.ministry,
    designation: data.designation,
    attendance_mode: data.attendanceMode,
    desire: data.desire,
    source: "mta2026",
    status: "new",
    created_at: data.submittedAt,
  };

  const resp = await fetch(`${supabaseUrl}/rest/v1/${REG_TABLE}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey as string,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (isPreview) {
      console.error(
        "[register] SUPABASE_INSERT_DIAGNOSTIC",
        JSON.stringify(
          {
            supabase_url_host: safeSupabaseHost(supabaseUrl),
            supabase_anon_key: safeKeyDiagnostics(supabaseKey),
            table: REG_TABLE,
            payload_keys: Object.keys(payload),
            attendance_mode: data.attendanceMode,
            response_status: resp.status,
            response_body: body,
          },
          null,
          2
        )
      );
    }
    throw new Error(`Supabase insert failed (${resp.status}): ${body}`);
  }
}

const attendanceLabel = (m: string) =>
  m === "in_person" ? "In person — Akute, Nigeria" : m === "online" ? "Online" : m;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Loud env health check — never fail silently with a 500 ──
  const missing = [
    ["RESEND_API_KEY", process.env.RESEND_API_KEY],
    ["SUPABASE_URL", process.env.SUPABASE_URL],
    ["SUPABASE_ANON_KEY", process.env.SUPABASE_ANON_KEY],
    ...(process.env.VERCEL_ENV === "production"
      ? [["MTA_PUBLIC_BASE_URL", process.env.MTA_PUBLIC_BASE_URL]]
      : []),
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k as string);

  if (missing.length > 0) {
    console.error(
      `[register] MISCONFIGURED — missing env vars: ${missing.join(", ")}. ` +
        `Registration cannot be captured until these are set in Vercel.`
    );
    return res.status(503).json({
      error: "Registration is temporarily unavailable (server not configured).",
      missing_env: missing, // names only — never values
    });
  }

  const { fullName, email, phone, whatsapp, ministry, designation, attendanceMode, desire } =
    req.body ?? {};

  if (!fullName || !email || !phone || !ministry || !designation || !attendanceMode || !desire) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (attendanceMode !== "in_person" && attendanceMode !== "online") {
    return res.status(400).json({ error: "Invalid attendance_mode" });
  }

  const submittedAt = new Date().toISOString();
  const registrationId = randomUUID();
  const checkInUrl = `${getAppOrigin()}/checkin/${registrationId}`;
  const reg: Registration = {
    id: registrationId,
    fullName,
    email,
    phone,
    whatsapp,
    ministry,
    designation,
    attendanceMode,
    desire,
    submittedAt,
  };

  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── 1. Authoritative DB write (system of record) ──
  let dbFailed = false;
  let dbError = "";
  try {
    await saveToSupabase(reg);
  } catch (err) {
    dbFailed = true;
    dbError = err instanceof Error ? err.message : String(err);
    console.error(`[register] DB write FAILED for ${email}: ${dbError}`);
  }

  // ── 2. Emails (admin notify + registrant auto-reply). Admin email is the
  //       safety net if the DB write failed, so nothing is lost silently. ──
  let emailSent = false;
  try {
    const qrPng = await QRCode.toBuffer(checkInUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 480,
      color: {
        dark: "#1A0533",
        light: "#FFFFFF",
      },
    });

    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `${dbFailed ? "[DB WRITE FAILED] " : ""}New ${EVENT_NAME} Registration — ${fullName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1A0533;color:#fff;padding:32px;border-radius:12px;">
          <h2 style="color:#C9972A;margin-bottom:24px;">New Registration — ${EVENT_NAME}</h2>
          ${dbFailed ? `<p style="background:#5a1111;color:#ffd7d7;padding:10px 14px;border-radius:8px;font-size:13px;">⚠️ Database write failed — this record exists ONLY in this email. Add it manually. Error: ${dbError}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;width:150px;">Full Name</td><td style="padding:8px 0;font-weight:bold;">${fullName}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">Email</td><td style="padding:8px 0;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">WhatsApp</td><td style="padding:8px 0;">${whatsapp || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">Ministry</td><td style="padding:8px 0;">${ministry}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">Designation</td><td style="padding:8px 0;">${designation}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;">Attendance</td><td style="padding:8px 0;">${attendanceLabel(attendanceMode)}</td></tr>
            <tr><td style="padding:8px 0;color:#B88FC7;font-size:13px;vertical-align:top;">Desire</td><td style="padding:8px 0;">${desire}</td></tr>
          </table>
        </div>
      `,
    });

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${EVENT_NAME} — Registration Confirmed!`,
      attachments: [
        {
          filename: "mta-checkin-qr.png",
          content: qrPng,
          contentType: "image/png",
          contentId: CHECKIN_QR_CONTENT_ID,
        },
      ],
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1A0533;color:#fff;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:28px;">
            <h1 style="color:#C9972A;font-size:28px;margin:0;">${EVENT_NAME}</h1>
            <p style="color:#B88FC7;font-size:13px;margin:4px 0 0;">${EVENT_TAGLINE}</p>
          </div>
          <p style="font-size:16px;">Dear <strong style="color:#C9972A;">${fullName}</strong>,</p>
          <p style="color:#ccc;line-height:1.7;">
            Thank you for registering for <strong>${EVENT_NAME}</strong>!
            Your registration has been received and your place is secured.
          </p>
          <div style="background:rgba(201,151,42,0.1);border:1px solid rgba(201,151,42,0.3);border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0;color:#C9972A;font-weight:bold;font-size:18px;">${EVENT_DATES}</p>
            <p style="margin:6px 0 0;color:#B88FC7;font-size:14px;">${EVENT_LOCATION}</p>
            <p style="margin:10px 0 0;color:#fff;font-size:13px;">You registered to attend: <strong>${attendanceLabel(attendanceMode)}</strong></p>
          </div>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,151,42,0.35);border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 10px;color:#C9972A;font-size:15px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;">Before the Assembly — WE WAIT</p>
            <p style="margin:0;color:#fff;font-size:16px;font-weight:bold;line-height:1.6;">Join 21 Days of Fasting & Prayer: August 13 – September 2, 2026</p>
            <p style="margin:10px 0 0;color:#B88FC7;font-size:13px;line-height:1.6;">Corporate consecration · Intercession · Spiritual sharpening</p>
            <p style="margin:14px 0 0;color:#ccc;font-size:14px;line-height:1.7;font-style:italic;">You don't come to MTA empty — you come loaded from 21 days in His presence.</p>
          </div>
          <div style="margin:24px 0 8px;text-align:center;">
            <p style="margin:0 0 10px;color:#C9972A;font-size:14px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;">Check-in QR</p>
            <img src="cid:${CHECKIN_QR_CONTENT_ID}" alt="MTA 2026 check-in QR" width="220" height="220" style="display:block;margin:0 auto 10px;background:#fff;padding:8px;border-radius:12px;" />
            <p style="margin:0;color:#B88FC7;font-size:12px;word-break:break-all;">${checkInUrl}</p>
          </div>
          <p style="color:#ccc;line-height:1.7;">
            Come expecting a fresh encounter with God. We will be in touch with more details as the conference approaches.
          </p>
          <p style="color:#ccc;margin-top:32px;">God bless you,<br/>
          <strong style="color:#fff;">Pastor Amos Unogwu</strong><br/>
          <span style="color:#B88FC7;font-size:13px;">HBG Ministry | heartbeatofgod.ca</span></p>
        </div>
      `,
    });
    emailSent = true;
  } catch (err) {
    console.error(`[register] Email send failed for ${email}:`, err);
  }

  // ── 3. Respond. 200 ONLY when the row persisted. ──
  if (!dbFailed) {
    return res.status(200).json({ success: true, email_sent: emailSent });
  }
  // Row did not persist — email is the fallback capture. Surface db_failed loudly.
  if (emailSent) {
    const previewDiagnostics =
      process.env.VERCEL_ENV === "preview"
        ? {
            supabase_url_host: safeSupabaseHost(process.env.SUPABASE_URL),
            supabase_anon_key: safeKeyDiagnostics(process.env.SUPABASE_ANON_KEY),
            payload_keys: ["full_name", "email", "phone", "whatsapp", "ministry", "designation", "attendance_mode", "desire", "source", "status", "created_at"],
            attendance_mode: attendanceMode,
            db_error: dbError,
          }
        : undefined;

    return res.status(502).json({
      success: false,
      db_failed: true,
      email_sent: true,
      message:
        "Your details reached the MTA team by email but our database is temporarily unavailable. We will confirm your spot shortly.",
      ...(previewDiagnostics ? { preview_diagnostics: previewDiagnostics } : {}),
    });
  }
  return res.status(500).json({ success: false, db_failed: true, email_sent: false });
}
