-- NI4E public event registration table.
-- Apply once in Supabase SQL Editor. Does not alter existing membership tables.
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_title text not null,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text not null check (length(trim(email)) <= 254),
  phone text,
  status text not null default 'new' check (status in ('new','contacted','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);
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
-- Public users may submit a registration, but cannot read or modify submissions.
drop policy if exists "Public can register for events" on public.event_registrations;
create policy "Public can register for events" on public.event_registrations
  for insert to anon, authenticated
  with check (
    length(trim(full_name)) between 2 and 160
    and length(trim(email)) between 5 and 254
    and length(trim(event_title)) between 2 and 240
  );
-- Admins can view and manage submissions only when their profile role is admin.
drop policy if exists "Admins manage event registrations" on public.event_registrations;
create policy "Admins manage event registrations" on public.event_registrations
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
