-- Notify every registered NI4E portal account when an official event is published.
-- Requires the member_notifications table from 20261020_member_notifications.sql.

create or replace function public.ni4e_notify_members_of_published_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_title text;
  v_body text;
begin
  if coalesce(new.content_type, '') <> 'event' or coalesce(new.published, false) is not true then
    return new;
  end if;
  if coalesce(new.metadata->>'demo', 'false') = 'true'
    or lower(coalesce(new.slug, '')) like 'demo-%'
    or lower(coalesce(new.title, '')) like '[demo]%' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_title := 'A new NI4E event has been published';
    v_body := coalesce(new.title, 'A new NI4E event') || ' is now available. Open Events & activities in your member portal to view the details.';
  elsif old.published is distinct from new.published and new.published is true then
    v_title := 'A new NI4E event has been published';
    v_body := coalesce(new.title, 'A new NI4E event') || ' is now available. Open Events & activities in your member portal to view the details.';
  elsif old.published is true and new.published is true
    and (old.title is distinct from new.title
      or old.summary is distinct from new.summary
      or old.event_start is distinct from new.event_start
      or old.event_end is distinct from new.event_end) then
    v_title := 'An NI4E event has been updated';
    v_body := coalesce(new.title, 'An NI4E event') || ' has updated details. Open Events & activities to review the latest information.';
  else
    return new;
  end if;

  insert into public.member_notifications(user_id, title, body, category, action_url, related_record_id)
  select p.id, v_title, v_body, 'event', '/member/events', new.id
  from public.profiles p
  where p.id is not null;

  return new;
end;
$$;

drop trigger if exists ni4e_published_event_member_notification on public.site_content;
create trigger ni4e_published_event_member_notification
after insert or update of content_type, published, title, summary, event_start, event_end
on public.site_content
for each row execute function public.ni4e_notify_members_of_published_event();

-- Keep notifications available to the member bell through Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.member_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
