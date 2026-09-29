import React, {useEffect, useMemo, useState} from 'react';
import logo from '../assets/ni4e-logo.png';
import {PageHero} from '../components';
import useReveal from '../hooks/useReveal';
import {presidents} from '../data/site';

export default function Presidents(){useReveal();return <><PageHero title="Past Presidents" crumb="Leadership / Past Presidents"/><section className="section reveal"><div className="presGrid">{presidents.map((p,i)=><article className="pres" key={p[0]}><div className="headshot"><span>{p[0].split(' ').slice(1,3).map(x=>x[0]).join('')}</span></div><span className="tag">{p[1]}</span><h3>{p[0]}</h3><p>Past National President</p></article>)}</div></section></>}
