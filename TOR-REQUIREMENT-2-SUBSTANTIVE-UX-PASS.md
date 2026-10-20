# NI4E TOR Requirement 2 — Substantive UX Pass

This pass builds on the existing React/Vite/Supabase project. It does not replace Supabase configuration or change the existing public content queries.

## Changes in this pass

- Events: richer visual treatment for event cards and event detail panels; added a programme overview, sample agenda structure, intended audience section and clearer preview framing. Existing live-event registration logic is retained.
- Projects: detail view now demonstrates objectives, scope, beneficiaries, outcomes and an illustrative delivery sequence.
- Technical divisions: detail view now demonstrates technical themes, knowledge exchange, professional learning and industry collaboration, with a publications pathway.
- Committees: detail view now demonstrates mandate, responsibilities, work programme, accountability and a contact pathway.
- News: richer article detail masthead, byline, lead, structured article body and contextual announcement guidance. The main CTA is now contextual instead of always sending readers to Events.
- Shared styling: improved visual identity for event and directory cards, mobile detail-panel sizing, programme grids and text spacing.

## Important implementation notes

- All sample records remain illustrative and should not be represented as official NI4E announcements, projects, leaders, committees or publications.
- Existing Supabase integration and live data queries are preserved.
- Demo event registration remains disabled for illustrative events.
- Generated publication briefs are still demo resource files; replace with approved publication files before launch.
- This archive was created in an environment where npm dependency installation timed out and the dependency cache was incomplete. The latest source changes have not been verified by a fresh production build in this environment. Run `npm run build` locally before deployment and report any errors for correction.

## Acceptance checklist

1. `npm run build` completes successfully.
2. Events search/filter/refresh work; demo events open full details and clearly state that registration is not live.
3. Project, technical division and committee detail views show their type-specific sections.
4. News article links are contextual and share action works or degrades gracefully.
5. Mobile detail panels scroll to the bottom without text being obscured.
6. Supabase published content appears alongside preview records without duplicate titles.
7. Membership, authentication and admin routes still work as before.
