import React, { useEffect, useState } from 'react';
import { Award, RefreshCw, Users, ArrowUpRight, ShieldCheck, BookOpen, Network, Landmark } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';
import { useRef } from 'react';
import { supabase, supabaseConfigured } from '../firebase/config';

// Executive roles and portraits transcribed from the supplied 2026 inauguration brochure.
const executiveCouncil = [
{id:'alkali-abba-tijjani',name:'Engr. Alkali Abba Tijjani',title:'National Chairman',group:'Current national leadership',image:'/images/executive-council/alkali-abba-tijjani.jpg',qualifications:['B.Eng. Electrical & Electronics Engineering, University of Maiduguri (2008)','M.Sc. Engineering Management, Ahmadu Bello University (2023)','Master’s in Procurement Management (2025)'],biography:'National Chairman, identified in the supplied 2026 inauguration brochure. The NSE Electrical Division directory also lists him as Chairman of the Electrical Division.',experience:'Assistant Director, Borno State Government. Previous institutional service includes Maiduguri Chapter Chairman, National Membership Secretary and National Vice Chairman (ICT).',career:[{period:'2008',role:'B.Eng. Electrical & Electronics Engineering',org:'University of Maiduguri'},{period:'2023',role:'M.Sc. Engineering Management',org:'Ahmadu Bello University'},{period:'2025',role:'Master’s in Procurement Management',org:'Supplied inauguration brochure'}],expertise:['Electrical and electronics engineering','Engineering management','Membership development','ICT'],source:'2026 inauguration brochure; NSE Electrical Division directory'},
{id:'oloekunle-ezekiel-olusegun',name:'Engr. Oloekunle Ezekiel Olusegun',title:'Deputy National Chairman',group:'Current national leadership',image:'/images/executive-council/oloekunle-ezekiel-olusegun.jpg',qualifications:['FNSE','FNIEEE','JP'],biography:'Listed as Deputy National Chairman in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms this executive role.',source:'2026 inauguration brochure'},
{id:'hassan-natala',name:'Engr. Dr. Hassan Natala',title:'National Vice Chairman, Power',group:'Current national leadership',image:'/images/executive-council/hassan-natala.jpg',qualifications:['FNSE','FNIEEE'],biography:'Listed as National Vice Chairman, Power in the supplied 2026 National Executive Members page. A public professional profile identifies engineering work with ANCO Engineering and General Services Ltd and COREN registration.',experience:'Publicly indexed professional profile lists ANCO Engineering and General Services Ltd; further roles and dates require confirmation.',source:'2026 inauguration brochure; publicly indexed professional profile'},
{id:'nani-kabaye',name:'Engr. Nani Kabaye',title:'National Vice Chairman, ICT',group:'Current national leadership',image:'/images/executive-council/nani-kabaye.jpg',qualifications:['FNSE','MNIEEE'],biography:'Listed as National Vice Chairman, ICT in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms the current portfolio.',source:'2026 inauguration brochure'},
{id:'kamulu-lawal',name:'Engr. Dr. Kamulu Lawal',title:'National Vice Chairman, Control, Measurement & Instrumentation',group:'Current national leadership',image:'/images/executive-council/kamulu-lawal.jpg',qualifications:['MNSE','MNIEEE','MEng (as printed in brochure)'],biography:'Listed as National Vice Chairman for Control, Measurement and Instrumentation in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms the current portfolio.',source:'2026 inauguration brochure'},
{id:'umar-abubakar-wakta',name:'Engr. Umar Abubakar Wakta',title:'National Executive Council Member',group:'Current national leadership',image:'/images/executive-council/umar-abubakar-wakta.jpg',qualifications:['MNSE','MNIEEE'],biography:'Listed as a National Executive Council member in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms this executive role.',source:'2026 inauguration brochure'},
{id:'edima-ekanem',name:'Engr. Edima Ekanem',title:'National Executive Council Member',group:'Current national leadership',image:'/images/executive-council/edima-ekanem.jpg',qualifications:['FNSE','MNIEEE'],biography:'Listed as a National Executive Council member in the supplied 2026 National Executive Members page. A published conference programme profile reports a B.Eng. in Electrical/Electronics Engineering from the University of Uyo in 2007 and COREN registration.',experience:'A published conference programme profile states she graduated from the University of Uyo in 2007 and has undertaken further training in electrical engineering and cybersecurity.',career:[{period:'2007',role:'B.Eng. Electrical/Electronics Engineering',org:'University of Uyo'}],source:'2026 inauguration brochure; 2025 safety conference programme profile'},
{id:'ashola-samuel',name:'Engr. Ashola Samuel',title:'National Executive Council Member',group:'Current national leadership',image:'/images/executive-council/ashola-samuel.jpg',qualifications:['MNSE','MNIEEE'],biography:'Listed as a National Executive Council member in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms this executive role.',source:'2026 inauguration brochure'},
{id:'kelechi-eke',name:'Engr. Kelechi Eke',title:'National Executive Council Member',group:'Current national leadership',image:'/images/executive-council/kelechi-eke.jpg',qualifications:['FNSE','FNIEEE'],biography:'Listed as a National Executive Council member in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms this executive role.',source:'2026 inauguration brochure'},
{id:'john-andrew-habila',name:'Engr. John Andrew Habila',title:'Executive Secretary',group:'Current national leadership',image:'/images/executive-council/john-andrew-habila.jpg',qualifications:['MNSE','MNIEEE'],biography:'Listed as Executive Secretary in the supplied 2026 National Executive Members page.',experience:'The supplied brochure confirms this secretariat role.',source:'2026 inauguration brochure'}
];

const pastChairmen = [
 ['Engr. Dr. Olusegun O. Ajayi','1986–1987'],
 ['Late Engr. Foluseke A. Somolu','1987–1988'],
 ['Engr. V. I. Maduka','1988–1989'],
 ['Late Engr. M. O. Shokoya','1990–1991'],
 ['Engr. R. B. Osula','1992–1993'],
 ['Engr. Dr. A. Esan','1994–1995'],
 ['Engr. Titi Omo-Ettu','1996–1997'],
 ['Engr. Dr. Olusegun O. Ajayi','1998–1999'],
 ['Engr. R. B. Adenekan','2000–2001'],
 ['Late Engr. M. A. Adegbite','2002–2003'],
 ['Engr. A. O. Cole','2004–2005'],
 ['Engr. M. Bolanle Odetokun','2006–2007'],
 ['Engr. Olafemi Olaniyan','2008–2009'],
 ['Late Engr. Abiodun Ajifowobaje','2010–2011'],
 ['Engr. Adekunle S. Makinde','2012–2013'],
 ['Engr. Gracious A. Omatseye','2014–2015'],
 ['Engr. Emmanuel O. Akinwole','2016–2017'],
 ['Engr. John Oyewole Funso-Adebayo','2018–2019'],
 ['Engr. Olusegun Adeyemi Kings','2020–2021'],
 ['Engr. Michael Akan','2022–2023'],
 ['Engr. Nsikak Afia','2024'],
 ['Engr. Kelechi Eke','2025–2026']
].map(([name, tenure], index) => ({ id: `past-chair-${index}`, name, title: 'National Chairman', tenure, group: 'Past national chairmen', biography: '', summary: '', source: 'Supplied inauguration brochure (2026)' }));

const governance = [
 {icon:Landmark,title:'National Executive Committee',text:'Provides executive direction, discusses and implements institutional policies, and coordinates national programmes.'},
 {icon:Network,title:'Technical Section Leadership',text:'Connects specialist engineering communities through technical activity, professional learning and knowledge exchange.'},
 {icon:ShieldCheck,title:'National Secretariat',text:'Coordinates day-to-day institutional administration, records, communication and the implementation of approved decisions.'}
];


function NationalExecutiveChart({members,onSelect}) {
 const chairman=members.find(m=>m.title==='National Chairman');
 const senior=members.filter(m=>m.title==='Deputy National Chairman'||m.title.startsWith('National Vice Chairman'));
 const secretariat=members.filter(m=>m.title==='Executive Secretary');
 const other=members.filter(m=>m.title==='National Executive Council Member');
 const Node=({person,level=''})=><button type="button" className={`necNode ${level}`} onClick={()=>onSelect(person)} aria-label={`View profile: ${person.name}`}><span className="necPortrait">{person.image?<img src={person.image} alt=""/>:person.name.split(/\s+/).map(x=>x[0]).slice(0,2).join('')}</span><span className="necNodeText"><strong>{person.name}</strong><small>{person.title}</small><em>View profile <ArrowUpRight size={13}/></em></span></button>;
 return <div className="necChart" aria-label="National Executive Council organisational chart"><div className="necChartLegend"><span>Select an executive to view their profile</span><span>{members.length} officers</span></div>{chairman&&<div className="necTier necChairTier"><Node person={chairman} level="necChair"/></div>}{senior.length>0&&<><div className="necConnector"/><div className="necTier necViceTier">{senior.map(p=><Node key={p.id} person={p} level="necSenior"/>)}</div></>}{other.length>0&&<><div className="necConnector"/><h3 className="necTierLabel">National Executive Council Members</h3><div className="necTier necMemberTier">{other.map(p=><Node key={p.id} person={p}/>)}</div></>}{secretariat.length>0&&<><div className="necConnector"/><h3 className="necTierLabel">National Secretariat</h3><div className="necTier necSecretariatTier">{secretariat.map(p=><Node key={p.id} person={p}/>)}</div></>}</div>;
}

export default function Leadership({ setPage }) {
  const galleryRef = useRef(null);
  const [leaders,setLeaders] = useState([...executiveCouncil, ...pastChairmen]);
  const [loading,setLoading] = useState(false);
  const [sourceStatus,setSourceStatus] = useState('fallback');
  const [selected,setSelected] = useState(null);
  const previousScrollY = useRef(0);
  const openProfile = person => { previousScrollY.current = window.scrollY; setSelected(person); };
  const closeProfile = () => { setSelected(null); };
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('Current national leadership');
  const [era,setEra] = useState('All years');
  const [notice,setNotice] = useState('');
  const loadLeaders = async ({ reset = false } = {}) => {
    setLoading(true);
    try {
      let current = executiveCouncil;
      let past = pastChairmen.map(([name,tenure],index)=>({id:`past-chairman-${index}`,name,title:'Past National Chairman',group:'Past national chairmen',tenure}));
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase.from('site_content').select('*').in('content_type',['executive','past_president']).eq('published',true).order('created_at',{ascending:true});
        if (error) throw error;
        const rows = data || [];
        const executives = rows.filter(row=>row.content_type==='executive').map(row=>({ id:row.id, name:row.metadata?.name || row.title, title:row.metadata?.position || row.metadata?.title || row.summary, group:'Current national leadership', image:row.metadata?.image || row.metadata?.portrait || '', qualifications:row.metadata?.qualifications || [], biography:row.body || row.metadata?.biography || row.summary || '', experience:row.metadata?.experience || '', career:row.metadata?.career || [], expertise:row.metadata?.expertise || [], source:row.metadata?.source || 'NI4E institutional record' }));
        const chairmen = rows.filter(row=>row.content_type==='past_president').map(row=>({ id:row.id, name:row.metadata?.name || row.title, title:'Past National Chairman', group:'Past national chairmen', tenure:row.metadata?.tenure || row.summary, image:row.metadata?.image || '', biography:row.body || row.summary || '' }));
        if (executives.length) current = executives;
        if (chairmen.length) past = chairmen;
        setSourceStatus(rows.length ? 'live' : 'fallback');
      }
      setLeaders([...current, ...past]);
      if (reset) { setQuery(''); setFilter('Current national leadership'); setEra('All years'); setNotice(''); }
    } catch (error) {
      console.error('NI4E leadership content load failed:', error);
      setLeaders([...executiveCouncil, ...pastChairmen.map(([name,tenure],index)=>({id:`past-chairman-${index}`,name,title:'Past National Chairman',group:'Past national chairmen',tenure}))]);
      setSourceStatus('fallback');
      setNotice('Showing the verified directory while live leadership records are unavailable.');
    } finally { setLoading(false); }
  };
  useEffect(()=>{loadLeaders();},[]);
  useEffect(()=>{const el=galleryRef.current;if(!el||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let paused=false;const timer=window.setInterval(()=>{if(paused||!el.isConnected)return;const card=el.querySelector('article');if(!card)return;const step=card.getBoundingClientRect().width+14;if(el.scrollLeft+el.clientWidth>=el.scrollWidth-8)el.scrollTo({left:0,behavior:'smooth'});else el.scrollBy({left:step,behavior:'smooth'});},4600);const pause=()=>paused=true,resume=()=>paused=false;el.addEventListener('mouseenter',pause);el.addEventListener('mouseleave',resume);el.addEventListener('focusin',pause);el.addEventListener('focusout',resume);return()=>{clearInterval(timer);el.removeEventListener('mouseenter',pause);el.removeEventListener('mouseleave',resume);el.removeEventListener('focusin',pause);el.removeEventListener('focusout',resume);};},[filter]);
  useEffect(()=>{
    if(!selected) return;
    const body=document.body;
    const scrollY=previousScrollY.current;
    const previous={position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width,overflow:body.style.overflow};
    body.classList.add('modal-open');
    body.style.position='fixed'; body.style.top=`-${scrollY}px`; body.style.left='0'; body.style.right='0'; body.style.width='100%'; body.style.overflow='hidden';
    return ()=>{
      body.classList.remove('modal-open');
      Object.assign(body.style,previous);
      window.scrollTo({top:scrollY,behavior:'instant'});
    };
  },[selected]);
  const groups = ['Current national leadership','Past national chairmen'];
  const eras = ['All years','1980s','1990s','2000s','2010s','2020s'];
  const visible = leaders.filter(x=>(x.group||'Institutional leadership')===filter&&`${x.name||x.metadata?.name||x.title} ${x.title} ${x.tenure||''} ${x.biography||x.body||''}`.toLowerCase().includes(query.toLowerCase().trim())&&(filter!=='Past national chairmen'||era==='All years'||(()=>{const start=Number(String(x.tenure||'').slice(0,4));return start>=Number(era.slice(0,4))&&start<Number(era.slice(0,4))+10})()));
  const initials = name => String(name||'NI4E').replace(/^(Engr\.?\s*|\(Dr\.?\)\s*)/i,'').split(/[ ,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return <>
    <section className="leadershipPageHero" aria-labelledby="leadership-page-title">
      <div className="leadershipPageHeroInner">
        <div className="leadershipPageHeroCopy"><span className="leadershipEyebrow"><span/> LEADERSHIP & GOVERNANCE</span><h1 id="leadership-page-title">The people guiding <em>our profession.</em></h1><p>Meet the engineers and professionals serving NI4E, shaping our priorities and advancing energy, electrical and electronics engineering in Nigeria.</p><div className="leadershipHeroFacts"><span><Users size={16}/> National leadership</span><span><ShieldCheck size={16}/> Professional service</span><span><Network size={16}/> Shared direction</span></div></div>
        <div className="leadershipHeroAside"><div className="leadershipHeroSeal"><Landmark size={28}/></div><span className="leadershipHeroAsideKicker">NI4E · NATIONAL LEADERSHIP</span><p>Leadership rooted in professional excellence, responsibility and service.</p><span className="leadershipHeroAsideRule"/></div>
      </div>
      <div className="leadershipHeroBottom"><span>THE NATIONAL EXECUTIVE COUNCIL</span><span>Explore the structure <ArrowUpRight size={15}/></span></div>
    </section>
    <section className="section leadershipPagePro">
      <div className="leadershipIntroPro"><div><span className="kicker">MEET THE LEADERS</span><h2>National Executive Council</h2><p>Select an officer to view their profile, or browse past national chairmen and their years of service.</p></div><span className="leadershipDemoPill"><Users size={14}/> {sourceStatus==='live'?'Live NI4E directory':'Leadership directory'}</span></div>
      <div className="leadershipToolbar"><div><span className="kicker">LEADERSHIP DIRECTORY</span><h2>{filter==='Current national leadership'?'National Executive Council':filter==='Past national chairmen'?'Past National Chairmen':'National Executive Council'}</h2><p>{visible.length} {filter==='Past national chairmen'?'chairmen':'records'} shown</p></div><button type="button" className="textbtn" onClick={()=>loadLeaders({reset:true})} disabled={loading}><RefreshCw size={16}/>{loading?'Resetting…':'Reset directory'}</button></div>
      <div className="leadershipDirectoryControls"><label className="leadershipSearch"><span>Search directory</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, role or tenure"/></label>{filter==='Past national chairmen'&&<label className="leadershipEraFilter"><span>Filter by decade</span><select value={era} onChange={e=>setEra(e.target.value)}>{eras.map(item=><option key={item}>{item}</option>)}</select></label>}</div>
      <div className="leadershipFilters" role="tablist" aria-label="Filter leadership directory">{groups.map(g=><button key={g} type="button" role="tab" aria-selected={filter===g} className={filter===g?'active':''} onClick={()=>{setFilter(g);setQuery('');setEra('All years')}}>{g==='Current national leadership'?'National Executive Council':'Past Chairmen'}</button>)}</div>
      {notice&&<p className="leadershipStatus" role="status">{notice}</p>}
      {visible.length===0 && !loading ? <div className="publicState"><Users size={30}/><h3>No matching records</h3><p>Try another name, role, tenure or decade.</p></div> : filter==='Current national leadership' ? <NationalExecutiveChart members={visible} onSelect={openProfile} /> : filter==='Past national chairmen' ? <div className="leadershipArchiveList" aria-label="Past national chairmen">{visible.map((leader,i)=><article className="leadershipArchiveRow" key={leader.id||leader.name} style={{'--profile-index':i}}><span className="leadershipArchiveIndex">{String(i+1).padStart(2,'0')}</span><div className="leadershipArchiveIdentity"><h3>{leader.name}</h3><span>National Chairman</span></div><div className="leadershipArchiveTenure"><span>Tenure</span><strong>{leader.tenure}</strong></div><span className="leadershipArchiveArrow" aria-hidden="true">↗</span></article>)}</div> : <div className="leadershipProfileGrid">{visible.map((leader,i)=><article className="leadershipProfileCard" key={leader.id||leader.name||leader.title} style={{'--profile-index':i}}>
        <div className="leadershipProfileBanner">{leader.image ? <img className="leadershipProfileBackdrop" src={leader.image} alt={leader.name} loading="lazy"/> : <img className="leadershipProfileBackdrop" src={leader.title?.toLowerCase().includes('power') ? 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80' : leader.title?.toLowerCase().includes('space') || leader.title?.toLowerCase().includes('avionic') ? 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80' : leader.title?.toLowerCase().includes('communication') || leader.title?.toLowerCase().includes('ict') ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80' : 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80'} alt="Engineering field related to this leadership portfolio" loading="lazy"/>}<span className="leadershipMonogram">{leader.image ? <img src={leader.image} alt={leader.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit"}}/> : initials(leader.name||leader.metadata?.name||leader.title)}</span><span className="leadershipBannerSeal"><Award size={20}/></span><span className="leadershipBannerLabel">{leader.group === 'Current national leadership' ? 'CURRENT LEADERSHIP' : 'HISTORICAL RECORD'}</span></div>
        <div className="leadershipProfileContent"><span className="leadershipRole">{leader.title}</span><h3>{leader.name||leader.metadata?.name||leader.title}</h3>{leader.group === 'Past national chairmen' ? <p className="leadershipTenure">Tenure <strong>{leader.tenure}</strong></p> : <p>{leader.biography||leader.body||leader.summary}</p>}
          {leader.priorities?.length>0&&<div className="leadershipPriority"><b>Portfolio priorities</b><ul>{leader.priorities.slice(0,3).map(p=><li key={p}>{p}</li>)}</ul></div>}
          <div className="leadershipCardFooter"><span>{leader.group === 'Past national chairmen' ? 'Past national leadership' : (leader.group||'Institutional leadership')}</span>{leader.group !== 'Past national chairmen' && <button type="button" onClick={()=>openProfile(leader)}>Full profile <ArrowUpRight size={15}/></button>}</div>
        </div>
      </article>)}</div>}
      <div className="leadershipLowerContent">
        <div className="leadershipPhotoCarousel" aria-label="Leadership through collaboration carousel">
          <div className="leadershipPhotoCarouselTrack" ref={galleryRef}>
            <article><img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85" alt="Professionals gathered for a formal meeting"/><div><span>01 / PROFESSIONAL COMMUNITY</span><h3>Leadership through collaboration</h3><p>Professional dialogue, shared responsibility and service to the engineering community.</p></div></article>
            <article><img src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=85" alt="Engineering professionals working with technical equipment"/><div><span>02 / TECHNICAL PRACTICE</span><h3>Engineering expertise in action</h3><p>Connecting professional leadership with technical capability and practical knowledge.</p></div></article>
            <article><img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=85" alt="Electricity transmission infrastructure"/><div><span>03 / NATIONAL DEVELOPMENT</span><h3>Powering essential infrastructure</h3><p>Professional standards and technical knowledge that support reliable engineering systems.</p></div></article>
            <article><img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=85" alt="Professionals participating in a collaborative discussion"/><div><span>04 / GOVERNANCE</span><h3>Shared direction, clear accountability</h3><p>Governance, coordination and follow-through on institutional priorities.</p></div></article>
          </div>
          <div className="leadershipPhotoHint"><span>Swipe or scroll to explore</span><div><button type="button" onClick={()=>galleryRef.current?.scrollBy({left:-Math.max(260,galleryRef.current?.clientWidth*.65||260),behavior:'smooth'})} aria-label="Previous leadership slide">← Previous</button> <button type="button" onClick={()=>galleryRef.current?.scrollBy({left:Math.max(260,galleryRef.current?.clientWidth*.65||260),behavior:'smooth'})} aria-label="Next leadership slide">Next →</button></div></div>
        </div>
        <div className="leadershipGovernanceGrid">{governance.map(({icon:Icon,title,text})=><article key={title}><span><Icon size={22}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div>
    </section>
    {selected&&<div className="publicModalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&closeProfile()}><section className="publicDetailModal leadershipDetailModal" role="dialog" aria-modal="true" aria-labelledby="leader-detail-title"><button className="publicModalClose" onClick={closeProfile} aria-label="Close profile">×</button><div className="leadershipDetailHero">{selected.image ? <img className="leadershipDetailPhoto" src={selected.image} alt={selected.name || 'Executive portrait'} /> : <span className="leadershipDetailPhoto leadershipDetailInitials">{initials(selected.name||selected.title)}</span>}<div><span className="kicker">LEADERSHIP PROFILE</span><h2 id="leader-detail-title">{selected.name||selected.metadata?.name||selected.title}</h2><p>{selected.title}</p></div></div><h3>Professional profile</h3><p>{selected.biography||selected.body||selected.summary}</p>
      <div className="leadershipDetailFacts"><div><span>QUALIFICATIONS</span><ul>{(selected.qualifications||[]).map(x=><li key={x}>{x}</li>)}</ul></div><div><span>CAREER & EXPERIENCE</span><p>{selected.experience||'Career details have not been published in the available source material.'}</p></div><div><span>PROFESSIONAL DESIGNATIONS</span><p>{(selected.qualifications||[]).filter(x=>/FNSE|MNSE|FNIEEE|MNIEEE|COREN|CMC|FIMC|JP/.test(x)).join(', ')||'No additional professional designations listed in the available sources.'}</p></div><div><span>CONTACT</span>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : <p>Contact information not published</p>}</div><div><span>BASE</span><p>{selected.location||'Not listed in the cited record'}</p></div></div>
      {selected.career?.length>0&&<><h3>Career experience</h3><div className="leadershipCareerTimeline">{selected.career.map((job,i)=><article key={job.role+i}><span>{job.period}</span><b>{job.role}</b><p>{job.org}</p></article>)}</div></>}
      {selected.expertise?.length>0&&<><h3>Areas of expertise</h3><div className="leadershipExpertiseChips">{selected.expertise.map(x=><span key={x}>{x}</span>)}</div></>}
      {selected.responsibilities?.length>0&&<><h3>Role responsibilities</h3><ul className="leadershipDetailList">{selected.responsibilities.map(x=><li key={x}>{x}</li>)}</ul></>}
      {selected.priorities?.length>0&&<><h3>Portfolio priorities</h3><ul className="leadershipDetailList">{selected.priorities.map(p=><li key={p}>{p}</li>)}</ul></>}<div className="leadershipProfileSource"><span>{selected.source ? `Source: ${selected.source}` : 'NI4E leadership and governance'}</span></div><button className="textbtn publicCloseText" onClick={closeProfile}>Close profile</button></section></div>}
  </>;
}
