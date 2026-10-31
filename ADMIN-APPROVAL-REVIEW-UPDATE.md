
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


## Admin applications workflow (30 October 2026)

The Admin Applications queue now reads the existing `application_type` field and separates first-time applications, membership renewals and membership upgrades with dedicated filters and counts. Upgrade requests display the previous category when present. The review panel identifies the request type and explains the approval/payment boundary. Desktop uses a labelled action row; mobile uses stacked request cards with the same Review, Approve and Decline actions.

Approve opens a confirmation step and then calls the existing admin-only `admin_review_membership_application` RPC. Decline opens the applicant review panel and requires a written reason before calling that same RPC. Supporting documents continue to use the private storage bucket and short-lived signed links.

**Important database follow-up:** apply `supabase/migrations/20261030_preserve_active_membership_during_renewal_upgrade_review.sql` in the Supabase SQL Editor. The previous review RPC changed the profile membership status to `approved_pending_payment` for every request type. The new migration preserves the member's existing membership status and category while a renewal or upgrade is under review or awaiting payment. The verified payment function remains responsible for applying the renewal/upgrade after successful payment.

The dashboard now provides clickable operational counts for all requests, awaiting action, new applications, renewals, upgrades and approvals. Counts are based on the latest 200 application records loaded by the existing query; they are not a full-database aggregate if the institution has more than 200 records.

## Verification status

Source-level review and ZIP integrity checks are required before delivery. A production Vite build could not be run in this environment because the extracted project does not contain the Vite executable/dependencies. Apply the SQL migration and test the full request/payment lifecycle in the connected Supabase project before deploying.
