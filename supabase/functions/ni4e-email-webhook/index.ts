import { corsHeaders } from '../_shared/cors.ts';
import nodemailer from 'npm:nodemailer@6.9.16';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') throw new Error('Method not allowed');
    const secret = Deno.env.get('NI4E_WEBHOOK_SECRET');
    if (!secret || req.headers.get('x-ni4e-webhook-secret') !== secret) return Response.json({ error: 'Unauthorized webhook' }, { status: 401, headers: corsHeaders });
    const host = Deno.env.get('SMTP_HOST');
    const port = Number(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const from = Deno.env.get('NI4E_EMAIL_FROM') || smtpUser;
    if (!host || !smtpUser || !smtpPass || !from) return Response.json({ queued: false, message: 'SMTP is not configured yet; no email was sent.' }, { status: 202, headers: corsHeaders });
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user: smtpUser, pass: smtpPass } });
    const payload = await req.json();
    const table = String(payload.table || '');
    const event = String(payload.type || payload.eventType || '').toUpperCase();
    const row = payload.record || payload.new || {};
    const old = payload.old_record || payload.old || {};
    let to = String(row.email || '');
    let subject = 'NI4E membership update';
    let heading = 'Membership update';
    let message = 'Your NI4E membership record has been updated.';
    let action = '';
    if (table === 'membership_applications') {
      const category = esc(row.category || 'membership');
      const name = esc(row.full_name || 'Applicant');
      const status = String(row.status || 'pending');
      if (event === 'INSERT') {
        subject = 'NI4E has received your membership application'; heading = 'Application received';
        message = `Dear ${name}, we have received your application for ${category}. Please wait for NI4E approval before making payment. The official review timeline is communicated by NI4E.`;
      } else if (status !== String(old.status || '')) {
        if (status === 'approved') { subject = 'Your NI4E membership application is approved'; heading = 'Application approved'; message = `Dear ${name}, your application for ${category} has been approved. Please sign in and open the Membership Payment page to pay the official fee shown there. Do not pay using unofficial links.`; action = `${Deno.env.get('NI4E_SITE_URL') || ''}/membership/payment`; }
        else if (status === 'rejected') { subject = 'Update on your NI4E membership application'; heading = 'Application decision'; message = `Dear ${name}, NI4E has not approved your application for ${category} at this time. Please sign in or contact NI4E for the recorded decision and next steps.`; }
        else if (status === 'under_review') { subject = 'Your NI4E application is under review'; heading = 'Application under review'; message = `Dear ${name}, your application is currently under review. We will notify you when the review decision is recorded.`; }
      } else { return Response.json({ skipped: true }, { headers: corsHeaders }); }
    } else if (table === 'membership_payments') {
      if (String(row.status) !== 'success' || String(old.status) === 'success') return Response.json({ skipped: true }, { headers: corsHeaders });
      to = String(row.email || payload.email || '');
      if (!to) return Response.json({ skipped: true, message: 'Payment webhook needs an email field or a server-side user lookup.' }, { headers: corsHeaders });
      subject = 'NI4E membership payment confirmed'; heading = 'Payment confirmed';
      message = `Your payment for ${esc(row.category || 'membership')} has been verified. Transaction reference: ${esc(row.provider_reference || 'See your payment history')}.`;
    } else if (table === 'event_registrations') {
      if (event !== 'INSERT' || String(row.payment_status || 'not_required') !== 'not_required') return Response.json({ skipped: true }, { headers: corsHeaders });
      to = String(row.email || '');
      if (!to) return Response.json({ skipped: true, message: 'Event registration has no attendee email.' }, { headers: corsHeaders });
      subject = 'NI4E event registration received'; heading = 'Registration received';
      message = `Your registration for ${esc(row.event_title || 'the NI4E event')} has been received. Please keep this email address available for any event updates from NI4E.`;
      action = `${Deno.env.get('NI4E_SITE_URL') || ''}/events`;
    } else if (table === 'event_payments') {
      if (String(row.status) !== 'success' || String(old.status) === 'success') return Response.json({ skipped: true }, { headers: corsHeaders });
      to = String(row.email || row.attendee_email || payload.email || '');
      if (!to) return Response.json({ skipped: true, message: 'Event payment has no attendee email.' }, { headers: corsHeaders });
      subject = 'NI4E event registration and payment confirmed'; heading = 'Event registration confirmed';
      message = `Your payment for ${esc(row.event_title || 'the NI4E event')} has been verified. Your registration is confirmed. Reference: ${esc(row.provider_reference || 'See your registration record')}.`;
      action = `${Deno.env.get('NI4E_SITE_URL') || ''}/events`;
    } else return Response.json({ skipped: true, message: 'Unsupported table' }, { headers: corsHeaders });
    if (!to.includes('@')) return Response.json({ skipped: true, message: 'No recipient email in webhook record' }, { headers: corsHeaders });
    const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#18313b"><div style="background:#075a48;color:white;padding:24px"><strong>NI4E</strong><div style="font-size:12px;margin-top:6px">The Nigerian Institution of Energy, Electrical &amp; Electronics Engineers</div></div><div style="padding:28px"><h1 style="font-size:24px">${esc(heading)}</h1><p style="line-height:1.7">${message}</p>${action ? `<p><a style="display:inline-block;background:#d2b56f;color:#172f38;padding:12px 18px;text-decoration:none" href="${esc(action)}">${table === 'event_registrations' || table === 'event_payments' ? 'View event details' : 'Open membership payment'}</a></p>` : ''}<p style="color:#68777d;font-size:12px;margin-top:28px">This is an automated NI4E notification. Please do not reply to this email.</p></div></div>`;
    const result = await transporter.sendMail({ from, to, subject, html });
    const adminEmail = Deno.env.get('NI4E_ADMIN_EMAIL');
    if (((table === 'membership_applications' && event === 'INSERT') || (table === 'event_registrations' && event === 'INSERT' && String(row.payment_status || 'not_required') === 'not_required') || (table === 'event_payments' && String(row.status) === 'success' && String(old.status) !== 'success')) && adminEmail && adminEmail.includes('@')) {
      await transporter.sendMail({ from, to: adminEmail, subject: table === 'event_payments' ? 'NI4E event payment verified' : table === 'event_registrations' ? 'New NI4E event registration' : 'New NI4E membership application received', html: table === 'event_payments' ? `<p>A paid event registration has been verified.</p><p>Event: ${esc(row.event_title || '')}</p><p>Attendee: ${esc(row.attendee_email || row.email || '')}</p><p>Reference: ${esc(row.provider_reference || '')}</p><p>Review it in the NI4E admin dashboard.</p>` : table === 'event_registrations' ? `<p>A new free event registration has been received.</p><p>Event: ${esc(row.event_title || '')}</p><p>Attendee: ${esc(row.full_name || '')}</p><p>Email: ${esc(row.email || '')}</p><p>Review it in Admin → Event Registrations.</p>` : `<p>A new ${esc(row.application_type || 'new')} membership application has been submitted.</p><p>Applicant: ${esc(row.full_name || '')}</p><p>Category: ${esc(row.category || '')}</p><p>Application ID: ${esc(row.id || '')}</p><p>Please review it in the NI4E admin dashboard.</p>` });
    }
    return Response.json({ sent: true, messageId: result.messageId }, { headers: corsHeaders });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Email notification failed' }, { status: 400, headers: corsHeaders }); }
});
