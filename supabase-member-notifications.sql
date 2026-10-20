-- NI4E member in-app notifications. Run in Supabase SQL Editor.
create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general',
  action_url text,
  related_record_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_notifications_user_created_idx on public.member_notifications(user_id, created_at desc);
create index if not exists member_notifications_unread_idx on public.member_notifications(user_id) where read_at is null;
alter table public.member_notifications enable row level security;
drop policy if exists "Members read own notifications" on public.member_notifications;
create policy "Members read own notifications" on public.member_notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "Members mark own notifications read" on public.member_notifications;
create policy "Members mark own notifications read" on public.member_notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.member_notifications from authenticated;
grant select, update(read_at) on public.member_notifications to authenticated;

create or replace function public.ni4e_notify_application_change()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_title text; v_body text; v_type text := lower(coalesce(new.application_type, 'new'));
begin
  if new.user_id is null then return new; end if;
  if tg_op = 'INSERT' then
    v_title := case v_type when 'renewal' then 'Renewal request received' when 'upgrade' then 'Membership upgrade request received' else 'Membership application received' end;
    v_body := 'Your ' || replace(v_type, '_', ' ') || ' request for ' || coalesce(new.category, 'membership') || ' has been received. Track it in My Applications.';
  elsif old.status is distinct from new.status or old.review_notes is distinct from new.review_notes then
    v_title := case lower(coalesce(new.status,'')) when 'approved' then 'Your application has been approved' when 'approved_pending_payment' then 'Application approved — payment required' when 'payment_pending' then 'Payment is required to continue' when 'active' then 'Your membership is now active' when 'rejected' then 'An application decision is available' when 'needs_information' then 'More information is required' when 'under_review' then 'Your application is under review' else 'Your application has been updated' end;
    v_body := case lower(coalesce(new.status,'')) when 'approved' then 'NI4E has approved your request. Review the application tracker for next steps.' when 'approved_pending_payment' then 'Your request was approved. Review the payment instructions in your member portal.' when 'payment_pending' then 'A payment step is now available. Open the application tracker for details.' when 'active' then 'Your membership record is now active. Review your membership page for official details.' when 'rejected' then 'NI4E has recorded a decision. Open My Applications to view the decision and review notes.' when 'needs_information' then 'NI4E needs additional information or documents. Open My Applications to review the feedback.' when 'under_review' then 'Your request is being reviewed by NI4E.' else 'NI4E updated your request. Open My Applications to review its latest status and notes.' end;
    if new.review_notes is distinct from old.review_notes and coalesce(new.review_notes,'') <> '' then v_body := v_body || ' Reviewer note: ' || left(new.review_notes, 500); end if;
  else return new;
  end if;
  insert into public.member_notifications(user_id,title,body,category,action_url,related_record_id) values(new.user_id,v_title,v_body,'application','/member/applications',new.id);
  return new;
end $$;
drop trigger if exists ni4e_application_notification_insert on public.membership_applications;
create trigger ni4e_application_notification_insert after insert on public.membership_applications for each row execute function public.ni4e_notify_application_change();
drop trigger if exists ni4e_application_notification_update on public.membership_applications;
create trigger ni4e_application_notification_update after update of status, review_notes on public.membership_applications for each row execute function public.ni4e_notify_application_change();

create or replace function public.ni4e_notify_membership_profile_change()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v_title text; v_body text;
begin
  if new.membership_number is distinct from old.membership_number and coalesce(new.membership_number,'') <> '' then
    v_title := 'Your membership number is available'; v_body := 'NI4E has recorded your official membership number: ' || new.membership_number || '. Open My Membership to review your details.';
  elsif new.membership_status is distinct from old.membership_status then
    v_title := case lower(coalesce(new.membership_status,'')) when 'active' then 'Membership activated' when 'expired' then 'Membership expiry update' else 'Membership status updated' end;
    v_body := 'Your membership status is now ' || replace(coalesce(new.membership_status,'updated'),'_',' ') || '. Open My Membership for details.';
  elsif new.membership_expires_at is distinct from old.membership_expires_at and new.membership_expires_at is not null then
    v_title := 'Membership validity updated'; v_body := 'Your membership validity has been updated to ' || to_char(new.membership_expires_at::date, 'DD Mon YYYY') || '. Open My Membership to confirm the details.';
  else return new; end if;
  insert into public.member_notifications(user_id,title,body,category,action_url) values(new.id,v_title,v_body,'membership','/member/membership');
  return new;
end $$;
drop trigger if exists ni4e_profile_membership_notification on public.profiles;
create trigger ni4e_profile_membership_notification after update of membership_number, membership_status, membership_expires_at on public.profiles for each row execute function public.ni4e_notify_membership_profile_change();

do $$ begin alter publication supabase_realtime add table public.member_notifications; exception when duplicate_object then null; when undefined_object then null; end $$;
