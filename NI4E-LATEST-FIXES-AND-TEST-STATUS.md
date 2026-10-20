# NI4E latest fixes and test status

## Fixed in this pass

- Membership registration route now permits signed-in applicants who are not yet active members. The active-membership gate remains in place for member-only pages, while the application form is accessible to a newly created account.
- Navigation to registration stores the intended destination so sign-in returns the user to the application rather than redirecting them to the payment status page.
- Event fallback cards no longer have a front-end hard block that told visitors to contact the Secretariat. Three free-registration event records have stable UUIDs and a matching Supabase seed file.
- Event registration migration now adds attendee-count, payment-status, currency, amount, payment reference and paid-at columns when missing.
- Home hero carousel advances automatically even when the pointer is resting over the hero. Spotlight carousel likewise no longer pauses on mouse hover. The project and technical-division galleries advance horizontally while a detail modal is open.
- Membership page now explains category pathways, required information, application review, correction/resubmission, approval, payment, activation and annual renewal in greater detail.
- Technical Divisions page now has an expanded specialist-network introduction and additional divisions covering energy efficiency, telecommunications/digital infrastructure and power electronics/electric drives.
- Projects directory includes additional detailed engineering initiative profiles. Motion/hover transitions were added to cards, pathways, directory detail modals and gallery imagery, with reduced-motion support.

## Database step for event registration

Apply `supabase-event-directory-content-seed.sql` in the existing Supabase project's SQL Editor after the event registration/payment migrations. It inserts the three published event records referenced by the page and makes the free registration flow satisfy the current event-existence RLS policy. It does not delete or replace unrelated event content.

If the project already has the Stage 3 event-payment migration applied, apply only the event seed file unless the registration columns are known to be missing. The seed events are free; no Paystack payment is required for them.

## Validation status

- Parsed all 39 JSX/TSX source files with TypeScript transpilation: zero syntax diagnostics.
- Attempted `npm ci --ignore-scripts --no-audit --no-fund`, but dependency installation timed out in this environment. Therefore a full Vite production build and live Supabase/Paystack tests have not been verified here.
- Keep the existing Supabase data. Do not reset the database or run destructive migrations as part of this patch.
