import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') throw new Error('Method not allowed');
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const body = await req.json(); const reference = String(body.reference || '');
    if (!token || !reference) throw new Error('Sign in and provide the payment reference.');
    const url = Deno.env.get('SUPABASE_URL')!; const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) throw new Error('Payment provider is not configured.');
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) throw new Error('Your session has expired. Please sign in again.');
    const admin = createClient(url, serviceKey);
    const { data: payment, error: paymentError } = await admin.from('membership_payments').select('*').eq('provider_reference', reference).eq('user_id', user.id).maybeSingle();
    if (paymentError || !payment) throw new Error('Payment record was not found for this account.');
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${paystackKey}` } });
    const result = await verifyResponse.json();
    if (!verifyResponse.ok || !result.status || !result.data) throw new Error('The payment provider could not verify this transaction.');
    const successful = result.data.status === 'success' && Number(result.data.amount) === Number(payment.amount_kobo) && result.data.currency === 'NGN';
    const status = successful ? 'success' : (result.data.status === 'abandoned' ? 'abandoned' : 'failed');
    const { error: updateError } = await admin.from('membership_payments').update({ status, paid_at: successful ? new Date().toISOString() : null }).eq('id', payment.id);
    if (updateError) throw updateError;
    let activated = false;
    if (successful && payment.application_id) {
      const { data: app } = await admin.from('membership_applications').select('id,user_id,category,status,application_type').eq('id', payment.application_id).maybeSingle();
      if (app?.user_id === user.id && ['approved','active'].includes(app.status)) {
        const demoNumber = `DEMO-${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
        const { error: profileError } = await admin.from('profiles').update({ membership_status: 'active', membership_category: app.category, membership_number: demoNumber, membership_activated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', user.id);
        if (profileError) throw profileError;
        // Keep the application tracker aligned with the verified payment record. This is server-side only.
        const { error: applicationUpdateError } = await admin.from('membership_applications').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', app.id).eq('user_id', user.id);
        if (applicationUpdateError) throw applicationUpdateError;
        const { data: existingCert } = await admin.from('membership_demo_certificates').select('id').eq('user_id', user.id).eq('application_id', app.id).maybeSingle();
        if (!existingCert) {
          const { error: certError } = await admin.from('membership_demo_certificates').insert({ user_id: user.id, application_id: app.id, category: app.category, demo_only: true });
          if (certError && !String(certError.message || '').includes('does not exist')) throw certError;
        }
        activated = true;
      }
      const webhookSecret = Deno.env.get('NI4E_WEBHOOK_SECRET');
      if (successful && webhookSecret) {
        const baseUrl = Deno.env.get('SUPABASE_URL')!;
        await fetch(`${baseUrl}/functions/v1/ni4e-email-webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ni4e-webhook-secret': webhookSecret }, body: JSON.stringify({ type: 'UPDATE', table: 'membership_payments', record: { ...payment, status: 'success', email: user.email, category: app?.category || payment.category, provider_reference: reference, activated }, old_record: { ...payment, status: 'pending' } }) });
      }
    }
    return Response.json({ status, verified: successful, activated, message: successful ? (activated ? 'Payment verified and membership activated.' : 'Payment verified. NI4E still needs to approve the application before activation.') : 'Payment was not confirmed as successful.' }, { headers: corsHeaders });
  } catch (e) { return Response.json({ error: e.message || 'Unable to verify payment.' }, { status: 400, headers: corsHeaders }); }
});
