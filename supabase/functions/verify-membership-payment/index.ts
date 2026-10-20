import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let providerVerified = false;
  let verifiedReference = '';
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
    const successful = result.data.status === 'success' && String(result.data.reference || '') === reference && Number(result.data.amount) === Number(payment.amount_kobo) && result.data.currency === String(payment.currency || 'NGN');
    providerVerified = successful;
    verifiedReference = reference;
    const status = payment.status === 'success' ? 'success' : successful ? 'success' : (result.data.status === 'abandoned' ? 'abandoned' : 'failed');
    const { error: updateError } = await admin.from('membership_payments').update({ status, paid_at: status === 'success' ? (payment.paid_at || new Date().toISOString()) : null }).eq('id', payment.id);
    if (updateError) throw updateError;
    let activated = false;
    if (successful && payment.application_id) {
      const { data: app } = await admin.from('membership_applications').select('id,user_id,category,status,application_type').eq('id', payment.application_id).maybeSingle();
      if (app?.user_id === user.id && ['approved','active'].includes(app.status)) {
        // Annual renewal basis is admin-configured; never infer a renewal period from the browser.
        const { data: renewalSetting, error: renewalSettingError } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'ni4e_renewal_basis').maybeSingle();
        if (renewalSettingError) throw renewalSettingError;
        const renewalBasis = typeof renewalSetting?.setting_value === 'string' ? renewalSetting.setting_value : renewalSetting?.setting_value == null ? 'not_configured' : String(renewalSetting.setting_value).replace(/^\"|\"$/g, '');
        const isRenewal = app.application_type === 'renewal';
        const isUpgrade = app.application_type === 'upgrade';
        if (isRenewal && renewalBasis !== 'anniversary') throw new Error('Payment was verified, but NI4E has not configured the annual renewal date calculation. Contact the Secretariat with your payment reference before membership dates are updated.');
        const { data: profileRow, error: profileLookupError } = await admin.from('profiles').select('membership_activated_at,membership_expires_at').eq('id', user.id).maybeSingle();
        if (profileLookupError) throw profileLookupError;
        const now = new Date();
        const existingExpiry = profileRow?.membership_expires_at ? new Date(profileRow.membership_expires_at) : null;
        const expiryBase = isRenewal && existingExpiry && existingExpiry > now ? existingExpiry : now;
        const newExpiry = new Date(expiryBase); newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        // Annual expiry is written only when NI4E has explicitly selected the anniversary policy. Initial payment can activate the member even if that policy is still awaiting configuration.
        const profileUpdate: { membership_status: string; membership_category: string; updated_at: string; membership_expires_at?: string; membership_activated_at?: string } = { membership_status: 'active', membership_category: app.category, updated_at: now.toISOString() };
        if (renewalBasis === 'anniversary') profileUpdate.membership_expires_at = (isUpgrade && existingExpiry ? existingExpiry : newExpiry).toISOString();
        if (!isRenewal && !profileRow?.membership_activated_at) profileUpdate.membership_activated_at = now.toISOString();
        // Do not invent an official membership number. NI4E assigns the approved number in Admin → Members.
        const { error: profileError } = await admin.from('profiles').update(profileUpdate).eq('id', user.id);
        if (profileError) throw profileError;
        // Keep the application tracker aligned with the verified payment record. This is server-side only.
        const { error: applicationUpdateError } = await admin.from('membership_applications').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', app.id).eq('user_id', user.id);
        if (applicationUpdateError) throw applicationUpdateError;
        // Certificate generation is optional and must never turn a confirmed charge into a failed checkout.
        // Some deployments have not applied the demo-certificate table migration yet.
        const { data: existingCert, error: certLookupError } = await admin.from('membership_demo_certificates').select('id').eq('user_id', user.id).eq('application_id', app.id).maybeSingle();
        const certTableMissing = Boolean(certLookupError && /does not exist|schema cache|could not find the table|relation .* does not exist/i.test(certLookupError.message || ''));
        if (!certLookupError && !existingCert) {
          const { error: certError } = await admin.from('membership_demo_certificates').insert({ user_id: user.id, application_id: app.id, category: app.category, demo_only: true });
          if (certError && !/does not exist|schema cache|could not find the table|relation .* does not exist/i.test(certError.message || '')) console.error('Optional demo certificate could not be created:', certError.message);
        } else if (certLookupError && !certTableMissing) {
          console.error('Optional demo certificate lookup failed:', certLookupError.message);
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
  } catch (e) {
    // The provider's confirmed success is authoritative for payment status. If a later membership
    // sync step fails, return a successful verification result with a clear follow-up state rather
    // than showing a generic non-2xx error that could prompt the member to pay twice.
    if (providerVerified) {
      console.error('Payment verified; membership sync needs follow-up:', verifiedReference, e?.message || e);
      return Response.json({ status: 'success', verified: true, activated: false, reference: verifiedReference, syncPending: true, message: 'Your payment was verified successfully. Your membership record is still being updated. Please do not pay again; refresh your membership status shortly or contact the Secretariat with your payment reference if it remains unchanged.' }, { status: 200, headers: corsHeaders });
    }
    return Response.json({ error: e.message || 'Unable to verify payment.' }, { status: 400, headers: corsHeaders });
  }
});
