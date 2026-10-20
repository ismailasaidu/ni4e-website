-- NI4E Stage 3: safe resubmission of returned/rejected membership applications.
-- This does not grant applicants broad UPDATE access to membership_applications.

create or replace function public.resubmit_membership_application(
  p_application_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_category text,
  p_application_data jsonb
)
returns table(id uuid, status text, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.membership_applications%rowtype;
  v_existing_data jsonb;
  v_history jsonb;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to resubmit an application.' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_full_name, '')), '') is null
     or nullif(trim(coalesce(p_email, '')), '') is null
     or nullif(trim(coalesce(p_phone, '')), '') is null then
    raise exception 'Full name, email and phone are required.' using errcode = '22023';
  end if;
  if lower(trim(coalesce(p_email, ''))) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if coalesce(p_category, '') not in ('Student Member', 'Graduate Member', 'Associate Member', 'Corporate Member') then
    raise exception 'Choose a valid NI4E membership category.' using errcode = '22023';
  end if;

  select * into v_app
  from public.membership_applications
  where id = p_application_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Application not found for this account.' using errcode = 'P0002';
  end if;
  if v_app.application_type in ('renewal', 'upgrade') then
    raise exception 'Renewal and upgrade requests cannot be resubmitted through the new-membership form.' using errcode = '22023';
  end if;
  if v_app.status not in ('rejected', 'needs_information') then
    raise exception 'Only applications returned for correction or rejected by NI4E can be resubmitted.' using errcode = '22023';
  end if;

  v_existing_data := coalesce(v_app.application_data, '{}'::jsonb);
  v_history := coalesce(v_existing_data -> 'review_history', '[]'::jsonb);
  if jsonb_typeof(v_history) <> 'array' then v_history := '[]'::jsonb; end if;
  if v_app.review_notes is not null or v_app.reviewed_by is not null or v_app.reviewed_at is not null then
    v_history := v_history || jsonb_build_array(jsonb_build_object(
      'status', v_app.status,
      'notes', v_app.review_notes,
      'reviewed_by', v_app.reviewed_by,
      'reviewed_at', v_app.reviewed_at,
      'archived_at', v_now
    ));
  end if;

  return query
  update public.membership_applications
  set full_name = trim(p_full_name),
      email = lower(trim(p_email)),
      phone = trim(p_phone),
      category = p_category,
      status = 'pending',
      application_data = coalesce(p_application_data, '{}'::jsonb) || jsonb_build_object('review_history', v_history, 'resubmitted_at', v_now),
      review_notes = null,
      reviewed_by = null,
      reviewed_at = null,
      submitted_at = v_now,
      updated_at = v_now,
      source = 'website-registration-resubmission'
  where id = v_app.id
  returning membership_applications.id, membership_applications.status, membership_applications.submitted_at;
end;
$$;

revoke all on function public.resubmit_membership_application(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.resubmit_membership_application(uuid, text, text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
