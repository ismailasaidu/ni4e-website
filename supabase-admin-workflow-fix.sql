-- NI4E admin approval/rejection and payment workflow compatibility migration.
-- Safe to run more than once. Existing application/payment records are preserved.
-- Run in Supabase SQL Editor while connected to the NI4E project.

alter table public.membership_applications
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists application_type text not null default 'new',
  add column if not exists previous_category text not null default '';

alter table public.membership_applications
  drop constraint if exists membership_applications_status_check;
alter table public.membership_applications
  add constraint membership_applications_status_check
  check (status in ('pending','under_review','needs_information','approved','rejected','payment_pending','active'));

alter table public.membership_fee_schedule
  add column if not exists upgrade_amount_kobo bigint
  check (upgrade_amount_kobo is null or upgrade_amount_kobo > 0);

alter table public.membership_payments
  add column if not exists payment_type text not null default 'membership';
alter table public.membership_payments
  drop constraint if exists membership_payments_payment_type_check;
alter table public.membership_payments
  add constraint membership_payments_payment_type_check
  check (payment_type in ('membership','upgrade','renewal'));

alter table public.profiles
  add column if not exists membership_number text,
  add column if not exists membership_activated_at timestamptz;

create index if not exists membership_applications_status_submitted_idx
  on public.membership_applications(status, submitted_at desc);
create index if not exists membership_applications_user_status_idx
  on public.membership_applications(user_id, status, submitted_at desc);
create index if not exists membership_payments_user_created_idx
  on public.membership_payments(user_id, created_at desc);

comment on column public.membership_applications.review_notes is
  'Administrative review note; provide a clear reason for rejection or requested corrections.';

notify pgrst, 'reload schema';
