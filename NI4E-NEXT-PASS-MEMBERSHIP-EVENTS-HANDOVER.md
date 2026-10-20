# NI4E next implementation pass — membership, renewal and event registration

## Implemented in source

- Rebuilt the Membership page into a fuller category guide with eligibility, evidence, benefits, application journey, member services, FAQs, and responsive layouts.
- Public membership fees are read from active `membership_fee_schedule` rows. The site does not invent official amounts; unconfigured categories show that NI4E has not published the fee.
- Associate and Corporate eligibility/document requirements are read from NI4E policy settings when configured. When absent, the page explicitly explains that official policy has not been published rather than inventing requirements.
- Expanded the application wizard to six stages: account/category, personal details, education, professional experience/references, supporting documents, review/declaration.
- Captures residential details, discipline, qualifications, institution, graduation year, current role, employer, experience, professional registration, NSE details, specialist interests, referee information, terms declaration and document-verification consent.
- Account email is tied to the signed-in identity. Student applicants must upload student ID and proof of enrolment; graduate applicants must upload a degree certificate or statement of result.
- Existing applications in pending, under-review, approved, payment-pending or active states now display a clear status screen with the right next action instead of an apparently broken duplicate-application form.
- Admin fee schedule now supports a distinct annual renewal fee as well as initial membership and upgrade fees.
- Membership payment initialization uses the renewal fee for renewal applications and no longer blocks a first-time approved membership payment merely because the annual renewal basis is still unconfigured. Renewal payments remain guarded until the official renewal basis is configured.
- Event registration now requires a signed-in user in the interface and in the paid-event Edge Function. The free registration row stores `user_id`, and event registration intent is restored after sign-in.
- Added responsive styles for the membership category cards, detail sections, cost panels, checklist, declaration controls, event modal and application fields.

## Required Supabase migration

Apply `supabase-membership-renewal-fees-and-event-auth.sql` in the existing Supabase SQL Editor **after** the existing NI4E schema/repair/event payment migrations. It is additive and does not delete existing application, member or payment records. It:

1. Adds `renewal_amount_kobo` to the membership fee schedule without inserting invented fees.
2. Adds `user_id` to event registrations if missing.
3. Removes old anonymous event-registration insert policies and requires `auth.uid()` for a new registration.
4. Adds an optional backfill of expiry dates only if NI4E has explicitly configured the anniversary policy.

After applying it, use Admin → Fees & Membership to enter NI4E-approved application, upgrade and annual renewal amounts. Do not activate a fee until it has been officially approved.

## Validation status

- Parsed 45 JSX/TS/TSX files with the globally available TypeScript transpiler: **0 syntax diagnostics**.
- A full `npm ci` could not complete in this environment (the install timed out); therefore `npm run build` and live Supabase/Paystack tests are **not verified** here.
- This pass has not been tested against the live production database, real email notifications, real payment credentials or actual mobile devices.

## Suggested test sequence after installation

1. `npm ci`
2. `npm run build`
3. Apply the SQL migration above.
4. Sign out and try event registration: it must route to sign-in and return to the chosen event after sign-in.
5. Sign in and register for a free event: the row must store the signed-in user's UUID; an anonymous insert must be rejected by RLS.
6. Test a paid event with Paystack test credentials; verify the server rejects unauthenticated initialization and verifies amount/currency/reference before confirmation.
7. Create a new membership account and confirm it sees **Application Not Started**, not a guessed category or review status.
8. Complete the six-step application, upload category documents, submit, and verify the dashboard reference/status.
9. Return a test application for correction and confirm resubmission preserves the same application UUID/reference and review history.
10. Approve a test application, configure official fees, complete a Paystack test transaction, and verify server-side activation.
11. Request renewal, approve it, verify that only the configured annual renewal fee is charged, and confirm the member record remains the same.
