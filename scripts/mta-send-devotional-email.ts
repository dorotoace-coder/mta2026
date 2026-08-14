#!/usr/bin/env node
import {
  assertMtaDevotionalLiveSendAuthorized,
  runMtaDevotionalEmailSend,
} from "../api/_lib/mtaDevotionalEmailSender.js";

type Args = {
  date: string;
  live: boolean;
  all: boolean;
  confirmSend: boolean;
  email?: string;
  limit?: number;
  mockRecipient?: string;
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const valueFor = (name: string) => {
    const match = args.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.slice(name.length + 3) : undefined;
  };

  const limitValue = valueFor("limit");

  return {
    date: valueFor("date") ?? new Date().toISOString().slice(0, 10),
    live: args.includes("--live"),
    all: args.includes("--all"),
    confirmSend: args.includes("--confirm-send"),
    email: valueFor("email"),
    limit: limitValue ? Number.parseInt(limitValue, 10) : undefined,
    mockRecipient: valueFor("mock-recipient"),
  };
};

const run = async () => {
  const args = parseArgs();
  if (args.live) assertMtaDevotionalLiveSendAuthorized();
  const summary = await runMtaDevotionalEmailSend({
    ...args,
    source: "manual",
    allowAllLive: false,
  });

  console.log(JSON.stringify(summary, null, 2));

  if (summary.mode === "dry_run") {
    console.log("\nDry-run complete. No Resend provider call was made and no live email was sent.");
  }

  if (summary.mode === "live" && summary.result?.reconciliation_required) {
    throw new Error("Live send requires manual provider/audit reconciliation; no automatic retry was attempted.");
  }

  if (summary.mode === "live" && summary.result?.sent !== 1) {
    throw new Error("Live single-recipient send did not complete successfully.");
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
