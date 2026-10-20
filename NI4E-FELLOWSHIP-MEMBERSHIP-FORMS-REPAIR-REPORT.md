# NI4E Fellowship and Membership Form Repair

## Fixes in this pass

- Fellowship route buttons now select the route and scroll to the actual application form for both signed-in and signed-out visitors. The previous signed-out branch redirected immediately to login, so the form never opened.
- Signed-out visitors can inspect the route-specific form and are given an explicit sign-in action before submission.
- Direct Fellowship and Fellowship by Education now use route-specific step names, section headings, visible fields and validation. Direct route asks for professional/corporate standing and NI4E participation; Education route asks for academic qualifications, research impact and academic evidence.
- Removed the duplicate Fellowship callout from the Membership page. There is one Fellowship entry point on Membership, leading to the Fellowship page where the two distinct application routes live.
- Membership category selected on the Membership page is now carried into registration through the login redirect, so applicants do not have to select it again.
- Registration steps now use category-specific labels and instructions for Student, Graduate, Associate and Corporate applicants. Existing category-specific fields, required documents and validation remain: Student ID + proof of enrolment for Student; degree certificate OR statement of result for Graduate; Associate/Corporate criteria and required documents are driven by NI4E policy settings.
- Removed unapproved fallback fee figures from the Membership and Fellowship pages. Only official configured fees are shown; otherwise the UI says the fee is awaiting NI4E Council configuration.

## Validation

- TypeScript JSX transpile parser: zero syntax diagnostics for `src/pages/Fellowship.jsx`, `src/pages/Membership.jsx`, and `src/member/Register.jsx`.
- `npm ci --ignore-scripts --no-audit --no-fund` timed out in this environment; dependencies were not available, so a Vite production build could not be run.
- No live Supabase, authentication, storage, email, or browser interaction test was possible in this pass. The archive should be built and tested against the project's configured Supabase environment before production deployment.
