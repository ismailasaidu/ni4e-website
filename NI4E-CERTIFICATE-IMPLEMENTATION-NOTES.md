# NI4E Certificate of Membership implementation

## Included
- Member portal's Membership Certificate action now creates a print-ready A4 landscape certificate personalised with the member's display name, membership category, membership number, issue date, expiry/validity, and certificate reference.
- The certificate can be printed or saved as PDF through the browser print dialog.
- Certificate generation is blocked unless the current membership status is `active`.
- `supabase-auto-membership-number.sql` adds `membership_issued_at` and `certificate_reference` and fills them when an active profile receives its automatic membership number. The reference is unique and stable.
- The certificate includes unsigned authorised-officer lines; NI4E must apply its approved signatures/seal before treating it as a formally executed certificate.

## Apply
1. Back up the project and database.
2. Apply the main schema reconciliation migration first, then apply `supabase-auto-membership-number.sql` in the NI4E Supabase SQL Editor.
3. Ensure the profile's `membership_category`, `membership_status`, `membership_number`, and `membership_expires_at` values are correct. The server-side verified payment flow must be what sets active status.
4. Run `npm install`, `npm run build`, then `npx netlify dev` and test using an active test member.

## Important
This is a browser-generated, print-to-PDF membership certificate, not a digitally signed PDF. The app does not invent a president/registrar name or signature. A production-issued certificate should only be represented as official after NI4E approves the certificate template and authorised signatories.
