import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, Search, FileText, Eye, Check} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';
import {publications} from '../data/site';

export default function Publications(){
 useReveal(); const [selected,setSelected]=useState(null); const [query,setQuery]=useState(''); const [saved,setSaved]=useState([]);
 const resources=publications.map((title,i)=>({title,type:['Journal','Practice Notes','Guideline','Annual Report'][i],year:'2026',description:['Technical knowledge and professional engineering content.','Practical notes for engineering and energy professionals.','Reference material for professional practice.','Institutional reporting and annual information.'][i]}));
 const filtered=resources.filter(x=>(x.title+x.type).toLowerCase().includes(query.toLowerCase()));
 const toggle=(x)=>setSaved(v=>v.includes(x)?v.filter(a=>a!==x):[...v,x]);
 return <><PageHero title="Publications" crumb="Publications" desc="A structured digital library for approved NI4E journals, technical notes, guidelines, reports and professional resources."/>
  <section className="section reveal libraryExperience"><div className="libraryHeader"><div><span className="kicker">NI4E DIGITAL LIBRARY</span><h2>Knowledge that stays organised.</h2><p>Search the library, preview a resource and save items for later. Publication metadata and files can be managed from the administration portal.</p></div><div className="librarySearch"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search publications..."/></div></div>
   <div className="libraryStats"><span><b>{resources.length}</b> resource types</span><span><b>{saved.length}</b> saved</span><span><b>PDF</b> ready library</span></div>
   <div className="publicationGrid enhancedPublicationGrid">{filtered.map((x,i)=><article className="publicationCardPro" key={x.title}><div className="pubCover"><span>NI4E</span><b>{x.type}</b><small>{x.year}</small></div><div className="pubBody"><div className="pubMeta"><span>{x.type}</span><button onClick={()=>toggle(x.title)}>{saved.includes(x.title)?'Saved':'Save'}</button></div><h3>{x.title}</h3><p>{x.description}</p><div className="pubActions"><button className="textbtn" onClick={()=>setSelected(x)}>Preview <Eye size={15}/></button><button className="textbtn" onClick={()=>setSelected(x)}>Details <ArrowRight size={15}/></button></div></div></article>)}</div>
  </section>
  {selected&&<div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="detailModal publicationModalPro"><button className="modalClose" onClick={()=>setSelected(null)}><X/></button><div className="pubModalCover"><span>NI4E</span><b>{selected.type}</b></div><span className="kicker">PUBLICATION PREVIEW</span><h2>{selected.title}</h2><p>{selected.description} The approved publication file, authorship, edition, date and access permissions can be managed by authorised NI4E administrators.</p><div className="resourcePreview"><FileText size={30}/><div><b>{selected.title}</b><span>{selected.type} · {selected.year} · Digital resource</span></div></div><button className="gold" onClick={()=>setSelected(null)}>Close preview <Check size={16}/></button></div></div>}
 </>
}
