# NI4E work checkpoint — 20 October 2026

## Changes made in this working source
- Membership Status active-member card now has a purpose-built NI4E navy/white/gold masthead, active badge, member name, category, official-number state, activation date and expiry date.
- Active members receive a full-width **View Membership Portal** action. Applicant status content remains separate.
- Admin section selection now reflects a section-specific hash route (`#/admin/<section-slug>`), supports browser back/forward, and restores the selected section from the hash while the app is open. Existing tab content is retained rather than rewritten wholesale.
- Admin sidebar starts expanded on desktop and remains a mobile drawer.
- Desktop public header spacing is tightened at 1101–1390px.

## Not yet verified
- `npm ci` timed out in the execution environment; `node_modules/.bin/vite` remains unavailable. Therefore `npm run build` and browser tests have not been completed.
- Admin sections now have section-specific hash URLs, but a full extraction into separate React route components has not been done.
- Live Supabase membership-number update permissions and profile refresh still require testing against the target project.
- No live database migration or deployment was performed.

## Membership number workflow
Admin → Members currently checks that the profile is active and not expired, validates the entered number, checks duplicates, and updates `profiles.membership_number`. Confirm the live RLS policy permits the admin update and that the signed-in member profile refreshes after save before sign-off. Never auto-generate an official number.
