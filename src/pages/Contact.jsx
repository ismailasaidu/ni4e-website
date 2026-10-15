import React, { useState } from 'react';
import { ArrowRight, Mail, Phone, MapPin, Send, MessageSquare, Clock3 } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';
import { supabase, supabaseConfigured } from '../firebase/config';

export default function Contact({ setPage }) {
  useReveal();
  const [form, setForm] = useState({ full_name: '', email: '', subject: 'General enquiry', message: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setNotice(null);
    try {
      if (!supabaseConfigured || !supabase) throw new Error('The contact form is not connected yet. Please try again later.');
      const { error } = await supabase.from('contact_enquiries').insert({
        full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(),
        subject: form.subject.trim(), message: form.message.trim(), status: 'new'
      });
      if (error) throw error;
      setNotice({ type: 'success', text: 'Your enquiry has been sent to NI4E. Thank you for getting in touch.' });
      setForm({ full_name: '', email: '', subject: 'General enquiry', message: '' });
    } catch (error) { setNotice({ type: 'error', text: error.message || 'Your message could not be sent. Please try again.' }); }
    finally { setBusy(false); }
  };
  return <>
    <PageHero title="Contact NI4E" crumb="Contact" desc="Contact the Nigerian Institution of Energy, Electrical & Electronics Engineers for membership enquiries, institutional information, events, publications and professional collaboration." />
    <section className="section contactPage">
      <div className="contactIntroBlock"><span className="kicker">WE'RE HERE TO HELP</span><h2>How can we help you?</h2><p>Send an enquiry to the Institution. Choose a subject so your message can be directed to the appropriate team. Public information on this website remains available without signing in.</p></div>
      <div className="contactLayout">
        <div className="contactInfoStack">
          <article className="contactInfoCard"><span className="contactInfoIcon"><Mail size={22}/></span><div><h3>Email enquiries</h3><p>Use the contact form to send a message to the appropriate NI4E team.</p></div></article>
          <article className="contactInfoCard"><span className="contactInfoIcon"><MessageSquare size={22}/></span><div><h3>Membership support</h3><p>For application progress, sign in to your account and open Application Status & Payments.</p><button className="textbtn" onClick={()=>setPage?.('login')}>Sign in to track an application <ArrowRight size={16}/></button></div></article>
          <article className="contactInfoCard"><span className="contactInfoIcon"><Clock3 size={22}/></span><div><h3>What happens next?</h3><p>Your enquiry is recorded for the authorised team to review. Please include enough detail for the team to understand your request.</p></div></article>
          <p className="contactNote">Official telephone numbers, postal address and direct email contacts should be added here once confirmed by NI4E.</p>
        </div>
        <form className="contactFormCard" onSubmit={submit}>
          <div className="contactFormHeading"><span className="kicker">SEND AN ENQUIRY</span><h2>Write to the Institution</h2><p>Fields marked * are required.</p></div>
          <label>Full name *<input required autoComplete="name" value={form.full_name} onChange={e=>update('full_name',e.target.value)} maxLength={160} placeholder="Your full name"/></label>
          <label>Email address *<input required type="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} maxLength={254} placeholder="you@example.com"/></label>
          <label>Enquiry subject *<select required value={form.subject} onChange={e=>update('subject',e.target.value)}><option>General enquiry</option><option>Membership and applications</option><option>Events and conference</option><option>Publications and technical resources</option><option>Chapters and technical divisions</option><option>Partnership and collaboration</option><option>Website support</option></select></label>
          <label>Message *<textarea required value={form.message} onChange={e=>update('message',e.target.value)} rows={6} maxLength={5000} placeholder="Tell us how we can help…"/></label>
          {notice && <p className={`contactFormNotice ${notice.type}`} role="status">{notice.text}</p>}
          <button className="darkbtn contactSubmit" disabled={busy}>{busy?'Sending enquiry…':'Send enquiry'} <Send size={17}/></button>
          <small>Your details will be used to respond to this enquiry and handled according to the Institution's applicable privacy practices.</small>
        </form>
      </div>
    </section>
  </>;
}
