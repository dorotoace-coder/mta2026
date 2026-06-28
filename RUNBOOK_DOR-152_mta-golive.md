# RUNBOOK — DOR-152 MTA 2026 Registration Go-Live

> **Logical DOR-152** (Linear id **DOR-138**) · Branch `dee/DOR-152-mta-registration-rebuild` · Tag `dee/DOR-152/mta-registration-rebuild`
> System of record: **HBG Supabase project `xnhgonceplerxhrecghw`** · Vercel project **`mta2026`**

## ⛔ Golden order (do not skip / do not reorder)
**Env vars + migration MUST be done BEFORE promoting to production, and the preview test MUST pass first.**
`(a) env vars → (b) migration → (c) preview test PASSES → (d) promote → (e) live smoke test`

Until env vars are set, the form returns **HTTP 503 "Registration temporarily unavailable"** (this is the new loud health check working as designed — not a bug).

---

## (a) Set the 3 env vars in Vercel — project `mta2026`
Vercel dashboard → **Project `mta2026`** → **Settings** → **Environment Variables** → *Add New*.
Set **all three**, and tick **both `Production` AND `Preview`** environments for each (Preview is required so step (c) can actually test before promotion):

| Variable name | Value to paste | Notes |
|---|---|---|
| `RESEND_API_KEY` | *(your Resend API key)* | from resend.com → API Keys |
| `SUPABASE_URL` | `https://xnhgonceplerxhrecghw.supabase.co` | the HBG project URL |
| `SUPABASE_ANON_KEY` | *(HBG project anon/public key)* | Supabase → Project Settings → API → `anon` `public` |

After saving, **redeploy the preview** so it picks up the vars: Vercel → Deployments → latest `dee/DOR-152-...` Preview → **⋯ → Redeploy** (or push any commit). Env var changes do **not** apply to existing deployments until redeployed.

> Secrets never go in the repo or in git. Set them only in the Vercel dashboard.

---

## (b) Apply the migration in Supabase
Supabase dashboard → **HBG project (`xnhgonceplerxhrecghw`)** → **SQL Editor** → *New query* → paste the block below → **Run**.
(Exact contents of `supabase/migrations/20260628020500_mta_registrations.sql` — safe to re-run; uses `IF NOT EXISTS` / `DROP POLICY IF EXISTS`.)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS mta_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  whatsapp        TEXT,
  ministry        TEXT,
  designation     TEXT,
  attendance_mode TEXT NOT NULL CHECK (attendance_mode IN ('in_person', 'online')),
  desire          TEXT,
  source          TEXT NOT NULL DEFAULT 'mta2026',
  status          TEXT NOT NULL DEFAULT 'new',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mta_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MTA registrations insert open" ON mta_registrations;
CREATE POLICY "MTA registrations insert open" ON mta_registrations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "MTA registrations admin read" ON mta_registrations;
CREATE POLICY "MTA registrations admin read" ON mta_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_mta_registrations_created_at ON mta_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mta_registrations_email      ON mta_registrations (email);
```

Verify: Supabase → **Table Editor** → `mta_registrations` exists with the columns above.

---

## (c) One-registration PREVIEW test (must pass before promoting)
1. Open the latest **Preview** URL (Vercel → Deployments → newest `Preview` for branch `dee/DOR-152-...`; current one at time of writing: **https://mta2026-mk9zgkgoi-doroto.vercel.app** — use the freshest one after the step-(a) redeploy).
2. Go to the **Register** section, fill the form (use a real inbox you control), pick **attendance = Online** (or In person), submit.
3. **Verify all three:**
   - **DB row:** Supabase → Table Editor → `mta_registrations` → a new row with your `full_name`, `email`, `phone`, and **`attendance_mode` = `online`/`in_person`** (confirm this column saved correctly), `source = mta2026`, `status = new`.
   - **Branded email:** the confirmation inbox receives an email titled **"MTA 2026 — EXPLOITS — Registration Confirmed!"** that says **Mighty Turn Around Assembly, September 4–6, 2026, Akute Nigeria & Online** — and **no "ILPC / Fresh Oil / June 5–7"** anywhere.
   - **Admin notify:** `heartbeatofgodf@gmail.com` receives the "New MTA 2026 — EXPLOITS Registration" email with phone/whatsapp/attendance rows.
4. **If the form shows "temporarily unavailable (503)":** env vars aren't on the Preview env yet → redo (a) with `Preview` ticked and redeploy.
5. **Only if all three pass, continue.**

---

## (d) Promote preview → production
Vercel → Deployments → the **passing Preview** deployment → **⋯ → Promote to Production**.
(Confirm env vars are also enabled for **Production** — step (a). If you set them Preview-only, add Production now and redeploy.)

---

## (e) Post-deploy smoke test on the LIVE URL
1. Open the production site (`mta.heartbeatofgod.ca` / the Production domain).
2. Submit one more real registration (attendance = the other mode than step (c)).
3. Confirm: new row in `mta_registrations`, MTA-branded confirmation email arrives, `attendance_mode` correct.
4. Done. Watch Vercel → project `mta2026` → **Logs** for any `[register]` errors over the first day.

---

## Rollback
- **Code:** Vercel → Deployments → promote the previous **Production** deployment (pre-DOR-152) back to Production.
- **Table:** the migration is additive (new `mta_registrations` table); nothing was dropped or altered on existing tables. Leaving the table in place is harmless.
