import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Users, Award, Building2, ShieldCheck, CheckCircle2, BriefcaseBusiness, GraduationCap} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';

export default function Membership({setPage}){
 useReveal();
 const [active,setActive]=useState('Corporate Member');
 const [openFaq,setOpenFaq]=useState(0);
 const cats=[
  ['Student Member','For students in recognised institutions.',GraduationCap,'Build your professional network while developing your academic and technical foundation.'],
  ['Graduate Member','For graduates beginning their professional journey.',Award,'Transition from academic training into professional engineering practice.'],
  ['Corporate Member','For established professionals and engineering practitioners.',Building2,'Build professional standing, participate in NI4E activities and stay connected to the engineering community.'],
  ['Associate Member','For eligible professionals seeking associate membership.',BriefcaseBusiness,'Develop professional connections and participate in the Institution’s activities.'],
  ['Life Member','For members eligible for Life Membership.',ShieldCheck,'Maintain a long-term connection with the Institution and its professional community.']
 ];
 const activeCat=cats.find(x=>x[0]===active)||cats[2];
 const ActiveIcon=activeCat[2];
 const benefits=['Professional membership profile','Access to Institution events and forums','Technical publications and resources','Professional networking opportunities','Digital membership documentation','Membership record updates and renewal'];
 const faqs=[
  ['Who can use the membership application?','The membership form supports new applications, updates to existing member information, and renewal or correction of membership records.'],
  ['Which membership categories are available?','The membership form lists Student, Graduate, Corporate, Associate and Life Member categories. Direct Fellowship is handled through a separate Fellowship application.'],
  ['What information is required?','The membership form captures personal information, contact information, educational information, professional information, NSE membership profile, membership category, resume upload and a declaration.'],
  ['Can I update an existing membership record?','Yes. The supplied NI4E Membership Application & Update Form is expressly intended for updating or correcting existing membership records.']
 ];
 return <>
  <PageHero title="Membership" crumb="Membership" desc="Membership services for The Nigerian Institution of Energy, Electrical & Electronics Engineers (NI4E), a Division of the Nigerian Society of Engineers (NSE)."/>
  <section className="section membershipIntro reveal">
   <div className="membershipIntroCopy">
    <span className="kicker">NI4E MEMBERSHIP</span>
    <h2>Join the Institution. Build your professional journey.</h2>
    <p>The Nigerian Institution of Energy, Electrical & Electronics Engineers (NI4E), a Division of the Nigerian Society of Engineers (NSE).</p>
    <p>The membership experience is structured around the Institution’s application and membership-update requirements, with a guided online process for personal, educational, professional and membership information.</p>
    <div className="membershipTrust"><span><ShieldCheck size={15}/> Secure application flow</span><span><CheckCircle2 size={15}/> Application tracking</span><span><Users size={15}/> Professional community</span></div>
   </div>
   <div className="membershipPreview">
    <div className="previewTop"><span>MEMBERSHIP SERVICES</span><span className="activeTag">ONLINE</span></div>
    <div className="previewIcon"><ActiveIcon size={25}/></div>
    <span className="tag">{active}</span><h3>{activeCat[1]}</h3><p>{activeCat[3]}</p>
    <button className="gold wide" onClick={()=>setPage('register')}>Start Membership Application <ArrowRight size={16}/></button>
   </div>
  </section>

  <section className="section reveal">
   <div className="sectionHead"><div><span className="kicker">MEMBERSHIP CATEGORIES</span><h2>Choose your membership category.</h2></div><span className="muted">Select a category to preview its pathway</span></div>
   <div className="catGrid enhancedCats">
    {cats.map(([t,p,I,sub],i)=><article className={`cat ${active===t?'selected':''}`} key={t} onClick={()=>setActive(t)} tabIndex="0" onKeyDown={e=>e.key==='Enter'&&setActive(t)}>
      <div className="catTop"><div className="catIcon"><I size={21}/></div><span className="catNo">0{i+1}</span></div>
      <h3>{t}</h3><p>{p}</p><small>{sub}</small>
      <button onClick={e=>{e.stopPropagation();setPage('register')}}>Apply / Update <ArrowRight size={15}/></button>
    </article>)}
   </div>
  </section>

  <section className="section membershipDetail reveal">
   <div className="detailPanel">
    <span className="kicker">{active.toUpperCase()}</span><h2>{activeCat[1]}</h2>
    <p>{activeCat[3]}</p>
    <div className="detailGrid">
      <div><b>Personal Information</b><span>Identity and contact details</span></div>
      <div><b>Education</b><span>Qualifications and institutions</span></div>
      <div><b>Professional</b><span>Employer, role and specialization</span></div>
      <div><b>NSE Profile</b><span>Membership and professional details</span></div>
    </div>
    <button className="darkbtn" onClick={()=>setPage('register')}>Apply for {active} <ArrowRight size={16}/></button>
   </div>
   <div className="benefitsPanel"><span className="kicker">MEMBER SERVICES</span><h3>One connected membership experience.</h3>{benefits.map(x=><span key={x}><CheckCircle2 size={16}/>{x}</span>)}</div>
  </section>

  <section className="section fellowshipCallout reveal">
   <div className="fellowshipIcon"><ShieldCheck size={28}/></div>
   <div><span className="kicker">DIRECT FELLOWSHIP</span><h2>Apply for the Grade of Fellow (FNI4E).</h2><p>The supplied Direct Fellowship Application describes Fellowship as the highest category of membership and requires professional achievement, leadership, contributions, referees and supporting evidence.</p></div>
   <button className="gold" onClick={()=>setPage('fellowship')}>Fellowship Application <ArrowRight size={17}/></button>
  </section>

  <section className="section membershipSteps reveal"><div><span className="kicker">APPLICATION JOURNEY</span><h2>A clear path from application to membership.</h2><p className="muted">The online flow follows the information structure in the supplied NI4E Membership Application & Update Form.</p></div><div className="stepsVisual advancedSteps">{[['01','Personal & Contact','Identity + contact details'],['02','Education','Qualifications + institutions'],['03','Professional','Employer + specialization'],['04','Membership','Category + NSE profile'],['05','Documents','Resume + declaration']].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><small>{x[2]}</small></div>)}</div></section>

  <section className="section reveal credentialSection"><div className="credentialIntro"><span className="kicker">DIGITAL MEMBERSHIP CREDENTIAL</span><h2>Membership documentation, ready for the member portal.</h2><p>The production platform will give approved members access to their membership documentation and certificate area. The official certificate artwork and wording should be supplied or approved by NI4E before publication.</p></div><div className="credentialPreview"><div className="credentialRibbon">NI4E</div><div className="credentialSeal"><img src={logo}/></div><span className="kicker">MEMBERSHIP CERTIFICATE</span><h3>Certificate of Membership</h3><p>This preview shows the intended digital certificate experience. Official certificate design, signatories, membership number and validity details will be populated from approved member records.</p><div className="credentialLines"><span>Member Name</span><b>Approved Member</b><span>Membership Category</span><b>Corporate / Graduate / Associate / Student / Life</b></div><div className="credentialFooter"><span>NI4E</span><span>Digital Member Record</span></div></div></section>

  <section className="section reveal"><div className="sectionHead"><div><span className="kicker">COMMON QUESTIONS</span><h2>Membership, made clearer.</h2></div></div><div className="faqList">{faqs.map(([q,a],i)=><div className={`faq ${openFaq===i?'open':''}`} key={q}><button onClick={()=>setOpenFaq(openFaq===i?-1:i)}><span>{q}</span><span className="faqPlus">+</span></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></section>
  <section className="membershipCTA reveal"><div><span className="kicker">READY TO APPLY?</span><h2>Start your NI4E membership application.</h2><p>Complete the structured membership form to submit your details for review.</p></div><button className="gold" onClick={()=>setPage('register')}>Begin Application <ArrowRight size={17}/></button></section>
 </>;
}
