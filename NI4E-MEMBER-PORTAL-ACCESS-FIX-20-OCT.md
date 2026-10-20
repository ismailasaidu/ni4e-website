# NI4E Member Portal access and premium membership card — 20 October 2026

## Implemented in source
- The Membership page now renders a premium blue/white/gold card when the signed-in user's existing application status is `active`.
- The active card shows the member name, membership category, active status, and official membership number when present. If no official number exists, it says `Pending official assignment` rather than inventing one.
- The active card's primary action is `View Membership Portal` and navigates directly to `dashboard`.
- The Account dropdown shows `Member Portal` for active non-admin members and sends it directly to `dashboard`.
- Applicant accounts retain application status and payment navigation; the Member Portal shortcut is not shown for non-active applicants.
- Responsive styles were added for the premium card.

## Verification
- Source edits applied to `src/pages/Membership.jsx`, `src/components/Header.jsx`, and `src/styles.css`.
- `npm run build` attempted; it could not run because Vite is not installed in this working copy (`sh: 1: vite: not found`). This is an environment/dependency blocker, not a successful build.
- No live Supabase data or production deployment was changed.

## Follow-up checks required
1. Install dependencies successfully (`npm ci` where lockfile is present, otherwise `npm install`).
2. Run `npm run build` and fix any compile errors.
3. Sign in as an active member and verify the card name/category/official number against the profile record.
4. Verify dropdown direct navigation for active member, and absence of Member Portal shortcut for a pending applicant.
5. Test at mobile and desktop widths.
