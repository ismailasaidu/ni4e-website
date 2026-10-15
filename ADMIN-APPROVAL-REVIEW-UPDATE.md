
# Admin application review update

This update adds an admin-side supporting-document review area to the application detail modal. It queries `public.membership_documents` by `application_id`, then requests short-lived signed URLs from the private `membership-documents` storage bucket. Admins can inspect document type, file name, size and upload date, open the signed link, and refresh the list. No storage bucket is made public and no service-role key is used in the browser.

The application actions now open the detail modal first instead of approving/rejecting directly from the table. This gives the reviewer a chance to inspect applicant details and documents. Rejection and correction requests require review notes. Approval changes the profile status to `approved_pending_payment`; it does not activate membership. Status changes remain subject to the existing Supabase RLS policies and schema fields.

No database migration was added for this UI change. It relies on the existing `membership_documents` table and private `membership-documents` bucket in `supabase-schema.sql`.

## Verification

- Archive integrity checked after packaging.
- A production build could not be verified in this environment because dependency installation timed out. Test `npm install` and `npm run build` before deployment.
- Confirm the deployed Supabase RLS policy `documents_read_self_or_admin` allows the signed-in NI4E admin to read `membership_documents`, and that storage policies allow an admin to create signed URLs for the private bucket.

## Email-free workflow update

The member portal now reads the latest `membership_applications` row and displays its status, application reference, review notes, and next steps directly in the signed-in dashboard. Applicants can refresh the status. This is the primary feedback path while NI4E has no custom-domain sender configured; email is optional and is not required for admin decisions to appear in the portal.

After server-side Paystack verification confirms the expected amount and NGN currency for the payment reference, the verification function marks the application `active` and updates the member profile. The member tracker therefore reflects verified activation rather than remaining at “approved” indefinitely. No new table is introduced by this update.

## Verification limitation

The source ZIP was checked for archive integrity. A production build could not be run in this environment because dependencies were not installed and `npm install` timed out. Configure/test Supabase Edge Function secrets and Paystack test credentials in the Supabase project before live checkout testing. Never put the Paystack secret or Supabase service-role key in frontend environment variables.
