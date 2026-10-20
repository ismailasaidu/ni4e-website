import React, { useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../firebase/config';
import { ArrowRight, Award, BookOpen, BriefcaseBusiness, CheckCircle2, Compass, GraduationCap, Network, ShieldCheck, Users, Zap, Globe2, Lightbulb, Handshake, Target } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';

export default function About({ setPage }) {
  useReveal();
  const carouselRef = useRef(null);
  const [aboutContent, setAboutContent] = useState(null);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let active = true;
    supabase.from('site_content').select('title,summary,body,metadata').eq('content_type','institutional_page').eq('slug','about').eq('published',true).maybeSingle().then(({data}) => { if (active && data) setAboutContent(data); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const el = carouselRef.current; if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let paused = false;
    const timer = window.setInterval(() => { if (paused || !el.isConnected) return; const first = el.querySelector('article'); if (!first) return; const step = first.getBoundingClientRect().width + 14; if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({left:0,behavior:'smooth'}); else el.scrollBy({left:step,behavior:'smooth'}); }, 4200);
    const pause = () => { paused = true; }; const resume = () => { paused = false; };
    el.addEventListener('mouseenter',pause); el.addEventListener('mouseleave',resume); el.addEventListener('focusin',pause); el.addEventListener('focusout',resume);
    return () => { clearInterval(timer); el.removeEventListener('mouseenter',pause); el.removeEventListener('mouseleave',resume); el.removeEventListener('focusin',pause); el.removeEventListener('focusout',resume); };
  }, []);
  const focus = [
    [Zap, 'Energy systems', 'Generation, transmission, distribution, power-system reliability, energy efficiency and emerging energy technologies.'],
    [ShieldCheck, 'Electrical engineering', 'Safe and dependable engineering practice, protection, installations, standards awareness and technical excellence.'],
    [Network, 'Electronics & digital systems', 'Electronics, instrumentation, automation, control, communications and digital technologies supporting modern infrastructure.'],
    [GraduationCap, 'Professional development', 'Technical learning, knowledge exchange and opportunities for students, graduates and practising professionals.']
  ];
  const pathways = [
    [Users, 'Membership', 'Understand the membership journey, prepare an application and access member services.', 'membership'],
    [Award, 'Events & CPD', 'Explore conferences, technical forums, workshops and continuing professional development.', 'events'],
    [BookOpen, 'Knowledge library', 'Find publications, technical resources, reports and institutional knowledge.', 'publications'],
    [Network, 'Communities', 'Explore chapters, technical areas, committees and professional collaboration.', 'chapters']
  ];
  const pillars = [
    [Target, 'Professional standards', 'Encourage responsible, safe and ethical engineering practice and a culture of continuous improvement.'],
    [Lightbulb, 'Technical knowledge', 'Create routes for professionals to share experience, discuss challenges and learn from technical work.'],
    [Handshake, 'Collaboration', 'Connect practitioners, educators, researchers, industry and emerging engineers around shared priorities.'],
    [Globe2, 'Public value', 'Make professional knowledge and engineering dialogue more accessible to the wider community.']
  ];
  const audiences = [
    ['Practising engineers', 'Technical resources, professional activities and opportunities to contribute experience.'],
    ['Students & graduates', 'A starting point for learning about the profession, communities and development opportunities.'],
    ['Industry & institutions', 'A channel to discover relevant activities and explore technical collaboration.'],
    ['Researchers & educators', 'Routes to share knowledge, publications, events and engineering perspectives.']
  ];
  return <>
    <PageHero title="About NI4E" crumb="About" desc="A professional platform for advancing energy, electrical and electronics engineering knowledge, practice and collaboration in Nigeria." />
    <section className="section aboutPageRedesign">
      <div className="aboutLeadGrid"><div><span className="kicker">WHO WE ARE</span><h2>{aboutContent?.metadata?.headline || aboutContent?.title || 'Engineering knowledge. Professional community. National progress.'}</h2><p className="aboutLeadText">{aboutContent?.summary || 'NI4E brings together professional interests across energy, electrical and electronics engineering.'}</p></div><div><p>{aboutContent?.body || 'NI4E provides a professional meeting point for people working across energy, electrical engineering and electronics. Its work connects technical knowledge with professional responsibility, collaboration and the practical needs of modern infrastructure.'}</p><p>{aboutContent?.metadata?.secondParagraph || 'The Institution’s work spans professional development, knowledge exchange, responsible engineering practice and stronger connections between practitioners, educators, researchers, industry and emerging professionals.'}</p><div className="aboutLeadActions"><button className="darkbtn" onClick={()=>setPage?.('membership')}>Explore membership <ArrowRight size={16}/></button><button className="textbtn" onClick={()=>setPage?.('contact')}>Contact the Institution</button></div></div></div>
      <div className="aboutImageShowcase" aria-label="Engineering disciplines and professional community">
        <div className="aboutImageFeature"><img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1500&q=90" alt="High-voltage transmission infrastructure"/><div><span>POWER & ENERGY</span><h3>Reliable systems for everyday life</h3></div></div>
        <div className="aboutImageSide"><article><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85" alt="Electronics and circuit board engineering"/><div><span>ELECTRONICS & DIGITAL SYSTEMS</span><h3>Technology that connects</h3></div></article><article><img src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=85" alt="Engineer at work in a technical environment"/><div><span>PROFESSIONAL PRACTICE</span><h3>Knowledge applied responsibly</h3></div></article></div>
      </div>
      <div className="aboutImageCarousel" aria-label="Engineering in practice gallery"><div className="aboutImageCarouselTrack" ref={carouselRef}>{[
        ['https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=85','Renewable energy','Solar generation, storage and reliable integration.'],
        ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85','Efficient buildings','Engineering decisions that improve performance.'],
        ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=85','Professional collaboration','People and ideas working across disciplines.'],
        ['https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85','Avionics and space','Engineering systems beyond the ground.']
      ].map(([src,title,desc])=><article key={title}><img src={src} alt={title} loading="lazy"/><div><h3>{title}</h3><p>{desc}</p></div></article>)}</div><p className="aboutCarouselHint">Swipe to explore engineering disciplines <span>→</span></p></div>
      <div className="aboutPurposeBand"><div><span className="kicker">OUR ROLE</span><h3>Connect the profession to the knowledge and services it needs.</h3></div><p>Support professional connection, share technical knowledge, promote responsible engineering practice and make institutional activities easier to discover and access.</p></div>
      <div className="aboutFocusHead"><span className="kicker">AREAS OF FOCUS</span><h2>Engineering disciplines shaping essential systems</h2><p>The energy, electrical and electronics disciplines underpin the systems people and businesses depend on every day.</p></div>
      <div className="aboutFocusGrid">{focus.map(([Icon,title,desc],i)=><article className="aboutFocusCard" key={title}><span className="aboutFocusNumber">0{i+1}</span><Icon size={27}/><h3>{title}</h3><p>{desc}</p></article>)}</div>
      <section className="aboutPillars"><div className="aboutFocusHead"><span className="kicker">WHAT THIS PLATFORM SUPPORTS</span><h2>From professional knowledge to practical contribution</h2><p>We connect professional knowledge with responsible practice, technical collaboration and the advancement of engineering capability.</p></div><div className="aboutPillarGrid">{pillars.map(([Icon,title,desc])=><article key={title}><span><Icon size={23}/></span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
      <section className="aboutAudience"><div className="aboutAudienceIntro"><span className="kicker">WHO THE WEBSITE SERVES</span><h2>Useful to the whole engineering community</h2><p>Different visitors arrive with different needs. The site should help each person find a relevant next step without having to know the organisation's internal structure first.</p></div><div className="aboutAudienceList">{audiences.map(([title,desc],i)=><article key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{desc}</p></div><ArrowRight size={18}/></article>)}</div></section>
      <div className="aboutPrinciples"><div><span className="kicker">HOW TO USE THIS WEBSITE</span><h2>A clear path through the professional journey.</h2><p className="aboutSectionIntro">Start with the information you need, then move into the relevant service or community.</p></div><div className="aboutPrincipleList"><p><CheckCircle2/> <span><b>Find trusted information</b><small>Institutional pages, approved leadership, recognised chapters and governance information.</small></span></p><p><CheckCircle2/> <span><b>Participate in activities</b><small>Membership pathways, event registration and professional-development opportunities.</small></span></p><p><CheckCircle2/> <span><b>Learn and contribute</b><small>Technical resources, publications, projects and knowledge-sharing activities.</small></span></p><p><CheckCircle2/> <span><b>Stay connected</b><small>News, announcements, contact channels and updates from the Institution.</small></span></p></div></div>
      <div className="aboutPathways"><div className="aboutFocusHead"><span className="kicker">EXPLORE NI4E</span><h2>Choose your next step</h2></div><div className="aboutPathwayGrid">{pathways.map(([Icon,title,desc,page])=><button key={title} className="aboutPathway" onClick={()=>setPage?.(page)}><Icon size={24}/><b>{title}</b><span>{desc}</span><ArrowRight size={17}/></button>)}</div></div>
      <div className="aboutProcess"><div><span className="kicker">A SIMPLE VISITOR JOURNEY</span><h2>Discover. Participate. Contribute.</h2></div><div className="aboutProcessSteps"><article><span>01</span><b>Discover</b><p>Learn about the Institution, its activities and the professional communities represented.</p></article><article><span>02</span><b>Participate</b><p>Explore membership, register for published events or find technical learning resources.</p></article><article><span>03</span><b>Contribute</b><p>Share knowledge, take part in activities and contact the Institution about collaboration.</p></article></div></div>
      <div className="aboutApprovalNote"><Compass size={19}/><div><b>Engineering that serves people and infrastructure</b><p>{aboutContent?.metadata?.closingStatement || 'Reliable energy systems, safe electrical installations and dependable electronics are central to economic activity and everyday life. NI4E’s professional community supports the knowledge, judgement and collaboration needed to deliver these systems responsibly.'}</p></div></div>
    </section>
  </>;
}
