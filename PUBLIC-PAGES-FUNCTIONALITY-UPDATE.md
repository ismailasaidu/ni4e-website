# NI4E public Events, Publications and Chapters update

## Public access
Events, Publications and Chapters are public pages. Visitors do not need to sign in to browse, search, filter, and open published records.

## Data source
Each page reads published rows from `public.site_content` using `content_type` = `event`, `publication`, or `chapter`. It does not display hardcoded sample chapters, fake publication records, or fake event records when the database is empty. The pages show loading skeletons, retryable errors, and useful empty states.

## Events
- Search and filter published events by type.
- View full event information, date, venue and optional time.
- Public event interest registration inserts into `event_registrations` and reports duplicate email registrations.
- Optional metadata keys: `event_type`, `venue`, `time`, `registration_open` (boolean), `registration_url`.
- Admin can set `event_start` and `event_end` and edit metadata JSON.

## Publications
- Public searchable/filterable catalogue and detail modal.
- Supports metadata keys: `type`, `category`, `year`, `author`, `publisher`, `format`, `file_url`.
- File links are shown when `metadata.file_url` is provided. The page clearly says when a file has not yet been attached.

## Chapters
- Public searchable directory and profile modal.
- Uses only chapter records actually published by NI4E; does not assume chapter names or locations.
- Supports metadata keys: `location` or `address`, `email`, `phone`, `website`, `chapter_lead`.

## Admin publishing
The existing content manager now exposes a metadata JSON field and event date/time fields, so an administrator can populate the information these public pages display. Metadata must be valid JSON. Example event metadata: `{"venue":"Abuja","event_type":"Conference","time":"9:00 AM","registration_open":true}`. Example publication metadata: `{"type":"Report","year":"2026","author":"NI4E","file_url":"https://..."}`. Example chapter metadata: `{"location":"Verified location","email":"chapter@example.org","phone":"...","website":"https://...","chapter_lead":"..."}`.

## Important setup
The pages depend on the existing `site_content` and `event_registrations` tables and the public-read / public-registration RLS policies in `supabase-schema.sql`. Confirm those migrations/policies have been applied to the connected Supabase project. No real event schedule, publication file, chapter name or contact is fabricated; administrators must publish verified information.

## Build status
A dependency install/build could not be completed in this environment because `npm install` timed out. The package versions were pinned to a stable Vite 6 / React 18 stack to avoid resolving `vite: latest` to the newer Rolldown native-binding path that previously failed on Windows. Run `npm install` and `npm run build` locally to verify with the project's actual environment.
