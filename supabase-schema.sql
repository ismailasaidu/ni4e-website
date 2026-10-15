-- NI4E tender-stage demo schema for Supabase Free
-- Run this whole file in Supabase Dashboard → SQL Editor.
-- Uses Row Level Security; do not expose service_role keys in the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  membership_category text not null default 'Corporate Member',
  role text not null default 'member' check (role in ('member','admin')),
  membership_status text not null default 'application_pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  category text not null default 'Corporate Member',
  status text not null default 'pending' check (status in ('pending','under_review','approved','rejected')),
  application_data jsonb not null default '{}'::jsonb,
  source text not null default 'website-registration',
  reviewed_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);



-- ToR workflow fields are included in the main schema so a fresh setup does not
-- fail when administrators request corrections or record review notes.
alter table public.membership_applications add column if not exists review_notes text;
alter table public.membership_applications add column if not exists reviewed_at timestamptz;
alter table public.membership_applications add column if not exists application_type text not null default 'new';
alter table public.membership_applications add column if not exists previous_category text not null default '';
alter table public.membership_applications drop constraint if exists membership_applications_status_check;
alter table public.membership_applications add constraint membership_applications_status_check
  check (status in ('pending','under_review','needs_information','approved','rejected','payment_pending','active'));
alter table public.membership_applications drop constraint if exists membership_applications_application_type_check;
alter table public.membership_applications add constraint membership_applications_application_type_check
  check (application_type in ('new','upgrade','renewal'));

create table if not exists public.membership_fee_schedule (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  amount_kobo bigint check (amount_kobo is null or amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.membership_applications(id) on delete set null,
  category text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  provider text not null default 'paystack',
  provider_reference text unique,
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Fields used by the server-side payment verification and membership upgrade flow.
alter table public.profiles add column if not exists membership_number text;
alter table public.profiles add column if not exists membership_activated_at timestamptz;
alter table public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint check (upgrade_amount_kobo is null or upgrade_amount_kobo > 0);
alter table public.membership_payments add column if not exists payment_type text not null default 'membership';
alter table public.membership_payments drop constraint if exists membership_payments_payment_type_check;
alter table public.membership_payments add constraint membership_payments_payment_type_check check (payment_type in ('membership','upgrade','renewal'));

alter table public.membership_fee_schedule enable row level security;
alter table public.membership_payments enable row level security;

alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;

-- SECURITY DEFINER helper avoids recursive RLS checks on the profiles table.
create or replace function public.is_ni4e_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

-- Profiles: members can view/update their own basic profile. Admins can view all profiles.
drop policy if exists "profile_select_self_or_admin" on public.profiles;
create policy "profile_select_self_or_admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_ni4e_admin());

drop policy if exists "profile_insert_self_member" on public.profiles;
create policy "profile_insert_self_member" on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and role = 'member');

drop policy if exists "profile_update_self_or_admin" on public.profiles;
create policy "profile_update_self_or_admin" on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.is_ni4e_admin())
with check ((id = (select auth.uid()) and role = 'member') or public.is_ni4e_admin());

-- Applications: members can submit and read their own application; admins can review all.
drop policy if exists "applications_select_self_or_admin" on public.membership_applications;
create policy "applications_select_self_or_admin" on public.membership_applications for select to authenticated
using (user_id = (select auth.uid()) or public.is_ni4e_admin());

drop policy if exists "applications_insert_self_pending" on public.membership_applications;
create policy "applications_insert_self_pending" on public.membership_applications for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "applications_update_admin_only" on public.membership_applications;
create policy "applications_update_admin_only" on public.membership_applications for update to authenticated
using (public.is_ni4e_admin())
with check (public.is_ni4e_admin());


-- Define admin helper before policies that use it.
create or replace function public.is_ni4e_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

-- Fees are readable by visitors/members; only admins may manage the official amounts.
drop policy if exists "fees_read_active" on public.membership_fee_schedule;
create policy "fees_read_active" on public.membership_fee_schedule for select to anon, authenticated using (active = true or public.is_ni4e_admin());
drop policy if exists "fees_admin_manage" on public.membership_fee_schedule;
create policy "fees_admin_manage" on public.membership_fee_schedule for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "payments_select_self_or_admin" on public.membership_payments;
create policy "payments_select_self_or_admin" on public.membership_payments for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
-- Payment rows must be created/updated by the trusted server-side payment function, not the browser.
drop policy if exists "payments_insert_server_only" on public.membership_payments;
create policy "payments_insert_server_only" on public.membership_payments for insert to service_role with check (true);
drop policy if exists "payments_update_server_only" on public.membership_payments;
create policy "payments_update_server_only" on public.membership_payments for update to service_role using (true) with check (true);

-- Signup trigger saves the membership application even when email confirmation prevents an active browser session.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  app jsonb;
begin
  insert into public.profiles (id, full_name, email, phone, membership_category, role, membership_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',''),
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data ->> 'phone',''),
    coalesce(new.raw_user_meta_data ->> 'membership_category','Corporate Member'),
    'member', 'application_pending'
  ) on conflict (id) do nothing;

  app := new.raw_user_meta_data -> 'ni4e_application';
  if app is not null and not exists (select 1 from public.membership_applications where user_id = new.id) then
    insert into public.membership_applications (user_id, full_name, email, phone, category, status, application_data, source)
    values (
      new.id,
      coalesce(app ->> 'full_name', new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(app ->> 'email', new.email, ''),
      coalesce(app ->> 'phone', new.raw_user_meta_data ->> 'phone', ''),
      coalesce(app ->> 'category', new.raw_user_meta_data ->> 'membership_category', 'Corporate Member'),
      'pending', coalesce(app -> 'application_data', '{}'::jsonb), coalesce(app ->> 'source','website-registration')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Private supporting-document storage for membership applications.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('membership-documents', 'membership-documents', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

drop policy if exists "members_upload_own_membership_documents" on storage.objects;
create policy "members_upload_own_membership_documents" on storage.objects for insert to authenticated
with check (bucket_id = 'membership-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "members_read_own_membership_documents" on storage.objects;
create policy "members_read_own_membership_documents" on storage.objects for select to authenticated
using (bucket_id = 'membership-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_ni4e_admin()));

drop policy if exists "members_delete_own_membership_documents" on storage.objects;
create policy "members_delete_own_membership_documents" on storage.objects for delete to authenticated
using (bucket_id = 'membership-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_ni4e_admin()));


create table if not exists public.membership_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.membership_applications(id) on delete set null,
  document_type text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);
alter table public.membership_documents enable row level security;
drop policy if exists "documents_read_self_or_admin" on public.membership_documents;
create policy "documents_read_self_or_admin" on public.membership_documents for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "documents_insert_self" on public.membership_documents;
create policy "documents_insert_self" on public.membership_documents for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "documents_delete_self_or_admin" on public.membership_documents;
create policy "documents_delete_self_or_admin" on public.membership_documents for delete to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());


-- Optional demonstration credential records. These are explicitly demo-only and
-- must never be presented as official NI4E certificates.
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

-- ToR content-management, enquiries, newsletter and event registration tables.
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null default 'General Enquiry',
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','archived')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  created_at timestamptz not null default now()
);
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('news','event','publication','chapter','executive','past_president','technical_division','document','project','committee')),
  title text not null,
  slug text not null,
  summary text not null default '',
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  event_start timestamptz,
  event_end timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_type,slug)
);
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.site_content(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_title text not null default '',
  full_name text not null,
  email text not null,
  phone text not null default '',
  status text not null default 'registered' check (status in ('registered','cancelled','attended','no_show')),
  cpd_hours numeric(5,2),
  created_at timestamptz not null default now(),
  unique(event_id,email)
);

alter table public.contact_enquiries enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.site_content enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "contact_enquiry_public_insert" on public.contact_enquiries;
create policy "contact_enquiry_public_insert" on public.contact_enquiries for insert to anon, authenticated with check (length(trim(full_name)) > 0 and length(trim(email)) > 3 and length(trim(message)) > 0);
drop policy if exists "contact_enquiry_admin_manage" on public.contact_enquiries;
create policy "contact_enquiry_admin_manage" on public.contact_enquiries for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "newsletter_public_subscribe" on public.newsletter_subscriptions;
create policy "newsletter_public_subscribe" on public.newsletter_subscriptions for insert to anon, authenticated with check (length(trim(email)) > 3);
drop policy if exists "newsletter_admin_manage" on public.newsletter_subscriptions;
create policy "newsletter_admin_manage" on public.newsletter_subscriptions for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content for select to anon, authenticated using (published = true or public.is_ni4e_admin());
drop policy if exists "site_content_admin_manage" on public.site_content;
create policy "site_content_admin_manage" on public.site_content for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "event_registration_insert" on public.event_registrations;
create policy "event_registration_insert" on public.event_registrations for insert to anon, authenticated with check (length(trim(full_name)) > 0 and length(trim(email)) > 3);
drop policy if exists "event_registration_self_or_admin_read" on public.event_registrations;
create policy "event_registration_self_or_admin_read" on public.event_registrations for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "event_registration_admin_update" on public.event_registrations;
create policy "event_registration_admin_update" on public.event_registrations for update to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

-- Admin settings and atomic application review workflow used by the current Admin UI.
create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null default '""'::jsonb,
  description text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "site_settings_admin_manage" on public.site_settings;
create policy "site_settings_admin_manage" on public.site_settings for all to authenticated
using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

create or replace function public.admin_review_membership_application(
  p_application_id uuid,
  p_status text,
  p_review_notes text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_category text;
  v_profile_status text;
begin
  if not public.is_ni4e_admin() then raise exception 'Administrator access required.' using errcode = '42501'; end if;
  if p_status not in ('pending','under_review','needs_information','approved','rejected') then raise exception 'Unsupported application status.'; end if;
  if p_status in ('rejected','needs_information') and length(trim(coalesce(p_review_notes,''))) = 0 then
    raise exception 'A review note is required for rejection or requested corrections.';
  end if;
  select user_id, category into v_user_id, v_category from public.membership_applications where id = p_application_id for update;
  if v_user_id is null then raise exception 'Membership application not found.'; end if;
  update public.membership_applications
    set status = p_status, review_notes = nullif(trim(coalesce(p_review_notes,'')),''),
        reviewed_by = (select auth.uid()), reviewed_at = now(), updated_at = now()
    where id = p_application_id;
  v_profile_status := case p_status
    when 'approved' then 'approved_pending_payment'
    when 'rejected' then 'rejected'
    when 'needs_information' then 'needs_information'
    when 'under_review' then 'under_review'
    else 'application_pending' end;
  update public.profiles set membership_status = v_profile_status,
    membership_category = case when p_status = 'approved' then coalesce(v_category, membership_category) else membership_category end,
    updated_at = now() where id = v_user_id;
end;
$$;
revoke all on function public.admin_review_membership_application(uuid,text,text) from public;
grant execute on function public.admin_review_membership_application(uuid,text,text) to authenticated;

-- Prevent ordinary members from granting themselves active membership or changing their role.
create or replace function public.protect_profile_membership_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_ni4e_admin() and (select auth.uid()) = old.id then
    if new.role is distinct from old.role
      or new.membership_status is distinct from old.membership_status
      or new.membership_category is distinct from old.membership_category
      or new.membership_number is distinct from old.membership_number
      or new.membership_activated_at is distinct from old.membership_activated_at then
      raise exception 'Membership role and activation fields can only be changed by NI4E administrators or verified server-side workflows.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_membership_fields_trigger on public.profiles;
create trigger protect_profile_membership_fields_trigger before update on public.profiles
for each row execute function public.protect_profile_membership_fields();

alter table public.event_registrations add column if not exists event_title text not null default '';

notify pgrst, 'reload schema';
