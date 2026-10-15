# NI4E demo content setup

This package includes fictional seed records for Events, Publications, Chapters, News, Projects, Technical Divisions and Committees.

## Important

- Every record is marked `[DEMO]` in its title and `metadata.demo = true`.
- These are fictional records for prototype/tender demonstrations, not official NI4E notices, chapters, publications, projects, committees, office-holders or events.
- Replace/delete demo records before the production launch.
- I cannot directly write into your Supabase project from this local project package; run the included SQL yourself to control exactly what enters your database.

## Push the demo records to Supabase

1. Open the Supabase dashboard for your NI4E project.
2. Go to **SQL Editor** and create a new query.
3. Open `supabase-demo-content-seed.sql`, copy its full contents into the SQL Editor and run it.
4. Refresh the website. The public pages read published content from `public.site_content`; the Admin content tabs can edit/delete the seeded entries.
5. In Admin, use Events, News & Announcements, Publications, Chapters, Technical Divisions, Projects and Committees to update records. Keep `published` enabled to show them publicly.

The seed script is idempotent for these slugs: re-running it updates the same demo records rather than duplicating them.

## Remove all demo content

After replacing the demo data, run this only if you intend to delete all records marked as demo:

```sql
delete from public.site_content where metadata->>'demo' = 'true';
```

## Build locally

```powershell
npm install
npm run build
npm run dev
```

If `npm install` fails with `ENOSPC`, free disk space before retrying. Do not share `.env` keys or Supabase service-role secrets.
