import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, ChevronRight, Users, Award, Building2, ShieldCheck, CheckCircle2, Newspaper, Network} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {HomeCarousel, EventCard} from '../components';
import useReveal from '../hooks/useReveal';
import {events,heroSlides,institutionStats,quickResources} from '../data/site';

export default function Home({setPage,onSearch}){useReveal();return <>
 <style>{`
  /* Mobile-only fix: keep the hero statistics in the hero flow instead of overlaying the next section. */
  @media (max-width:680px){
    .hero{display:flex;flex-direction:column;align-items:stretch;min-height:0;height:auto;overflow:hidden;}
    .hero .ni4eCarousel{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%;min-height:700px;flex:0 0 auto;padding:0 0 92px!important;}
    .hero .ni4eCarousel .carouselContent{padding:52px 18px 0!important;margin-top:0!important;}
    .hero .ni4eCarousel .carouselControls{left:18px!important;bottom:24px!important;}
    .hero .heroStats{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%;max-width:none;margin:0;padding:0 12px!important;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));z-index:6;}
    .hero .heroStats span{min-width:0;padding:13px 9px;}
    .hero .heroStats span:last-child{display:none;}
  }
  @media (max-width:420px){
    .hero .ni4eCarousel{min-height:720px;}
    .hero .ni4eCarousel .carouselContent{padding-left:15px!important;padding-right:15px!important;}
    .hero .heroStats{padding:0 8px!important;}
  }
 `}</style>
 <section className="hero">
  <div className="heroArt"><div className="gridGlow"/><div className="tower t1"/><div className="tower t2"/><div className="tower t3"/><div className="orb"/></div>
  <div className="heroShade"/>
  <HomeCarousel setPage={setPage}/>
  <div className="heroStats reveal">{institutionStats.slice(0,3).map(x=><span key={x[0]}><b>{x[0]}</b><small>{x[1]}</small></span>)}</div>
 </section>
 <section className="ni4eMeaning reveal">
  <div className="meaningLabel"><span className="kicker">WHO WE ARE</span><small>NI4E</small></div>
  <div><h2>The Nigerian Institution of Energy, Electrical &amp; Electronics Engineers</h2><div className="meaningDivision">A Division of the Nigerian Society of Engineers (NSE)</div><p>A professional institution focused on advancing knowledge, practice, innovation and collaboration across the energy, electrical and electronics engineering fields in Nigeria.</p></div>
  <button className="textbtn" onClick={()=>setPage('about')}>Learn more about NI4E <ArrowRight size={16}/></button>
 </section>
 <section className="pillars reveal">{[[Users,'Professional Development','Grow your career and expertise.'],[Building2,'Industry Collaboration','Connect with engineering leaders.'],[ShieldCheck,'Standards & Best Practices','Promote professional excellence.'],[Award,'National Development','Engineering solutions for Nigeria.']].map(([I,t,s])=><div key={t}><I/><b>{t}</b><small>{s}</small></div>)}</section>
 <section className="section statsSection reveal">
  <div className="sectionHead"><div><span className="kicker">NI4E AT A GLANCE</span><h2>A digital foundation built around people, knowledge and professional service.</h2></div></div>
  <div className="glanceGrid">{institutionStats.map(x=><article key={x[0]}><b>{x[0]}</b><strong>{x[1]}</strong><span>{x[2]}</span></article>)}</div>
 </section>
 <section className="section resourceSection reveal">
  <div className="sectionHead"><div><span className="kicker">QUICK ACCESS</span><h2>Explore the institution.</h2></div><button className="textbtn" onClick={()=>setPage('about')}>View institution overview <ArrowRight size={16}/></button></div>
  <div className="resourceGrid">{quickResources.map(([I,t,s,p])=><button key={t} className="resourceCard" onClick={()=>setPage(p)}><div className="resourceIcon"><I size={21}/></div><div><b>{t}</b><p>{s}</p></div><ChevronRight/></button>)}</div>
 </section>
 <section className="section reveal"><div className="sectionHead"><div><span className="kicker">WHY NI4E</span><h2>A professional home for the people shaping Nigeria's future.</h2></div><button className="textbtn" onClick={()=>setPage('about')}>Discover NI4E <ArrowRight size={16}/></button></div><div className="featureGrid">{[['01','Professional Recognition','Build your professional profile within a national engineering community.'],['02','Knowledge & Innovation','Access technical resources, events, publications and industry conversations.'],['03','Community & Network','Connect with engineers, institutions, chapters and emerging professionals.']].map(x=><article key={x[0]} className="featureCard"><div className="num">{x[0]}</div><h3>{x[1]}</h3><p>{x[2]}</p><ArrowRight/></article>)}</div></section>
 <section className="membershipBand reveal"><div><span className="kicker">MEMBERSHIP</span><h2>Be part of the engineering community.</h2><p>Explore membership pathways designed for students, graduates and established professionals.</p></div><button className="darkbtn" onClick={()=>setPage('membership')}>Explore Membership <ArrowRight size={17}/></button></section>
 <section className="section reveal"><div className="sectionHead"><div><span className="kicker">UPCOMING</span><h2>Events & professional development</h2></div><button className="textbtn" onClick={()=>setPage('events')}>View all events <ArrowRight size={16}/></button></div><div className="eventGrid">{events.slice(0,3).map((e,i)=><EventCard key={e[0]} e={e} i={i}/>)}</div></section>
 <section className="section splitPromo reveal"><div className="promoVisual"><div className="signalLines"/><div className="promoSeal"><img src={logo}/><span>ENGINEERING<br/>FORWARD</span></div></div><div className="promoCopy"><span className="kicker">THE MEMBER EXPERIENCE</span><h2>One platform for your professional journey.</h2><p>From registration and verification to renewals, events, certificates and resources — the NI4E digital platform keeps members connected.</p><div className="checkList">{['Digital membership profile','Application tracking','Certificates & documents','Events and professional resources'].map(x=><span key={x}><CheckCircle2 size={16}/>{x}</span>)}</div><button className="darkbtn" onClick={()=>setPage('login')}>Explore Member Portal <ArrowRight size={16}/></button></div></section>
 <section className="newsStrip reveal"><div><span className="kicker">LATEST</span><h2>Institution updates</h2></div><div className="newsMini"><Newspaper/><div><b>Professional development and institution announcements</b><small>Announcements and professional updates are managed through the NI4E administration portal.</small></div><ArrowRight/></div><button className="textbtn" onClick={()=>setPage('news')}>All news</button></section>
</>}
