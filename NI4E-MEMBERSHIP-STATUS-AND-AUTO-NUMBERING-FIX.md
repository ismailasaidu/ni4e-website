# NI4E membership status and automatic numbering fix

## Changes
- Fixed the JSX ternary/IIFE syntax error in `src/pages/Membership.jsx`.
- When a signed-in user has a non-Fellowship membership application, the old large membership intro panel is hidden and the status card appears in the membership category-card position.
- The category cards and other application-start content are hidden for users with an existing application.
- Status-specific actions: approved -> Membership Payments (`payment`); active -> member dashboard; corrections -> continue the existing application; other states -> application status.
- The Admin Members view now displays the system-generated membership number instead of asking staff to type one.
- Added `supabase-auto-membership-number.sql`, which creates a sequence and trigger assigning `NI4E-{STU|GRD|ASC|COR|FEL|LIF|MEM}-{YEAR}-{SEQUENCE}` when a profile becomes active, without overwriting an existing number.

## Required deployment
1. Back up the project and database.
2. Apply the normal schema reconciliation migration first, if not already applied, then run `supabase-auto-membership-number.sql` in the correct Supabase project.
3. Deploy the updated frontend through the existing workflow.
4. Redeploy the `verify-membership-payment` Edge Function if it is not currently deployed. It activates the profile after verified payment; the database trigger then assigns the number.
5. Test pending, approved, correction-requested, rejected, paid/active cases using test data.

## Important limitations
- Membership numbers are generated only for profiles becoming active after this trigger is installed. Existing active profiles with blank numbers need a deliberate one-time backfill after review.
- The number can be used as the member/certificate reference. This package does not create an official PDF certificate template or digitally sign certificates; those require the approved certificate design and issuer details.
- A full Vite production build could not be run in this environment because dependency installation timed out. Run `npm install` and `npm run build` locally before deploying.
