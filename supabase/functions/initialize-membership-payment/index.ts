import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') throw new Error('Method not allowed');
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('Please sign in before paying.');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) throw new Error('Payment provider is not configured by NI4E yet. No payment was taken.');
    const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) throw new Error('Your session has expired. Please sign in again.');
    const admin = createClient(url, serviceKey);
    const body = await req.json();
    const applicationId = String(body.application_id || '');
    if (!applicationId) throw new Error('An approved application is required before payment.');
    const { data: app, error: appLookupError } = await admin.from('membership_applications').select('id,user_id,category,status,application_type').eq('id', applicationId).eq('user_id', user.id).maybeSingle();
    if (appLookupError || !app || app.status !== 'approved') throw new Error('Your application must be approved by NI4E before payment.');
    const category = String(app.category || body.category || user.user_metadata?.membership_category || 'Corporate Member');
    const { data: renewalSetting, error: renewalSettingError } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'ni4e_renewal_basis').maybeSingle();
    if (renewalSettingError) throw renewalSettingError;
    const renewalBasis = typeof renewalSetting?.setting_value === 'string' ? renewalSetting.setting_value : renewalSetting?.setting_value == null ? 'not_configured' : String(renewalSetting.setting_value).replace(/^"|"$/g, '');
    const isRenewal = app.application_type === 'renewal';
    if (isRenewal && renewalBasis !== 'anniversary') throw new Error('NI4E must configure the annual renewal date calculation in Admin → Membership Policies before renewal payment can begin. No payment was taken.');
    const { data: fee, error: feeError } = await admin.from('membership_fee_schedule').select('category,amount_kobo,upgrade_amount_kobo,renewal_amount_kobo,currency').eq('category', category).eq('active', true).maybeSingle();
    if (feeError) throw feeError;
    const payableAmount = app.application_type === 'upgrade' ? fee?.upgrade_amount_kobo : isRenewal ? fee?.renewal_amount_kobo : fee?.amount_kobo;
    if (!payableAmount || payableAmount < 1) throw new Error(app.application_type === 'upgrade' ? 'NI4E has not configured the approved upgrade fee for this category yet.' : isRenewal ? 'NI4E has not configured an approved annual renewal fee for this category.' : 'NI4E has not configured an approved fee for this membership category.');
    const reference = `NI4E-${crypto.randomUUID()}`;
    const { error: insertError } = await admin.from('membership_payments').insert({ user_id: user.id, application_id: app.id, payment_type: app.application_type === 'upgrade' ? 'upgrade' : (app.application_type === 'renewal' ? 'renewal' : 'membership'), category: fee.category, amount_kobo: payableAmount, currency: 'NGN', provider: 'paystack', provider_reference: reference, status: 'pending' });
    if (insertError) throw insertError;
    const siteUrl = Deno.env.get('NI4E_SITE_URL') || req.headers.get('origin') || 'http://localhost:5173';
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST', headers: { Authorization: `Bearer ${paystackKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: payableAmount, reference, callback_url: `${siteUrl.replace(/\/$/, '')}/membership/payment?payment=verify&reference=${encodeURIComponent(reference)}`, metadata: { user_id: user.id, application_id: app.id, category: fee.category } })
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await admin.from('membership_payments').update({ status: 'failed' }).eq('provider_reference', reference);
      throw new Error(result.message || 'Paystack could not initialize this payment.');
    }
    return Response.json({ authorization_url: result.data.authorization_url, reference }, { headers: corsHeaders });
  } catch (e) { return Response.json({ error: e.message || 'Unable to start payment.' }, { status: 400, headers: corsHeaders }); }
});
