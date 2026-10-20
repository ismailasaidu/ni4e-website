-- NI4E automatic membership numbering. Apply after the main schema/reconciliation migration.
-- Number format: NI4E-{CATEGORY}-{YEAR}-{SEQUENCE}, e.g. NI4E-STU-2026-000001.
-- Sequence is database-generated; administrators must not type or edit the number.
create sequence if not exists public.ni4e_membership_number_seq;

alter table public.profiles
  add column if not exists membership_number text,
  add column if not exists membership_issued_at date,
  add column if not exists certificate_reference text;

create unique index if not exists profiles_membership_number_unique
  on public.profiles (membership_number)
  where membership_number is not null and btrim(membership_number) <> '';

create unique index if not exists profiles_certificate_reference_unique
  on public.profiles (certificate_reference)
  where certificate_reference is not null and btrim(certificate_reference) <> '';

create or replace function public.ni4e_assign_membership_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_label text;
  category_code text;
  next_value bigint;
begin
  -- Assign only when membership becomes active; never overwrite an existing number.
  if new.membership_status = 'active'
     and (new.membership_number is null or btrim(new.membership_number) = '') then
    category_label := lower(coalesce(new.membership_category, ''));
    category_code := case
      when category_label like '%student%' then 'STU'
      when category_label like '%graduate%' then 'GRD'
      when category_label like '%associate%' then 'ASC'
      when category_label like '%corporate%' then 'COR'
      when category_label like '%fellow%' then 'FEL'
      when category_label like '%life%' then 'LIF'
      else 'MEM'
    end;
    next_value := nextval('public.ni4e_membership_number_seq');
    new.membership_number := 'NI4E-' || category_code || '-' || to_char(current_date, 'YYYY') || '-' || lpad(next_value::text, 6, '0');
    new.membership_issued_at := coalesce(new.membership_issued_at, current_date);
    new.certificate_reference := coalesce(new.certificate_reference, 'NI4E-CERT-' || replace(new.membership_number, 'NI4E-', ''));
  elsif new.membership_status = 'active' and new.membership_number is not null then
    new.membership_issued_at := coalesce(new.membership_issued_at, current_date);
    new.certificate_reference := coalesce(new.certificate_reference, 'NI4E-CERT-' || replace(new.membership_number, 'NI4E-', ''));
  end if;
  return new;
end;
$$;

drop trigger if exists ni4e_assign_membership_number_trigger on public.profiles;
create trigger ni4e_assign_membership_number_trigger
before insert or update of membership_status, membership_category, membership_number
on public.profiles
for each row execute function public.ni4e_assign_membership_number();

notify pgrst, 'reload schema';
