# NI4E Website — Tender Demo

Responsive NI4E public website with a membership registration/login flow and an admin membership-application queue. The current tender-stage build uses Supabase Free for authentication and database persistence; it does not require Firebase.

> Current implementation gaps and validation limits are tracked in [TOR-IMPLEMENTATION-AUDIT.md](./TOR-IMPLEMENTATION-AUDIT.md). This project must not be represented as fully tested or production-ready until those items are closed.

## Supabase Free setup

1. Create a free project at https://supabase.com/dashboard.
2. In Project Settings → API, copy the Project URL and the publishable/anon key. Never use `service_role` in the browser.
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In SQL Editor, run `supabase-schema.sql` in full. It creates `profiles` and `membership_applications`, Row Level Security policies, and a signup profile trigger.
5. For the committee demo, Authentication → Providers → Email: disable email confirmations so new demo users can submit applications immediately. In production, configure email confirmation and test the full workflow.
6. Start the site with `npm install` and `npm run dev -- --host`. If Vite is already running, stop it with Ctrl+C and restart after changing `.env`.
7. Register a demo account through the site. To grant admin access, copy that account's UUID from Authentication → Users and run this in SQL Editor, replacing the UUID: `update public.profiles set role = 'admin' where id = 'PASTE-USER-UUID-HERE';` Only do this for your own trusted admin account. Then log out and back in.

## Notes

- Existing UI and navigation are retained. Membership applications are stored in Supabase and start in `pending` status. Admin users can review and update status.
- Supabase Free has usage limits and inactive projects may pause. This is for tender demonstration, not a production uptime guarantee.
- `.env` is excluded from Git. Never commit service-role keys or other server secrets.
- The member dashboard still contains presentation/demo membership content, and payments, certificates, notifications, file uploads, and the other admin modules are not yet fully connected to backend services. Do not present those modules as production-complete.

## Membership payment workflow (tender stage)

- The public header now exposes **Member Login** on desktop and mobile, plus a Membership Payments link in the mobile menu.
- Registration sends the application payload in Supabase Auth user metadata. The `handle_new_user` database trigger creates the profile and pending membership application, so it does not depend on an active browser session being returned before email confirmation.
- The schema adds `membership_fee_schedule` and `membership_payments`. NI4E must enter the officially approved fee per membership category; this project deliberately does not invent fee amounts.
- The payment page reads the approved fee and payment history. A live Paystack checkout is not activated until the institution supplies its approved fee schedule and the project administrator configures a secure server-side payment initializer and `PAYSTACK_SECRET_KEY`. Never place a Paystack secret key in a `VITE_` variable or browser code. Payment must only be marked successful after server-side provider verification.
- After updating this schema, check the Supabase SQL Editor output. For an existing project, this SQL uses `create table if not exists` and recreates the signup trigger. Existing users are not retroactively given applications by the signup trigger; test with a new test account or repair existing test records separately.

## ToR membership workflow: payments and supporting documents

The membership payment UI uses the approved fee in `membership_fee_schedule`; it deliberately does not invent fee amounts. Apply the updated `supabase-schema.sql` first. To set an approved fee, an NI4E administrator must confirm the fee schedule and then configure the approved amount in the database (stored in kobo, e.g. NGN 10,000 = `1000000` kobo). Do not enable checkout until the fee has been approved.

### Paystack checkout

Secure checkout is implemented with Supabase Edge Functions in `supabase/functions/initialize-membership-payment` and `supabase/functions/verify-membership-payment`. Deploy with the Supabase CLI and set `PAYSTACK_SECRET_KEY` and `NI4E_SITE_URL` as Supabase function secrets; never add the Paystack secret to `.env` or any `VITE_` variable. Use a Paystack test key for tender testing. See `supabase/functions/README.md` for exact commands. The browser cannot mark a payment successful: the verification function checks Paystack's server response, amount and currency. A successful payment does not automatically approve a membership application.

### Supporting documents

After confirming their email and signing in, members can upload PDF/JPG/PNG supporting documents from the Member Dashboard. Files are stored in the private `membership-documents` bucket under a user-specific folder. Maximum file size is 5 MB. Apply the updated SQL schema to create the bucket and row-level policies. Admin document review UI should be tested before treating document review as production-ready.

### Test checklist before demo

- Register a new test applicant; confirm email; verify the application row exists in `membership_applications` and profile row exists in `profiles`.
- Sign in via the visible `Member Login` link and confirm the dashboard status is loaded from Supabase.
- Upload a sample PDF and verify a private storage object and `membership_documents` row exist.
- Configure an approved test fee and Paystack test secret; deploy both functions; test successful, failed and abandoned checkout, including amount-mismatch verification.
- Confirm the admin role is granted only manually to authorized staff, and that payment success never automatically approves the application.

### Application decisions without custom-domain email

A custom-domain email address is not required for the core membership workflow. Applicants see the latest application status, reference, reviewer notes and payment next step in their authenticated portal. SMTP notification delivery is optional and remains disabled until sender credentials are configured in Supabase Edge Function secrets. Paystack verification remains server-side; a browser redirect alone must never activate a member.


### Membership access and mobile portal navigation update
- Member dashboard access now requires `profiles.membership_status = active`; the admin role no longer bypasses the member-activation gate. Administrators should use the separate Admin portal.
- Member portal mobile navigation uses a compact fixed bottom bar with a More sheet, rather than squeezing every menu item into the top of the screen.
- Important: validate with a separate unpaid test account and verify matching Supabase RLS policies before production.


## Motion and loading states
See `INTERACTION-AND-ANIMATION-UPDATE.md` for the implemented page transitions, branded navigation loader, scroll reveals, hero motion, card/overlay transitions, and form submission spinner. Respect for reduced-motion preferences is included.


## Public page updates
- Contact navigation now uses `/contact` and provides an enquiry form connected to `public.contact_enquiries`.
- Event details remain publicly viewable; submitting an event registration requires a signed-in Supabase account.
- Publications without an attached file provide a downloadable resource brief generated from the catalogue summary and body. It is clearly a brief, not represented as an official PDF/report.
- Technical division and committee profiles include fuller scopes, responsibilities, activity examples and expected outputs. Confirm official names, appointments, contact details and published resources with NI4E before production.


## Repair an existing Supabase project

If an existing deployment reports missing `review_notes` columns, related-resource loading errors, or admin tabs failing on missing schema fields, open the same Supabase project configured in `.env` and run `supabase-repair-migration.sql` in **Dashboard → SQL Editor**. The migration is designed to be re-runnable and refreshes the PostgREST schema cache. Then reload the site. Do not expose the Supabase service-role key in the frontend. Confirm the intended administrator's `public.profiles.role` is `admin` using a trusted admin workflow.


---

## Integrated Stage 1–3 package

For the complete integrated scope, migration order, paid-event checkout setup, annual renewal policy configuration, notification webhooks and acceptance-test checklist, read **[STAGE-1-2-3-INTEGRATED-HANDOVER.md](./STAGE-1-2-3-INTEGRATED-HANDOVER.md)** before deploying. Do not rerun the base schema blindly on the live Supabase project.

## Final schema reconciliation and membership-page status

For an existing NI4E Supabase project, first confirm the base schema and previously applied migrations. Then review and apply `supabase-final-schema-reconciliation.sql` in Supabase SQL Editor. It adds the profile expiry and membership fee renewal columns, plus the fields referenced by current admin, content, contact, newsletter, event/CPD and payment screens. It is additive and does not delete existing member/application/payment rows. Review its policy changes before applying; keep the Supabase service-role key out of frontend variables.

The Membership page now checks for the signed-in user's latest non-Fellowship application and displays its reference, category, status and review notes on the page. Existing applications route to the tracker; correction requests route to the existing application correction flow, and rejected applications remain subject to the configured reapplication waiting period. If the status lookup fails, new-application buttons are disabled rather than risking an accidental duplicate.

Validation note: JSX/TSX syntax parsing passed for 49 source files in this package. A production Vite build could not be verified because `npm ci` did not complete in the execution environment. Live Supabase policies, migration execution, Paystack transactions, email and browser/device workflows must still be tested in the target project before production sign-off.
