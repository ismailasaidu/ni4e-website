# NI4E Fellowship and Membership Fix Report

## Changes in this pass

- Membership page now has one Fellowship gateway call-to-action instead of two separate route cards that both lead to the same Fellowship page.
- Fellowship page's Direct Fellowship and Fellowship by Education actions now select the route and scroll/focus the actual form section. Scrolling respects reduced-motion preferences.
- Starting Fellowship while signed out stores the requested destination; Login now returns the user to Fellowship after successful sign-in or account creation with a session.
- Direct Fellowship-specific membership standing questions are only required for the Direct route. Fellowship by Education validates its own academic award, institution, award year, distinctions and research/technical impact fields instead of being blocked by Direct-route-only answers.
- Added stronger layout and shadow to the single Fellowship callout on the Membership page, including a responsive stacked mobile layout.
- Existing Student/Graduate/Associate/Corporate form fields remain category-filtered. Student programme fields are shown for Student applicants; completed qualification and graduation year are shown/required for relevant non-student/Graduate applicants as defined in Register.jsx.

## Database / SQL

No new SQL is introduced by these frontend/navigation corrections. The existing membership application table, membership_documents table, private `membership-documents` storage bucket/policies, and `resubmit_membership_application` RPC must already exist for Fellowship submission and corrections to work.

## Validation performed

- TypeScript compiler JSX/TSX transpile syntax check: 0 syntax diagnostics across source files.
- `npm ci --ignore-scripts --no-audit --no-fund` timed out in this environment, so `npm run build` could not be completed.
- Live Supabase submission, storage upload, admin review queue and authentication redirect have not been exercised against the user's deployed backend. Please run the included project locally and verify these flows before deployment.
