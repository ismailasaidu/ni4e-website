-- NI4E Stage 3: integrated paid event payments.
-- Review before applying to the live project. Does not alter membership payment rows.
-- Requires the existing public.event_registrations table and public.is_ni4e_admin() helper.

begin;

create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete restrict,
  event_id text not null,
  event_title text not null,
  attendee_email text not null,
  amount_kobo bigint not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  provider text not null default 'paystack',
  provider_reference text not null unique,
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  provider_transaction_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Reconcile partially-created tables safely without replacing existing records.
alter table public.event_payments add column if not exists registration_id uuid references public.event_registrations(id) on delete restrict;
alter table public.event_payments add column if not exists event_id text not null default '';
alter table public.event_payments add column if not exists event_title text not null default '';
alter table public.event_payments add column if not exists attendee_email text not null default '';
alter table public.event_payments add column if not exists amount_kobo bigint;
alter table public.event_payments add column if not exists currency text not null default 'NGN';
alter table public.event_payments add column if not exists provider text not null default 'paystack';
alter table public.event_payments add column if not exists provider_reference text;
alter table public.event_payments add column if not exists status text not null default 'pending';
alter table public.event_payments add column if not exists provider_transaction_id text;
alter table public.event_payments add column if not exists created_at timestamptz not null default now();
alter table public.event_payments add column if not exists paid_at timestamptz;
create unique index if not exists event_payments_provider_reference_uidx on public.event_payments(provider_reference) where provider_reference is not null;
create index if not exists event_payments_created_at_idx on public.event_payments(created_at desc);
create index if not exists event_payments_event_id_idx on public.event_payments(event_id);
create index if not exists event_payments_registration_id_idx on public.event_payments(registration_id);

alter table public.event_payments enable row level security;
drop policy if exists "NI4E admins read event payments" on public.event_payments;
create policy "NI4E admins read event payments" on public.event_payments
  for select to authenticated using (public.is_ni4e_admin());
revoke all on public.event_payments from anon, authenticated;
grant select on public.event_payments to authenticated;

commit;
