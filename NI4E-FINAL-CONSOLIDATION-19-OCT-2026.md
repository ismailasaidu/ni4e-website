# NI4E final consolidation handover

This package consolidates the current NI4E source baseline with the membership status, membership numbering, schema reconciliation, payment, renewal, Fellowship, admin, and certificate work discussed in the conversation.

## Included changes
- Membership page displays an existing applicant's status card instead of category/application prompts; status-specific actions route to payment, correction/resubmission, decision/status, or member portal.
- Membership-number trigger creates a category-coded sequential number after the profile becomes active. Numbers are not typed by an administrator.
- Member portal certificate is printable and personalised from the authenticated profile: member name, category, membership number, issue date, expiry/validity, and certificate reference.
- Certificate includes a clearly marked DEMO president name/signature artwork. It explicitly says it is not valid for official use until NI4E replaces the placeholder with an approved name, signature, and seal.
- Fellowship application form is gated behind authentication; signed-out users see a sign-in gate rather than the application form preview. Existing application and correction workflows remain in place.
- Renewal workflow exists in the member dashboard: it creates/reuses a renewal request and requires NI4E approval before payment. Renewal payment/expiry calculation depends on applying the supplied schema and renewal migrations and configuring the institution-approved renewal policy and fee.
- Paystack payment Edge Functions and fee management are included from the current project baseline.

## Database migration order
Review the existing Supabase migration history before running scripts. Do not reset the database.
1. `supabase-final-schema-reconciliation.sql`
2. `supabase-auto-membership-number.sql`
3. `supabase-stage-3-membership-renewal.sql`
4. Apply the event/payment migrations only if they are not already applied; review before executing duplicate policies or table creation.

`supabase-stage-3-membership-renewal.sql` deliberately leaves renewal basis as `not_configured`; NI4E must choose and approve the renewal date policy before live renewals should be enabled. Fee schedule values must be approved and entered by the institution.

## Local checks
Run `npm install`, `npm run build`, then `npx netlify dev`. Confirm the `.env`/Netlify link points to the correct Supabase project. Do not commit secret keys. Test pending, correction-requested, approved, rejected, payment-success, payment-failure, active, expired, and renewal-request paths with test data.

## Honest verification status
This package has not been tested against the user's live Supabase instance or Paystack account. A successful production build was not verified in this environment. The demo signature is illustrative, not an actual presidential signature or official institutional endorsement. Official certificates must not be issued until the authorised signatory details and certificate policy are approved by NI4E.
