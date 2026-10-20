# NI4E Stage 3 — Membership, Events & Professional Development

## Membership category correction
- Removed Life Membership from the public membership categories and member upgrade selector.
- Fellowship (FNI4E) remains a separate application pathway, not a regular upgrade dropdown category.

## Included in this pass
- Existing membership application review lifecycle remains in place.
- Admin now has an **Event Registrations** workspace to review attendee records and update statuses (New, Contacted, Confirmed, Cancelled).
- Admin now has a **CPD Records** workspace to create, review and delete continuing professional development records.
- Member dashboard includes **My CPD Record**, displaying activities and total hours associated with the signed-in account.
- SQL migration creates the event registration table if needed and creates the CPD records table with Row Level Security.

## Database migration
1. In Supabase SQL Editor, run `supabase-stage-3-membership-events-cpd.sql`.
2. Confirm it finishes without errors.
3. Ensure the existing administrator account has `role = 'admin'` in `public.profiles`.
4. In the Admin dashboard, open **Event Registrations** and **CPD Records** to test access.

The event registration migration is idempotent and can coexist with the earlier `supabase-event-registration-migration.sql`. Do not remove existing tables or data.

## CPD record linking
- To show a CPD entry in a member's dashboard, provide that member's Supabase Auth user UUID in the optional **Member account UUID** field when adding the record.
- A record without a user UUID remains visible to administrators but is not associated with a member portal account.
- Member RLS permits a signed-in user to read only CPD records where `user_id = auth.uid()`. Admins can manage all CPD records.

## Local test
From the project folder containing `package.json`:

```powershell
npm ci
npm run build
npm run dev
```

Test application review, event registration submission, admin status updates, adding a CPD record with a member UUID, and seeing that record in the corresponding member dashboard.

## Not represented as completed automatically
- This package cannot run the SQL migration against your remote Supabase project by itself.
- Email/SMS delivery, paid event checkout, verified attendance, and automatic CPD issuance are not enabled by this pass; they require provider/configuration and workflow decisions.
- Build verification must be run in your local environment before deployment.
