# NI4E Requirements 2 and 3 — completion pass notes

This pass continues the existing React/Vite/Supabase project; it does not replace the UI or clear live records.

## Requirement 2 improvements in this pass
- Existing Events, Chapters, Publications, Projects, Technical Divisions and Committees pages now retain substantive local preview content if Supabase is not configured, errors, or returns no published records. Existing live records are kept and preview records are merged without title duplicates.
- Preview records are explicitly labelled as illustrative. Demo events cannot accept real registrations or payments; preview publication files are not represented as real official documents.
- Past Presidents has a non-person archive template rather than fabricated names/tenures. Leadership falls back to role-profile templates rather than inventing real office-holder identities.
- Fixed public-page rendering so a preview fallback is shown instead of the error panel hiding it.
- Updated the repair migration and demo seed content-type constraints to preserve the existing `institutional_page` type.

## Requirement 3 improvements in this pass
- Correction resubmission defaults to the agreed `same_application` policy. The existing RPC keeps the application UUID/reference stable and appends review history; final rejection still follows the configured waiting period.
- Member dashboard now formats the application UUID consistently as `NI4E-XXXXXXXX`, matching the registration success reference display. This is a display reference derived from the stable application UUID, not the official membership number.
- Existing public member directory and verification RPCs continue returning only name, membership number, category and status; no private contact or document data is added. Empty directory copy explains eligibility and official-number requirements rather than suggesting the system is broken.
- Membership fees remain payable only after approval; renewal date calculations and payment verification remain server-controlled and require the institution's configured renewal basis and deployed Edge Functions.

## Not claimed as verified
- No production build was completed in this environment because `vite` was unavailable after dependency installation timed out.
- No live Supabase project, RLS policies, email delivery, file uploads, or Paystack test transaction was accessed from this pass. These must be tested in the target project before calling the full requirements production-complete.
- Illustrative chapter/project/division/committee/news/event/publication content is clearly a preview and must be replaced by approved NI4E content before public launch.
