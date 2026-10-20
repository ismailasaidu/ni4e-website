import React, { useState } from 'react';
import { ArrowRight, Mail, Phone, MapPin, Send, MessageSquare, Clock3, ShieldCheck, Users, CalendarDays, BookOpen, CircleHelp, CheckCircle2 } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';
import { supabase, supabaseConfigured } from '../firebase/config';

const subjects = ['General enquiry','Membership and applications','Events and conference','Publications and technical resources','Chapters and technical divisions','Partnership and collaboration','Website support'];
const helpRoutes = [
  { icon: Users, title: 'Membership & applications', text: 'Questions about eligibility, application progress or member access.', action: 'Open membership', page: 'membership' },
  { icon: CalendarDays, title: 'Events & training', text: 'Questions about conferences, workshops, CPD or event registration.', action: 'Explore events', page: 'events' },
  { icon: BookOpen, title: 'Publications & resources', text: 'Help finding technical papers, publications or institutional documents.', action: 'Browse publications', page: 'publications' }
];
export default function Contact({ setPage }) {
  useReveal();
  const [form, setForm] = useState({ full_name: '', email: '', subject: 'General enquiry', message: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice(null);
    try {
      if (!supabaseConfigured || !supabase) {
        setNotice({ type: 'error', text: 'Your message could not be submitted right now. Please try again shortly or contact the NI4E Secretariat directly.' });
        return;
      }
      const { error } = await supabase.from('contact_enquiries').insert({
        full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(),
        subject: form.subject.trim(), message: form.message.trim(), status: 'new'
      });
      if (error) throw error;
      setNotice({ type: 'success', text: 'Your enquiry has been submitted successfully. Please keep an eye on the email address you provided for a response.' });
      setForm({ full_name: '', email: '', subject: 'General enquiry', message: '' });
    } catch (error) {
      const message = /contact_enquiries|relation .* does not exist|PGRST205/i.test(`${error.message || ''} ${error.code || ''}`)
        ? 'The contact form could not save this message because the enquiries table is unavailable in the connected database. Please contact the site administrator to check the contact-enquiry table and permissions.'
        : (error.message || 'Your message could not be submitted. Please check your connection and try again.');
      setNotice({ type: 'error', text: message });
    } finally { setBusy(false); }
  };
  return <>
    <PageHero title="Contact NI4E" crumb="Contact" desc="Get help with membership, events, technical resources or institutional enquiries. Choose the route that best matches your question, or send the team a message." />
    <section className="section contactPage contactPageFull">
      <div className="contactIntroBlock"><span className="kicker">CONTACT & SUPPORT</span><h2>Let's get your enquiry to the right place.</h2><p>Use the quick routes below for common needs, or send a detailed message using the form. Please do not include passwords, payment card details or other sensitive information.</p></div>
      <div className="contactQuickRoutes">{helpRoutes.map(({icon:Icon,title,text,action,page})=><article key={title}><span className="contactQuickIcon"><Icon size={23}/></span><h3>{title}</h3><p>{text}</p><button className="textbtn" onClick={()=>setPage?.(page)}>{action}<ArrowRight size={16}/></button></article>)}</div>
      <div className="contactLayout">
        <div className="contactInfoStack">
          <div className="contactSupportHeader"><span className="kicker">HOW TO REACH US</span><h2>Contact and enquiry support</h2><p>Official phone numbers, postal address and direct email contacts should be added here after NI4E confirms the approved details. Until then, the form is the central enquiry route.</p></div>
          <article className="contactInfoCard"><span className="contactInfoIcon"><Mail size={22}/></span><div><h3>Send an enquiry</h3><p>Choose a subject and include enough detail for the authorised team to understand your request.</p></div></article>
          <article className="contactInfoCard"><span className="contactInfoIcon"><MessageSquare size={22}/></span><div><h3>Track membership support</h3><p>If you already have an account, sign in to check your application status and related payment information.</p><button className="textbtn" onClick={()=>setPage?.('login')}>Sign in to your account <ArrowRight size={16}/></button></div></article>
          <article className="contactInfoCard"><span className="contactInfoIcon"><Clock3 size={22}/></span><div><h3>What happens after submission?</h3><p>Your message should be reviewed by an authorised team member. A response timeframe will be published here once NI4E confirms its service standard.</p></div></article>
          <div className="contactResponseSteps"><h3><CheckCircle2 size={19}/> A clear enquiry process</h3><ol><li><b>Choose a subject</b><span>This helps identify the type of support you need.</span></li><li><b>Describe the request</b><span>Include relevant reference numbers only where appropriate—never passwords or card details.</span></li><li><b>Submit and retain your copy</b><span>Wait for the on-screen result and keep a note of your enquiry.</span></li></ol></div>
          <div className="contactPrivacyNote"><ShieldCheck size={20}/><p><b>Privacy reminder</b><br/>Your details should be used only to handle the enquiry and managed under NI4E's approved privacy and data-retention policy. The final policy link should be added before launch.</p></div>
        </div>
        <form className="contactFormCard" onSubmit={submit}>
          <div className="contactFormHeading"><span className="kicker">SEND AN ENQUIRY</span><h2>Write to the Institution</h2><p>All fields are required so the team has enough context to respond.</p></div>
          <label>Full name *<input required autoComplete="name" value={form.full_name} onChange={e=>update('full_name',e.target.value)} maxLength={160} placeholder="Your full name"/></label>
          <label>Email address *<input required type="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} maxLength={254} placeholder="you@example.com"/></label>
          <label>Enquiry subject *<select required value={form.subject} onChange={e=>update('subject',e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Message *<textarea required value={form.message} onChange={e=>update('message',e.target.value)} rows={7} minLength={10} maxLength={5000} placeholder="Tell us what you need help with…"/><small className="contactCharacterCount">{form.message.length}/5000 characters · Minimum 10 characters</small></label>
          {notice && <p className={`contactFormNotice ${notice.type}`} role="status">{notice.text}</p>}
          <button className="darkbtn contactSubmit" disabled={busy}>{busy?'Sending enquiry…':'Submit enquiry'} <Send size={17}/></button>
          <small>Submitting this form does not guarantee an immediate response. Please do not submit confidential technical, financial or authentication information.</small>
        </form>
      </div>
      <div className="contactFaq"><div><span className="kicker">BEFORE YOU WRITE</span><h2>Common questions</h2><p>These quick answers help visitors find the right part of the website first.</p></div><div className="contactFaqList"><details><summary><CircleHelp size={18}/> How do I follow up on a membership application?</summary><p>Sign in and open the membership application/status area. If you cannot access your account, choose “Membership and applications” in the enquiry form.</p></details><details><summary><CircleHelp size={18}/> Where can I find event information?</summary><p>Visit Events & Conferences to search the available programme. Each event page should show dates, venue, programme details and the applicable registration route.</p></details><details><summary><CircleHelp size={18}/> Can I submit a technical resource or collaboration proposal?</summary><p>Yes. Choose “Publications and technical resources” or “Partnership and collaboration” and explain the proposal and the best way to follow up.</p></details></div></div>
    </section>
  </>;
}
