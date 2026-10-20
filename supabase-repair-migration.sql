-- NI4E database repair migration (idempotent)
-- Apply this in Supabase Dashboard -> SQL Editor for the SAME project used by the website.
-- It repairs missing columns used by the current React app, restores RLS policies,
-- refreshes PostgREST's schema cache, and installs a transactional application-review RPC.
-- It preserves existing rows and does not set any official membership fees.

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

-- Profiles / role and member portal state.
alter table if exists public.profiles add column if not exists full_name text not null default '';
alter table if exists public.profiles add column if not exists email text not null default '';
alter table if exists public.profiles add column if not exists phone text not null default '';
alter table if exists public.profiles add column if not exists membership_category text not null default 'Corporate Member';
alter table if exists public.profiles add column if not exists role text not null default 'member';
alter table if exists public.profiles add column if not exists membership_status text not null default 'application_pending';
alter table if exists public.profiles add column if not exists membership_number text;
alter table if exists public.profiles add column if not exists membership_activated_at timestamptz;
alter table if exists public.profiles add column if not exists created_at timestamptz not null default now();
alter table if exists public.profiles add column if not exists updated_at timestamptz not null default now();

-- Membership application review fields that caused the review_notes schema-cache error.
alter table if exists public.membership_applications add column if not exists full_name text not null default '';
alter table if exists public.membership_applications add column if not exists email text not null default '';
alter table if exists public.membership_applications add column if not exists phone text not null default '';
alter table if exists public.membership_applications add column if not exists category text not null default 'Corporate Member';
alter table if exists public.membership_applications add column if not exists status text not null default 'pending';
alter table if exists public.membership_applications add column if not exists application_data jsonb not null default '{}'::jsonb;
alter table if exists public.membership_applications add column if not exists source text not null default 'website-registration';
alter table if exists public.membership_applications add column if not exists submitted_at timestamptz not null default now();
alter table if exists public.membership_applications add column if not exists updated_at timestamptz not null default now();
alter table if exists public.membership_applications add column if not exists review_notes text;
alter table if exists public.membership_applications add column if not exists reviewed_by uuid references public.profiles(id);
alter table if exists public.membership_applications add column if not exists reviewed_at timestamptz;
alter table if exists public.membership_applications add column if not exists application_type text not null default 'new';
alter table if exists public.membership_applications add column if not exists previous_category text not null default '';
alter table if exists public.membership_applications drop constraint if exists membership_applications_status_check;
alter table if exists public.membership_applications add constraint membership_applications_status_check
  check (status in ('pending','under_review','needs_information','approved','rejected','payment_pending','active'));
alter table if exists public.membership_applications drop constraint if exists membership_applications_application_type_check;
alter table if exists public.membership_applications add constraint membership_applications_application_type_check
  check (application_type in ('new','upgrade','renewal'));
create index if not exists membership_applications_status_submitted_idx on public.membership_applications(status, submitted_at desc);
create index if not exists membership_applications_user_status_idx on public.membership_applications(user_id, status, submitted_at desc);

-- Fee schedule and payment columns used by Admin and Paystack Edge Functions.
alter table if exists public.membership_fee_schedule add column if not exists category text;
alter table if exists public.membership_fee_schedule add column if not exists amount_kobo bigint;
alter table if exists public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint;
alter table if exists public.membership_fee_schedule add column if not exists currency text not null default 'NGN';
alter table if exists public.membership_fee_schedule add column if not exists active boolean not null default false;
alter table if exists public.membership_fee_schedule add column if not exists updated_at timestamptz not null default now();
create unique index if not exists membership_fee_schedule_category_uidx on public.membership_fee_schedule(category);

alter table if exists public.membership_payments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table if exists public.membership_payments add column if not exists application_id uuid references public.membership_applications(id) on delete set null;
alter table if exists public.membership_payments add column if not exists category text not null default 'Membership';
alter table if exists public.membership_payments add column if not exists amount_kobo bigint;
alter table if exists public.membership_payments add column if not exists currency text not null default 'NGN';
alter table if exists public.membership_payments add column if not exists provider text not null default 'paystack';
alter table if exists public.membership_payments add column if not exists provider_reference text;
alter table if exists public.membership_payments add column if not exists status text not null default 'pending';
alter table if exists public.membership_payments add column if not exists payment_type text not null default 'membership';
alter table if exists public.membership_payments add column if not exists created_at timestamptz not null default now();
alter table if exists public.membership_payments add column if not exists paid_at timestamptz;
create unique index if not exists membership_payments_provider_reference_uidx on public.membership_payments(provider_reference) where provider_reference is not null;
create index if not exists membership_payments_user_created_idx on public.membership_payments(user_id, created_at desc);
alter table if exists public.membership_payments drop constraint if exists membership_payments_payment_type_check;
alter table if exists public.membership_payments add constraint membership_payments_payment_type_check check (payment_type in ('membership','upgrade','renewal'));

-- Content table shared by events, news, publications, chapters, executives, committees and documents.
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  title text not null default '',
  slug text not null default '',
  summary text not null default '',
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  event_start timestamptz,
  event_end timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
alter table public.site_content add column if not exists created_by uuid references public.profiles(id);
alter table public.site_content add column if not exists created_at timestamptz not null default now();
alter table public.site_content add column if not exists updated_at timestamptz not null default now();
alter table public.site_content drop constraint if exists site_content_content_type_check;
alter table public.site_content add constraint site_content_content_type_check
  check (content_type in ('news','event','publication','chapter','executive','past_president','technical_division','document','project','committee','institutional_page'));
update public.site_content set slug = 'migrated-' || id::text where slug is null or length(trim(slug)) = 0;
create index if not exists site_content_type_slug_idx on public.site_content(content_type, slug);
create index if not exists site_content_published_type_created_idx on public.site_content(published, content_type, created_at desc);

-- Contact messages and newsletter subscriptions.
create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null,
  subject text not null default 'General Enquiry', message text not null,
  status text not null default 'new', admin_notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.contact_enquiries add column if not exists full_name text not null default '';
alter table public.contact_enquiries add column if not exists email text not null default '';
alter table public.contact_enquiries add column if not exists subject text not null default 'General Enquiry';
alter table public.contact_enquiries add column if not exists message text not null default '';
alter table public.contact_enquiries add column if not exists status text not null default 'new';
alter table public.contact_enquiries add column if not exists admin_notes text not null default '';
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

-- Event registrations and CPD attendance.
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.site_content(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, full_name text not null, email text not null,
  phone text not null default '', status text not null default 'registered', cpd_hours numeric(5,2), created_at timestamptz not null default now(),
  unique(event_id,email)
);
alter table public.event_registrations add column if not exists event_title text not null default '';
alter table public.event_registrations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.event_registrations add column if not exists full_name text not null default '';
alter table public.event_registrations add column if not exists email text not null default '';
alter table public.event_registrations add column if not exists phone text not null default '';
alter table public.event_registrations add column if not exists status text not null default 'registered';
alter table public.event_registrations add column if not exists cpd_hours numeric(5,2);
alter table public.event_registrations add column if not exists created_at timestamptz not null default now();

-- Simple admin-managed key/value settings. Values are JSON so the table can store strings safely.
create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null default '""'::jsonb,
  description text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Storage bucket for private application documents and passport photographs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('membership-documents','membership-documents',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=array['application/pdf','image/jpeg','image/png'];

-- Private document metadata table (the files themselves remain in private Storage).
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
alter table public.membership_documents add column if not exists application_id uuid references public.membership_applications(id) on delete set null;
alter table public.membership_documents add column if not exists document_type text not null default 'supporting_document';
alter table public.membership_documents add column if not exists file_name text not null default '';
alter table public.membership_documents add column if not exists storage_path text not null default '';
alter table public.membership_documents add column if not exists mime_type text not null default 'application/octet-stream';
alter table public.membership_documents add column if not exists size_bytes bigint not null default 1;
alter table public.membership_documents add column if not exists created_at timestamptz not null default now();

-- RLS and admin helper.
create or replace function public.is_ni4e_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.membership_fee_schedule enable row level security;
alter table public.membership_payments enable row level security;
alter table public.site_content enable row level security;
alter table public.contact_enquiries enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.event_registrations enable row level security;
alter table public.site_settings enable row level security;
alter table public.membership_documents enable row level security;

-- Profile and application access rules. Only administrators can review other users' records.
drop policy if exists "profile_select_self_or_admin" on public.profiles;
create policy "profile_select_self_or_admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "profile_update_self_or_admin" on public.profiles;
create policy "profile_update_self_or_admin" on public.profiles for update to authenticated using (id = (select auth.uid()) or public.is_ni4e_admin()) with check ((id = (select auth.uid()) and role = 'member') or public.is_ni4e_admin());
drop policy if exists "applications_select_self_or_admin" on public.membership_applications;
create policy "applications_select_self_or_admin" on public.membership_applications for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "applications_insert_self_pending" on public.membership_applications;
create policy "applications_insert_self_pending" on public.membership_applications for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "applications_update_admin_only" on public.membership_applications;
create policy "applications_update_admin_only" on public.membership_applications for update to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());
drop policy if exists "documents_read_self_or_admin" on public.membership_documents;
create policy "documents_read_self_or_admin" on public.membership_documents for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "documents_insert_self" on public.membership_documents;
create policy "documents_insert_self" on public.membership_documents for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "documents_delete_self_or_admin" on public.membership_documents;
create policy "documents_delete_self_or_admin" on public.membership_documents for delete to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());

-- Recreate policies so older projects use the same rules as the current app.
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content for select to anon, authenticated using (published = true or public.is_ni4e_admin());
drop policy if exists "site_content_admin_manage" on public.site_content;
create policy "site_content_admin_manage" on public.site_content for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "contact_enquiry_public_insert" on public.contact_enquiries;
create policy "contact_enquiry_public_insert" on public.contact_enquiries for insert to anon, authenticated with check (length(trim(full_name)) > 0 and length(trim(email)) > 3 and length(trim(message)) > 0);
drop policy if exists "contact_enquiry_admin_manage" on public.contact_enquiries;
create policy "contact_enquiry_admin_manage" on public.contact_enquiries for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "newsletter_public_subscribe" on public.newsletter_subscriptions;
create policy "newsletter_public_subscribe" on public.newsletter_subscriptions for insert to anon, authenticated with check (length(trim(email)) > 3);
drop policy if exists "newsletter_admin_manage" on public.newsletter_subscriptions;
create policy "newsletter_admin_manage" on public.newsletter_subscriptions for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "fees_read_active" on public.membership_fee_schedule;
create policy "fees_read_active" on public.membership_fee_schedule for select to anon, authenticated using (active = true or public.is_ni4e_admin());
drop policy if exists "fees_admin_manage" on public.membership_fee_schedule;
create policy "fees_admin_manage" on public.membership_fee_schedule for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "payments_self_or_admin_read" on public.membership_payments;
create policy "payments_self_or_admin_read" on public.membership_payments for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "payments_admin_manage" on public.membership_payments;
create policy "payments_admin_manage" on public.membership_payments for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "site_settings_admin_manage" on public.site_settings;
create policy "site_settings_admin_manage" on public.site_settings for all to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "event_registration_insert" on public.event_registrations;
create policy "event_registration_insert" on public.event_registrations for insert to anon, authenticated with check (length(trim(full_name)) > 0 and length(trim(email)) > 3);
drop policy if exists "event_registration_self_or_admin_read" on public.event_registrations;
create policy "event_registration_self_or_admin_read" on public.event_registrations for select to authenticated using (user_id = (select auth.uid()) or public.is_ni4e_admin());
drop policy if exists "event_registration_admin_update" on public.event_registrations;
create policy "event_registration_admin_update" on public.event_registrations for update to authenticated using (public.is_ni4e_admin()) with check (public.is_ni4e_admin());

drop policy if exists "members_upload_own_membership_documents" on storage.objects;
create policy "members_upload_own_membership_documents" on storage.objects for insert to authenticated
with check (bucket_id = 'membership-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "members_read_own_membership_documents" on storage.objects;
create policy "members_read_own_membership_documents" on storage.objects for select to authenticated
using (bucket_id = 'membership-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_ni4e_admin()));
drop policy if exists "members_delete_own_membership_documents" on storage.objects;
create policy "members_delete_own_membership_documents" on storage.objects for delete to authenticated
using (bucket_id = 'membership-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_ni4e_admin()));

-- One transactional function keeps application + profile state in sync.
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

notify pgrst, 'reload schema';

-- Membership payment/profile columns referenced by the current frontend and Edge Functions.
alter table public.profiles add column if not exists membership_number text;
alter table public.profiles add column if not exists membership_activated_at timestamptz;
alter table public.profiles add column if not exists membership_expires_at timestamptz;
alter table public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists renewal_amount_kobo bigint;
alter table public.membership_payments add column if not exists payment_type text not null default 'membership';
alter table public.membership_payments add column if not exists provider_transaction_id text;
