-- NI4E controlled membership upgrade + annual renewal lifecycle.
-- Apply in Supabase SQL Editor after the existing membership, notifications,
-- renewal-fee and upgrade-document-checklist migrations.

alter table public.membership_applications
  add column if not exists rejected_at timestamptz,
  add column if not exists reapplication_eligible_at timestamptz,
  add column if not exists documents_submitted_at timestamptz,
  add column if not exists committee_verified_at timestamptz,
  add column if not exists final_approved_at timestamptz;

alter table public.membership_applications drop constraint if exists membership_applications_status_check;
alter table public.membership_applications add constraint membership_applications_status_check
  check (status in (
    'pending','under_review','needs_information','approved','documents_submitted',
    'committee_review','committee_verified','approved_for_payment',
    'approved_pending_payment','payment_pending','active','rejected'
  ));

insert into public.site_settings(setting_key, setting_value, description) values
  ('ni4e_upgrade_reapplication_wait_months', '6'::jsonb, 'Administrator-configurable waiting period in calendar months before a member may submit a new upgrade request after rejection.'),
  ('ni4e_renewal_open_days_before_expiry', '"not_configured"'::jsonb, 'Number of days before recorded membership expiry when annual renewal requests may be submitted. Must be approved and configured by NI4E.'),
  ('ni4e_renewal_grace_days', '"not_configured"'::jsonb, 'Approved number of days after expiry during which renewal requests may still be submitted. Set 0 for no grace period.')
on conflict(setting_key) do nothing;

update public.membership_applications a
set rejected_at = coalesce(a.rejected_at, a.reviewed_at, a.updated_at, a.submitted_at),
    reapplication_eligible_at = coalesce(a.reapplication_eligible_at,
      coalesce(a.reviewed_at, a.updated_at, a.submitted_at) + make_interval(months => coalesce((
        select case when ss.setting_value='"not_configured"'::jsonb then 6 else greatest(1,(ss.setting_value #>> '{}')::integer) end
        from public.site_settings ss where ss.setting_key='ni4e_upgrade_reapplication_wait_months'
      ),6)))
where a.application_type='upgrade' and a.status='rejected' and a.reapplication_eligible_at is null;

-- Public member policy returns only settings intended to be displayed in the member portal.
create or replace function public.ni4e_public_membership_policy()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(setting_key, setting_value), '{}'::jsonb)
  from public.site_settings
  where setting_key = any(array[
    'ni4e_review_timeline','ni4e_rejection_wait_days','ni4e_upgrade_reapplication_wait_months',
    'ni4e_correction_policy','ni4e_renewal_basis','ni4e_annual_renewal_policy',
    'ni4e_renewal_open_days_before_expiry','ni4e_renewal_grace_days',
    'ni4e_max_document_size_mb','ni4e_allowed_document_types',
    'ni4e_student_required_documents','ni4e_graduate_required_documents',
    'ni4e_associate_required_documents','ni4e_corporate_required_documents',
    'ni4e_associate_eligibility','ni4e_corporate_membership_definition',
    'ni4e_public_directory_statuses','ni4e_upgrade_graduate_required_documents',
    'ni4e_upgrade_associate_required_documents','ni4e_upgrade_corporate_required_documents',
    'ni4e_upgrade_fellow_required_documents'
  ]);
$$;
revoke all on function public.ni4e_public_membership_policy() from public;
grant execute on function public.ni4e_public_membership_policy() to anon, authenticated;

-- Enforce reapplication rules in the database, not only in React.
create or replace function public.ni4e_guard_upgrade_application_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_last_reapply timestamptz;
  v_wait_months integer;
  v_open_count integer;
  v_member_status text;
  v_membership_number text;
begin
  if coalesce(new.application_type,'new') <> 'upgrade' then return new; end if;
  select membership_status,membership_number into v_member_status,v_membership_number from public.profiles where id=new.user_id;
  if v_member_status <> 'active' or coalesce(v_membership_number,'')='' then raise exception 'Only an active NI4E member with an assigned membership number may request an upgrade.'; end if;
  select case when setting_value = '"not_configured"'::jsonb then 6 else greatest(1, (setting_value #>> '{}')::integer) end
    into v_wait_months from public.site_settings where setting_key='ni4e_upgrade_reapplication_wait_months';
  v_wait_months := coalesce(v_wait_months, 6);

  select coalesce(reapplication_eligible_at, rejected_at + make_interval(months => v_wait_months)) into v_last_reapply
  from public.membership_applications
  where user_id=new.user_id and application_type='upgrade' and status='rejected'
  order by rejected_at desc nulls last, reviewed_at desc nulls last, submitted_at desc
  limit 1;
  if v_last_reapply is not null and v_last_reapply > now() then
    raise exception 'You may submit another upgrade application from %.', to_char(v_last_reapply at time zone 'Africa/Lagos','DD Mon YYYY');
  end if;

  select count(*) into v_open_count from public.membership_applications
  where user_id=new.user_id and application_type='upgrade'
    and status in ('pending','under_review','needs_information','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','approved_pending_payment','payment_pending');
  if v_open_count > 0 then raise exception 'You already have an upgrade request in progress. Continue the existing application.'; end if;
  return new;
end $$;
drop trigger if exists ni4e_guard_upgrade_application_insert on public.membership_applications;
create trigger ni4e_guard_upgrade_application_insert before insert on public.membership_applications
for each row execute function public.ni4e_guard_upgrade_application_insert();

-- Members submit requested evidence from the exact application workspace.
-- Upgrade evidence advances to committee verification; renewal/new-application
-- corrections return to the Secretariat review queue.
create or replace function public.member_submit_membership_response(p_application_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_count integer; v_status text; v_type text; v_previous_docs_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Please sign in.' using errcode='42501'; end if;
  select status,coalesce(application_type,'new'),documents_submitted_at into v_status,v_type,v_previous_docs_at
  from public.membership_applications
  where id=p_application_id and user_id=auth.uid() for update;
  if v_status is null then raise exception 'Membership application not found.'; end if;
  if v_type='upgrade' and v_status not in ('approved','needs_information') then
    raise exception 'Upgrade documents can only be submitted after initial approval or a request for additional information.';
  elsif v_type<>'upgrade' and v_status<>'needs_information' then
    raise exception 'A response can only be submitted when NI4E has requested additional information.';
  end if;
  select count(*) into v_count from public.membership_documents
  where application_id=p_application_id and user_id=auth.uid()
    and (v_status <> 'needs_information' or v_previous_docs_at is null or created_at > coalesce((select reviewed_at from public.membership_applications where id=p_application_id), '-infinity'::timestamptz));
  if v_count < 1 then raise exception 'Upload the requested supporting document before submitting your response.'; end if;
  update public.membership_applications set
    status=case when v_type='upgrade' and (v_status='approved' or v_previous_docs_at is not null) then 'documents_submitted' else 'under_review' end,
    documents_submitted_at=case when v_type='upgrade' and (v_status='approved' or v_previous_docs_at is not null) then now() else documents_submitted_at end,
    updated_at=now()
  where id=p_application_id;
end $$;
revoke all on function public.member_submit_membership_response(uuid) from public;
grant execute on function public.member_submit_membership_response(uuid) to authenticated;

-- Admin-controlled decision transitions. Upgrade initial approval is NOT payment approval.
create or replace function public.admin_review_membership_application(
  p_application_id uuid,
  p_status text,
  p_review_notes text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid; v_category text; v_type text; v_old_status text;
  v_wait_months integer; v_eligible_at timestamptz; v_doc_count integer;
begin
  if not public.is_ni4e_admin() then raise exception 'Administrator access required.' using errcode='42501'; end if;
  if p_status not in ('pending','under_review','needs_information','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','rejected') then
    raise exception 'Unsupported membership application decision.';
  end if;
  if p_status in ('rejected','needs_information') and length(trim(coalesce(p_review_notes,'')))=0 then
    raise exception 'A clear reason or instruction is required for this decision.';
  end if;
  select user_id,category,coalesce(application_type,'new'),status into v_user_id,v_category,v_type,v_old_status
  from public.membership_applications where id=p_application_id for update;
  if v_user_id is null then raise exception 'Membership application not found.'; end if;

  if v_type='upgrade' then
    if p_status='under_review' and v_old_status not in ('pending','under_review') then raise exception 'This upgrade has moved beyond the initial review stage. Use the document and committee actions for its current stage.'; end if;
    if p_status='approved' and v_old_status in ('needs_information') and exists(select 1 from public.membership_applications where id=p_application_id and documents_submitted_at is not null) then raise exception 'This application has already entered document verification. Submit the new evidence and continue with committee review.'; end if;
    if p_status='committee_review' and v_old_status <> 'documents_submitted' then raise exception 'The member must submit supporting documents before committee verification.'; end if;
    if p_status='committee_verified' and v_old_status <> 'committee_review' then raise exception 'The application must be in committee verification before documents can be verified.'; end if;
    if p_status='committee_verified' then
      select count(*) into v_doc_count from public.membership_documents where application_id=p_application_id and user_id=v_user_id;
      if v_doc_count < 1 then raise exception 'No supporting documents are attached to this upgrade application.'; end if;
    end if;
    if p_status='approved_for_payment' and v_old_status <> 'committee_verified' then raise exception 'Final approval is only available after committee document verification.'; end if;
    if p_status='approved' and v_old_status not in ('pending','under_review','needs_information') then raise exception 'Initial approval can only be recorded during the first review stage.'; end if;
  elsif v_type='renewal' then
    if p_status in ('documents_submitted','committee_review','committee_verified','approved_for_payment') then raise exception 'Renewal requests use the Secretariat review and approval process, not the upgrade document committee stages.'; end if;
  end if;

  v_eligible_at := null;
  if p_status='rejected' and v_type='upgrade' then
    select case when setting_value='"not_configured"'::jsonb then 6 else greatest(1,(setting_value #>> '{}')::integer) end
      into v_wait_months from public.site_settings where setting_key='ni4e_upgrade_reapplication_wait_months';
    v_wait_months := coalesce(v_wait_months,6);
    v_eligible_at := now() + make_interval(months => v_wait_months);
  end if;

  update public.membership_applications set
    status=p_status,
    review_notes=nullif(trim(coalesce(p_review_notes,'')),''),
    reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now(),
    rejected_at=case when p_status='rejected' then now() else rejected_at end,
    reapplication_eligible_at=case when p_status='rejected' and v_type='upgrade' then v_eligible_at when p_status<>'rejected' then null else reapplication_eligible_at end,
    committee_verified_at=case when p_status='committee_verified' then now() else committee_verified_at end,
    final_approved_at=case when p_status='approved_for_payment' then now() else final_approved_at end
  where id=p_application_id;

  -- Existing membership identity and grade remain unchanged until provider-verified payment.
  if v_type='new' then
    update public.profiles set
      membership_status=case p_status when 'approved' then 'approved_pending_payment' when 'rejected' then 'rejected' when 'needs_information' then 'needs_information' when 'under_review' then 'under_review' else 'application_pending' end,
      membership_category=case when p_status='approved' then coalesce(v_category,membership_category) else membership_category end,
      updated_at=now() where id=v_user_id;
  end if;
end $$;
revoke all on function public.admin_review_membership_application(uuid,text,text) from public;
grant execute on function public.admin_review_membership_application(uuid,text,text) to authenticated;

-- Renewal requests are accepted only inside the configured renewal window / grace period.
create or replace function public.ni4e_guard_renewal_application_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_expiry timestamptz; v_open integer; v_grace integer; v_status text; v_membership_number text;
begin
  if coalesce(new.application_type,'new') <> 'renewal' then return new; end if;
  select membership_expires_at,membership_status,membership_number into v_expiry,v_status,v_membership_number from public.profiles where id=new.user_id;
  if coalesce(v_membership_number,'')='' then raise exception 'An official NI4E membership number is required before renewal.'; end if;
  select case when setting_value='"not_configured"'::jsonb then null else (setting_value #>> '{}')::integer end into v_open from public.site_settings where setting_key='ni4e_renewal_open_days_before_expiry';
  select case when setting_value='"not_configured"'::jsonb then null else (setting_value #>> '{}')::integer end into v_grace from public.site_settings where setting_key='ni4e_renewal_grace_days';
  if v_expiry is null then raise exception 'Your membership expiry date is not recorded. Please contact the Secretariat.'; end if;
  if v_open is null or v_grace is null then raise exception 'NI4E has not configured the annual renewal opening window and grace period yet.'; end if;
  if v_status not in ('active','expired') then raise exception 'Only existing active or expired members can request annual renewal.'; end if;
  if now() < v_expiry - make_interval(days=>v_open) or now() > v_expiry + make_interval(days=>v_grace) then
    raise exception 'Annual renewal is available from % until %.', to_char((v_expiry-make_interval(days=>v_open)) at time zone 'Africa/Lagos','DD Mon YYYY'), to_char((v_expiry+make_interval(days=>v_grace)) at time zone 'Africa/Lagos','DD Mon YYYY');
  end if;
  if exists(select 1 from public.membership_applications where user_id=new.user_id and application_type='renewal' and status in ('pending','under_review','needs_information','approved','approved_pending_payment','payment_pending')) then
    raise exception 'You already have a renewal request in progress. Open Applications to continue it.';
  end if;
  return new;
end $$;
drop trigger if exists ni4e_guard_renewal_application_insert on public.membership_applications;
create trigger ni4e_guard_renewal_application_insert before insert on public.membership_applications
for each row execute function public.ni4e_guard_renewal_application_insert();

-- More informative in-app notifications for the new lifecycle stages.
create or replace function public.ni4e_notify_application_change()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_title text; v_body text; v_type text:=lower(coalesce(new.application_type,'new'));
begin
  if new.user_id is null then return new; end if;
  if tg_op='INSERT' then
    v_title:=case v_type when 'renewal' then 'Renewal request received' when 'upgrade' then 'Membership upgrade request received' else 'Membership application received' end;
    v_body:='Your '||replace(v_type,'_',' ')||' request for '||coalesce(new.category,'membership')||' has been received. Track it in Applications.';
  elsif old.status is distinct from new.status or old.review_notes is distinct from new.review_notes then
    v_title:=case new.status
      when 'approved' then case when v_type='upgrade' then 'Upgrade request approved — documents required' else 'Your application has been approved' end
      when 'documents_submitted' then 'Upgrade documents submitted'
      when 'committee_review' then 'Your documents are with the committee'
      when 'committee_verified' then 'Committee verification completed'
      when 'approved_for_payment' then 'Your upgrade has final approval'
      when 'approved_pending_payment' then 'Application approved — payment required'
      when 'payment_pending' then 'Payment is required to continue'
      when 'active' then 'Your membership is now active'
      when 'rejected' then 'An application decision is available'
      when 'needs_information' then 'More information is required'
      when 'under_review' then 'Your application is under review'
      else 'Your application has been updated' end;
    v_body:=case new.status
      when 'approved' then case when v_type='upgrade' then 'Your initial upgrade review was successful. Open this application to submit the supporting documents for your requested grade.' else 'NI4E approved your request. Payment is available in your application tracker.' end
      when 'documents_submitted' then 'Your upgrade documents have been received and are ready for committee verification.'
      when 'committee_review' then 'The committee is reviewing the supporting documents attached to your upgrade application.'
      when 'committee_verified' then 'The committee has verified your supporting documents. NI4E will record the final decision next.'
      when 'approved_for_payment' then 'Your upgrade has final approval. You may now complete the configured upgrade payment.'
      when 'active' then 'Your membership record has been updated. Review your membership page.'
      when 'rejected' then 'NI4E recorded a decision. Open Applications to read the reason and your reapplication eligibility date.'
      when 'needs_information' then 'NI4E needs additional information or documents. Open the same application to respond.'
      else 'NI4E updated your request. Open Applications to review the latest status.' end;
    if new.review_notes is distinct from old.review_notes and coalesce(new.review_notes,'')<>'' then v_body:=v_body||' Reviewer note: '||left(new.review_notes,500); end if;
    if new.reapplication_eligible_at is not null then v_body:=v_body||' You may submit another upgrade request from '||to_char(new.reapplication_eligible_at at time zone 'Africa/Lagos','DD Mon YYYY')||'.'; end if;
  else return new; end if;
  insert into public.member_notifications(user_id,title,body,category,action_url,related_record_id)
  values(new.user_id,v_title,v_body,'application','/member/applications',new.id);
  return new;
end $$;

notify pgrst, 'reload schema';
