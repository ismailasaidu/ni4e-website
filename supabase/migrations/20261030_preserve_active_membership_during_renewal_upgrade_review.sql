-- Preserve an existing member's active membership while a renewal or upgrade
-- request is being reviewed or awaiting payment. Apply in Supabase SQL Editor.
-- New membership applications retain the normal application_pending / approved_pending_payment flow.

create or replace function public.admin_review_membership_application(
  p_application_id uuid,
  p_status text,
  p_review_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_category text;
  v_application_type text;
  v_current_membership_status text;
  v_profile_status text;
begin
  if not public.is_ni4e_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if p_status not in ('pending','under_review','needs_information','approved','rejected') then
    raise exception 'Unsupported application status.';
  end if;

  if p_status in ('rejected','needs_information') and length(trim(coalesce(p_review_notes,''))) = 0 then
    raise exception 'A review note is required for rejection or requested corrections.';
  end if;

  select user_id, category, coalesce(application_type, 'new')
    into v_user_id, v_category, v_application_type
  from public.membership_applications
  where id = p_application_id
  for update;

  if v_user_id is null then
    raise exception 'Membership application not found.';
  end if;

  select membership_status into v_current_membership_status
  from public.profiles
  where id = v_user_id
  for update;

  update public.membership_applications
  set status = p_status,
      review_notes = nullif(trim(coalesce(p_review_notes,'')),''),
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  if v_application_type in ('renewal','upgrade') then
    -- The member keeps their existing status/category until the verified payment
    -- function completes the renewal or upgrade. Rejection also leaves their
    -- existing membership record untouched.
    v_profile_status := v_current_membership_status;
  else
    v_profile_status := case p_status
      when 'approved' then 'approved_pending_payment'
      when 'rejected' then 'rejected'
      when 'needs_information' then 'needs_information'
      when 'under_review' then 'under_review'
      else 'application_pending'
    end;
  end if;

  update public.profiles
  set membership_status = v_profile_status,
      membership_category = case
        when v_application_type = 'new' and p_status = 'approved'
          then coalesce(v_category, membership_category)
        else membership_category
      end,
      updated_at = now()
  where id = v_user_id;
end;
$$;

revoke all on function public.admin_review_membership_application(uuid,text,text) from public;
grant execute on function public.admin_review_membership_application(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
