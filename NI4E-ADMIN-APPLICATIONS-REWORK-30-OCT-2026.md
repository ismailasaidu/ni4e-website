# NI4E Admin Dashboard and Applications Rework — 30 October 2026

## Applications queue
- Includes `new`, `renewal`, and `upgrade` requests using the existing `membership_applications.application_type` field.
- Adds a request-type filter and status filter, searchable by applicant name, email, phone, category and reference.
- Adds distinct totals for new applications, renewals and upgrades.
- Shows the previous category on upgrade requests where supplied.
- Uses explicit Review, Approve and Decline actions; mobile gets stacked cards rather than a horizontally scrolling table.
- Review modal retains private supporting-document links and review notes.
- Approve requires a confirmation step and then invokes the existing `admin_review_membership_application` RPC.
- Decline opens the review modal and requires a reason before invoking the same RPC.
- Approval is described accurately as approval for payment, not activation.

## Dashboard
- Replaces the basic application-only stats row with a membership operations section.
- Adds clickable counts for all requests, awaiting action, new applications, renewals, upgrades and approved requests.
- Adds a refresh action for the membership request queue.

## Database migration required
Apply `supabase/migrations/20261030_preserve_active_membership_during_renewal_upgrade_review.sql` in the correct Supabase project. It updates the existing admin review RPC so renewal and upgrade decisions do not overwrite the member's existing membership status or category while the request is being reviewed or waiting for payment. Verified payment remains responsible for applying the renewal or upgrade.

## Known verification limits
- The project ZIP and source changes are packaged for handoff.
- A Vite production build was not run: the extracted environment does not contain the Vite executable/dependencies.
- Live Supabase workflow tests were not possible here. Test new application, renewal and upgrade approvals/rejections plus payment verification in Supabase test mode after applying the migration.
- Dashboard counts are based on the existing application query limit of 200 records.
