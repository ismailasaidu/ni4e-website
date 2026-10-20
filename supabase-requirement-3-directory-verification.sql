-- NI4E Requirement 3: privacy-limited public member directory and verification RPCs.
-- Directory and verification return only approved public fields. Both use the admin-configured
-- status allow-list in site_settings; the safe default is active only.
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

create or replace function public.ni4e_verify_membership(p_membership_number text)
returns table(verified boolean, full_name text, membership_number text, membership_category text, membership_status text)
language sql stable security definer set search_path = '' as $$
  select true, p.full_name, p.membership_number, p.membership_category, case when p.membership_expires_at is not null and p.membership_expires_at <= now() then 'expired' else p.membership_status end
  from public.profiles p
  where lower(trim(p.membership_number)) = lower(trim(p_membership_number))
    and lower(coalesce(case when p.membership_expires_at is not null and p.membership_expires_at <= now() then 'expired' else p.membership_status end, '')) = any (
      select lower(trim(status_value))
      from unnest(string_to_array(coalesce((
        select ss.setting_value #>> '{}' from public.site_settings ss
        where ss.setting_key = 'ni4e_public_directory_statuses'
      ), 'active'), ',')) as statuses(status_value)
    )
    and p.membership_number is not null
    and lower(trim(p.membership_number)) not like 'demo-%'
  limit 1;
$$;
revoke all on function public.ni4e_verify_membership(text) from public;
grant execute on function public.ni4e_verify_membership(text) to anon, authenticated;
notify pgrst, 'reload schema';
