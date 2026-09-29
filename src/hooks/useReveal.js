import {useEffect} from 'react';

export default function useReveal(){useEffect(()=>{const els=document.querySelectorAll('.reveal');const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});els.forEach(e=>io.observe(e));return()=>io.disconnect()},[])}
