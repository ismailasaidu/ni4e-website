# NI4E consolidated continuation — 19 October 2026

This package continues the supplied NI4E source tree. Existing page layout and route structure were retained; edits are targeted to membership and Fellowship behaviour.

## Changes in this pass

- Membership page shows proposed planning estimates when no active official fee is configured. Estimates are clearly marked provisional and are never passed to payment checkout. Active fee-schedule values take precedence.
- Proposed estimates shown in the UI (NGN): Student application ₦5,000 / renewal ₦3,000; Graduate ₦10,000 / ₦6,000; Associate ₦15,000 / ₦10,000; Corporate ₦25,000 / ₦15,000. These are not NI4E-approved fees. An authorised administrator must enter and activate official fees before any checkout can occur.
- Student programme and current study level are separate required selections. The “Enter your current programme” field appears only when programme is Other. Qualification and discipline Other fields are conditional as well.
- Associate and Corporate forms use category-specific fields and evidence lists rather than the Graduate form alone.
- Associate upload checklist defaults to qualification evidence, CV, evidence of technical/industry experience, and a professional background statement. Corporate checklist defaults to qualification evidence, detailed CV, and evidence of current practice. Registration evidence is conditionally required when Corporate applicants declare that they are registered.
- Fellowship form reveal/scroll handling explicitly sets the form section visible when a route's Apply button is used.
- Existing review, payment, renewal, member verification, public directory, events, CPD, contact/newsletter and content-management files are retained from the supplied baseline.

## Important verification status

- `npm run build` was attempted but could not run because the environment does not have the Vite executable installed. Dependency installation did not complete in the available environment.
- This package has not been tested against the live Supabase project. No claim is made that remote SQL migrations, RLS, storage, Paystack, email delivery, membership activation, renewal expiry, or public verification are live and certified.
- Do not reset Supabase or delete existing data. Review the existing migration history before applying any SQL. Apply only migrations not already applied, in the order documented by the project handover.
- Before production, run the production build and test the complete lifecycle with test accounts: application submission; admin review; correction and same-record resubmission; rejection; payment success/failure/abandonment; invalid and duplicate payment references; server-side activation; expiry; renewal; directory/verification; and non-admin access restrictions.

## TOR completion audit to use for final acceptance

- Public pages and responsive behaviour: inspect Home, About, Leadership, Past Presidents, Membership, Chapters, Events, Publications, News, Contact, Fellowship, Projects, Technical Divisions and Committees.
- Membership: test all distinct application categories, uploads, review notes, applicant status, correction/resubmission, fee schedule, payment verification, activation, renewal, certificate, directory and public verification.
- Member services: test protected portal, profile, documents, payments, events, CPD, certificates and resource access.
- Admin: test role-based access and persistent create/edit/delete/publish actions for site content, event registrations, CPD records, enquiries, newsletter subscriptions, membership review and fee policy.
- Integrations: deploy/configure Supabase Edge Functions and server-side secrets; verify email provider/webhooks and Paystack in test mode.
- Security/deployment: review RLS and private storage access using applicant, active member and admin accounts; verify backups/restore, domain/SSL, mobile/desktop browsers and accessibility.
