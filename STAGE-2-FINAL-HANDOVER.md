# NI4E Stage 2 final refinement

## Identity and editorial corrections
- Public pages use NI4E identity only. NIEEE/NIEEE.org is not presented as the site's identity or as an official source link.
- Leadership names, credentials, career histories and example.org email addresses are fictional illustrative profiles.
- The About page's main headline, summary, body and selected supporting copy can be managed from the database.

## Database setup (required once)
1. Open the existing NI4E Supabase project and go to SQL Editor.
2. Run `NI4E-STAGE-2-CONTENT-MIGRATION-AND-SEED.sql`.
3. The script extends `site_content.content_type` to allow `institutional_page`, seeds the About page, and upserts the nine illustrative executive profiles. Existing unique `(content_type, slug)` records are updated, not duplicated.
4. In the website Admin dashboard, use **About Page** to edit the About page record and **Executives** to add/edit/publish leadership records. The existing `site_content` policies must allow published public reads and administrator writes; the migration does not weaken RLS.
5. In Executives metadata, keep keys such as `name`, `role`, `group`, `sampleProfile`, `email`, `location`, `qualifications`, `experience`, `career`, `expertise`, `responsibilities`, and `priorities`. Arrays should remain JSON arrays. Use only example.org email addresses for fictional profiles.

## Carousel behaviour
- About and leadership galleries advance every 4.2–4.6 seconds.
- They pause on hover/focus and stop auto-motion when the visitor has requested reduced motion.
- Visitors can still swipe/scroll the tracks manually.

## Verification
Run `npm ci`, `npm run build`, and `npm run dev` from this project folder. Confirm the Supabase environment variables are configured in the local environment/deploy settings. The migration file must be run in the user's Supabase project; the source archive cannot write to a remote database by itself.
