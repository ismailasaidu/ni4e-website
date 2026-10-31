# NI4E Admin ↔ Public Website Content Management

## What is connected in this pass

The Admin `site_content` editor is the content source for Events, News & Announcements, Publications, Chapters, Technical Divisions, Projects, Committees, Documents, Executives and Past Presidents. The public pages query published records from `public.site_content` and unpublished records remain out of public views.

This pass also connects:

- **Leadership:** the public Leadership directory now loads published `executive` and `past_president` records from Supabase. If no records of a type have been published, the existing brochure-based directory remains as a fallback. Executive metadata keys: `name`, `position`, `image`, `qualifications` (array), `experience`, `career` (array), `expertise` (array), `priorities` (array), `source`, plus optional `email` and `location`. Put the full biography in Body or `biography`.
- **About:** the public About page now loads the latest published `institutional_page` record. If none exists, the existing institutional copy remains as fallback. Metadata keys: `headline`, `introduction`, `second_paragraph`, `vision`, `mission_heading`, `mission`, `objectives` (array of `{number,title,text}`), `history` (array of `{year,title,text}`), and `professional_scope` (array of `{title,text}`). Title and Body fields also feed the page headline and main institutional paragraph.

## Database setup

Run `supabase-ni4e-content-management-migration.sql` in Supabase SQL Editor if the live database's `site_content` constraint does not yet allow `institutional_page`.

The existing `supabase-repair-migration.sql` in this project already includes `institutional_page` in its `site_content_content_type_check` constraint and includes public-read/admin-manage RLS policies. If the live database is behind, run the project repair migration according to the existing deployment procedure instead of running multiple competing schema patches.

Do not disable Row Level Security. Do not put a Supabase service-role key in frontend environment variables.

## First-time setup

1. Sign in using an account whose `profiles.role` is `admin`.
2. Open Admin → About Page. Create one record with a stable slug such as `about-ni4e`, fill Title, Summary and Body, and add the supported JSON metadata keys above. Set Published only when reviewed.
3. Open Admin → Executives. Add each current NEC officer as an individual record. Use the officer's name as Title; set Summary to the official position; add the portrait URL and profile fields in metadata. Publish each approved profile.
4. Open Admin → Past Presidents. Add one record per verified past chairman; use `tenure` and optional `image` in metadata. Publish only verified entries.
5. For Chapters, Technical Divisions, Projects and Committees, manage records through their corresponding Admin tabs. Public pages display published records.
6. Verify each saved change on the public page in a separate browser session. Confirm that draft records remain private.

## Important behaviour

- Saving a record does not publish it unless the Published checkbox is enabled.
- About uses the most recently updated published institutional page record.
- Leadership uses published database records when present; the verified static directory remains a fallback if no records of that type have been published.
- Event registration/payment, paid-publication storage and membership/payment flows are intentionally left intact.
- Existing content is not automatically migrated into new records. Populate and verify the managed About and Leadership records before assuming the database is the authoritative complete directory.
