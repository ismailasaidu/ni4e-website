# NI4E Events, Publications and News update — 29 October 2026

## Events
- Expanded the event modal into an event overview plus a structured event-details panel.
- Added “Why attend?” and “Who should attend?” sections, using event metadata when supplied and concise fallback text otherwise.
- Added date, time/duration, venue, audience, organiser, format and registration deadline to the event details panel.
- Added matching admin fields for why-attend copy, event format and duration; existing flyer, agenda, registration, paid-event and payment flow controls remain.
- Event agenda remains inside the modal; no separate programme download is required.

## Publications
- Retained four clear filters: All Publications, Journals, Engineering Books, Research Papers and Technical Reports.
- Technical guides and engineering-practice resources are grouped under Technical Reports instead of being their own filter category.
- Removed an unused helper that would have generated a plain-text catalogue download masquerading as a document. Actual linked PDFs and original-source links remain the access route.
- Retained publication search, source links, citation copying and paid-publication checkout/access logic.

## News
- The only content categories are News and Upcoming Events (with an All view).
- Replaced NIQS-sourced story/event seed content with engineering-sector updates from CIEEEN, NSME and NSE and upcoming listings from NETCON and Reliability AFRICA, linked to their original sources.
- Database-fed items outside the two categories are excluded; demo/preview-like items and NIQS-derived records are filtered from the public list.
- Existing share-story control and scroll-position restoration on closing a story are retained.

## Verification status
- Inspected the modified source and confirmed balanced curly braces and parentheses in the modified JSX files.
- A full Vite production build was not completed because npm dependency installation timed out in this environment. Run `npm install` and `npm run build` before deployment.
- News source references: https://cieeen.gov.ng/news/cieeen-begins-issuance-of-professional-certificates-to-registered-engineering-practitioners ; https://nsme.org.ng/ ; https://nse.org.ng/category/latest-news/ ; https://www.netcon.ng/ ; https://reliabilityafrica.com/home/
