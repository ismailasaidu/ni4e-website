# NI4E public pages fixes

## Fixes included
- Fixed modal positioning: the page-level transition no longer applies a transform that can trap fixed-position modal overlays. Modals are constrained to the visible viewport and scroll internally on mobile.
- Event registration now submits the event title as well as the event id and displays a useful error when the registration table has not been created.
- Added `supabase-event-registration-migration.sql` to create the event registrations table and RLS policies.
- Publication detail records without files now provide useful next actions and a copy-citation option instead of ending at a warning.
- Chapter and directory details include pathways to related events, resources, membership and other public directories.
- News stories include share and related-event actions.
- Replaced the Contact page with an Opportunities & Engagement hub and renamed the navigation entry.

## Required Supabase step
Open Supabase SQL Editor for the NI4E project, inspect `supabase-event-registration-migration.sql`, and run it. This creates only the `event_registrations` table and related policies. It does not insert official event records or alter membership tables.

## Verify locally
Run `npm install`, `npm run build`, and `npm run dev`. Test event registration after applying the migration, and test modal opening on a long page on both mobile and desktop.
