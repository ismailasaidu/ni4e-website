-- NI4E TEMPORARY MEMBERSHIP FEES FOR PAYSTACK TESTING
-- These match the amounts already displayed as proposed in src/pages/Membership.jsx.
-- Amounts are stored in kobo. Run this in Supabase SQL Editor before testing checkout.
-- IMPORTANT: Use Paystack TEST secret/public keys during testing. Confirm these amounts
-- with NI4E before production and update them through Admin > Membership Fees.

alter table public.membership_fee_schedule add column if not exists upgrade_amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists renewal_amount_kobo bigint;
alter table public.membership_fee_schedule add column if not exists currency text not null default 'NGN';
alter table public.membership_fee_schedule add column if not exists active boolean not null default false;
alter table public.membership_fee_schedule add column if not exists updated_at timestamptz not null default now();

insert into public.membership_fee_schedule
  (category, amount_kobo, upgrade_amount_kobo, renewal_amount_kobo, currency, active, updated_at)
values
  ('Student Member',   2000000, 2000000, 1000000, 'NGN', true, now()),
  ('Graduate Member',  8000000, 8000000, 4000000, 'NGN', true, now()),
  ('Associate Member',15000000,15000000, 7500000, 'NGN', true, now()),
  ('Corporate Member',25000000,25000000,12500000, 'NGN', true, now())
on conflict (category) do update set
  amount_kobo = excluded.amount_kobo,
  upgrade_amount_kobo = excluded.upgrade_amount_kobo,
  renewal_amount_kobo = excluded.renewal_amount_kobo,
  currency = excluded.currency,
  active = true,
  updated_at = now();

-- Verify the active fee rows and amounts (NGN values shown for convenience).
select category, amount_kobo / 100.0 as application_fee_ngn,
       upgrade_amount_kobo / 100.0 as upgrade_fee_ngn,
       renewal_amount_kobo / 100.0 as renewal_fee_ngn, currency, active
from public.membership_fee_schedule
where category in ('Student Member','Graduate Member','Associate Member','Corporate Member')
order by case category when 'Student Member' then 1 when 'Graduate Member' then 2 when 'Associate Member' then 3 else 4 end;
