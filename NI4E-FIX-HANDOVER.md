# NI4E repair pass handover

## Changes in this pass

- Added image previews, visible selected-file names, remove-file controls, type checks and 5 MB size checks to membership registration uploads. Added a limited applicant portal upload workflow for users who need to confirm their email before uploading.
- Added a recovery path to create/link the applicant's database application record before attaching documents when an authenticated signup session is available.
- Made document upload failures non-fatal after account creation, so an upload problem does not trap the applicant in a failed signup state; the confirmation page explains when the user must sign in and retry.
- Normalized resource category aliases (for example `events`/`event`, `committees`/`committee`) so published related resources can match public pages more reliably.
- Improved the shared related-resource error state with a specific migration/policy hint and retry behavior.
- Changed the public navigation label from **Opportunities** to **Contact**, retaining the existing `/contact` route and page.
- Made the member portal route render a sign-in prompt when signed out and a limited applicant portal for signed-in non-active users. Applicants can check status/review notes and upload documents without seeing the full members-only dashboard; the full dashboard remains restricted to active members.
- Added persistent Payments and Settings screens to the admin panel.
- Changed application approval/rejection/review to use the transactional `admin_review_membership_application` RPC, which updates the application and profile state together.
- Prevented manual member activation from the Members tab; activation must come from verified server-side payment workflow.
- Added `supabase-repair-migration.sql` to restore missing columns/tables, content types, storage policies, RLS policies, site settings, the transactional review function, and the PostgREST schema cache.
- Updated `supabase-schema.sql` so fresh setups also include the admin settings and review workflow.

## Required database step

The React source cannot alter the user's hosted Supabase database by itself. Open the **same Supabase project** configured by `VITE_SUPABASE_URL`, go to **SQL Editor**, and run `supabase-repair-migration.sql`. Then reload the site. This is required to fix the live `review_notes` schema-cache error and the shared `site_content` resource query errors.

Do not put the Supabase `service_role` key in frontend environment variables. The repair migration does not set an admin account automatically. Confirm the intended administrator's `public.profiles.role` is `admin` through a trusted Supabase admin workflow.

## Validation notes

- The archive's dependencies could not be installed in this environment because `npm install` timed out, so a production build and browser end-to-end test could not be completed here. Source smoke checks confirmed balanced raw delimiters and the expected repair paths, but do not replace a Vite build.
- The hosted Supabase database, storage bucket, RLS policies, Edge Function deployment, and Paystack configuration were not accessible from this repair session. After applying the migration, test with separate applicant and administrator accounts, including successful and failed document uploads and Paystack test transactions.
