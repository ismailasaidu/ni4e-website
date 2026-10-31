# NI4E Leadership & News Update

## Changes
- Refined the National Executive Council chart with clearer hierarchy tiers, cleaner connectors, improved portrait nodes, stronger chairperson styling and responsive layouts.
- Added the NI4E-hosted “Engineering for a Sustainable Nigeria” event to News > Upcoming Events, using the existing event record and locally hosted event artwork.
- Added an internal “View event & register on NI4E” action that routes to the Events page and opens the matching event details. Registration then uses the existing NI4E sign-in, registration and Paystack flow.
- Updated event loading to merge published events with unique seeded featured events so the internal News CTA can resolve the event even when other published events exist.
- Existing external event listings remain attributed to their organisers; their external registration actions remain explicit.

## Verification
- Reviewed the edited JSX and CSS source paths and checked that the internal event ID matches the existing Events page featured event.
- Full Vite build/browser verification was not run because dependencies are not installed in this workspace.
