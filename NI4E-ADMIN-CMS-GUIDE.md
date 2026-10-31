# NI4E Admin CMS connection guide

## What is now connected
- Events, News, Publications, Projects, Committees, Technical Divisions and Documents use `site_content` records and public pages filter to `published = true`.
- Leadership reads published `executive` and `past_president` records from `site_content`; if no live records exist for a group, the existing approved directory remains as the fallback.
- Chapters reads published `chapter` records and applies edits to matching directory entries by title; new chapter records are added to the directory.
- About reads the latest published `institutional_page` record and supports metadata-driven sections.
- Admin navigation is grouped into Overview, Membership & People, Website Content, Events & Publications, Communication and Administration.

## Required database step
Run `supabase-admin-cms-upgrade.sql` in Supabase SQL Editor. The original schema constraint did not include `institutional_page`, even though the Admin panel exposed an About Page editor. This migration adds that content type and an index for public content lookups.

## Admin content record contract
All content is stored in `public.site_content`. Use the matching tab in Admin, enter the title/slug/summary/body, edit the JSON metadata, and enable Published only when the record is ready.

### Executives (`content_type = executive`)
```json
{
  "name": "Officer full name",
  "position": "National Chairman",
  "image": "/images/executive-council/officer.jpg",
  "qualifications": ["B.Eng."],
  "experience": "Professional experience",
  "expertise": ["Power systems"],
  "career": [{"period": "2020", "role": "Role", "org": "Organisation"}]
}
```
The `body` field is used as the biography. The public page groups roles using the exact position labels: `National Chairman`, `Deputy National Chairman`, `National Vice Chairman ...`, `National Executive Council Member`, and `Executive Secretary`.

### Past Presidents (`content_type = past_president`)
Use title as the person's name; metadata may contain `name`, `tenure`, and `image`. Set `event_start` to the beginning of the tenure for chronological ordering.

### Chapters (`content_type = chapter`)
Use title as the chapter name; metadata keys: `address`, `phone`, `chapter_lead`, `region`. Summary and body are displayed in the chapter directory/detail view.

### About Page (`content_type = institutional_page`)
Use a stable slug such as `about-ni4e`. Metadata keys supported: `headline`, `introduction`, `secondParagraph`, `vision`, `missionHeadline`, `mission`, `objectives`, `history`, `disciplines`. `objectives` entries can be `["01", "Title", "Description"]` or objects with `number`, `title`, and `text`. `history` entries use `year`, `title`, and `text`. `disciplines` entries use `title` and `text` (icon defaults to a book/lightbulb-style icon).

## Security and operational note
The browser uses only the Supabase anon key. Never place a service-role key in Vite environment variables. Keep write permissions restricted by the existing administrator RLS policies. Test create, edit, publish, unpublish and delete with an admin account, then verify the public page in a separate session.
