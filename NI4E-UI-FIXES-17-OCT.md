# NI4E UI fixes — 17 October 2026

- Converted shared detail overlays into in-flow embedded detail panels via a shared CSS override; close-overlay controls are hidden because details are now page content.
- Added automatic scrolling to the embedded detail panel when opened, so selected leadership profiles and event/publication/chapter/directory details become visible immediately.
- Added a route-level scroll-to-top effect to prevent navigation from restoring the previous page's scroll position.
- Reduced the hover lift on the Membership Services card so it no longer shifts awkwardly under the cursor.
- Made the membership category cards horizontally swipeable with snap points on mobile, so the selected Student card no longer dominates the entire first view and users can browse categories in a carousel-like layout.
- Tightened leadership intro and detail layout for small screens.

Validation: JSX/TSX syntax check and archive integrity should be run after packaging. Live backend and full browser checks have not been performed in this environment.
