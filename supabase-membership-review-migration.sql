-- NI4E membership review workflow migration
-- Run after supabase-schema.sql and supabase-membership-upgrades-and-email.sql.
alter table public.membership_applications
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

alter table public.membership_applications drop constraint if exists membership_applications_status_check;
alter table public.membership_applications add constraint membership_applications_status_check
  check (status in ('pending','under_review','needs_information','approved','rejected','payment_pending','active'));

create index if not exists membership_applications_status_submitted_idx
  on public.membership_applications (status, submitted_at desc);

comment on column public.membership_applications.review_notes is
  'Administrative review note; provide a clear reason for rejection or requested corrections.';
