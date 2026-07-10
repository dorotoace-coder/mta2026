#!/usr/bin/env node
import { runMtaDevotionalEmailSend } from "../api/_lib/mtaDevotionalEmailSender.js";

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
  const summary = await runMtaDevotionalEmailSend({
    ...args,
    source: "manual",
    allowAllLive: false,
  });

  console.log(JSON.stringify(summary, null, 2));

  if (summary.mode === "dry_run") {
    console.log("\nDry-run complete. No Resend provider call was made and no live email was sent.");
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
