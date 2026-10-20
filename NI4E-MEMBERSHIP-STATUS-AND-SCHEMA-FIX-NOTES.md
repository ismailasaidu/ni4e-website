# NI4E Membership status placement + schema fix

## Frontend behaviour
- Removed the standalone top-of-page “You're already in the NI4E application process” panel.
- Signed-in users with an existing non-Fellowship application now see an application status card in the Membership Services card location.
- For an existing application, membership category cards, category details, generic apply CTA, and application marketing sections are hidden to avoid duplicate-application prompts.
- Status-specific next actions: correction requests open the existing application form; approved applications open membership payment; active members open the member portal; other states open application status/decision.
- New applicants still see the existing category and requirements UI.

## Database repair
The migration files `supabase-repair-migration.sql` and `supabase-final-schema-reconciliation.sql` add, idempotently:
- `profiles.membership_expires_at`
- `membership_fee_schedule.amount_kobo`
- `membership_fee_schedule.upgrade_amount_kobo`
- `membership_fee_schedule.renewal_amount_kobo`
- `membership_fee_schedule.currency`, `active`, and `updated_at`

No fee amount is invented. Active checkout remains subject to an approved fee and the existing server-side payment verification.

## Apply carefully
1. Back up the Supabase database/project before schema changes.
2. In the SQL Editor of the exact Supabase project used by local `netlify dev`, run `supabase-repair-migration.sql` after reviewing the existing migration history.
3. The repair migration sends `NOTIFY pgrst, 'reload schema'` so PostgREST refreshes its schema cache. If an error persists, verify the Supabase URL/project reference in the local Netlify environment and re-open the API schema cache after migration.
4. Restart `netlify dev`, reload the Membership page, and test pending, correction-requested, approved, rejected, and active states with representative test accounts.

## Verification status
Source edits are included. This package has not been tested against the user's live Supabase database or Paystack account. A successful live payment or live admin workflow must not be assumed until tested in the target environment.
