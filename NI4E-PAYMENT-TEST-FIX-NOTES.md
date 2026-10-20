# NI4E membership status and payment test fix

## Changes
- Improved the Membership Application Status page for narrow screens: stacked detail panels, wrapping long values, and full-width action buttons on mobile.
- Added `supabase-membership-test-fees.sql` with temporary fee rows matching the existing proposed frontend amounts. The payment Edge Function checks `membership_fee_schedule`, so frontend-only hardcoded values cannot authorize checkout.

## Required before checkout testing
1. Open Supabase Dashboard → SQL Editor for the same project used by the site.
2. Run `supabase-membership-test-fees.sql` and confirm the final query returns four active fee rows. The Student Member application fee is currently set to NGN 20,000 (2,000,000 kobo), matching the current frontend's proposed value.
3. Confirm `PAYSTACK_SECRET_KEY` in Supabase Edge Function secrets is a Paystack **test** secret key before clicking checkout. Do not test with a live secret key.
4. Ensure the `initialize-membership-payment` and `verify-membership-payment` Edge Functions are deployed in that same Supabase project.
5. Run `npx netlify dev`, sign in as the approved applicant, open application details, then Continue to payment.

The fees are temporary testing values taken from the code's existing proposed fee list, not a claim that NI4E has formally approved these prices. Confirm with NI4E before production.

## Verification status
Source and CSS edits were applied. A production build could not be verified in this environment because `npm ci` timed out and left Vite unavailable (`vite: not found`). Run `npm ci` and `npm run build` locally after ensuring disk space and network access.
