create table if not exists public.mta_devotional_send_audit (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  registration_id uuid references public.mta_registrations(id),
  channel text not null default 'email',
  devotional_date date not null,
  journey_day int,
  content_key text,
  dry_run boolean not null default true,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.mta_devotional_send_audit
  add constraint mta_devotional_send_audit_channel_check
  check (channel in ('email'));

alter table public.mta_devotional_send_audit
  add constraint mta_devotional_send_audit_status_check
  check (status in ('pending', 'skipped', 'sent', 'failed', 'dry_run'));

alter table public.mta_devotional_send_audit
  add constraint mta_devotional_send_audit_journey_day_check
  check (journey_day is null or (journey_day >= 1 and journey_day <= 21));

create unique index if not exists mta_devotional_send_audit_live_once
  on public.mta_devotional_send_audit (registration_id, devotional_date, channel)
  where dry_run = false and registration_id is not null;

create index if not exists mta_devotional_send_audit_run_id_idx
  on public.mta_devotional_send_audit (run_id);

create index if not exists mta_devotional_send_audit_devotional_date_idx
  on public.mta_devotional_send_audit (devotional_date);

alter table public.mta_devotional_send_audit enable row level security;

create policy mta_devotional_send_audit_authenticated_select
  on public.mta_devotional_send_audit
  for select
  to authenticated
  using (true);

create policy mta_devotional_send_audit_authenticated_insert
  on public.mta_devotional_send_audit
  for insert
  to authenticated
  with check (true);

grant usage on schema public to authenticated;
grant select, insert on table public.mta_devotional_send_audit to authenticated;
