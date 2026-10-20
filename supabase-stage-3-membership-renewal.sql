-- NI4E Stage 3: annual membership renewal dates. Safe to run repeatedly.
alter table public.profiles add column if not exists membership_expires_at timestamptz;
insert into public.site_settings (setting_key, setting_value, description) values
  ('ni4e_renewal_basis', '"not_configured"'::jsonb, 'Choose the approved annual renewal date calculation before taking membership payments.')
on conflict (setting_key) do nothing;
notify pgrst, 'reload schema';
