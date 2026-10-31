# NI4E Membership Centre – implementation notes

## Source changes in this package

- `src/pages/Membership.jsx`: exports the existing public membership category definitions so the member portal consumes the same eligibility, supporting-document, benefit and policy-note content.
- `src/member/PortalSection.jsx`: the Membership Details view now presents the member record, a live expiry countdown, grade guidance cards, eligibility/document accordions, upgrade request submission, annual renewal request submission, and membership request history.
- `src/styles.css`: adds responsive styling for the membership overview, countdown, renewal action and grade progression cards.

## Request workflow behaviour

- Upgrade and renewal requests are inserted into the existing `membership_applications` table with `application_type` set to `upgrade` or `renewal`, `status` set to `pending`, and the previous/current category recorded.
- The member portal blocks requests for accounts that are not active members.
- It checks the loaded application history for an in-progress request of the same type before submission.
- The member receives a reference and is told that Secretariat review occurs before payment.
- The existing Admin Applications queue already filters `new`, `upgrade` and `renewal` request types and exposes review/initial-approval/decline actions. These new requests therefore enter that existing queue.
- The countdown is read-only. It does not change the database expiry date or modify protected profile fields.

## Verification status

- TypeScript's JSX transpiler parsed both modified JSX files successfully.
- A Vite production build could not be run in this environment: the archive did not include installed dependencies and `npm install` timed out; `vite` is therefore unavailable in the extracted workspace.
- No live Supabase credentials/session are available here, so database writes, RLS permissions, and the live admin/member round trip still require testing in the deployed environment.

## Important scope boundary

This is a focused implementation of the member-side Membership Centre and request submission into the existing admin queue. It does not claim that every previously discussed admin redesign, certificate generation or payment lifecycle item has been completed.
