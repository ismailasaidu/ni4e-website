import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    const url = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!url || !serviceKey) throw new Error('NI4E payment service is not configured.');
    if (!token) throw new Error('Please sign in before registering for an event.');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!anonKey) throw new Error('NI4E authentication is not configured.');
    const authClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user: signedInUser }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !signedInUser) throw new Error('Your session has expired. Please sign in again.');
    if (!paystackKey) throw new Error('Event payment is not configured by NI4E yet. No payment was taken.');
    const admin = createClient(url, serviceKey);
    const body = await req.json();
    const eventId = String(body.event_id || '').trim();
    const fullName = String(body.full_name || '').trim();
    const email = String(signedInUser.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const attendeeCount = Math.min(20, Math.max(1, Number.parseInt(String(body.attendee_count || '1'), 10) || 1));
    if (!eventId || fullName.length < 2 || fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 32) throw new Error('Enter a valid name, email address and phone number.');
    const { data: event, error: eventError } = await admin.from('site_content').select('id,title,metadata,published,content_type').eq('id', eventId).eq('content_type', 'event').eq('published', true).maybeSingle();
    if (eventError || !event) throw new Error('This event is no longer available for registration.');
    const meta = event.metadata || {};
    if (meta.registration_open === false || String(meta.registration_open).toLowerCase() === 'false') throw new Error('Registration for this event is closed.');
    if (!(meta.is_paid === true || String(meta.is_paid).toLowerCase() === 'true')) throw new Error('This event is not configured as a paid event. Refresh the events page and try again.');
    const unitAmount = Number(meta.fee_amount_kobo || 0);
    if (!Number.isSafeInteger(unitAmount) || unitAmount < 100) throw new Error('NI4E has not configured a valid fee for this event. No payment was taken.');
    const amount = unitAmount * attendeeCount;
    if (!Number.isSafeInteger(amount) || amount < 100) throw new Error('The total event fee is invalid. Contact NI4E.');
    let registration: any;
    const { data: existing, error: existingError } = await admin.from('event_registrations').select('*').eq('event_id', eventId).eq('user_id', signedInUser.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing && existing.payment_status === 'success') throw new Error('This email is already registered and paid for this event. Contact NI4E if you need help.');
    if (existing) {
      const { data, error } = await admin.from('event_registrations').update({ event_title: event.title, user_id: signedInUser.id, email, full_name: fullName, phone, attendee_count: attendeeCount, amount_kobo: amount, currency: 'NGN', payment_status: 'pending', status: 'new', updated_at: new Date().toISOString() }).eq('id', existing.id).select('*').single();
      if (error) throw error; registration = data;
    } else {
      const { data, error } = await admin.from('event_registrations').insert({ event_id: eventId, event_title: event.title, user_id: signedInUser.id, full_name: fullName, email, phone, attendee_count: attendeeCount, amount_kobo: amount, currency: 'NGN', payment_status: 'pending', status: 'new' }).select('*').single();
      if (error) { if (error.code === '23505') throw new Error('This email is already registered for the event. Refresh the page or contact NI4E.'); throw error; } registration = data;
    }
    const reference = `NI4E-EVT-${crypto.randomUUID()}`;
    const { error: payInsertError } = await admin.from('event_payments').insert({ registration_id: registration.id, event_id: eventId, event_title: event.title, attendee_email: email, amount_kobo: amount, currency: 'NGN', provider: 'paystack', provider_reference: reference, status: 'pending' });
    if (payInsertError) throw payInsertError;
    const siteUrl = (Deno.env.get('NI4E_SITE_URL') || req.headers.get('origin') || 'http://localhost:5173').replace(/\/$/, '');
    const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${paystackKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount, currency: 'NGN', reference, callback_url: `${siteUrl}/events?event_payment=verify&reference=${encodeURIComponent(reference)}`, metadata: { user_id: signedInUser.id, event_id: eventId, event_title: event.title, registration_id: registration.id, attendee_email: email, attendee_count: attendeeCount, payment_kind: 'ni4e_event' } }) });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await admin.from('event_payments').update({ status: 'failed' }).eq('provider_reference', reference);
      await admin.from('event_registrations').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', registration.id);
      throw new Error(result.message || 'Paystack could not initialize this event payment.');
    }
    await admin.from('event_registrations').update({ payment_reference: reference, updated_at: new Date().toISOString() }).eq('id', registration.id);
    return json({ authorization_url: result.data.authorization_url, reference });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Unable to start event payment.' }, 400); }
});
