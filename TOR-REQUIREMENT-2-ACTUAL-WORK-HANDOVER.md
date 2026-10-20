# NI4E TOR Requirement 2 — page/content implementation handover

This update targets the existing React/Vite/Supabase project. It does not ask the user to reconnect Supabase or create a new app.

## What changed in this pass

- Public directory loaders now keep real published records and add illustrative local preview entries so a partially populated Supabase database does not make a page look unfinished.
- If the Supabase seed records are already present, the UI avoids adding the local demo set a second time.
- Events, chapters, publications, projects, technical divisions and committees have preview records and their current search/filter/detail flows remain in place.
- Leadership can show real records plus fictional clearly labelled preview profiles. SQL seed records use the existing `executive` content type accepted by the schema.
- News keeps existing published stories and also displays illustrative sample stories unless seeded demo stories are already present.
- Demo seed SQL explicitly marks records as published; this fixes the previous seed omission that could cause the site to query zero records.
- The About, Membership and Contact pages retain their designed page content and service flows.

## Demo content safety

Every sample leader, chapter, event, publication, project, technical division, committee and news story is explicitly described as illustrative/demo content. It must not be presented as an official NI4E record. Replace it with approved institutional information before launch.

## Supabase demo seed

The file `supabase-demo-content-seed.sql` is included for a persistent preview in the connected Supabase database. It inserts demo records into `site_content` and marks them `published = true` with `metadata.demo = true`. It is safe to re-run for the same content types/slugs because it uses `ON CONFLICT (content_type, slug) DO UPDATE`.

The frontend also includes local preview data, so the public page layouts do not rely solely on seed rows being present.

## Verification status

The archive contains source and SQL only; `node_modules` is intentionally excluded. A fresh dependency install in this environment timed out / had no cached packages, so I cannot honestly claim a post-edit production build was verified here. The user previously confirmed the prior archive built with Vite, but these latest edits still require `npm run build` on the user's machine. No claim is made that live database writes were executed from this chat.
