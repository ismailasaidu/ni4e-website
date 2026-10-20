-- NI4E Stage 3: event registration administration and member CPD records.
-- Run in Supabase SQL Editor after the existing NI4E schema/migrations.
-- Safe to re-run: tables/indexes/policies are created or replaced idempotently.

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_title text not null,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text not null check (length(trim(email)) between 5 and 254),
  phone text,
  status text not null default 'new' check (status in ('new','contacted','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);
-- Compatibility columns used by the public event registration form and payment Edge Functions.
alter table public.event_registrations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.event_registrations add column if not exists attendee_count integer not null default 1 check (attendee_count between 1 and 20);
alter table public.event_registrations add column if not exists payment_status text not null default 'not_required';
alter table public.event_registrations add column if not exists currency text not null default 'NGN';
alter table public.event_registrations add column if not exists amount_kobo bigint;
alter table public.event_registrations add column if not exists payment_reference text;
alter table public.event_registrations add column if not exists paid_at timestamptz;

create index if not exists event_registrations_created_at_idx on public.event_registrations (created_at desc);
create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);
alter table public.event_registrations enable row level security;
drop policy if exists "Public can register for events" on public.event_registrations;
create policy "Public can register for events" on public.event_registrations for insert to anon, authenticated
  with check (length(trim(full_name)) between 2 and 160 and length(trim(email)) between 5 and 254 and length(trim(event_title)) between 2 and 240);
drop policy if exists "Admins manage event registrations" on public.event_registrations;
create policy "Admins manage event registrations" on public.event_registrations for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.member_cpd_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  member_name text not null check (length(trim(member_name)) between 2 and 160),
  member_email text not null check (length(trim(member_email)) between 5 and 254),
  activity_title text not null check (length(trim(activity_title)) between 2 and 240),
  provider text,
  completion_date date not null default current_date,
  hours numeric(6,2) not null check (hours > 0 and hours <= 1000),
  certificate_reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_cpd_records_user_date_idx on public.member_cpd_records (user_id, completion_date desc);
create index if not exists member_cpd_records_email_date_idx on public.member_cpd_records (lower(member_email), completion_date desc);
alter table public.member_cpd_records enable row level security;
drop policy if exists "Members can read their own CPD records" on public.member_cpd_records;
create policy "Members can read their own CPD records" on public.member_cpd_records for select to authenticated using (user_id = auth.uid());
drop policy if exists "Admins manage CPD records" on public.member_cpd_records;
create policy "Admins manage CPD records" on public.member_cpd_records for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

comment on table public.event_registrations is 'NI4E event attendee registration records; admin-only read and update.';
comment on table public.member_cpd_records is 'NI4E member continuing professional development records.';
