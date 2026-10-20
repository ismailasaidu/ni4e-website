-- NI4E: explicit annual renewal fee and signed-in event registration.
-- Safe to re-run; does not delete existing records.

alter table public.membership_fee_schedule
  add column if not exists renewal_amount_kobo bigint
  check (renewal_amount_kobo is null or renewal_amount_kobo > 0);

-- Public page may show active official application and renewal fees only.
-- Existing fee policies govern visibility; no fee values are inserted here.

alter table public.event_registrations
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists event_registrations_user_id_created_idx
  on public.event_registrations(user_id, created_at desc);

drop policy if exists "Public can register for events" on public.event_registrations;
drop policy if exists "event_registration_insert" on public.event_registrations;
drop policy if exists "NI4E public registration insert" on public.event_registrations;
drop policy if exists "Authenticated users register for events" on public.event_registrations;
create policy "Authenticated users register for events" on public.event_registrations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and length(trim(full_name)) between 2 and 160
    and length(trim(email)) between 5 and 254
    and length(trim(event_title)) between 2 and 240
  );

drop policy if exists "event_registration_self_or_admin_read" on public.event_registrations;
create policy "event_registration_self_or_admin_read" on public.event_registrations
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_ni4e_admin());

drop policy if exists "Admins manage event registrations" on public.event_registrations;
create policy "Admins manage event registrations" on public.event_registrations
  for all to authenticated
  using (public.is_ni4e_admin())
  with check (public.is_ni4e_admin());

-- When NI4E later selects anniversary-based expiry, existing activated members
-- without an expiry can be assigned one-year expiry from their activation date.
-- This is intentionally conditional; no expiry dates are inferred before policy approval.
update public.profiles p
set membership_expires_at = p.membership_activated_at + interval '1 year', updated_at = now()
where p.membership_activated_at is not null
  and p.membership_expires_at is null
  and exists (
    select 1 from public.site_settings s
    where s.setting_key = 'ni4e_renewal_basis'
      and lower(trim(both '"' from s.setting_value #>> '{}')) = 'anniversary'
  );
