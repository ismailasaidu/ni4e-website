-- NI4E upgrade document checklists. Defaults intentionally remain unconfigured until approved by the institution.
insert into public.site_settings (setting_key, setting_value, description) values
  ('ni4e_upgrade_graduate_required_documents', '"Not configured — NI4E approval required"'::jsonb, 'Approved documents required when upgrading to Graduate Member.'),
  ('ni4e_upgrade_associate_required_documents', '"Not configured — NI4E approval required"'::jsonb, 'Approved documents required when upgrading to Associate Member.'),
  ('ni4e_upgrade_corporate_required_documents', '"Not configured — NI4E approval required"'::jsonb, 'Approved documents required when upgrading to Corporate Member.'),
  ('ni4e_upgrade_fellow_required_documents', '"Not configured — NI4E approval required"'::jsonb, 'Approved documents required when upgrading to Fellow.')
on conflict (setting_key) do nothing;

create or replace function public.ni4e_public_membership_policy()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_object_agg(setting_key, setting_value), '{}'::jsonb)
  from public.site_settings
  where setting_key = any (array[
    'ni4e_review_timeline','ni4e_rejection_wait_days','ni4e_correction_policy',
    'ni4e_renewal_basis','ni4e_annual_renewal_policy','ni4e_max_document_size_mb',
    'ni4e_allowed_document_types','ni4e_student_required_documents','ni4e_graduate_required_documents',
    'ni4e_associate_required_documents','ni4e_corporate_required_documents',
    'ni4e_associate_eligibility','ni4e_corporate_membership_definition',
    'ni4e_public_directory_statuses','ni4e_upgrade_graduate_required_documents',
    'ni4e_upgrade_associate_required_documents','ni4e_upgrade_corporate_required_documents',
    'ni4e_upgrade_fellow_required_documents'
  ]);
$$;
revoke all on function public.ni4e_public_membership_policy() from public;
grant execute on function public.ni4e_public_membership_policy() to anon, authenticated;
notify pgrst, 'reload schema';
