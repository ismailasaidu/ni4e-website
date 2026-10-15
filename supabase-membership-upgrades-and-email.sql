-- Apply this additive migration after supabase-schema.sql.
-- Existing membership data is preserved.
alter table public.membership_applications add column if not exists application_type text not null default 'new' check (application_type in ('new','upgrade','renewal'));
alter table public.membership_applications add column if not exists previous_category text not null default '';
alter table public.profiles add column if not exists membership_number text;
alter table public.profiles add column if not exists membership_activated_at timestamptz;
alter table public.membership_payments add column if not exists payment_type text not null default 'membership' check (payment_type in ('membership','upgrade','renewal'));
alter table public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint check (upgrade_amount_kobo is null or upgrade_amount_kobo > 0);

-- Prevent self-service escalation of role or membership activation. Server-side payment verification uses service_role.
drop policy if exists "profile_update_self_or_admin" on public.profiles;
create policy "profile_update_self_or_admin" on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.is_ni4e_admin())
with check ((id = (select auth.uid()) and role = 'member') or public.is_ni4e_admin());
revoke update on public.profiles from authenticated;
grant update (full_name, email, phone) on public.profiles to authenticated;

-- A verified payment may only be created by the trusted payment Edge Function.
-- The member's own row can be read; the service role updates the status.
create index if not exists membership_applications_user_status_idx on public.membership_applications(user_id,status,submitted_at desc);
create index if not exists membership_payments_user_created_idx on public.membership_payments(user_id,created_at desc);

-- Optional, demo-only certificate records; never treat these as official credentials.
create table if not exists public.membership_demo_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.membership_applications(id) on delete set null,
  category text not null,
  issued_at timestamptz not null default now(),
  demo_only boolean not null default true check (demo_only = true)
);
alter table public.membership_demo_certificates enable row level security;
drop policy if exists "demo_certificates_read_self_or_admin" on public.membership_demo_certificates;
create policy "demo_certificates_read_self_or_admin" on public.membership_demo_certificates for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
-- Inserts are service-role only (payment verification function).
