import React, {useEffect, useMemo, useState} from 'react';
import {X, ArrowRight, Check, Newspaper, CalendarDays, BookOpen, CalendarCheck, Share2} from 'lucide-react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';
import RelatedResources from '../components/RelatedResources';
import {supabase} from '../firebase/config';

export default function News({setPage}){
 useReveal(); const [selected,setSelected]=useState(null); const [filter,setFilter]=useState('All'); const [publishedArticles,setPublishedArticles]=useState([]);
 useEffect(()=>{let active=true;supabase?.from('site_content').select('*').eq('content_type','news').eq('published',true).order('created_at',{ascending:false}).then(({data})=>{if(active&&data?.length)setPublishedArticles(data.map(x=>[x.title,x.metadata?.category||'Announcements',x.summary,x.body,x.id]));}).catch(()=>{});return()=>{active=false}},[]);
 const articles=[['Annual General Engineering Conference registration opens','Events','Information about the Institution’s next major professional gathering.'],['Young engineers forum announced','Professional Development','An update for early-career engineers and emerging professionals.'],['New technical resources added','Resources','A newsroom update about newly published technical materials.']];
 const displayedArticles=publishedArticles.length?publishedArticles:articles;
 const featuredArticle=displayedArticles[0]||articles[0];
 const filtered=filter==='All'?displayedArticles:displayedArticles.filter(x=>x[1]===filter);
 return <><PageHero title="News & Announcements" crumb="News" desc="Keep up with Institution announcements, professional development updates, events and resources."/>
 <section className="section reveal newsroom"><div className="newsHeader"><div><span className="kicker">NI4E NEWSROOM</span><h2>What’s happening across the Institution.</h2><p>Approved announcements and stories can be published, categorised and managed by authorised administrators.</p></div><div className="newsFilters">{['All','Events','Professional Development','Resources'].map(x=><button className={filter===x?'active':''} key={x} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
 <div className="newsFeatured"><div className="featuredNewsVisual"><Newspaper size={48}/><span>FEATURED UPDATE</span></div><div><span className="tag">{featuredArticle[1]}</span><h3>{featuredArticle[0]}</h3><p>{featuredArticle[2]} {featuredArticle[3]||''}</p><button className="gold" onClick={()=>setSelected(featuredArticle)}>Read update <ArrowRight size={16}/></button></div></div>
 <div className="newsGrid enhancedNewsGrid">{filtered.map((a,i)=><article className="newsCardPro" key={a[0]}><div className={`newsImage n${i%3}`}><Newspaper size={28}/></div><div className="newsCardBody"><span className="tag">{a[1]}</span><small>NI4E NEWSROOM</small><h3>{a[0]}</h3><p>{a[2]}</p><button className="textbtn" onClick={()=>setSelected(a)}>Read story <ArrowRight size={15}/></button></div></article>)}</div><RelatedResources contentType="news" title="Related announcements and resources" /></section>
 {selected&&<div className="modalBackdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div className="detailModal newsModalPro"><button className="modalClose" onClick={()=>setSelected(null)}><X/></button><span className="tag">{selected[1]}</span><h2>{selected[0]}</h2><small>NI4E NEWSROOM · ARTICLE</small><p>{selected[2]}</p><p>{selected[3]||'Further information will be published by the Institution as details are confirmed.'}</p><RelatedResources contentType="news" title="Resources related to this story" compact /><div className="newsModalActions"><button className="darkbtn" onClick={()=>{setSelected(null);setPage?.('events')}}>Explore events <CalendarDays size={16}/></button><button className="textbtn" onClick={()=>{if(navigator.share)navigator.share({title:selected[0],text:selected[2],url:window.location.href}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(`${selected[0]} — ${selected[2]}`).catch(()=>{});}}><Share2 size={16}/> Share story</button><button className="textbtn" onClick={()=>setSelected(null)}>Close story <Check size={16}/></button></div></div></div>}
 </>
}
