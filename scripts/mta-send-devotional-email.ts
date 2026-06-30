#!/usr/bin/env node
import { Resend } from "resend";
import { fastDayContent } from "../src/lib/mtaFastJourneyContent.ts";

const FAST_START_UTC = Date.UTC(2026, 7, 13);
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_BASE_URL = "https://mta.heartbeatofgod.ca";
const AUDIT_TABLE = "mta_devotional_send_audit";

type Args = {
  date: string;
  dryRun: boolean;
  live: boolean;
  all: boolean;
  confirmSend: boolean;
  email?: string;
  limit?: number;
  mockRecipient?: string;
};

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

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const valueFor = (name: string) => {
    const match = args.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.slice(name.length + 3) : undefined;
  };

  const live = args.includes("--live");
  const all = args.includes("--all");
  const confirmSend = args.includes("--confirm-send");
  const dryRun = !live;
  const date = valueFor("date") ?? new Date().toISOString().slice(0, 10);
  const limitValue = valueFor("limit");

  return {
    date,
    dryRun,
    live,
    all,
    confirmSend,
    email: valueFor("email"),
    limit: limitValue ? Number.parseInt(limitValue, 10) : undefined,
    mockRecipient: valueFor("mock-recipient"),
  };
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

const isoDateToFastDay = (isoDate: string) => {
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

const fetchRecipients = async (args: Args): Promise<{ recipients: RegistrationRecipient[]; counts: RecipientCounts }> => {
  if (args.mockRecipient) {
    const mock: RegistrationRecipient = {
      id: "00000000-0000-4000-8000-000000000156",
      full_name: "MTA Preview Recipient",
      email: args.mockRecipient,
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

  if (args.email) filters.push(`email=eq.${encodeURIComponent(args.email)}`);
  if (args.limit && Number.isFinite(args.limit)) filters.push(`limit=${Math.max(1, args.limit)}`);

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
  journeyUrl,
}: {
  recipient: RegistrationRecipient;
  day: number;
  title: string;
  scripture: string;
  devotional: string;
  declaration: string;
  journeyUrl: string;
}) => {
  const name = htmlEscape(recipient.full_name || "Beloved");
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

const insertAudit = async (row: Record<string, unknown>) => {
  const response = await fetch(supabaseUrl(`/rest/v1/${AUDIT_TABLE}`), {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    throw new Error(`Audit insert failed (${response.status}): ${await response.text()}`);
  }
};

const run = async () => {
  const args = parseArgs();
  const runId = crypto.randomUUID();
  const day = isoDateToFastDay(args.date);
  const entry = fastDayContent[day - 1];
  const contentKey = `mta-fast-day-${String(day).padStart(2, "0")}`;
  const baseUrl = (process.env.MTA_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

  if (args.live && process.env.MTA_DEVOTIONAL_SENDS_DISABLED === "true") {
    throw new Error("Live sends are blocked because MTA_DEVOTIONAL_SENDS_DISABLED=true.");
  }

  if (args.live && !args.email && !args.all) {
    throw new Error("Live mode requires --email=<address> for one recipient or --all for eligible recipients.");
  }

  if (args.live && args.all && !args.confirmSend) {
    throw new Error("Live all-recipient send requires --live --all --confirm-send.");
  }

  const { recipients, counts } = await fetchRecipients(args);
  const summary = {
    run_id: runId,
    mode: args.dryRun ? "dry_run" : "live",
    devotional_date: args.date,
    journey_day: day,
    content_key: contentKey,
    title: entry.title,
    counts,
    safety: {
      live_email_sent: false,
      dry_run_default: true,
      stop_send_guard: "MTA_DEVOTIONAL_SENDS_DISABLED=true blocks live sends",
      live_all_requires: "--live --all --confirm-send",
    },
    candidate_sample: recipients.slice(0, 5).map((recipient) => ({
      id: recipient.id,
      full_name: recipient.full_name,
      email: maskEmail(recipient.email),
      fast_commitment: recipient.fast_commitment,
      joining_fast: recipient.joining_fast,
    })),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    console.log("\nDry-run complete. No Resend provider call was made and no live email was sent.");
    return;
  }

  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const journeyUrl = `${baseUrl}/checkin/${recipient.id}`;
    const html = renderEmail({
      recipient,
      day,
      title: entry.title,
      scripture: entry.scripture,
      devotional: entry.devotional,
      declaration: entry.declaration,
      journeyUrl,
    });

    try {
      const result = await resend.emails.send({
        from: process.env.MTA_DEVOTIONAL_FROM || "MTA 2026 <noreply@heartbeatofgod.ca>",
        to: recipient.email,
        subject: `MTA 2026 Fast — Day ${day}: ${entry.title}`,
        html,
      });

      await insertAudit({
        run_id: runId,
        registration_id: recipient.id,
        channel: "email",
        devotional_date: args.date,
        journey_day: day,
        content_key: contentKey,
        dry_run: false,
        status: "sent",
        provider_message_id: result.data?.id ?? null,
        sent_at: new Date().toISOString(),
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      await insertAudit({
        run_id: runId,
        registration_id: recipient.id,
        channel: "email",
        devotional_date: args.date,
        journey_day: day,
        content_key: contentKey,
        dry_run: false,
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error),
      });
      console.error(`Send failed for ${maskEmail(recipient.email)}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        safety: {
          ...summary.safety,
          live_email_sent: sent > 0,
        },
        result: { sent, failed },
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
