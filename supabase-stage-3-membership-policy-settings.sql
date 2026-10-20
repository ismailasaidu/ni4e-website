-- NI4E Stage 3: policy settings for admin-managed, unconfirmed membership rules.
-- Safe to run more than once. Existing settings are preserved.
-- Requires the existing public.site_settings table and its admin-only RLS policy
-- from supabase-schema.sql / supabase-repair-migration.sql.

alter table public.profiles add column if not exists membership_expires_at timestamptz;

insert into public.site_settings (setting_key, setting_value, description)
values
  ('ni4e_corporate_membership_definition', '"Not confirmed — NI4E clarification required"'::jsonb, 'Corporate Membership meaning is unconfirmed. Do not publish until NI4E approves.'),
  ('ni4e_associate_eligibility', '"Not configured — NI4E approval required"'::jsonb, 'Official Associate eligibility criteria are unconfirmed.'),
  ('ni4e_student_required_documents', '"Student ID\nProof of enrolment"'::jsonb, 'Confirmed Student Membership documents.'),
  ('ni4e_graduate_required_documents', '"Degree certificate or statement of result"'::jsonb, 'Confirmed Graduate Membership document choice.'),
  ('ni4e_associate_required_documents', '"Not configured — NI4E approval required"'::jsonb, 'Associate documents depend on approved eligibility policy.'),
  ('ni4e_corporate_required_documents', '"Not configured — NI4E clarification required"'::jsonb, 'Corporate documents depend on category definition.'),
  ('ni4e_application_fee_policy', '"after_approval"'::jsonb, 'All fees are payable after application approval.'),
  ('ni4e_correction_policy', '"same_application"'::jsonb, 'Applicants may resubmit a needs-information application against the same application reference; prior review history is retained.'),
  ('ni4e_rejection_wait_days', 'null'::jsonb, 'Reapplication waiting period in days. Null means not configured; do not invent a period.'),
  ('ni4e_review_timeline', '"Not configured — enter the official NI4E review timeline"'::jsonb, 'Official review timeline is available to NI4E but the approved wording/value must be entered.'),
  ('ni4e_renewal_basis', '"not_configured"'::jsonb, 'Choose the approved annual renewal date calculation before taking membership payments.'),
  ('ni4e_annual_renewal_policy', '"annual"'::jsonb, 'Annual membership renewal is confirmed.'),
  ('ni4e_public_directory_statuses', '"active"'::jsonb, 'Default public directory status visibility is active only.'),
  ('ni4e_max_document_size_mb', '5'::jsonb, 'Maximum upload size in MB. Keep aligned with Supabase Storage limits.'),
  ('ni4e_allowed_document_types', '"pdf,jpg,jpeg,png"'::jsonb, 'Allowed document extensions; keep frontend and storage validation aligned.')
on conflict (setting_key) do nothing;

-- Align the legacy placeholder with the agreed correction workflow, but preserve any explicit admin choice.
update public.site_settings
set setting_value = '"same_application"'::jsonb,
    description = 'Applicants may resubmit a needs-information application against the same application reference; prior review history is retained.'
where setting_key = 'ni4e_correction_policy'
  and lower(trim(both '"' from setting_value #>> '{}')) in ('not_configured','');

-- Safe public policy projection: do not grant anonymous access to all site_settings.
create or replace function public.ni4e_public_membership_policy()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(setting_key, setting_value), '{}'::jsonb)
  from public.site_settings
  where setting_key = any (array[
    'ni4e_review_timeline',
    'ni4e_rejection_wait_days',
    'ni4e_correction_policy',
    'ni4e_renewal_basis',
    'ni4e_annual_renewal_policy',
    'ni4e_max_document_size_mb',
    'ni4e_allowed_document_types',
    'ni4e_student_required_documents',
    'ni4e_graduate_required_documents',
    'ni4e_associate_required_documents',
    'ni4e_corporate_required_documents',
    'ni4e_associate_eligibility',
    'ni4e_corporate_membership_definition',
    'ni4e_public_directory_statuses'
  ]);
$$;
revoke all on function public.ni4e_public_membership_policy() from public;
grant execute on function public.ni4e_public_membership_policy() to anon, authenticated;


-- Apply the admin-configured public directory status allow-list while returning
-- only the four approved public fields. Default is active-only.
create or replace function public.ni4e_public_member_directory()
returns table(full_name text, membership_number text, membership_category text, membership_status text)
language sql stable security definer set search_path = '' as $$
  select p.full_name, p.membership_number, p.membership_category, case when p.membership_expires_at is not null and p.membership_expires_at <= now() then 'expired' else p.membership_status end
  from public.profiles p
  where lower(coalesce(case when p.membership_expires_at is not null and p.membership_expires_at <= now() then 'expired' else p.membership_status end, '')) = any (
    select lower(trim(status_value))
    from unnest(string_to_array(coalesce((
      select ss.setting_value #>> '{}' from public.site_settings ss
      where ss.setting_key = 'ni4e_public_directory_statuses'
    ), 'active'), ',')) as statuses(status_value)
  )
    and p.membership_number is not null
    and length(trim(p.membership_number)) > 0
    and lower(trim(p.membership_number)) not like 'demo-%'
  order by p.full_name;
$$;
revoke all on function public.ni4e_public_member_directory() from public;
grant execute on function public.ni4e_public_member_directory() to anon, authenticated;
notify pgrst, 'reload schema';
