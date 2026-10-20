# NI4E Event Registration Continuation — 19 October 2026

## Change in this continuation
- Added the `user_id` foreign-key column to the event registration migrations because the Events page inserts the signed-in account ID.
- Made the Stage 3 Events/CPD migration idempotently add the attendee-count, payment status, currency, amount, payment reference and paid-at fields used by the event registration/payment UI and Edge Functions.
- Kept existing tables and rows; no destructive reset statements were added.

## Important verification notes
- The Events page requires a signed-in account to register.
- Free event registration inserts into `public.event_registrations`; paid events use the `initialize-event-payment` and `verify-event-payment` Edge Functions.
- Admin has an Event Registrations workspace and CPD Records workspace in the existing code.
- This change has not been tested against the user's remote Supabase project.
- A production build could not be run in this environment because the bundled `node_modules/.bin/vite` executable is missing/has no executable permission. Run `npm ci` and `npm run build` on the developer machine.
- Apply the updated migration in Supabase SQL Editor only after reviewing the current schema. It is additive and should not reset existing data.
