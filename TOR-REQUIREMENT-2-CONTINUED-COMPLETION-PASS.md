# TOR Requirement 2 — Continued Completion Pass

This pass builds on the supplied NI4E project and preserves the existing React/Vite/Supabase integration.

## Changes in this pass

- Added four actual, downloadable PDF demo resources under `public/demo-resources/` for the Publications catalogue. Each PDF is explicitly marked as an illustrative sample, not an official NI4E publication.
- Updated the four bundled publication records to link to the corresponding sample PDFs and identify them as demo assets.
- Updated the publication detail view with separate Preview PDF and Download PDF actions, citation copying, related events and technical-division navigation. Published records without a file now have an honest catalogue-brief fallback instead of a dead action.
- Improved mobile detail views: full-height, scrollable modal sheets on small screens; safer spacing around the close control; clearer event banners and better keyboard focus states.
- Refined About and Contact mobile spacing and form focus treatment.
- Kept the existing Supabase query/submission paths and did not change live database schema or credentials.

## Demo safety

Demo PDF files are generated examples and must not be represented as official institutional guidance. Replace them with approved NI4E publications before production. Demo event registrations are not stored in the live database.

## Verification status

- PDF files were generated and included in the project.
- ZIP archive integrity can be checked with `unzip -t`.
- A fresh production build could not be completed in this execution environment because dependency installation timed out. The build must be verified on the user's machine with `npm ci` (or `npm install` if no valid lockfile is present), followed by `npm run build`.
- Browser checks still required for all eleven Requirement 2 pages, Supabase read/write permissions, and real registration/contact submission.

## Requirement 2 sign-off checklist

1. About — verify page hierarchy, institutional accuracy placeholders, responsive sections and links.
2. Leadership — verify profile layout and correct published records.
3. Membership — verify application entry point and existing member flows.
4. Chapters — verify search, filters, profiles and contact links.
5. Technical Divisions — verify specialist focus areas, related resources and navigation.
6. Committees — verify mandate, responsibilities and related resources.
7. Events — verify filters, event details, demo registration receipt and authenticated real registration.
8. News — verify article details, share action and relevant cross-links.
9. Publications — verify category/search, PDF preview/download, citation copy and related links.
10. Projects — verify project profile sections and cross-links.
11. Contact — verify validation, demo/live distinction, Supabase submission and failure feedback.

Do not sign off Requirement 2 until the build succeeds and all page-specific checks above have been completed in the browser.
