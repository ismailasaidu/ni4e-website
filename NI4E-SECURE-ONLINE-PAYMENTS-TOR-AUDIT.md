# Secure Online Payments — TOR Alignment Audit

## TOR requirement
Secure online payment facilities for membership dues and registrations.

## Existing implementation found
- Membership dues and renewal/upgrade payments use Supabase Edge Functions to initialize Paystack checkout and verify transactions server-side.
- Event registration supports free registration and paid events via event-payment Edge Functions.
- Payment records are stored in `membership_payments` and `event_payments`.
- Membership activation is performed in the server-side membership verification function after checking the application.
- Renewal initialization requires an explicitly configured annual renewal policy and configured renewal fee.

## Security improvement in this continuation
- Membership verification now checks that the provider-returned transaction reference exactly matches the requested and stored reference, in addition to amount and currency.
- A repeated verification cannot downgrade a previously successful membership payment status.

## Required before production
1. Configure Supabase Edge Function secrets: `PAYSTACK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NI4E_SITE_URL`; configure email webhook secrets if notifications are used.
2. Deploy all four payment functions: `initialize-membership-payment`, `verify-membership-payment`, `initialize-event-payment`, `verify-event-payment`.
3. Apply the reviewed membership and event payment SQL migrations to the existing Supabase project; do not reset data.
4. Configure active membership fee schedule rows and renewal policy in Admin. Displayed fees must match server-side fee rows.
5. Test Paystack test mode: successful, failed, abandoned, mismatched amount/currency/reference, duplicate callback, renewal, and paid/free event registration.
6. Verify that only server-verified successful payment activates membership or confirms a paid event registration.

## Limitations
The source can be audited locally, but this package cannot deploy functions, set secrets, or run live Paystack/Supabase transactions. Production readiness is not claimed until these steps pass.
