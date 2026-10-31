# NI4E Upgrade and Annual Renewal Lifecycle — 30 October 2026

## What changed

- Upgrade applications now have distinct stages: `pending` → `under_review` → `approved` (initial approval) → member document submission (`documents_submitted`) → `committee_review` → `committee_verified` → `approved_for_payment` → provider-verified payment → `active`.
- Upgrade payment initialization is blocked until `approved_for_payment`. The member's existing membership number and current grade remain unchanged until verified payment.
- Upgrade rejection records `rejected_at` and `reapplication_eligible_at`. The default administrator-configured waiting period is six calendar months. Admins can change it in Admin → Membership Policies. The database blocks premature reapplication.
- Correction requests remain on the same application and do not start a reapplication waiting period.
- Members upload upgrade evidence only after initial approval (or when responding to an explicit correction request), inside the same application. They then submit the evidence for committee verification.
- Renewal remains a simpler process: request within the configured window → Secretariat review → approval → configured annual renewal fee → provider-verified payment → extend membership expiry by one year. Grade and membership number are retained.
- Admin → Membership Policies now includes renewal opening days before expiry and grace days after expiry. These values are intentionally unconfigured until NI4E approves them. Renewal checkout also remains blocked until the renewal date basis is set to the approved anniversary method and the category renewal fee is configured in Fees & Membership.
- In-app notifications describe the new upgrade stages and renewal/application updates.

## Supabase setup

Run `supabase/migrations/20261030_membership_upgrade_and_renewal_lifecycle.sql` in the SQL Editor of the Supabase project used by the site. It adds lifecycle columns, database-enforced cooldown and renewal-window guards, member response RPC, admin stage-transition RPC, and notification wording.

Redeploy the updated payment and email Edge Functions from the project root (use your configured Supabase CLI session):

```powershell
supabase functions deploy initialize-membership-payment --project-ref lvlcikjophvshhxsueun
supabase functions deploy verify-membership-payment --project-ref lvlcikjophvshhxsueun
supabase functions deploy ni4e-email-webhook --project-ref lvlcikjophvshhxsueun
```

Then open Admin → Membership Policies and configure: 

1. Upgrade reapplication waiting period (default 6 months; adjust only if NI4E approves a different period).
2. Renewal opens (days before expiry).
3. Renewal grace period (days after expiry; enter 0 if there is no grace period).
4. Annual renewal date calculation (anniversary, only after NI4E approval).
5. Upgrade document checklists for each grade.

Also configure annual renewal and upgrade fees under Admin → Fees & Membership. Do not invent fee amounts or document criteria.

## Admin upgrade decisions

- Pending / under review: initial approval or rejection / correction request.
- Documents submitted: send to committee.
- Committee review: verify documents or request clarification.
- Committee verified: final approval for payment.
- Rejected: six-month (or configured) reapplication date is recorded.

The existing application review modal is used for all these actions. Committee verification is represented as a distinct workflow stage; role-specific committee accounts/permissions are not introduced by this migration.

## Renewal decisions

- Pending / under review: Secretariat review.
- Needs information: member uploads requested evidence to the same renewal request and submits the response.
- Approved: renewal payment becomes available.
- Successful provider verification: expiry is extended from the later of the current expiry or payment date by one year.

## Testing checklist

1. Submit upgrade request; verify no document upload or payment appears before initial approval.
2. Initial approve; upload multiple files in the same application; submit documents.
3. Verify `documents_submitted` → `committee_review` → `committee_verified` → `approved_for_payment`.
4. Confirm payment is blocked before final approval and enabled only after final approval.
5. Complete a test payment; confirm membership grade changes but membership number does not.
6. Reject another upgrade with a reason; confirm reapplication date and that database insert is blocked until that date.
7. Request corrections; confirm the same application can receive additional documents without a cooldown.
8. Configure renewal opening/grace days, anniversary basis and renewal fee. Test before-window, in-window and grace-period requests.
9. Approve renewal and test payment; confirm expiry extends by one year and grade/number remain unchanged.
10. Confirm member notifications for every stage.

## Important limitations

- The migration does not decide official grade eligibility or document checklists. NI4E must configure approved requirements.
- Renewal opening and grace durations are left unconfigured until NI4E chooses them.
- The committee verification stage is modelled in the workflow, but a separate committee user role and voting/quorum process are outside this change. The admin action currently records that committee verification was completed; authorised committee access must still be governed by NI4E's existing admin permissions.
- The member submission RPC requires at least one new supporting file for an upgrade response; the committee must compare the submitted files with the configured grade checklist and request any missing items. The checklist is displayed to members but exact per-item file matching is not automatically enforced.
- No live Supabase or Paystack transaction was run during this source edit.
