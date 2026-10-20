# NI4E membership and Fellowship completion pass

## What changed
- Student applications use a dedicated current-programme-and-level field. They are not asked to provide a completed qualification or graduation year.
- Graduate applications require a completed qualification and graduation year.
- Associate and Corporate applications require a completed qualification but do not inherit the Graduate-only graduation-year requirement.
- Category-specific education fields, document requirements, and review summary now use the correct values.
- Fellowship form now requires responses for professional standing, experience, contributions, referees, declaration and required documents; the Education route has dedicated academic qualification, awarding institution and year fields plus research-impact evidence.
- Fellowship submission checks for an existing active application to prevent duplicates. Existing applications awaiting review are directed to the status page; applications marked `needs_information` load saved answers and can be resubmitted through the existing `resubmit_membership_application` RPC, retaining the same application record/reference.
- Fellowship route eligibility indicators are saved in `application_data.screening_flags` for committee review. Proposed criteria are not treated as an automatic award; payment remains dependent on NI4E approval.
- Existing private membership document storage and application tables are reused.

## SQL
No new SQL migration is required for these code changes when the existing NI4E schema, membership-document storage, RLS policies, and `supabase-stage-3-membership-resubmission-policy.sql` have already been applied. If the resubmission RPC migration has not been applied, apply that existing migration after the main schema/repair migration. Do not run a database reset.

## Validation status
- JSX/TSX syntax transpilation checked.
- A successful Vite production build and live Supabase upload/review workflow still need to be run in the project environment.
- Fellowship qualification/experience thresholds and fees remain subject to NI4E Council approval; application submission is not an election or a payment entitlement.
