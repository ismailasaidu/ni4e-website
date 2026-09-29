import React, {useEffect, useMemo, useState} from 'react';

export default function ScrollTop(){useEffect(()=>{const on=()=>document.documentElement.style.setProperty('--scroll',`${(scrollY/(document.body.scrollHeight-innerHeight))*100}%`);addEventListener('scroll',on,{passive:true});on();return()=>removeEventListener('scroll',on)},[]);return <div className="scrollProgress"/>}
