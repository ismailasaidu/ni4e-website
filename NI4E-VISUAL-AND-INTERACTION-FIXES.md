# NI4E visual and interaction fixes — 29 October 2026

## Publications
- Publication cards use record-specific cover images for journal, book, research paper and technical resource types, while respecting supplied cover URLs.
- Free/paid access badges are styled as readable, centered pills instead of narrow stacked text.
- Card actions wrap cleanly on desktop and mobile so labels such as “Read paper” do not collapse vertically.
- The details modal scrolls into view when opened and restores the original page scroll position when closed.
- PDF resources have an explicit Download PDF action when the record points to a PDF; external books and resources remain open-source links.
- Copy citation remains an additional option rather than the only access action.

## Events and News
- Event modal opens into view and restores the previous page scroll position on close.
- News story modal scrolls into view and returns to the story card's original page position on close.
- News image cards use their article-specific image with cover sizing.
- External event registration is explicitly labelled as taking the visitor to the external organiser, clarifying that organiser-controlled events do not use NI4E's internal ticketing checkout.

## Verification
- Source edits were reviewed and packaged.
- `npm install --ignore-scripts --no-audit --no-fund` timed out in this environment, so a full Vite build and browser test could not be completed here.
