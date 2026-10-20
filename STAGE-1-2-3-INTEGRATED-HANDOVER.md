# NI4E Digital Platform — Integrated Stage 1, Stage 2 and Stage 3 Handover

## Purpose and scope

This package keeps the existing React/Vite + Supabase application and its NI4E visual direction, while connecting the public website, content administration, membership lifecycle, member portal, event registration and payment records.

The agreed source of truth remains the signed NI4E proposal. This implementation does not invent official fees, Corporate Membership meaning, Associate eligibility, a review deadline, or a rejection waiting period.

## Stage 1 — Institutional website

- Public home and institutional information pages.
- About, Leadership, Past Presidents, Membership, Chapters, Events, Publications, News and Contact areas.
- Responsive navigation, search, content cards, detail views and page-level loading/empty/error feedback.
- Public institutional content is connected to `site_content` and administered from the existing Admin content sections.
- Past Presidents and leadership are now sourced from approved CMS records rather than hard-coded fictional names. Where NI4E has not published verified records, the page explains that records are pending instead of presenting made-up office holders.
- Connected production pages no longer silently append demo chapters, publications, projects, committees or events to official records. Demo content is for local preview only when Supabase is not configured.

## Stage 2 — Connected content and administration

- Existing admin dashboard and content-management workflow are retained.
- Events, news, publications, chapters, past presidents, leadership/executives, documents and enquiries remain linked to the content/admin areas.
- Event registration records are visible under **Admin → Event Registrations**.
- Membership applications, supporting documents, review decisions, members, fee configuration and payment history remain in their existing admin sections.
- Member dashboard event cards now use published Supabase events and the “View all” action opens the public Events page; fake hard-coded event activity was removed.
- The membership fee editor label is clarified as a membership fee; amounts remain administrator-configured.

## Stage 3 — Membership application, renewal and verification

### Application categories

- Student Member: Student ID and proof of enrolment are required.
- Graduate Member: degree certificate **or** statement of result is required.
- Associate Member: eligibility and extra evidence are configured by NI4E.
- Corporate Member: definition and extra evidence are configurable until NI4E confirms whether this is an individual grade or an organisation membership.
- Fellowship (FNI4E) remains separate. No Life Membership category is added.

### Application lifecycle

- Guided multi-step form, validation and category-specific document uploads.
- Private document storage and retained document/application history.
- Review outcomes are distinct: pending, under review, needs information, approved/payment pending and rejected.
- Correction requests preserve the same application reference and history when the configured correction policy permits resubmission.
- Final rejection is separate from a correction request. A new application is blocked until NI4E configures the waiting period and it has elapsed.
- Fees are payable only after approval. The system does not guess missing fees.
- Paystack verification is server-side; a browser redirect alone never activates membership.
- Active members can request annual renewal from the member dashboard. The renewal creates a reviewable renewal application; payment remains locked until approval. A verified renewal extends the existing membership validity and keeps payment history linked to the member.
- Admin must configure the annual renewal date basis (`anniversary`) before membership checkout is enabled. This is intentionally not guessed; the current implementation supports the anniversary basis only once NI4E approves it.
- A paid member's official membership number is not invented. Admin assigns the confirmed number under **Admin → Members** after activation. Public directory/verification functions exclude `DEMO-` numbers.

### Policy settings

**Admin → Membership Policies** stores configurable policy values in the protected `site_settings` table. These include Corporate definition, Associate eligibility, category-specific document lists, correction behaviour, rejection waiting period, official review-timeline wording, annual renewal date basis, allowed upload types/size and public directory statuses. Fee amounts stay in the existing **Fees & Membership** section so there is one source of truth for checkout.

A value saved in admin is configuration; it is not proof that NI4E has approved that policy. Do not publish unapproved values.

### Directory and verification

- A public **Member Directory & Verification** page is linked from the main navigation.
- Public responses expose only name, membership number, category and approved status.
- Email, phone, address, uploaded documents, payment data and reviewer notes are never returned by the public directory functions.
- Only active/administrator-configured eligible statuses with a non-demo membership number are shown by default.

## Paid event registration

### Admin setup

1. Open **Admin → Events** and create/edit an event.
2. Publish the event after its title, dates, venue, summary and event details have been confirmed.
3. In **Registration & ticket payment**, enable registration and mark the event as paid.
4. Enter the approved ticket fee in NGN per attendee. Leave it unset until NI4E approves the amount; checkout remains unavailable when the fee is missing.
5. Save and publish the event.

The public Events page displays the paid label and fee. Attendees enter their details and attendee count, then proceed to Paystack. The server reads the fee from the published event record, computes the total, creates the registration/payment record, and initializes Paystack. The browser cannot choose the authoritative amount.

### Verification and admin reporting

- A unique event-payment reference is stored with the registration.
- Paystack verification checks reference, amount and currency server-side.
- Registration status becomes confirmed only after verified success.
- Failed, abandoned or unverified transactions do not confirm a paid registration.
- **Admin → Payments** shows both membership transactions and event-ticket transactions.
- **Admin → Event Registrations** shows attendee details, payment state, amount, reference and attendance status. Admin cannot manually confirm a registration while required payment is still pending/failed.
- A verified payment can trigger attendee and administrator email notifications when SMTP/webhook secrets are configured.
- Free event registrations use the public insert policy, which only allows published events that are open and not configured as paid.

## Important demo-content policy

A preview record is not an official NI4E record. Connected production pages now show only published CMS records for events, chapters, publications, projects, technical divisions and committees. If no approved record exists, the page shows an empty state and tells the administrator where to publish the information. This prevents fictional names, dates or documents from appearing as official institutional facts.

The dashboard's certificate output is explicitly **DEMO ONLY**, not an official NI4E credential. An approved certificate design/signatory and actual certificate issuance policy still need NI4E approval before that demo is replaced by an official credential workflow.

## Existing Supabase project: migration sequence

Do **not** rerun the entire base schema on the live project as a shortcut. Back up the database and confirm which migrations have already been applied. For the current Stage 3 package, review and apply these incremental SQL files in Supabase SQL Editor:

1. `supabase-stage-3-membership-policy-settings.sql`
2. `supabase-stage-3-membership-resubmission-policy.sql`
3. `supabase-stage-3-membership-renewal.sql`
4. `supabase-requirement-3-directory-verification.sql` (re-run to update the functions to the configurable status allow-list and exclude demo numbers)
5. `supabase-stage-3-integrated-event-payments.sql`

The earlier base schema, event-registration/CPD migration, membership-upgrades/email migration and application-review workflow must already exist as applicable. If a migration has not been applied, inspect it against the live schema first; do not blindly run both alternative schema-repair scripts.

## Supabase Edge Functions and secrets

Deploy from the project root using the Supabase CLI:

```bash
supabase functions deploy initialize-membership-payment
supabase functions deploy verify-membership-payment
supabase functions deploy initialize-event-payment
supabase functions deploy verify-event-payment
supabase functions deploy ni4e-email-webhook --no-verify-jwt
```

Keep these server-only secrets in Supabase Edge Function secrets, never in `VITE_` variables:

- `PAYSTACK_SECRET_KEY` — use Paystack test credentials first.
- `NI4E_SITE_URL` — deployed website origin, without a trailing slash.
- `NI4E_WEBHOOK_SECRET` — a strong secret shared only with Supabase Database Webhooks.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NI4E_EMAIL_FROM` — required for actual outbound email.
- `NI4E_ADMIN_EMAIL` — optional recipient for admin notifications.

Set up Supabase Database Webhooks calling `/functions/v1/ni4e-email-webhook` with header `x-ni4e-webhook-secret` matching the secret above and payloads containing `record` and `old_record`:

- `membership_applications`: INSERT and UPDATE.
- `event_registrations`: INSERT (free-event registration receipt/admin alert; paid pending registrations are skipped).
- `event_payments`: UPDATE (verified successful payment notification).

If SMTP is not configured, the webhook intentionally reports that no email was sent. A database record alone does not prove email delivery.

## Required environment

Set the existing frontend Supabase URL and anon key using the environment names already expected by `src/firebase/config.js`. Do not put service-role or Paystack secret keys in frontend environment variables. The current Netlify configuration remains the deployment target; confirm production variables and Supabase function secrets separately.

## Acceptance tests before sign-off

1. `npm ci` completes and `npm run build` passes from the project root.
2. Test the public pages on mobile, tablet and desktop; verify menu, search, links, loading, empty and error states.
3. Create/edit/publish a chapter, publication, news item, past president and event in Admin; verify each appears on its public page.
4. Confirm unconfigured demo content is not shown as official content on a connected site.
5. Submit a Student application with both required documents; try submitting with either missing and confirm validation blocks it.
6. Submit a Graduate application with only a degree certificate, then test a statement of result instead.
7. Confirm Associate/Corporate requirements are controlled by Admin policy settings and do not assume unapproved rules.
8. Test correction and rejection paths with a test account; confirm correction policy and waiting period are respected and history/reference are retained.
9. Confirm an unapproved application cannot access payment; approval with no fee configured still cannot start checkout.
10. Configure the approved annual renewal date basis in Admin → Membership Policies, request a renewal as an active test member, approve it, and verify that payment extends `membership_expires_at` without changing the member number.
11. Use Paystack test mode to test successful, failed, abandoned, duplicate callback, wrong amount and invalid reference cases for membership and events.
12. Verify a paid event's amount is read from the published event metadata and cannot be changed by the browser request.
13. Confirm a failed/pending event payment does not set registration to confirmed; verified success updates the registration and appears in Admin → Payments and Event Registrations.
14. Confirm free events can accept registrations only while published/open and not paid.
15. Confirm admin event settings (paid/free, fee, registration open/closed) change the public event behaviour.
16. Confirm public directory/verification return only approved fields, exclude `DEMO-` numbers and respect the configured status list.
17. Confirm an active member can receive an officially assigned membership number in Admin → Members and then appears in the directory according to policy.
18. Confirm applicants cannot access another applicant's application or documents; public users cannot read private document buckets or payment rows.
19. Test email webhooks with SMTP configured and inspect both attendee and administrator messages. Test again without SMTP and ensure the UI does not falsely claim an email was sent.
20. Verify annual renewal links to the existing membership and preserves payment history.
21. Review Netlify logs, Supabase Edge Function logs, RLS policies and browser console before production sign-off.

## Verification performed while assembling this package

- The ZIP is generated from a single clean project root; duplicate nested project folders are removed.
- A TypeScript parser was used to parse 50 JavaScript/JSX/TypeScript source files; no syntax errors were reported.
- CSS brace balance was checked.
- A fresh Vite production build and live Supabase/Paystack/SMTP end-to-end tests could not be completed in this environment because dependency installation timed out and the live services are not connected here. Do not treat those tests as passed until you run them in your environment.
