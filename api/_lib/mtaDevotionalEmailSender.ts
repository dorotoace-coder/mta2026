import { Resend } from "resend";
import { fastDayContent } from "../../src/lib/mtaFastJourneyContent.ts";

const FAST_START_UTC = Date.UTC(2026, 7, 13);
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BASE_URL = "https://mta.heartbeatofgod.ca";
const AUDIT_TABLE = "mta_devotional_send_audit";

type RegistrationRecipient = {
  id: string;
  full_name: string | null;
  email: string | null;
  fast_commitment: "yes" | "try" | "no" | null;
  joining_fast: boolean | null;
};

type RecipientCounts = {
  totalRegistrations: number;
  joiningFastCount: number;
  validEmailCount: number;
  skippedCount: number;
  sendCandidateCount: number;
  source: "supabase" | "mock";
};

type PrayerSection = {
  direction: string;
  scriptureAnchor: {
    reference: string;
    text: string;
  };
  prayerPoints: string[];
};

type AuditReservation = {
  id: string;
};

export type DevotionalSendOptions = {
  date: string;
  live?: boolean;
  all?: boolean;
  confirmSend?: boolean;
  email?: string;
  limit?: number;
  mockRecipient?: string;
  source?: "manual" | "cron";
  allowAllLive?: boolean;
};

export type DevotionalSendSummary = {
  run_id: string;
  mode: "dry_run" | "live";
  source: "manual" | "cron";
  devotional_date: string;
  journey_day: number;
  content_key: string;
  title: string;
  prayer_section:
    | {
        included: true;
        direction: string;
        scripture_anchor: string;
        prayer_points_count: number;
      }
    | { included: false };
  counts: RecipientCounts;
  safety: {
    live_email_sent: boolean;
    dry_run_default: true;
    provider_call_made: boolean;
    provider_calls_used: number;
    stop_send_guard: string;
    cron_enabled_guard: string;
    live_all_requires: string;
    scheduled_live_all_status: string;
  };
  candidate_sample: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    fast_commitment: "yes" | "try" | "no" | null;
    joining_fast: boolean | null;
  }>;
  result?: {
    sent: number;
    failed: number;
    skipped: number;
    provider_message_id_present: boolean;
  };
};

const prayerSectionsByDay: Record<number, PrayerSection> = {
  1: {
    direction: "Prophetic alignment for consecration, focus, and spiritual authority.",
    scriptureAnchor: {
      reference: "Daniel 9:3 — KJV",
      text: "And I set my face unto the Lord God, to seek by prayer and supplications, with fasting…",
    },
    prayerPoints: [
      "By the power of the Holy Ghost, I set my face toward God; every distraction assigned to weaken my consecration is broken now.",
      "Every weakness, appetite, or habit fighting my consecration, lose your hold over my life by the power of the Holy Ghost.",
      "I receive fresh fire, clarity, strength, and spiritual authority; I rise from this fast loaded for exploits in Jesus’ name.",
    ],
  },
};

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const maskEmail = (email: string | null | undefined) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const prefix = local.slice(0, 2);
  return `${prefix}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
};

export const isoDateToFastDay = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Invalid --date value "${isoDate}". Use YYYY-MM-DD.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateUtc = Date.UTC(year, month - 1, day);
  const fastDay = Math.floor((dateUtc - FAST_START_UTC) / DAY_MS) + 1;

  if (fastDay < 1 || fastDay > 21) {
    throw new Error(`${isoDate} is outside the 21-day fast window. Use 2026-08-13 through 2026-09-02.`);
  }

  return fastDay;
};

const supabaseHeaders = () => {
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
  };
};

const supabaseUrl = (path: string) => {
  const base = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  return `${base}${path}`;
};

const getCount = async (query: string) => {
  const url = supabaseUrl(`/rest/v1/mta_registrations?select=id${query ? `&${query}` : ""}`);
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      ...supabaseHeaders(),
      prefer: "count=exact",
      range: "0-0",
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase count failed (${response.status}): ${await response.text()}`);
  }

  const contentRange = response.headers.get("content-range") ?? "0-0/0";
  return Number.parseInt(contentRange.split("/")[1] ?? "0", 10);
};

const fetchRecipients = async (
  options: DevotionalSendOptions
): Promise<{ recipients: RegistrationRecipient[]; counts: RecipientCounts }> => {
  if (options.mockRecipient) {
    const mock: RegistrationRecipient = {
      id: "00000000-0000-4000-8000-000000000156",
      full_name: "MTA Preview Recipient",
      email: options.mockRecipient,
      fast_commitment: "yes",
      joining_fast: true,
    };
    return {
      recipients: [mock],
      counts: {
        totalRegistrations: 1,
        joiningFastCount: 1,
        validEmailCount: 1,
        skippedCount: 0,
        sendCandidateCount: 1,
        source: "mock",
      },
    };
  }

  const totalRegistrations = await getCount("");
  const joiningFastCount = await getCount("joining_fast=eq.true");
  const validEmailCount = await getCount("joining_fast=eq.true&fast_commitment=in.(yes,try)&email=not.is.null");

  const filters = [
    "select=id,full_name,email,fast_commitment,joining_fast",
    "joining_fast=eq.true",
    "fast_commitment=in.(yes,try)",
    "email=not.is.null",
    "order=created_at.asc",
  ];

  if (options.email) filters.push(`email=eq.${encodeURIComponent(options.email)}`);
  if (options.limit && Number.isFinite(options.limit)) filters.push(`limit=${Math.max(1, options.limit)}`);

  const response = await fetch(supabaseUrl(`/rest/v1/mta_registrations?${filters.join("&")}`), {
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Supabase recipient query failed (${response.status}): ${await response.text()}`);
  }

  const recipients = (await response.json()) as RegistrationRecipient[];
  return {
    recipients,
    counts: {
      totalRegistrations,
      joiningFastCount,
      validEmailCount,
      skippedCount: Math.max(0, validEmailCount - recipients.length),
      sendCandidateCount: recipients.length,
      source: "supabase",
    },
  };
};

const htmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderEmail = ({
  recipient,
  day,
  title,
  scripture,
  devotional,
  declaration,
  prayerSection,
  journeyUrl,
}: {
  recipient: RegistrationRecipient;
  day: number;
  title: string;
  scripture: string;
  devotional: string;
  declaration: string;
  prayerSection?: PrayerSection;
  journeyUrl: string;
}) => {
  const name = htmlEscape(recipient.full_name || "Beloved");
  const prayerHtml = prayerSection
    ? `<div style="margin:0 0 22px;padding:18px;border:1px solid #5b4621;border-radius:14px;background:#0d1025;">
                  <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d6b25e;margin-bottom:10px;">Prayer Direction</div>
                  <div style="font-size:15px;line-height:1.6;color:#efe3bf;margin-bottom:14px;">${htmlEscape(prayerSection.direction)}</div>
                  <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">Scripture Anchor</div>
                  <div style="font-size:15px;line-height:1.6;color:#fff4d0;margin-bottom:14px;"><strong>${htmlEscape(prayerSection.scriptureAnchor.reference)}</strong><br><span style="font-style:italic;">${htmlEscape(prayerSection.scriptureAnchor.text)}</span></div>
                  <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">3 Prophetic Prayer Points</div>
                  <ol style="margin:0;padding-left:20px;color:#efe3bf;font-size:15px;line-height:1.65;">
                    ${prayerSection.prayerPoints.map((point) => `<li style="margin:0 0 8px;">${htmlEscape(point)}</li>`).join("")}
                  </ol>
                </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#070817;color:#f9efd0;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070817;padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#10132a;border:1px solid #8f6b2f;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 26px 18px;text-align:center;background:#080a18;border-bottom:1px solid #3b2d14;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#d6b25e;">MTA 2026 — EXPLOITS</div>
                <h1 style="margin:12px 0 4px;font-size:30px;line-height:1.15;color:#fff4d0;">Day ${day} of 21</h1>
                <div style="font-size:18px;color:#d6b25e;">${htmlEscape(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 18px;font-size:17px;line-height:1.65;color:#f8eccb;">${name}, grace to you as we wait before the Lord.</p>
                <div style="margin:0 0 22px;padding:18px 18px;border-left:4px solid #d6b25e;background:#0a0d1e;color:#fff7df;font-style:italic;font-size:16px;line-height:1.65;">
                  ${htmlEscape(scripture)}
                </div>
                <div style="margin:0 0 22px;font-size:16px;line-height:1.75;color:#efe3bf;">
                  ${htmlEscape(devotional)}
                </div>
                <div style="margin:0 0 24px;padding:18px;border:1px solid #6c5426;border-radius:14px;background:#15172e;">
                  <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d6b25e;margin-bottom:8px;">Declaration</div>
                  <div style="font-size:17px;line-height:1.65;color:#fff4d0;font-weight:bold;">${htmlEscape(declaration)}</div>
                </div>
                ${prayerHtml}
                <p style="margin:0 0 18px;text-align:center;">
                  <a href="${journeyUrl}" style="display:inline-block;background:#d6b25e;color:#070817;text-decoration:none;font-weight:bold;border-radius:999px;padding:12px 20px;">Open Your MTA Journey Page</a>
                </p>
                <p style="margin:22px 0 0;font-size:13px;line-height:1.55;color:#b9ad8c;text-align:center;">
                  You are receiving this because you registered for MTA 2026 and joined the 21 Days of Fasting & Prayer. For help or opt-out, reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const reserveAudit = async (row: Record<string, unknown>) => {
  const response = await fetch(supabaseUrl(`/rest/v1/${AUDIT_TABLE}`), {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (response.status === 409) return null;
  if (!response.ok) {
    throw new Error(`Audit reservation failed (${response.status}): ${await response.text()}`);
  }

  const rows = (await response.json()) as AuditReservation[];
  return rows[0] ?? null;
};

const updateAudit = async (id: string, patch: Record<string, unknown>) => {
  const response = await fetch(supabaseUrl(`/rest/v1/${AUDIT_TABLE}?id=eq.${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`Audit update failed (${response.status}): ${await response.text()}`);
  }
};

export const runMtaDevotionalEmailSend = async (
  options: DevotionalSendOptions
): Promise<DevotionalSendSummary> => {
  const live = options.live === true;
  const runId = crypto.randomUUID();
  const source = options.source ?? "manual";
  const day = isoDateToFastDay(options.date);
  const entry = fastDayContent[day - 1];
  const prayerSection = prayerSectionsByDay[day];
  const contentKey = `mta-fast-day-${String(day).padStart(2, "0")}`;
  const baseUrl = (process.env.MTA_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

  if (live && process.env.MTA_DEVOTIONAL_SENDS_DISABLED === "true") {
    throw new Error("Live sends are blocked because MTA_DEVOTIONAL_SENDS_DISABLED=true.");
  }

  if (live && !options.email && !options.all) {
    throw new Error("Live mode requires --email=<address> for one recipient or --all for eligible recipients.");
  }

  if (live && options.all && !options.confirmSend) {
    throw new Error("Live all-recipient send requires --live --all --confirm-send.");
  }

  if (live && options.all && options.allowAllLive !== true) {
    throw new Error("All-recipient live devotional sending is blocked in DOR-156B-P1.");
  }

  const { recipients, counts } = await fetchRecipients(options);
  const summary: DevotionalSendSummary = {
    run_id: runId,
    mode: live ? "live" : "dry_run",
    source,
    devotional_date: options.date,
    journey_day: day,
    content_key: contentKey,
    title: entry.title,
    prayer_section: prayerSection
      ? {
          included: true,
          direction: prayerSection.direction,
          scripture_anchor: prayerSection.scriptureAnchor.reference,
          prayer_points_count: prayerSection.prayerPoints.length,
        }
      : { included: false },
    counts,
    safety: {
      live_email_sent: false,
      dry_run_default: true,
      provider_call_made: false,
      provider_calls_used: 0,
      stop_send_guard: "MTA_DEVOTIONAL_SENDS_DISABLED=true blocks live sends",
      cron_enabled_guard: "MTA_DEVOTIONAL_CRON_ENABLED=true required before cron execution",
      live_all_requires: "--live --all --confirm-send",
      scheduled_live_all_status: "blocked in DOR-156B-P1",
    },
    candidate_sample: recipients.slice(0, 5).map((recipient) => ({
      id: recipient.id,
      full_name: recipient.full_name,
      email: maskEmail(recipient.email),
      fast_commitment: recipient.fast_commitment,
      joining_fast: recipient.joining_fast,
    })),
  };

  if (!live) return summary;

  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let providerMessageIdPresent = false;

  for (const recipient of recipients) {
    if (!recipient.email) continue;

    const reservation = await reserveAudit({
      run_id: runId,
      registration_id: recipient.id,
      channel: "email",
      devotional_date: options.date,
      journey_day: day,
      content_key: contentKey,
      dry_run: false,
      status: "pending",
    });

    if (!reservation) {
      skipped += 1;
      continue;
    }

    const journeyUrl = `${baseUrl}/checkin/${recipient.id}`;
    const html = renderEmail({
      recipient,
      day,
      title: entry.title,
      scripture: entry.scripture,
      devotional: entry.devotional,
      declaration: entry.declaration,
      prayerSection,
      journeyUrl,
    });

    try {
      const result = await resend.emails.send({
        from: process.env.MTA_DEVOTIONAL_FROM || "MTA 2026 <noreply@heartbeatofgod.ca>",
        to: recipient.email,
        subject: `MTA 2026 Fast — Day ${day}: ${entry.title}`,
        html,
      });

      providerMessageIdPresent = providerMessageIdPresent || Boolean(result.data?.id);
      await updateAudit(reservation.id, {
        status: "sent",
        provider_message_id: result.data?.id ?? null,
        sent_at: new Date().toISOString(),
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      await updateAudit(reservation.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...summary,
    safety: {
      ...summary.safety,
      live_email_sent: sent > 0,
      provider_call_made: sent + failed > 0,
      provider_calls_used: sent + failed,
    },
    result: {
      sent,
      failed,
      skipped,
      provider_message_id_present: providerMessageIdPresent,
    },
  };
};
