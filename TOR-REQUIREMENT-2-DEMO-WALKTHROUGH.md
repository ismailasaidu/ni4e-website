# NI4E TOR Requirement 2 — Committee Demo Walkthrough

This update is intended to let the NI4E committee experience the full public-page journey before replacing illustrative material with approved institutional content.

## What the demo includes

- **About:** institutional overview, broad engineering focus areas, purpose, pathways and links into the site.
- **Leadership:** six fictional profile examples with roles and biographies. These names are not real NI4E officeholders.
- **Membership:** membership category selector, benefits, application journey, FAQ, credential preview and routes into the existing application flow. Fees/eligibility should only be shown when formally confirmed.
- **Chapters:** four illustrative regional directory entries with search and profile modals. These do not assert that the named regions are officially recognised chapters.
- **Technical Divisions:** four illustrative technical-area profiles with filtering/search and details.
- **Committees:** three illustrative committee profiles with filtering/search and details.
- **Events:** three illustrative event cards with dates, venues, detail views and disabled demo registration.
- **News:** three sample editorial stories with categories, featured story, article modal and share action.
- **Publications:** four illustrative catalogue entries with details, citation copy and generated text brief downloads. These are not official publications.
- **Projects:** three illustrative project profiles with search/filtering and detail views.
- **Contact Us:** validated contact form. In demo mode it explicitly tells the visitor the message was not sent or saved; when configured, the form submits to Supabase.

## Demo data versus live records

Each database-backed directory first attempts to load published records from Supabase. If the service is not configured, the query fails, or no published records exist, the frontend uses the bundled illustrative data so that the page remains demonstrable. Where published live records exist, they replace the sample set for that page.

The sample records are for layout and interaction review only. They must be replaced by committee-approved data before public launch. Do not represent sample leadership, chapter, event, project, committee, technical division or publication content as official NI4E records.

## Run locally

From the folder containing `package.json`:

```powershell
npm install
npm run dev
```

Then open the local URL shown by Vite. To verify the production bundle:

```powershell
npm run build
```

If installation previously failed with `ENOSPC`, free disk space and remove the incomplete `node_modules` directory before reinstalling. Never commit `.env` secrets or a Supabase service-role key to the frontend.

## Acceptance checklist

1. Visit all eleven pages using the main navigation.
2. Confirm sample content appears even when Supabase variables are absent.
3. Test directory search and category filters.
4. Open and close each details modal.
5. Confirm demo event registration is not represented as a real registration.
6. Submit the Contact form in demo mode and confirm the status explicitly says the message was not sent/saved.
7. Test at mobile (375px), tablet (768px), and desktop (1440px) widths.
8. Configure Supabase and confirm approved published records replace the sample entries.
9. Run `npm run build` and resolve all build errors before deployment.
