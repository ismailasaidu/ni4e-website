# NI4E consolidation update

This update consolidates targeted form and membership UX fixes on the supplied NI4E source baseline.

## Changes
- Membership fee display now shows larger proposed naira values for Student, Graduate, Associate and Corporate categories and renewal estimates. These are proposed, not official NI4E-approved charges.
- Fellowship fee section shows proposed Direct and Education route amounts; this display does not authorize payment. Server-side fee schedule must match before payment is enabled.
- Fellowship wizard next/back navigation scrolls to the Fellowship form section instead of the top of the page.
- Fellowship narrative questions use multiline text areas.
- Referee details no longer request a typed signature; the form asks for referee contact/membership details and uploads two signed referee forms.
- Fellowship year-awarded input is constrained to a sensible range and cannot exceed the current year.
- Removed redundant generic Fellowship start CTA; route-specific cards remain the route selector.
- Student programme and level dropdowns and conditional Other input remain in the registration form.

## Verification limits
This package has not been tested against the live Supabase project or Paystack. Do not assume remote migrations, payment configuration, storage permissions, or live membership activation are verified by source changes alone. Proposed amounts must be confirmed by NI4E and synchronized with the server-side fee schedule before real payment collection.
