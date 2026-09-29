import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, ChevronRight, CalendarDays, MapPin} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero, EventCard} from '../components';
import useReveal from '../hooks/useReveal';
import {events,heroSlides,institutionStats,quickResources} from '../data/site';

export default function Events(){
 useReveal();
 const [filter,setFilter]=useState('ALL'); const [selected,setSelected]=useState(null); const [saved,setSaved]=useState([]);
 const filters=['ALL','CONFERENCE','WORKSHOP','FORUM','ROUNDTABLE'];
 const filtered=filter==='ALL'?events:events.filter(e=>e[3]===filter);
 const toggleSave=(name)=>setSaved(v=>v.includes(name)?v.filter(x=>x!==name):[...v,name]);
 return <>
  <PageHero title="Events" crumb="Events" desc="Discover conferences, workshops, technical forums and professional gatherings organised through the NI4E digital platform."/>
  <section className="section reveal eventExperience">
   <div className="eventIntroBar"><div><span className="kicker">EVENT CENTRE</span><h2>Stay connected to the engineering community.</h2><p>Browse upcoming activities, open an event for its details and keep the ones you care about close at hand.</p></div><div className="eventMiniStats"><div><b>{events.length}</b><span>Listed events</span></div><div><b>{saved.length}</b><span>Saved by you</span></div></div></div>
   <div className="filterbar enhancedFilter">{filters.map(x=><button className={filter===x?'active':''} key={x} onClick={()=>setFilter(x)}>{x==='ALL'?'All events':x.charAt(0)+x.slice(1).toLowerCase()}</button>)}</div>
   <div className="eventGrid enhancedEventGrid">{filtered.map((e,i)=><article className="eventCardPro" key={e[0]} onClick={()=>setSelected(e)}>
    <div className="eventVisual"><div className="eventVisualMark"><CalendarDays size={28}/></div><span className="eventType">{e[3]}</span><button className={`saveEvent ${saved.includes(e[0])?'saved':''}`} aria-label="Save event" onClick={x=>{x.stopPropagation();toggleSave(e[0])}}>{saved.includes(e[0])?'Saved':'Save'}</button></div>
    <div className="eventCardBody"><div className="eventDateLine"><span>{e[1]}</span><span>{e[2]}</span></div><h3>{e[0]}</h3><p>Event details, programme information, participation options and registration will appear here as the Institution publishes the event.</p><div className="eventCardFooter"><span>View details <ArrowRight size={15}/></span><ChevronRight size={18}/></div></div>
   </article>)}</div>
  </section>
  {selected&&<div className="modalBackdrop" onMouseDown={x=>x.target===x.currentTarget&&setSelected(null)}><div className="detailModal eventModalPro"><button className="modalClose" onClick={()=>setSelected(null)}><X/></button><span className="tag">{selected[3]}</span><h2>{selected[0]}</h2><div className="modalMeta"><span><CalendarDays size={16}/>{selected[1]}</span><span><MapPin size={16}/>{selected[2]}</span></div><div className="modalSection"><span className="kicker">EVENT INFORMATION</span><p>Use this space for the approved event description, agenda, speakers, venue information, registration requirements and member participation details.</p></div><div className="modalActions"><button className="darkbtn" onClick={()=>toggleSave(selected[0])}>{saved.includes(selected[0])?'Remove saved event':'Save event'}</button><button className="gold" onClick={()=>setSelected(null)}>Register interest <ArrowRight size={16}/></button></div></div></div>}
 </>
}
