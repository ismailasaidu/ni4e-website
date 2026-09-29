import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, Search, MapPin, Globe2, Check, Network} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';

export default function Chapters(){
 useReveal(); const [selected,setSelected]=useState(null); const [query,setQuery]=useState('');
 const chapters=['Abuja Chapter','Kaduna Chapter','Lagos Chapter','Kano Chapter','Jos Chapter','Port Harcourt Chapter'];
 const filtered=chapters.filter(x=>x.toLowerCase().includes(query.toLowerCase()));
 return <><PageHero title="Chapters" crumb="Chapters" desc="Connect with the NI4E network through local professional communities, chapter activities and member engagement."/>
 <section className="section reveal chapterExperience"><div className="chapterNetworkHero"><div className="networkOrb"><Network size={38}/></div><div><span className="kicker">CHAPTER NETWORK</span><h2>A connected national professional community.</h2><p>Explore chapter locations and access the contact, leadership, activities and membership information published by NI4E.</p></div><div className="chapterSearch"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a chapter..."/></div></div>
 <div className="chapterGrid enhancedChapterGrid">{filtered.map((x,i)=><article className="chapterCardPro" key={x} onClick={()=>setSelected(x)}><div className="chapterMap"><Globe2 size={25}/><span>{String(i+1).padStart(2,'0')}</span></div><div><span className="tag">CHAPTER</span><h3>{x}</h3><p>Chapter profile, leadership, contact information and activities.</p><button className="textbtn">Explore chapter <ArrowRight size={15}/></button></div></article>)}</div>
 </section>
 <section className="section reveal chapterJoin"><div><span className="kicker">CHAPTER ENGAGEMENT</span><h2>Looking for your local professional community?</h2><p>Use the chapter directory to find the relevant chapter and access its published information.</p></div><button className="darkbtn">View membership <ArrowRight size={16}/></button></section>
 {selected&&<div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="detailModal"><button className="modalClose" onClick={()=>setSelected(null)}><X/></button><span className="kicker">CHAPTER PROFILE</span><h2>{selected}</h2><p>Approved chapter information will appear here, including chapter leadership, contact details, meeting information, activities and member services.</p><div className="modalMeta"><span><Network size={16}/>Professional network</span><span><MapPin size={16}/>Location profile</span></div><button className="gold" onClick={()=>setSelected(null)}>Close <Check size={16}/></button></div></div>}
 </>
}
