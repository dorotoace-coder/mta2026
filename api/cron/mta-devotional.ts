import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runMtaDevotionalEmailSend } from "../../src/lib/mtaDevotionalEmailSender.ts";

type Body = {
  date?: string;
  email?: string;
  limit?: number;
  live?: boolean;
};

const asSingleValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const isTrue = (value: unknown) => value === true || value === "true";

const getBody = (req: VercelRequest): Body => {
  if (!req.body || typeof req.body !== "object") return {};
  return req.body as Body;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      view_type: "mta_devotional_cron",
      status: "method_not_allowed",
      email_sent: false,
      provider_calls_used: 0,
    });
  }

  const cronSecret = process.env.CRON_SECRET || process.env.MTA_DEVOTIONAL_CRON_SECRET;
  if (!cronSecret) {
    return res.status(503).json({
      view_type: "mta_devotional_cron",
      status: "not_configured",
      reason: "CRON_SECRET or MTA_DEVOTIONAL_CRON_SECRET is required.",
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      view_type: "mta_devotional_cron",
      status: "unauthorized",
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  }

  if (process.env.MTA_DEVOTIONAL_CRON_ENABLED !== "true") {
    return res.status(200).json({
      view_type: "mta_devotional_cron",
      status: "disabled",
      reason: "MTA_DEVOTIONAL_CRON_ENABLED is not true.",
      dry_run: true,
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  }

  const body = getBody(req);
  const liveRequested = isTrue(asSingleValue(req.query.live)) || isTrue(body.live);

  if (liveRequested) {
    return res.status(403).json({
      view_type: "mta_devotional_cron",
      status: "live_send_blocked",
      reason: "Scheduled live devotional sends are blocked in DOR-156B-P1.",
      dry_run: true,
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  }

  const date = asSingleValue(req.query.date) || body.date || new Date().toISOString().slice(0, 10);
  const email = asSingleValue(req.query.email) || body.email;
  const limitValue = asSingleValue(req.query.limit);
  const parsedLimit = limitValue ? Number.parseInt(limitValue, 10) : body.limit;

  try {
    const summary = await runMtaDevotionalEmailSend({
      date,
      email,
      limit: parsedLimit,
      live: false,
      all: false,
      confirmSend: false,
      source: "cron",
      allowAllLive: false,
    });

    return res.status(200).json({
      view_type: "mta_devotional_cron",
      status: "dry_run_complete",
      ...summary,
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  } catch (error) {
    return res.status(400).json({
      view_type: "mta_devotional_cron",
      status: "dry_run_failed",
      error: error instanceof Error ? error.message : String(error),
      email_sent: false,
      provider_call_made: false,
      provider_calls_used: 0,
    });
  }
}
