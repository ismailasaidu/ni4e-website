import React, {useEffect, useMemo, useState} from 'react';
import {ArrowRight, Globe2} from 'lucide-react';
import {heroSlides} from '../data/site';
import logo from '../assets/ni4e-logo.png';

export default function HomeCarousel({setPage}){
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const slide=heroSlides[index];
 useEffect(()=>{
   if(paused)return;
   const timer=setInterval(()=>setIndex(i=>(i+1)%heroSlides.length),5500);
   return()=>clearInterval(timer);
 },[paused]);
 return <div className="ni4eCarousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
  <style>{`
   .ni4eCarousel{position:absolute;inset:0;z-index:3;display:flex;align-items:center}
   .ni4eCarousel .carouselContent{width:min(760px,92%);padding:0 6vw;color:#fff;animation:carouselIn .7s ease both}
   .ni4eCarousel .carouselEyebrow{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.16em;font-weight:800;color:#d6b66a;margin-bottom:18px}
   .ni4eCarousel .carouselEyebrow i{display:block;width:34px;height:2px;background:#d6b66a}
   .ni4eCarousel h1{font-size:clamp(42px,5.5vw,78px);line-height:1.02;max-width:780px;margin:0 0 20px;letter-spacing:-.045em}
   .ni4eCarousel h1 em{color:#d6b66a;font-style:normal}
   .ni4eCarousel p{max-width:680px;color:rgba(255,255,255,.78);font-size:16px;line-height:1.8;margin:0 0 28px}
   .ni4eCarousel .carouselControls{position:absolute;left:6vw;bottom:38px;display:flex;align-items:center;gap:12px}
   .ni4eCarousel .carouselArrow{width:42px;height:42px;border:1px solid rgba(255,255,255,.28);background:rgba(7,30,24,.3);color:#fff;border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:.25s}
   .ni4eCarousel .carouselArrow:hover{background:#d6b66a;color:#0b211b;transform:translateY(-2px)}
   .ni4eCarousel .dots{display:flex;gap:6px;margin:0 8px}
   .ni4eCarousel .dot{width:28px;height:3px;border:0;background:rgba(255,255,255,.28);cursor:pointer;padding:0}
   .ni4eCarousel .dot.active{background:#d6b66a}
   .ni4eCarousel .slideBadge{position:absolute;right:6vw;bottom:42px;display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.78);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
   .ni4eCarousel .slideBadge span{width:7px;height:7px;border-radius:50%;background:#58b889;box-shadow:0 0 0 5px rgba(88,184,137,.12)}
   @keyframes carouselIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
   @media(min-width:981px){.ni4eCarousel .carouselControls{bottom:0!important}.ni4eCarousel .carouselArrow{position:relative;top:55px!important}}
   @media(max-width:760px){
    .ni4eCarousel .carouselContent{padding:0 22px;margin-top:20px}
    .ni4eCarousel h1{font-size:42px}
    .ni4eCarousel p{font-size:14px;line-height:1.65}
    .ni4eCarousel .carouselControls{left:22px;bottom:22px}
    .ni4eCarousel .slideBadge{display:none}
   }
  `}</style>
  <div key={index} className="carouselContent">
   <div className="carouselEyebrow"><i/>{slide.eyebrow}</div>
   <div className="carouselIdentity"><span>NI4E</span><b>The Nigerian Institution of Energy, Electrical &amp; Electronics Engineers</b><small>A Division of the Nigerian Society of Engineers (NSE)</small></div>
   <h1>{slide.title}</h1>
   <p>{slide.text}</p>
   <div className="actions">
    <button className="gold magnetic" onClick={()=>setPage('register')}>Become a Member <ArrowRight size={18}/></button>
    <button className="outline" onClick={()=>setPage('about')}><Globe2 size={17}/> Explore NI4E</button>
   </div>
  </div>
  <div className="carouselControls">
   <button className="carouselArrow" aria-label="Previous slide" onClick={()=>setIndex(i=>(i-1+heroSlides.length)%heroSlides.length)}>←</button>
   <div className="dots">{heroSlides.map((_,i)=><button key={i} className={`dot ${i===index?'active':''}`} onClick={()=>setIndex(i)} aria-label={`Go to slide ${i+1}`}/>)}</div>
   <button className="carouselArrow" aria-label="Next slide" onClick={()=>setIndex(i=>(i+1)%heroSlides.length)}>→</button>
  </div>
  <div className="slideBadge"><span/>{slide.label}</div>
 </div>
}
