import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, ChevronRight, CalendarDays, MapPin} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';

export default function EventCard({e,i}){
 const [open,setOpen]=useState(false);
 return <><article className="event eventCard" onClick={()=>setOpen(true)} tabIndex="0" onKeyDown={x=>x.key==='Enter'&&setOpen(true)}>
  <div className="eventDate"><b>{String(20+i).padStart(2,'0')}</b><span>{i===0?'NOV':'MAR'}</span></div>
  <div><span className="tag">{e[3]}</span><h3>{e[0]}</h3><p>{e[1]} · {e[2]}</p></div>
  <button className="circle" aria-label={`View ${e[0]}`} onClick={x=>{x.stopPropagation();setOpen(true)}}><ChevronRight/></button>
 </article>
 {open&&<div className="modalBackdrop" onMouseDown={x=>x.target===x.currentTarget&&setOpen(false)}>
  <div className="detailModal"><button className="modalClose" onClick={()=>setOpen(false)}><X/></button><span className="kicker">{e[3]}</span><h2>{e[0]}</h2><div className="modalMeta"><span><CalendarDays size={16}/>{e[1]}</span><span><MapPin size={16}/>{e[2]}</span></div><p>View the full event information, registration details, venue, schedule and member participation options from one place.</p><button className="gold" onClick={()=>setOpen(false)}>Register interest <ArrowRight size={16}/></button></div>
 </div>}
 </>}
