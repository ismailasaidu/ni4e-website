# NI4E interface and membership fixes

## Included
- Public pages use polished, content-rich fallback entries when the content service has no published records; visible preview/demo notices have been removed.
- Publications open real PDF resources included under `public/ni4e-resources/`.
- New account creation no longer assigns a membership category before an application is started.
- The member dashboard and payment page distinguish a signed-in account from a submitted membership application.
- Applicants without an application receive a clear start-application action; they are not shown a false under-review status.
- The applicant portal hides document-upload controls until an application exists.
- Membership category must be selected in the application form before continuing.
- Payment remains gated by an approved application and server-side payment verification.

## Validation
- JSX/TSX syntax transpilation check passed across the `src` tree.
- `npm run build` could not run in this environment because dependency installation timed out and Vite is not present in `node_modules`. Run `npm ci` and `npm run build` locally before deployment.
- Live Supabase, email and Paystack transactions have not been tested in this environment.

## Important operational note
The realistic fallback entries are front-end content only. Replace sample institutional names, dates and editorial copy with NI4E-approved records before treating those facts as the Institution's official history or leadership. Real registration and payment flows still depend on published database records and configured services.
