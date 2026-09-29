import React, {useEffect, useMemo, useState} from 'react';
import {Menu, X, Search, LogIn} from 'lucide-react';
import {nav} from '../data/site';
import logo from '../assets/ni4e-logo.png';

export default function Header({setPage,onSearch}){
 const [open,setOpen]=useState(false); const [scrolled,setScrolled]=useState(false);
 useEffect(()=>{const f=()=>setScrolled(scrollY>18);const r=()=>{if(innerWidth>980)setOpen(false)};addEventListener('scroll',f,{passive:true});addEventListener('resize',r);f();return()=>{removeEventListener('scroll',f);removeEventListener('resize',r)}},[]);useEffect(()=>{document.body.classList.toggle('menu-open',open);return()=>document.body.classList.remove('menu-open')},[open]);
 return <header className={`header ${scrolled?'scrolled':''}`}><div className="navwrap">
  <button className="brand" onClick={()=>setPage('home')} aria-label="NI4E home"><img src={logo}/><span><b>NI4E</b><small>The Nigerian Institution of Energy,<br/>Electrical & Electronics Engineers<br/><em>A Division of the Nigerian Society of Engineers (NSE)</em></small></span></button>
  <nav className={open?'open':''}>{nav.map(([n,p])=><button key={p} onClick={()=>{setPage(p);setOpen(false)}}>{n}</button>)}</nav>
  <div className="navactions"><button className="iconbtn" onClick={onSearch} aria-label="Search"><Search size={18}/></button><button className="portal" onClick={()=>setPage('login')}><LogIn size={17}/> Member Portal</button><button className="mobile" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
 </div></header>
}
