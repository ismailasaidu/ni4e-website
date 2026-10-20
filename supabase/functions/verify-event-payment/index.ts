import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    const url = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!url || !serviceKey || !paystackKey) throw new Error('NI4E event verification is not configured.');
    const { reference } = await req.json(); const ref = String(reference || '').trim();
    if (!/^NI4E-EVT-[0-9a-f-]{36}$/i.test(ref)) throw new Error('Invalid event payment reference.');
    const admin = createClient(url, serviceKey);
    const { data: payment, error: paymentError } = await admin.from('event_payments').select('*').eq('provider_reference', ref).maybeSingle();
    if (paymentError || !payment) throw new Error('Event payment record was not found.');
    if (payment.status === 'success') {
      await admin.from('event_registrations').update({ payment_status: 'success', status: 'confirmed', paid_at: payment.paid_at || new Date().toISOString(), payment_reference: ref, updated_at: new Date().toISOString() }).eq('id', payment.registration_id);
      return json({ verified: true, status: 'success', message: 'Your event payment has already been verified.' });
    }
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data) throw new Error('Paystack could not verify this transaction yet.');
    const transaction = result.data;
    const success = transaction.status === 'success' && Number(transaction.amount) === Number(payment.amount_kobo) && transaction.currency === payment.currency && String(transaction.reference) === ref;
    const status = success ? 'success' : transaction.status === 'abandoned' ? 'abandoned' : 'failed';
    const { error: updatePaymentError } = await admin.from('event_payments').update({ status, provider_transaction_id: transaction.id ? String(transaction.id) : null, paid_at: success ? new Date().toISOString() : null }).eq('id', payment.id);
    if (updatePaymentError) throw updatePaymentError;
    const { error: updateRegistrationError } = await admin.from('event_registrations').update({ payment_status: status, status: success ? 'confirmed' : 'new', paid_at: success ? new Date().toISOString() : null, payment_reference: ref, updated_at: new Date().toISOString() }).eq('id', payment.registration_id);
    if (updateRegistrationError) throw updateRegistrationError;
    const webhookSecret = Deno.env.get('NI4E_WEBHOOK_SECRET');
    if (success && webhookSecret) {
      await fetch(`${url}/functions/v1/ni4e-email-webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ni4e-webhook-secret': webhookSecret }, body: JSON.stringify({ type: 'UPDATE', table: 'event_payments', record: { ...payment, status: 'success', email: payment.attendee_email, event_title: payment.event_title, provider_reference: ref }, old_record: { ...payment, status: 'pending' } }) });
    }
    return json({ verified: success, status, message: success ? 'Event payment verified. Your registration is confirmed.' : status === 'abandoned' ? 'Payment was not completed. You can return to the event page to try again.' : 'Payment was not confirmed as successful. If money was deducted, contact NI4E with your reference.' });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Unable to verify event payment.' }, 400); }
});
