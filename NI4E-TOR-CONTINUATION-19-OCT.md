# NI4E Terms of Reference — continuation pass (19 October 2026)

## Implemented in this pass
- Added an Admin → Newsletter Subscribers module backed by `newsletter_subscriptions`.
- Admins can refresh and review subscribed/unsubscribed addresses and change subscription status; changes persist to Supabase.
- Added summary counts for total, subscribed and unsubscribed addresses.
- The module explicitly does not claim to send newsletter campaigns. Email campaign delivery requires an approved email provider/configuration and a separate sending workflow.

## Existing functionality retained from the current baseline
- Public institutional content management for events, news, publications, executives, past presidents, chapters, documents, technical divisions, projects, committees and About page.
- Membership application review, configurable fees/policies, member records, payment records, event registrations, CPD records, contact enquiries, membership directory/verification, and member portal sections.
- Membership/renewal and event payment Edge Functions are present in the source.

## Validation
- TypeScript transpile/parser check: 43 JavaScript/JSX/TypeScript source files, zero syntax diagnostics.
- `npm ci --no-audit --no-fund` timed out in this environment, so a Vite production build could not be completed here.
- No live Supabase, RLS, email delivery, Paystack, browser or device testing was performed in this pass.

## Deployment note
- This pass adds no SQL schema changes. It uses the existing `newsletter_subscriptions` table and existing admin RLS policy from `supabase-repair-migration.sql` / `supabase-schema.sql`. If that migration/policy is not applied to the active Supabase project, the screen will report a database access error until it is applied.
