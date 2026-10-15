# NI4E account dropdown and applicant/member access navigation

This update adds an Account dropdown to the public header and a matching Account section to the mobile navigation.

- Logged out: Sign in, Join NI4E / Apply, and Membership information.
- Signed in: Account overview, Application status & payments for non-admin accounts, Member portal only for active members, Admin portal for admins, and Sign out.
- Account overview sends applicants to the existing application/payment status page, active members to the member dashboard, and admins to the admin portal.
- Sign out calls Supabase Auth signOut and navigates to the public homepage.
- The sign-in page now describes itself as NI4E Account Access because applicants use the same credentials to track their applications.

No new authentication provider, account, database table, or migration was added. The existing ProtectedRoute still guards the member dashboard based on `profiles.membership_status === 'active'` and the admin route based on the admin role.

## Verification note
The project dependencies could not be installed in the working environment within the available timeout, so a Vite production build could not be run here. After extracting the ZIP, run `npm install` and `npm run dev` locally, then test both logged-out and logged-in states. Do not include `.env` or secrets when sharing the project.


## Follow-up header refinements
- Hide the standalone header Account trigger at mobile/tablet widths; account actions remain available inside the mobile navigation menu.
- Remove the Join NI4E / Apply action from the Account dropdown. New applications remain available through the public Membership page.
- Use a single sign-in label instead of a separate Member Login label on payment and homepage entry points. Active membership controls access to the member portal.
