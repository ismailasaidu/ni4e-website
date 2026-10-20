# NI4E Fellowship and Application Status Fixes

## Changes in this pass
- Removed the general-purpose document upload panel from the applicant status portal. It now appears only when the latest application status is `needs_information`; already-submitted documents remain listed.
- Corrected ordinary membership form category fields: `graduationYear` is shown only for Graduate Member. Student applicants use their selected qualification/current programme and institution; the duplicate `studentProgramme` requirement has been removed from validation. Graduate applicants must provide a valid graduation year.
- Fellowship form validation has been made route-aware and less contradictory. Direct route no longer requires COREN/licence/division fields when those may be inapplicable, and a Corporate Membership Number is required only if the applicant says they are a Corporate Member. The application can be submitted for committee assessment; it does not confer Fellowship or enable payment automatically.
- Fellowship Education route still requires academic qualifications and research/technical impact. Both routes require the core identity, experience, contribution statements, CV, passport, achievement evidence, two Fellowship referees and declaration.
- Where AGM/branch/chapter/publication evidence is not applicable, the applicant is prompted to explain rather than being forced to invent experience.

## SQL
No new SQL migration is required for these frontend validation and presentation changes. The existing membership tables, private `membership-documents` storage bucket and membership document table are used. Ensure the existing RLS policies permit authenticated applicants to insert their own application/document rows and upload under their own user ID; do not disable RLS.

## Validation status
All 39 JSX/TSX source files were parsed with the globally available TypeScript transpiler: zero syntax diagnostics. A production build and live Supabase/RLS/storage workflow were not run in this environment.
