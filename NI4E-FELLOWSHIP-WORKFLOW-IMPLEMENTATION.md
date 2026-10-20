# NI4E Fellowship workflow implementation

## What changed
- Direct Fellowship and Fellowship by Education now use route-specific validation. Education applicants are not required to answer Direct Fellowship membership-standing questions.
- Education route validates the qualifying award, awarding institution, year, academic distinctions, research/technical impact, publications or alternative evidence, and research/project evidence.
- Direct route validates membership standing, Corporate membership information (membership number required only when the answer is Yes), experience, discipline, standing, and professional contributions.
- Both routes retain shared identity/contact, CV, passport photo, achievement evidence, two referee details and declaration requirements in the current policy implementation.
- Application insert/retry handles document-upload failures without falsely showing success or forcing a duplicate application. The saved application is marked `upload_incomplete` in `application_data`; on return, the applicant can continue the same record and reference.
- Successful submission writes the application into `membership_applications` with category `Fellowship — Direct` or `Fellowship — Education`, status `pending`, source `fellowship_portal`; files are stored in the existing private `membership-documents` bucket and linked in `membership_documents`.
- Existing application detection prevents duplicate submissions and sends applicants with existing submitted applications to the status workflow. `needs_information` submissions continue through the existing `resubmit_membership_application` RPC.

## Database prerequisites
This pass does not add a new table or require a new migration when the existing NI4E schema is installed. It relies on:
- `public.membership_applications` including `application_data`, `source`, `review_notes`, `status`, `user_id`, and the existing workflow status constraint that permits `needs_information`.
- `public.membership_documents` and its existing RLS policies.
- The private Supabase Storage bucket `membership-documents` with authenticated-user policies allowing each user to write only to their own `{user_id}/{application_id}/...` path.
- The existing `resubmit_membership_application` RPC for correction/resubmission after `needs_information`.
- Admin RLS policies allowing authorized NI4E administrators to review/update membership applications and view document metadata.

If any prerequisite is missing, apply the relevant existing schema/repair/storage migrations from this project first. Do not reset the database or rerun all migrations blindly.

## Important policy note
The Direct Fellowship screening language (including any experience threshold) is still a proposed screening policy and must be ratified by NI4E Council. The form records evidence and routes it for committee assessment; it must not automatically elect a Fellow or enable payment solely because the form was submitted. Official fee schedule and eligibility rules should be configured by authorized admins.

## Verification status
- Fellowship.jsx successfully transpiled with the installed global TypeScript JSX parser (no syntax diagnostics).
- A complete production build and live Supabase submission, upload, admin-review, and payment tests were not run in this environment. Please run `npm ci` and `npm run build`, then test with a non-admin account before deployment.
