#!/usr/bin/env node
// DOR-156B-P4A — read-only devotional eligibility check.
//
// Confirms whether an email currently has an ELIGIBLE registration row:
//   joining_fast = true
//   fast_commitment in ('yes','try')
//   email present
//
// Read-only: performs a single SELECT against mta_registrations.
// Never inserts/updates/deletes. Never calls a provider. Never prints secrets.
//
// Usage:
//   node --env-file=.env.local scripts/mta-check-eligibility.mjs [email]
// Defaults to dorotoace@gmail.com.

const email = process.argv[2] || "dorotoace@gmail.com";

const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!base || !key) {
  console.error(
    "Eligibility check needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment " +
      "(e.g. run with: node --env-file=.env.local scripts/mta-check-eligibility.mjs). " +
      "No values were read or printed."
  );
  process.exit(2);
}

const maskEmail = (value) => {
  const [local, domain] = String(value).split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
};

const filters = [
  "select=id,joining_fast,fast_commitment,email",
  "joining_fast=eq.true",
  "fast_commitment=in.(yes,try)",
  "email=not.is.null",
  `email=eq.${encodeURIComponent(email)}`,
];

const url = `${base}/rest/v1/mta_registrations?${filters.join("&")}`;

const res = await fetch(url, {
  method: "GET",
  headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
});

if (!res.ok) {
  console.error(`Eligibility query failed (HTTP ${res.status}).`);
  process.exit(3);
}

const rows = await res.json();
const eligible = Array.isArray(rows) && rows.length > 0;

console.log(
  JSON.stringify(
    {
      view_type: "mta_devotional_eligibility_check",
      email: maskEmail(email),
      eligible,
      match_count: Array.isArray(rows) ? rows.length : 0,
      criteria: { joining_fast: true, fast_commitment_in: ["yes", "try"], email_present: true },
      writes_performed: false,
      provider_calls_used: 0,
    },
    null,
    2
  )
);
