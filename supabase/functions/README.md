# NI4E payment functions (Paystack)

These functions keep the Paystack secret off the browser. Deploy both functions after applying `supabase-schema.sql`:

```sh
supabase functions deploy initialize-membership-payment
supabase functions deploy verify-membership-payment
```

Configure secrets in the Supabase project (never in `VITE_` variables):

```sh
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_REPLACE_WITH_NI4E_TEST_SECRET
supabase secrets set NI4E_SITE_URL=http://localhost:5173
```

Set `NI4E_SITE_URL` to the actual deployed website URL when deploying. The Supabase CLI supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. Use a Paystack **test** secret for tender testing; switch to live credentials only after NI4E approves fees and authorizes production processing.

Before deployment, run the functions locally or in a test Supabase project and test success, failure, abandoned payment, amount mismatch, and wrong-user verification. Never mark an application approved just because a payment succeeded; the application still needs NI4E review.


## Membership status, upgrades, demo certificates and email

1. Run `supabase-membership-upgrades-and-email.sql` in Supabase SQL Editor after the main `supabase-schema.sql`. It adds upgrade metadata and a demo-only certificate record table.
2. Deploy the email webhook function with JWT verification disabled because Supabase Database Webhooks call it server-to-server: `supabase functions deploy ni4e-email-webhook --no-verify-jwt`. The function independently checks `x-ni4e-webhook-secret`.
3. Add SMTP Edge Function secrets (keep these out of VITE variables): `supabase secrets set SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... NI4E_EMAIL_FROM=... NI4E_ADMIN_EMAIL=... NI4E_WEBHOOK_SECRET=... NI4E_SITE_URL=...`. Use port 465 for implicit TLS or 587 for STARTTLS, as required by the SMTP provider. Email is deliberately dormant until credentials are added.
4. In Supabase Dashboard → Database → Webhooks, create an INSERT and UPDATE webhook for `public.membership_applications` pointing to `/functions/v1/ni4e-email-webhook`, with header `x-ni4e-webhook-secret: <same secret>`. Include the record and old record payloads. INSERT sends receipt email and administrator alert; status changes send approval/rejection/review messages.
5. Payment confirmation email is also sent through the SMTP webhook by `verify-membership-payment` after provider verification, if SMTP secrets are configured. Never trust the browser return URL as payment evidence.
6. An existing active member requests an upgrade from the dashboard. The request creates a separate application with `application_type=upgrade`; NI4E must approve it before the fee/Paystack checkout is enabled. The existing active membership remains intact while the upgrade is reviewed.
7. After an approved application/upgrade has a provider-verified successful payment, the payment function activates the profile and creates a demo-certificate record. The dashboard certificate is visibly marked DEMO ONLY and must not be represented as an official NI4E credential.

SMTP credentials are never placed in React or VITE environment variables; they live only in Supabase Edge Function secrets. The email webhook uses Nodemailer and can be configured once NI4E supplies its SMTP host, port, username, password and sender address.

## Integrated Stage 1–3 event payments and policy configuration

Read `STAGE-1-2-3-INTEGRATED-HANDOVER.md` for the complete scope, migration sequence, admin setup and acceptance tests. New event-payment functions:

```sh
supabase functions deploy initialize-event-payment
supabase functions deploy verify-event-payment
```

The event checkout reads the approved ticket fee from the published event's `metadata.fee_amount_kobo`; it does not trust a client-supplied amount. Apply `supabase-stage-3-integrated-event-payments.sql` before deploying/testing these functions. Event payment success emails use the existing `ni4e-email-webhook` and require `NI4E_WEBHOOK_SECRET` plus SMTP secrets. Configure Database Webhooks for free `event_registrations` INSERT and successful `event_payments` UPDATE as described in the integrated handover.

Admin policy values are stored in `site_settings` by `src/admin/MembershipPolicySettings.jsx`. Apply `supabase-stage-3-membership-policy-settings.sql` and `supabase-stage-3-membership-resubmission-policy.sql` before testing correction and reapplication paths. Rerun `supabase-requirement-3-directory-verification.sql` to update the public RPCs after the policy migration.
