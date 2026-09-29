import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, Check, Newspaper} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';

export default function News(){
 useReveal(); const [selected,setSelected]=useState(null); const [filter,setFilter]=useState('All');
 const articles=[['Annual General Engineering Conference registration opens','Events','Information about the Institution’s next major professional gathering.'],['Young engineers forum announced','Professional Development','An update for early-career engineers and emerging professionals.'],['New technical resources added','Resources','A newsroom update about newly published technical materials.']];
 const filtered=filter==='All'?articles:articles.filter(x=>x[1]===filter);
 return <><PageHero title="News & Announcements" crumb="News" desc="Keep up with Institution announcements, professional development updates, events and resources."/>
 <section className="section reveal newsroom"><div className="newsHeader"><div><span className="kicker">NI4E NEWSROOM</span><h2>What’s happening across the Institution.</h2><p>Approved announcements and stories can be published, categorised and managed by authorised administrators.</p></div><div className="newsFilters">{['All','Events','Professional Development','Resources'].map(x=><button className={filter===x?'active':''} key={x} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
 <div className="newsFeatured"><div className="featuredNewsVisual"><Newspaper size={48}/><span>FEATURED UPDATE</span></div><div><span className="tag">{articles[0][1]}</span><h3>{articles[0][0]}</h3><p>{articles[0][2]} Article content, author, publication date and featured media can be managed from the newsroom.</p><button className="gold" onClick={()=>setSelected(articles[0])}>Read update <ArrowRight size={16}/></button></div></div>
 <div className="newsGrid enhancedNewsGrid">{filtered.map((a,i)=><article className="newsCardPro" key={a[0]}><div className={`newsImage n${i%3}`}><Newspaper size={28}/></div><div className="newsCardBody"><span className="tag">{a[1]}</span><small>NI4E NEWSROOM</small><h3>{a[0]}</h3><p>{a[2]}</p><button className="textbtn" onClick={()=>setSelected(a)}>Read story <ArrowRight size={15}/></button></div></article>)}</div></section>
 {selected&&<div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="detailModal newsModalPro"><button className="modalClose" onClick={()=>setSelected(null)}><X/></button><span className="tag">{selected[1]}</span><h2>{selected[0]}</h2><small>NI4E NEWSROOM · ARTICLE</small><p>{selected[2]}</p><p>The full approved article body, author, publication date, images and related links can be managed through the administration portal. This keeps the public newsroom connected to the Institution’s internal publishing workflow.</p><button className="gold" onClick={()=>setSelected(null)}>Close story <Check size={16}/></button></div></div>}
 </>
}
