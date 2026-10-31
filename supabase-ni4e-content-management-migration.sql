-- NI4E website content-management integration
-- Run in Supabase Dashboard > SQL Editor before using the About Page editor.
-- Adds the About-page record type to the existing site_content constraint.

do $$
declare
  existing_constraint text;
begin
  select c.conname into existing_constraint
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'site_content'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%content_type%';

  if existing_constraint is not null then
    execute format('alter table public.site_content drop constraint %I', existing_constraint);
  end if;

  alter table public.site_content
    add constraint site_content_content_type_check
    check (content_type in (
      'news','event','publication','chapter','executive','past_president',
      'technical_division','document','project','committee','institutional_page'
    ));
end $$;

create index if not exists site_content_published_type_updated_idx
  on public.site_content (content_type, published, updated_at desc);

-- Existing RLS policies are intentionally retained. Do not disable RLS or expose service_role keys.
