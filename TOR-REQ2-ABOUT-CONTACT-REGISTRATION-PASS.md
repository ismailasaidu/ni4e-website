# Requirement 2 – About, Contact and Registration improvement pass

## Updated in this pass
- About page expanded with discipline cards, platform pillars, audience journeys, visitor journey steps and routes into membership, events, publications and communities.
- Contact page expanded with quick routes by enquiry type, a more complete enquiry form, validation guidance, process steps, privacy reminder and FAQ accordions.
- Event demo registration now opens a realistic form and displays a clearly labelled preview receipt after valid submission. It does not write demo submissions to Supabase or send emails.
- Official event registration continues through the existing authenticated Supabase insert path.
- Existing Supabase client/configuration and membership/admin files are preserved.

## Important testing notes
- Build has not been verified in this environment because dependency installation timed out. Run `npm ci` (or `npm install`) then `npm run build` locally.
- Test a demo event registration and confirm it explicitly says no record/email was created.
- Test an official published event while signed in and verify the row is saved in `event_registrations`.
- Test the contact form with valid data and verify the row is saved in `contact_enquiries`; test invalid email and empty required fields too.
- Official contact details, institutional mission wording and privacy policy links remain subject to NI4E approval; no fictional phone number, postal address or email was added.
