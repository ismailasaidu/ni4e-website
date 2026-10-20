-- NI4E consolidated schema reconciliation (additive / repeatable)
-- Apply in Supabase SQL Editor AFTER the existing NI4E base schema.
-- This migration adds fields used by current membership, admin, event and payment code.
-- It does not delete tables, rows, applications, members or payment history.

create extension if not exists pgcrypto;

-- Required member expiry and fee-schedule columns referenced by frontend/admin.
-- Additive and safe to re-run; does not invent official fee values.
alter table if exists public.profiles add column if not exists membership_expires_at timestamptz;
alter table if exists public.membership_fee_schedule add column if not exists amount_kobo bigint;
alter table if exists public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint;
alter table if exists public.membership_fee_schedule add column if not exists renewal_amount_kobo bigint;
alter table if exists public.membership_fee_schedule add column if not exists currency text not null default 'NGN';
alter table if exists public.membership_fee_schedule add column if not exists active boolean not null default false;
alter table if exists public.membership_fee_schedule add column if not exists updated_at timestamptz not null default now();

-- Profiles / member lifecycle.
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists membership_category text not null default 'Corporate Member';
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists membership_status text not null default 'application_pending';
alter table public.profiles add column if not exists membership_number text;
alter table public.profiles add column if not exists membership_activated_at timestamptz;
alter table public.profiles add column if not exists membership_expires_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Applications / review / correction / renewal lifecycle.
alter table public.membership_applications add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.membership_applications add column if not exists full_name text not null default '';
alter table public.membership_applications add column if not exists email text not null default '';
alter table public.membership_applications add column if not exists phone text not null default '';
alter table public.membership_applications add column if not exists category text not null default 'Corporate Member';
alter table public.membership_applications add column if not exists status text not null default 'pending';
alter table public.membership_applications add column if not exists application_data jsonb not null default '{}'::jsonb;
alter table public.membership_applications add column if not exists source text not null default 'website-registration';
alter table public.membership_applications add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.membership_applications add column if not exists reviewed_at timestamptz;
alter table public.membership_applications add column if not exists review_notes text;
alter table public.membership_applications add column if not exists submitted_at timestamptz not null default now();
alter table public.membership_applications add column if not exists updated_at timestamptz not null default now();
alter table public.membership_applications add column if not exists application_type text not null default 'new';
alter table public.membership_applications add column if not exists previous_category text not null default '';

-- Fee schedule: checkout intentionally remains unavailable while official amounts are null/inactive.
alter table public.membership_fee_schedule add column if not exists amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists renewal_amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists currency text not null default 'NGN';
alter table public.membership_fee_schedule add column if not exists active boolean not null default false;
alter table public.membership_fee_schedule add column if not exists updated_at timestamptz not null default now();

-- Membership payment history.
alter table public.membership_payments add column if not exists application_id uuid references public.membership_applications(id) on delete set null;
alter table public.membership_payments add column if not exists category text not null default 'Membership';
alter table public.membership_payments add column if not exists amount_kobo bigint;
alter table public.membership_payments add column if not exists currency text not null default 'NGN';
alter table public.membership_payments add column if not exists provider text not null default 'paystack';
alter table public.membership_payments add column if not exists provider_reference text;
alter table public.membership_payments add column if not exists status text not null default 'pending';
alter table public.membership_payments add column if not exists payment_type text not null default 'membership';
alter table public.membership_payments add column if not exists created_at timestamptz not null default now();
alter table public.membership_payments add column if not exists paid_at timestamptz;
alter table public.membership_payments add column if not exists provider_transaction_id text;

-- Public content / CMS.
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(), content_type text not null, title text not null,
  slug text not null, summary text not null default '', body text not null default '',
  metadata jsonb not null default '{}'::jsonb, published boolean not null default false,
  event_start timestamptz, event_end timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null
);
alter table public.site_content add column if not exists content_type text not null default 'news';
alter table public.site_content add column if not exists title text not null default '';
alter table public.site_content add column if not exists slug text not null default '';
alter table public.site_content add column if not exists summary text not null default '';
alter table public.site_content add column if not exists body text not null default '';
alter table public.site_content add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.site_content add column if not exists published boolean not null default false;
alter table public.site_content add column if not exists event_start timestamptz;
alter table public.site_content add column if not exists event_end timestamptz;
alter table public.site_content add column if not exists created_at timestamptz not null default now();
alter table public.site_content add column if not exists updated_at timestamptz not null default now();
alter table public.site_content add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.site_content drop constraint if exists site_content_content_type_check;
alter table public.site_content add constraint site_content_content_type_check
  check (content_type in ('news','event','publication','chapter','executive','past_president','technical_division','document','project','committee','institutional_page'));
create index if not exists site_content_type_published_created_idx on public.site_content(content_type, published, created_at desc);

-- Contact enquiries and newsletter.
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null,
  phone text not null default '', subject text not null default '', message text not null,
  status text not null default 'new', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.contact_enquiries add column if not exists full_name text not null default '';
alter table public.contact_enquiries add column if not exists email text not null default '';
alter table public.contact_enquiries add column if not exists phone text not null default '';
alter table public.contact_enquiries add column if not exists subject text not null default '';
alter table public.contact_enquiries add column if not exists message text not null default '';
alter table public.contact_enquiries add column if not exists status text not null default 'new';
alter table public.contact_enquiries add column if not exists created_at timestamptz not null default now();
alter table public.contact_enquiries add column if not exists updated_at timestamptz not null default now();
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(), email text not null unique,
  status text not null default 'subscribed', created_at timestamptz not null default now()
);
alter table public.newsletter_subscriptions add column if not exists email text not null default '';
alter table public.newsletter_subscriptions add column if not exists status text not null default 'subscribed';
alter table public.newsletter_subscriptions add column if not exists created_at timestamptz not null default now();
create unique index if not exists newsletter_subscriptions_email_uidx on public.newsletter_subscriptions(email);

-- Events / attendance / CPD.
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(), event_id text not null, event_title text not null,
  user_id uuid references auth.users(id) on delete set null, full_name text not null, email text not null,
  phone text not null default '', status text not null default 'new', attendee_count integer not null default 1,
  payment_status text not null default 'not_required', currency text not null default 'NGN', amount_kobo bigint,
  payment_reference text, paid_at timestamptz, cpd_hours numeric(6,2), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.event_registrations add column if not exists event_id text not null default '';
alter table public.event_registrations add column if not exists event_title text not null default '';
alter table public.event_registrations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.event_registrations add column if not exists full_name text not null default '';
alter table public.event_registrations add column if not exists email text not null default '';
alter table public.event_registrations add column if not exists phone text not null default '';
alter table public.event_registrations add column if not exists status text not null default 'new';
alter table public.event_registrations add column if not exists attendee_count integer not null default 1;
alter table public.event_registrations add column if not exists payment_status text not null default 'not_required';
alter table public.event_registrations add column if not exists currency text not null default 'NGN';
alter table public.event_registrations add column if not exists amount_kobo bigint;
alter table public.event_registrations add column if not exists payment_reference text;
alter table public.event_registrations add column if not exists paid_at timestamptz;
alter table public.event_registrations add column if not exists cpd_hours numeric(6,2);
alter table public.event_registrations add column if not exists created_at timestamptz not null default now();
alter table public.event_registrations add column if not exists updated_at timestamptz not null default now();
create index if not exists event_registrations_created_at_idx on public.event_registrations(created_at desc);
create index if not exists event_registrations_event_id_idx on public.event_registrations(event_id);

create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(), registration_id uuid not null references public.event_registrations(id) on delete restrict,
  event_id text not null, event_title text not null, attendee_email text not null, amount_kobo bigint not null,
  currency text not null default 'NGN', provider text not null default 'paystack', provider_reference text not null unique,
  status text not null default 'pending', provider_transaction_id text, created_at timestamptz not null default now(), paid_at timestamptz
);
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
create index if not exists event_payments_created_at_idx on public.event_payments(created_at desc);
create index if not exists event_payments_event_id_idx on public.event_payments(event_id);
create index if not exists event_payments_registration_id_idx on public.event_payments(registration_id);

create table if not exists public.member_cpd_records (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  member_name text not null, member_email text not null, activity_title text not null, provider text,
  completion_date date not null default current_date, hours numeric(6,2) not null, certificate_reference text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.member_cpd_records add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.member_cpd_records add column if not exists member_name text not null default '';
alter table public.member_cpd_records add column if not exists member_email text not null default '';
alter table public.member_cpd_records add column if not exists activity_title text not null default '';
alter table public.member_cpd_records add column if not exists provider text;
alter table public.member_cpd_records add column if not exists completion_date date not null default current_date;
alter table public.member_cpd_records add column if not exists hours numeric(6,2) not null default 1;
alter table public.member_cpd_records add column if not exists certificate_reference text;
alter table public.member_cpd_records add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.member_cpd_records add column if not exists created_at timestamptz not null default now();
alter table public.member_cpd_records add column if not exists updated_at timestamptz not null default now();

-- Site settings used by membership policy controls and public content settings.
create table if not exists public.site_settings (
  setting_key text primary key, setting_value jsonb not null default '""'::jsonb,
  description text not null default '', updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
alter table public.site_settings add column if not exists setting_value jsonb not null default '""'::jsonb;
alter table public.site_settings add column if not exists description text not null default '';
alter table public.site_settings add column if not exists updated_by uuid references public.profiles(id);
alter table public.site_settings add column if not exists updated_at timestamptz not null default now();

-- Private supporting documents metadata.
create table if not exists public.membership_documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.membership_applications(id) on delete set null, document_type text not null,
  file_name text not null, storage_path text not null unique, mime_type text not null, size_bytes bigint not null,
  created_at timestamptz not null default now()
);
alter table public.membership_documents add column if not exists application_id uuid references public.membership_applications(id) on delete set null;
alter table public.membership_documents add column if not exists document_type text not null default 'supporting_document';
alter table public.membership_documents add column if not exists file_name text not null default '';
alter table public.membership_documents add column if not exists storage_path text not null default '';
alter table public.membership_documents add column if not exists mime_type text not null default 'application/octet-stream';
alter table public.membership_documents add column if not exists size_bytes bigint not null default 1;
alter table public.membership_documents add column if not exists created_at timestamptz not null default now();

-- Application review RPC and history are kept as JSON in application_data by the existing workflow.
-- Ensure the PostgREST API sees newly added columns immediately.
notify pgrst, 'reload schema';

-- Access controls: preserve private records and expose only approved public content.
alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.membership_fee_schedule enable row level security;
alter table public.membership_payments enable row level security;
alter table public.membership_documents enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_enquiries enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_payments enable row level security;
alter table public.member_cpd_records enable row level security;

drop policy if exists "fees_read_active" on public.membership_fee_schedule;
create policy "fees_read_active" on public.membership_fee_schedule for select to anon, authenticated using (active = true or public.is_ni4e_admin());
drop policy if exists "fees_admin_manage" on public.membership_fee_schedule;
create policy "fees_admin_manage" on public.membership_fee_schedule for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "payments_self_or_admin_read" on public.membership_payments;
create policy "payments_self_or_admin_read" on public.membership_payments for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "payments_admin_manage" on public.membership_payments;
create policy "payments_admin_manage" on public.membership_payments for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content for select to anon, authenticated using (published = true or public.is_ni4e_admin());
drop policy if exists "site_content_admin_manage" on public.site_content;
create policy "site_content_admin_manage" on public.site_content for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "site_settings_admin_manage" on public.site_settings;
create policy "site_settings_admin_manage" on public.site_settings for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "contact_enquiry_public_insert" on public.contact_enquiries;
create policy "contact_enquiry_public_insert" on public.contact_enquiries for insert to anon, authenticated with check (length(trim(full_name)) > 0 and length(trim(email)) > 3 and length(trim(message)) > 0);
drop policy if exists "contact_enquiry_admin_manage" on public.contact_enquiries;
create policy "contact_enquiry_admin_manage" on public.contact_enquiries for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "newsletter_public_subscribe" on public.newsletter_subscriptions;
create policy "newsletter_public_subscribe" on public.newsletter_subscriptions for insert to anon, authenticated with check (length(trim(email)) > 3);
drop policy if exists "newsletter_admin_manage" on public.newsletter_subscriptions;
create policy "newsletter_admin_manage" on public.newsletter_subscriptions for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "NI4E admins read event payments" on public.event_payments;
create policy "NI4E admins read event payments" on public.event_payments for select to authenticated using (public.is_ni4e_admin());
revoke all on public.event_payments from anon, authenticated;
grant select on public.event_payments to authenticated;
drop policy if exists "NI4E admins manage event registrations" on public.event_registrations;
create policy "NI4E admins manage event registrations" on public.event_registrations for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "Members can read their own CPD records" on public.member_cpd_records;
create policy "Members can read their own CPD records" on public.member_cpd_records for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Admins manage CPD records" on public.member_cpd_records;
create policy "Admins manage CPD records" on public.member_cpd_records for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "documents_read_self_or_admin" on public.membership_documents;
create policy "documents_read_self_or_admin" on public.membership_documents for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "documents_insert_self" on public.membership_documents;
create policy "documents_insert_self" on public.membership_documents for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "documents_delete_self_or_admin" on public.membership_documents;
create policy "documents_delete_self_or_admin" on public.membership_documents for delete to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());

-- Prevent members from changing privileged membership fields on their own profile.
-- Admins and server-side service-role operations remain able to perform authorised updates.
create or replace function public.ni4e_guard_profile_membership_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and auth.uid() = old.id
     and not public.is_ni4e_admin() then
    if new.role is distinct from old.role
       or new.membership_status is distinct from old.membership_status
       or new.membership_number is distinct from old.membership_number
       or new.membership_activated_at is distinct from old.membership_activated_at
       or new.membership_expires_at is distinct from old.membership_expires_at then
      raise exception 'Members cannot change administrator-controlled membership fields.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists ni4e_guard_profile_membership_fields on public.profiles;
create trigger ni4e_guard_profile_membership_fields
before update on public.profiles
for each row execute function public.ni4e_guard_profile_membership_fields();

notify pgrst, 'reload schema';
