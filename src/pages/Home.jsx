import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Award, BookOpen, Building2,
  CalendarDays, CheckCircle2, ChevronRight, CircuitBoard, FileCheck2,
  Globe2, GraduationCap, Landmark, Network, ShieldCheck, Sparkles, Users,
  Zap
} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import useReveal from '../hooks/useReveal';
import {quickResources} from '../data/site';
import { supabase, supabaseConfigured } from '../firebase/config';

const focusAreas = [
  {icon: Zap, number: '01', title: 'Energy systems', copy: 'Support the exchange of knowledge on energy generation, transition, access and resilient infrastructure.'},
  {icon: CircuitBoard, number: '02', title: 'Electrical engineering', copy: 'Promote sound engineering practice, safety, standards and technical excellence across the power sector.'},
  {icon: Network, number: '03', title: 'Electronics & innovation', copy: 'Connect emerging technologies, research, automation and practical engineering solutions.'},
];
const memberSteps = [
  {n:'01', title:'Choose your pathway', text:'Review the membership categories and requirements that fit your experience.'},
  {n:'02', title:'Submit your application', text:'Provide your details and the supporting information required for review.'},
  {n:'03', title:'Track your progress', text:'Follow your application and access member services through the digital portal.'},
];

export default function Home({setPage,onSearch}) {
  useReveal();
  const [featuredEvent, setFeaturedEvent] = useState(null);
  useEffect(() => { let alive = true; (async () => { if (!supabaseConfigured || !supabase) return; try { const { data, error } = await supabase.from('site_content').select('id,title,summary,event_start,event_end,metadata').eq('content_type','event').eq('published',true).gte('event_start',new Date().toISOString()).order('event_start',{ascending:true}).limit(1); if (!error && alive) setFeaturedEvent((data || [])[0] || null); } catch { if (alive) setFeaturedEvent(null); } })(); return () => { alive = false; }; }, []);
  return <div className="homeV2">
    <section className="hvHero">
      <div className="hvHeroGrid" aria-hidden="true" />
      <div className="hvHeroGlow hvGlowOne" aria-hidden="true" />
      <div className="hvHeroGlow hvGlowTwo" aria-hidden="true" />
      <div className="hvHeroInner">
        <div className="hvHeroCopy">
          <div className="hvEyebrow"><span /> A DIVISION OF THE NIGERIAN SOCIETY OF ENGINEERS</div>
          <div className="hvBrandLine"><img src={logo} alt="NI4E official logo"/><span>ENERGY <i>·</i> ELECTRICAL <i>·</i> ELECTRONICS ENGINEERING</span></div>
          <h1>Engineering knowledge.<br/><em>National progress.</em></h1>
          <p className="hvLead">A professional home for the people advancing Nigeria’s energy, electrical and electronics engineering future.</p>
          <p className="hvSublead">Connect with a community focused on professional development, technical excellence, innovation and meaningful industry collaboration.</p>
          <div className="hvActions">
            <button className="hvButton hvButtonGold" onClick={()=>setPage('register')}>Explore membership <ArrowRight size={17}/></button>
            <button className="hvButton hvButtonGlass" onClick={()=>setPage('about')}>Discover NI4E <ArrowUpRight size={17}/></button>
          </div>
          <div className="hvTrust"><span><ShieldCheck size={15}/> Professional community</span><span><Landmark size={15}/> NSE division</span><span><Globe2 size={15}/> National outlook</span></div>
        </div>
        <div className="hvHeroVisual" aria-label="Energy, electrical and electronics engineering visual">
          <div className="hvVisualTop"><span>ENGINEERING / 01</span><span className="hvLive"><i/> CONNECTED FUTURE</span></div>
          <div className="hvOrbit hvOrbitA"/><div className="hvOrbit hvOrbitB"/><div className="hvOrbit hvOrbitC"/>
          <div className="hvCore"><div className="hvCoreInner"><Zap size={38}/><span>NI4E</span><small>ENGINEERING FORWARD</small></div></div>
          <div className="hvNode hvNodeEnergy"><span className="hvNodeIcon"><Zap size={17}/></span><span><small>FIELD 01</small><b>Energy</b></span></div>
          <div className="hvNode hvNodeElectrical"><span className="hvNodeIcon"><CircuitBoard size={17}/></span><span><small>FIELD 02</small><b>Electrical</b></span></div>
          <div className="hvNode hvNodeElectronics"><span className="hvNodeIcon"><Network size={17}/></span><span><small>FIELD 03</small><b>Electronics</b></span></div>
          <div className="hvVisualFooter"><span>KNOWLEDGE</span><b>×</b><span>INNOVATION</span><b>×</b><span>IMPACT</span></div>
          <div className="hvSideLabel">THE NIGERIAN INSTITUTION</div>
        </div>
      </div>
      <div className="hvHeroBottom"><span>01 / INSTITUTIONAL OVERVIEW</span><span>ADVANCING PROFESSIONAL EXCELLENCE <ArrowDownRight size={15}/></span></div>
    </section>

    <section className="hvIntro reveal">
      <div className="hvIntroLabel"><span className="hvSectionIndex">01</span><span>WHO WE ARE</span></div>
      <div className="hvIntroMain"><h2>The Nigerian Institution of Energy, Electrical &amp; Electronics Engineers</h2><p>NI4E brings together professionals and emerging engineers to strengthen engineering knowledge, responsible practice and collaboration across critical technical fields.</p><div className="hvIntroFoot"><span><Landmark size={16}/> A Division of the Nigerian Society of Engineers (NSE)</span><button onClick={()=>setPage('about')}>About the Institution <ArrowRight size={16}/></button></div></div>
      <div className="hvIntroMark"><img src={logo} alt="NI4E emblem"/><span>PROFESSIONALISM<br/>KNOWLEDGE<br/>PROGRESS</span></div>
    </section>

    <section className="hvFocusSection">
      <div className="hvSectionHead reveal"><div><span className="hvKicker">OUR PROFESSIONAL FOCUS</span><h2>Three disciplines.<br/><em>One shared purpose.</em></h2></div><p>Supporting the people, ideas and practices that help engineering serve society.</p></div>
      <div className="hvFocusGrid">{focusAreas.map(({icon:Icon,number,title,copy})=><article className="hvFocusCard reveal" key={number}><div className="hvCardTop"><span>{number} / FOCUS AREA</span><Icon size={22}/></div><div className="hvFocusIcon"><Icon size={26}/></div><h3>{title}</h3><p>{copy}</p><button onClick={()=>setPage('about')}>Explore our work <ArrowUpRight size={16}/></button></article>)}</div>
    </section>

    <section className="hvServices reveal">
      <div className="hvServicesCopy"><span className="hvKicker">A MORE CONNECTED NI4E</span><h2>Professional services, made easier to access.</h2><p>The NI4E digital experience is designed to bring institutional information and member services together in one accessible place.</p><button className="hvButton hvButtonDark" onClick={()=>setPage('login')}>Sign in to your account <ArrowRight size={17}/></button><div className="hvServicesNote"><Sparkles size={16}/><span>Built around a clearer, more connected member journey.</span></div></div>
      <div className="hvServiceList">
        {[
          {icon:FileCheck2,title:'Membership applications',text:'Explore categories, requirements and application steps.',page:'membership'},
          {icon:CalendarDays,title:'Events & professional development',text:'Find conferences, workshops and technical forums.',page:'events'},
          {icon:BookOpen,title:'Publications & knowledge',text:'Discover technical publications and institutional resources.',page:'publications'},
          {icon:Users,title:'Chapters & community',text:'Learn about the institution’s network and leadership.',page:'chapters'},
        ].map(({icon:Icon,title,text,page},i)=><button className="hvServiceRow" key={title} onClick={()=>setPage(page)}><span className="hvServiceNumber">0{i+1}</span><span className="hvServiceIcon"><Icon size={20}/></span><span className="hvServiceText"><b>{title}</b><small>{text}</small></span><ChevronRight size={18}/></button>)}
      </div>
    </section>

    <section className="hvMembership reveal">
      <div className="hvMembershipVisual"><div className="hvMembershipGrid"/><div className="hvMembershipStamp"><Award size={35}/><span>YOUR JOURNEY<br/>IN ENGINEERING</span></div><div className="hvMembershipQuote">“A stronger profession begins with a connected community.”</div></div>
      <div className="hvMembershipCopy"><span className="hvKicker">MEMBERSHIP / GET INVOLVED</span><h2>Build your place in the engineering community.</h2><p>Whether you are beginning your career or bringing years of experience, explore the membership pathway that reflects your professional journey.</p><div className="hvSteps">{memberSteps.map(step=><div className="hvStep" key={step.n}><span>{step.n}</span><div><b>{step.title}</b><small>{step.text}</small></div><CheckCircle2 size={17}/></div>)}</div><button className="hvButton hvButtonGold" onClick={()=>setPage('membership')}>View membership pathways <ArrowRight size={17}/></button></div>
    </section>

    <section className="hvEvents reveal">
      <div className="hvSectionHead"><div><span className="hvKicker">CONNECT. LEARN. CONTRIBUTE.</span><h2>Ideas move forward <em>when we meet.</em></h2></div><button className="hvTextLink" onClick={()=>setPage('events')}>Explore all events <ArrowRight size={16}/></button></div>
      <div className="hvEventFeature"><div className="hvEventArtwork"><div className="hvEventRings"/><span className="hvEventEyebrow">NI4E / FEATURED EVENT</span><div className="hvEventMonogram">NI<span>4E</span></div><div className="hvEventArtworkFoot"><span>TECHNICAL EXCHANGE</span><span>PROFESSIONAL NETWORK</span></div></div><div className="hvEventInfo"><div className="hvEventMeta"><span><CalendarDays size={15}/>{featuredEvent?.event_start ? new Date(featuredEvent.event_start).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'No date announced'}</span><span><Globe2 size={15}/>{featuredEvent?.metadata?.venue || 'Venue to be announced'}</span></div><span className="hvEventTag">{featuredEvent?.metadata?.event_type || 'EVENTS & PROFESSIONAL DEVELOPMENT'}</span><h3>{featuredEvent?.title || 'Discover NI4E events'}</h3><p>{featuredEvent?.summary || 'Upcoming conferences, workshops and technical forums will appear here once NI4E publishes approved event details.'}</p><button className="hvButton hvButtonDark" onClick={()=>setPage('events')}>{featuredEvent ? 'View event details' : 'Explore events'} <ArrowRight size={17}/></button>{featuredEvent?.metadata?.is_paid && <small className="hvEventNote">Paid registration may apply. Check the event details for the approved fee.</small>}</div></div>
    </section>

    <section className="hvResourceBand reveal"><div><span className="hvKicker">EXPLORE THE INSTITUTION</span><h2>Find your next point of connection.</h2><p>Start with the information, resources and services you need.</p></div><div className="hvResourceGrid">{quickResources.map(([Icon,title,description,page])=><button className="hvResourceCard" key={title} onClick={()=>setPage(page)}><Icon size={22}/><b>{title}</b><small>{description}</small><span>Explore <ArrowUpRight size={15}/></span></button>)}</div></section>

    <section className="hvClosing reveal"><div className="hvClosingSeal"><img src={logo} alt="NI4E logo"/></div><div className="hvClosingCopy"><span className="hvKicker">THE NEXT CHAPTER IS BUILT TOGETHER</span><h2>Bring your expertise.<br/><em>Help move engineering forward.</em></h2><p>Discover membership, connect with professionals and take part in the conversations shaping the future of the discipline.</p></div><div className="hvClosingActions"><button className="hvButton hvButtonGold" onClick={()=>setPage('register')}>Start your application <ArrowRight size={17}/></button><button className="hvTextLink hvClosingContact" onClick={()=>setPage('contact')}>Speak with NI4E <ArrowUpRight size={16}/></button></div></section>
  </div>;
}
