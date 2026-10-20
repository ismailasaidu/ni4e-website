# TOR Requirement 2 — Page-purpose and demo-content update

This update changes the About page layout and gives database-driven public directories illustrative preview content when the database is not configured, returns no published records, or cannot be reached.

## Demo-data policy
- Entries are explicitly labelled as illustrative previews.
- Leadership uses role placeholders only; no people are invented.
- Chapter examples are geographic directory mockups and are explicitly not verified recognised chapters.
- Event examples already in the project are labelled as previews; registration is disabled for demo events.
- Directory sample projects, technical areas and committee remits are layout demonstrations, not claims of formally approved NI4E entities.
- Publications in the existing page are illustrative catalogue entries; do not treat their content as issued NI4E publications.

## Before production
1. Replace/disable demo entries after committee approval of official records.
2. Confirm About-page official mission/vision/history wording with NI4E.
3. Configure the correct Supabase project and test published records, contact submissions, event registration and document links.
4. Run `npm install`, `npm run build`, then test all eleven TOR pages on desktop and mobile.

Demo content is not inserted into Supabase by this code; it is local preview data used by the front end when live records are unavailable.
