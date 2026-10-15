# NI4E admin workflow audit (code review; live Supabase not available here)

## Fixed in this package
- Application-list Reject now opens the review dialog so an administrator can provide the required reason instead of immediately attempting a rejection with an empty note.
- Review dialog keeps approval, under-review, request-information, and rejection actions available.
- Added `supabase-admin-workflow-fix.sql`, an idempotent compatibility migration for review columns, status values, fee upgrade fields, payment type, member number/activation fields, and indexes.

## Workflow behavior found in the source
- Approve: sets application status to `approved`, then profile membership status to `approved_pending_payment`; payment page enables checkout only for an approved application and a configured fee.
- Reject: UI requires a review reason; profile status becomes `rejected`; payment page must not enable checkout for rejected applications.
- Request information: requires review notes and returns the profile status to `application_pending`.
- Under review: updates application status without activating membership.
- Payment history reads from `membership_payments`; actual checkout/activation depends on deployed `initialize-membership-payment` and `verify-membership-payment` Supabase Edge Functions and their secrets.
- Fee management uses `membership_fee_schedule`; official amounts must be entered by NI4E, not guessed.

## Known limitations / checks still required
- The Admin pages for Payments, Events, News & Announcements, Executives, Past Presidents, Chapters, Documents, Messages and Settings are placeholders in this source, not complete CRUD modules.
- Application and profile updates are currently two separate browser requests, not one database transaction. If the second request fails, the application decision may save while the profile status fails to update. For production, replace this with a single admin-only database RPC/Edge Function transaction.
- Approval/rejection email notifications are not confirmed by this UI code. They require a deployed server-side email function and provider configuration.
- No production build or live database tests were run because dependency installation timed out and this environment has no authenticated connection to the user's Supabase project.

## Required manual test cases after migration
1. Pending application -> Approve -> application shows `approved`, profile shows `approved_pending_payment`, payment page shows configured amount and enables checkout.
2. Pending application -> Reject without a note -> blocked; with a reason -> application/profile show rejected and checkout remains disabled.
3. Pending application -> Request information without a note -> blocked; with a note -> `needs_information` and applicant sees status/reason (requires applicant status UI to display review_notes).
4. Mark under review -> persists after refresh and does not activate membership.
5. A regular member cannot read/review other users' applications or edit official fee schedule.
6. Test payment success, failure, abandonment, invalid provider reference and duplicate verification using Paystack test mode; only server-verified success may activate a membership.
