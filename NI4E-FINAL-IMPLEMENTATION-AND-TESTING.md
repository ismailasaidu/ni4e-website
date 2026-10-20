# NI4E final implementation and testing handover

## Membership application form review

- Student applicants select both current programme and current level/year of study; the programme text field appears only when “Other” is selected.
- Graduate applicants must provide a degree certificate or a statement of result.
- Associate applicants provide category-specific qualification, CV, technical/industry experience evidence and professional background details; the admin policy can configure the exact document list.
- Corporate applicants provide professional practice, responsibilities/projects and registration details where applicable; registration evidence is required when the applicant declares that they are registered.
- Hidden category-specific fields do not block validation. Required fields and document evidence are validated before submission.
- Fellowship remains a separate application with Direct and Education routes and signed referee forms uploaded as files.

## Duplicate application prevention

- Membership page checks for the signed-in user's latest non-Fellowship new/upgrade-excluded application and shows the existing reference, category, status and review notes directly on the Membership page.
- Existing applications do not show a new-application action. Approved/under-review/pending applications route to the status tracker.
- “Needs information” routes to the correction workflow, which resubmits the same application through the existing protected RPC.
- Rejected applications remain subject to the administrator-configured waiting period; the previous rejected record is not deleted.
- If the status query fails, application buttons are disabled so a database error does not silently invite duplicate submission.

## Admin control surface in this source package

The admin navigation includes Dashboard, Applications, Members, Fees & Membership, Payments, Events, Event Registrations, CPD Records, News & Announcements, Publications, Technical Divisions, Projects, Committees, Executives, About Page, Past Presidents, Chapters, Documents, Messages, Newsletter Subscribers, Membership Policies and Settings.

- Membership Applications: review, request corrections, approve/reject with notes, inspect submitted details and review uploaded supporting documents.
- Members: review member status/expiry and assign an official membership number after activation and verified payment.
- Fees & Membership: configure category application/upgrade/renewal amounts and active state. Fees are not invented by the payment backend.
- Payments: review membership and event payment records; payment activation remains server-verified.
- CMS tabs: create, edit, publish/unpublish and delete records in `site_content`; public pages consume published content where the current page integration is implemented.
- Event Registrations and CPD Records: review registrations and manage CPD records.
- Messages and Newsletter Subscribers: review enquiries and update subscription state. Newsletter management does not claim to send campaigns unless an email delivery service is configured.
- Membership Policies and Settings: manage supported policy keys/settings; these values must reflect formally approved NI4E policy.

## Database reconciliation

`supabase-final-schema-reconciliation.sql` adds the missing `profiles.membership_expires_at` and `membership_fee_schedule.renewal_amount_kobo` columns, and reconciles other fields used by the current frontend and admin/payment modules. It also reloads the PostgREST schema cache. Review the SQL against the target project's actual migration history before running it. It does not delete existing records. Apply the base schema and workflow migrations first if the corresponding tables/functions are not yet present.

## TOR 3, 4 and 5 coverage note

This archive does not contain a standalone copy of the original TOR document with the numbered clauses, so this handover does not pretend to certify the wording of clauses 3, 4 and 5 independently. The project code includes the related membership application/review and public verification workflow, secure Paystack membership/renewal/event-payment Edge Functions, and event registration/CPD/admin content-management workflows described in the project handover documents. Map each of those to the official TOR wording before formal acceptance.

## Verification status and remaining live checks

- TypeScript parser check: 49 JS/JSX/TS source files parsed with zero syntax diagnostics.
- Production Vite build: not verified because `npm ci` timed out in this execution environment and the Vite executable was unavailable.
- No live Supabase database, RLS, Storage, Paystack, SMTP or browser session was available here. No claim is made that migrations have been applied to the user's live project or that live payments are already working.
- Before production sign-off, run `npm ci` and `npm run build`; test normal applicant, correction, rejection, admin and active-member accounts; test document privacy; test Paystack success/failure/abandonment/duplicate/mismatched-reference and amount cases; verify renewal/expiry and public directory restrictions; and check desktop/mobile layouts and browser console.
