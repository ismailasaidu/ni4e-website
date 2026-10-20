# Event registration fix

The public event page previously blocked registration for fallback event cards in the browser. In addition, Stage 3 registration policies require each event ID to reference a published `site_content` event record. The event cards now use stable UUIDs and the new `supabase-event-directory-content-seed.sql` creates matching published records.

Apply the SQL in Supabase in this order if not already applied:
1. `supabase-schema.sql` (only if establishing the schema from scratch; do not rerun blindly over a restored live database)
2. `supabase-event-registration-migration.sql`
3. `supabase-stage-3-integrated-event-payments.sql`
4. `supabase-event-directory-content-seed.sql`

If the existing site is already migrated, apply steps 2–4 only. The three seeded events are free-to-register; no payment is requested. Do not configure them as paid unless NI4E approves a fee and the corresponding event metadata and payment workflow are deliberately updated.
