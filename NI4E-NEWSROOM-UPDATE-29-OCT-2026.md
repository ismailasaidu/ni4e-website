# NI4E Newsroom update — 29 October 2026

## Changes
- Preserved the existing News page card/featured-story UI and share action.
- Replaced the previous generic editorial placeholder cards with sourced institutional and industry updates.
- Reduced the newsroom filters to All, News, and Upcoming Events.
- Added source attribution and original-source links to story details.
- Added a close-story behavior that restores the visitor's previous page scroll position.
- Excluded site-content records explicitly marked as demo, or whose title/summary/body contains common demo/preview wording, from the public News page.
- Updated the Events modal to show optional organiser, official source URL, intended audience, highlights, registration deadline, and agenda only when the admin has provided those details. Removed the fabricated generic agenda fallback.
- Added corresponding admin metadata fields so event organisers can enter those details without using raw JSON.

## External sources used for seed newsroom content
- NIQS National Conference & AGM 2026: https://niqs.org.ng/news/events/national-conference-agm-2026
- NIQS Big 5 Construct Nigeria report: https://www.niqs.org.ng/news/events/big-5-construct-nigeria
- Big 5 Construct Nigeria official event information (2027 dates): https://www.big5constructnigeria.com/event-info/
- NIQS homepage listing QS Connect Vol. 9.1: https://niqs.org.ng/

External events are attributed to their actual organisers and are not represented as NI4E-hosted events. Dates and event information should be checked against the organiser before publication.

## Verification
A full Vite build could not be completed because `npm install --prefer-offline --no-audit --no-fund` timed out in this environment. Test `npm install` and `npm run build` locally before deploying.
