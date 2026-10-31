# NI4E Member Portal follow-up — 30 October 2026

## Changes in this package

- Desktop member sidebar now participates in normal document scrolling. It is not a fixed-height nested scroll area. The mobile navigation remains a slide-in drawer.
- Upgrade requests expose an inline supporting-document uploader inside the relevant Applications card. Each file is linked to that application's UUID/reference in `membership_documents`.
- Approved applications expose a secure payment continuation action using the existing `initialize-membership-payment` Edge Function.
- Annual renewal request creation is available to members with an assigned membership number and an active/expired membership record. Duplicate in-progress renewal requests are blocked. Approved renewals use the same application-specific secure payment continuation.
- Member profile details are editable in the portal's own Profile & account tab. Legal name, email and official membership identity remain read-only; contact phone is editable. Profile-photo upload stores the image in the existing `member-avatars` bucket and saves `profiles.avatar_url`.
- The documents area is labelled **Application evidence** and is described as a secure, request-linked evidence record rather than a general downloads library.
- CPD is described as Continuing Professional Development. The member page displays records entered by NI4E administrators and explicitly explains that event attendance does not automatically generate CPD credit.
- Public Events and member Events & activities now use the same published `site_content` event records and hide rows explicitly marked as demo (`metadata.demo = true`, `slug` beginning `demo-`, or title beginning `[DEMO]`).
- The member Events list displays the configured event image/flyer where one is available.
- Upgrade document checklist settings have been added to Admin → Membership Policies. The member upgrade request modal displays the configured checklist for the selected grade when NI4E has entered one.

## Required Supabase migration

Run:

`supabase/migrations/20261030_ni4e_upgrade_document_checklists.sql`

This creates four safe, unconfigured settings and updates `ni4e_public_membership_policy()` to expose only those public checklist values. The defaults intentionally say that NI4E approval is required; no eligibility/document rules have been invented.

The existing avatar migration remains:

`supabase/migrations/20261030_member_avatar_storage.sql`

If that migration has not already been run in this Supabase project, run it as well.

## Annual renewal policy requirement

The annual renewal request itself is implemented, and the existing Edge Functions already support approved renewal payment and membership-date extension. However, the existing `ni4e_renewal_basis` setting defaults to `not_configured`. Before Paystack renewal checkout can proceed, an authorised NI4E administrator must select **Anniversary — one year from activation/current expiry** in Admin → Membership Policies, but only if that is the institution's formally approved rule. The renewal fee must also be configured in Fees & Membership. The portal deliberately does not invent a renewal date or fee.

## CPD implementation boundary

`member_cpd_records` currently supports administrator-entered records and member read access. It does not yet provide a member self-submission/evidence-review workflow, and event attendance is not automatically converted into CPD hours. The member portal now states this accurately.

## Verification

All 44 JSX/TSX files under `src` passed TypeScript's JSX transpilation/syntax check. A full Vite production build and live Supabase/Paystack transaction test were not completed in this environment.
