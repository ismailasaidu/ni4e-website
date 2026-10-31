# NI4E internal publication payments

## What is implemented
- Admin can mark a publication as open access or paid and set its NGN price.
- Public publication cards label access and price. Paid details show only the public abstract/preview and citation.
- Paid checkout is initialized server-side through Paystack; the amount is read from the saved publication metadata, not trusted from the browser.
- A purchase record is created for the signed-in user. The callback is verified server-side against Paystack reference, amount and currency.
- Verified purchases remain associated with the user's account. The public page loads the user's successful purchases and offers secure full-text access.
- Full PDFs are delivered with short-lived signed URLs from a private Supabase Storage bucket.
- Admin → Payments includes publication purchase records.
- Event agendas are edited inline in the event admin form and displayed inside the event details modal; a separate programme download is not required.

## Required setup before going live
1. Run `supabase/migrations/20261029_publication_commerce.sql` in the Supabase SQL Editor.
2. Deploy these Supabase Edge Functions:
   - `initialize-publication-payment`
   - `verify-publication-payment`
   - `get-publication-access`
3. Configure Edge Function secrets already used by the NI4E payment functions: `PAYSTACK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NI4E_SITE_URL` (the public website origin). Never put the Paystack secret or service-role key in Vite environment variables.
4. In Admin → Publications, mark the item as paid, set the price and use the new private PDF upload control. It uploads the PDF to the private `publication-files` bucket and fills the storage path automatically.
5. Enter only the abstract/preview in the public summary/body fields for a paid publication. The save handler automatically stores the preview as the public body for paid items; the complete text must live in the private PDF.
6. Test using Paystack test credentials first: signed-in buyer → checkout → callback → verified purchase in Admin → Payments → reopen publication → short-lived signed URL. Also test a failed/abandoned payment and confirm it does not grant access.

## Security notes
- Do not paste the full paid article into public metadata or a public PDF URL. Paid full text belongs only in the private Storage bucket.
- Publication checkout rejects unpublished, free, or unpriced items.
- Access is granted only when a successful purchase belongs to the signed-in account.
- Signed URLs expire after five minutes. A buyer can request a fresh one from their account by opening the publication again.
- Payment success is determined by server-side Paystack verification; a browser redirect alone is not proof of payment.
