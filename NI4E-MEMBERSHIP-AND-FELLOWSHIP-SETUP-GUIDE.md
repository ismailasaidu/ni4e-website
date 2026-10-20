# NI4E Membership & Fellowship completion pass

## What changed in this code
- General membership application now shows category-relevant questions. Student applicants are not asked for employment history or professional referees. Graduate/Associate/Corporate applicants receive professional-practice fields. Highest qualification, engineering discipline, contact preference, NSE status and years-of-experience options are selectable; qualification and discipline allow an “Other” specification.
- Removed professional referee fields from the ordinary membership application.
- Fellowship form state now includes every field that validation reads (years post-qualification, COREN number, licence status, division participation, education summary and research impact). Previously, some required values were not initialized, so the wizard could reject an otherwise completed form.
- Direct Fellowship and Fellowship by Education have distinct step-2 requirements. The UI collects eligibility evidence and routes it to the committee; the proposed 15-year threshold is not treated as an official NI4E rule and is not a frontend hard-stop. Application submission does not grant Fellowship or unlock payment; admin review remains required.
- Improved Fellowship desktop route cards and form presentation, and improved label/input/placeholder contrast for membership forms.

## SQL migration order
Do not reset the database. Do not blindly re-run every file against a database that is already in use. Review the existing migration history and apply only migrations not already applied.

For a brand-new Supabase project, use this sequence and stop to resolve any SQL error before continuing:
1. `supabase-schema.sql` — base schema (only for a new project; do not rerun on an existing production database without reviewing it).
2. `supabase-repair-migration.sql` — additive repairs.
3. `NI4E-STAGE-2-CONTENT-MIGRATION-AND-SEED.sql` — content schema and sample content; replace sample content with approved NI4E material before launch.
4. `supabase-stage-3-membership-policy-settings.sql` — admin-managed membership policies, public policy projection and directory visibility.
5. `supabase-membership-review-migration.sql` — reviewer notes / review workflow additions.
6. `supabase-stage-3-membership-resubmission-policy.sql` — same-reference correction/resubmission workflow.
7. `supabase-membership-upgrades-and-email.sql` — upgrades and email-related records/configuration.
8. `supabase-stage-3-membership-renewal.sql` — annual renewal schema/workflow.
9. `supabase-membership-renewal-fees-and-event-auth.sql` — renewal fee support and authenticated event-registration protections.
10. `supabase-requirement-3-directory-verification.sql` — searchable directory and membership verification functions.
11. `supabase-stage-3-membership-events-cpd.sql` and `supabase-stage-3-integrated-event-payments.sql` — event/CPD and paid event integration, if these features are in use.
12. `supabase-event-registration-migration.sql` and `supabase-admin-workflow-fix.sql` — apply only if not already applied; inspect for overlap with earlier event/admin migrations first.
13. `supabase-demo-content-seed.sql` and `supabase-event-directory-content-seed.sql` — optional sample content only. Do not use as official NI4E facts; remove/replace sample records before public launch.

## Admin configuration after migrations
- Open Admin → Membership Policies and configure the official review target. The applicant status page should display the saved policy, not a hard-coded 24-hour promise.
- Configure approved category eligibility/document requirements and the official fee schedule. Do not treat suggested Fellowship fees or eligibility thresholds as approved policy until NI4E confirms them.
- Fellowship applications must be reviewed by authorised staff before any Fellowship fee/payment is made available. Payment is not an award of Fellowship.
- Confirm Supabase Storage bucket `membership-documents` exists and is private, and its policies permit authenticated applicants to upload only within their own user/application path and authorised reviewers to inspect the documents.

## Verification required
Run `npm ci`, `npm run build`, and then test using a non-admin account. Verify Student, Graduate, Associate and Corporate application forms separately; submit Direct Fellowship and Fellowship by Education test applications; confirm both appear in Admin → Membership Applications and that documents can be reviewed. Then test approve/request information/reject, payment gating, and status refresh. A source syntax check is not a substitute for these live tests.
