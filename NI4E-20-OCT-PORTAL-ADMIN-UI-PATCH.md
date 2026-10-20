# NI4E portal and admin UI patch — 20 October 2026

## Changes in this source package
- Refined the active membership status card to use NI4E navy, white and restrained gold, with responsive member-detail fields.
- The card continues to use the signed-in user's profile and only shows a pending-assignment message when the official membership number is absent.
- Admin navigation now initializes expanded on desktop widths so section labels are visible on first entry; mobile remains a closed drawer by default.
- Adjusted desktop public-header spacing and navigation typography for the 1101–1390px range to reduce crowding.
- Existing admin sections are rendered as distinct tab views in `src/admin/Admin.jsx`; this patch does not replace those views with anchor-scroll navigation.

## Membership number
The official membership number should be assigned by an authorized administrator in Admin → Members after confirming the NI4E-issued number. Do not auto-invent a number, and do not use the application reference as a membership number. Confirm the relevant profile update policy/column and test that the assigned number appears consistently on the status card and portal.

## Verification status
Source changes made. Production build and browser/device testing are not confirmed in this package because Vite dependencies were unavailable in the working environment. Do not treat this package as a verified production release until `npm ci` and `npm run build` succeed and the member/admin flows are tested.
