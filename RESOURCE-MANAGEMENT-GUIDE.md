# NI4E page-specific resource management

Public page resources are not hardcoded into the React pages. The `RelatedResources` component reads published rows from `public.site_content` where `content_type = 'document'` and uses the document's metadata to decide which page(s) should display it.

## Add a resource in Admin
1. Open Admin > Documents.
2. Create a document record with a title, summary, body and a valid `file_url` (public HTTPS URL or Supabase Storage public URL).
3. In Extra details (JSON), use metadata like:

```json
{
  "format": "PDF",
  "author": "NI4E Editorial Office",
  "year": 2026,
  "file_url": "https://your-public-file-url.example/resource.pdf",
  "resource_for": ["publication", "technical_division"],
  "related_to_slug": "power-energy-systems"
}
```

4. Publish the document. It will appear on the matching public section(s). `resource_for` accepts `event`, `publication`, `chapter`, `project`, `technical_division`, `committee`, and `news`. Omit `related_to_slug` to show it as a general resource for that page type; include it to associate it with a specific item slug as well.
5. To update or remove the resource, edit/unpublish/delete the document in Admin > Documents. The public pages read the published database records on load.

## Important
- A real file must be uploaded to an approved public file host or Supabase Storage and its URL saved in `file_url`/`resource_url`. The app does not fabricate downloadable PDFs from metadata.
- Do not use private or sensitive documents in a public URL. For restricted files, a separate authenticated/signed-URL flow is required.
- Existing `site_content` schema supports the `document` content type; this resource display feature does not require a new database table. Admin access and public published-content policies must already be applied.
- This is a data-driven resource relationship, not a static list of baked-in links.
