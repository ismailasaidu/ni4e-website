import React, {useEffect, useMemo, useState} from 'react';
import logo from '../assets/ni4e-logo.png';

export default function PageHero({title,crumb,desc}){return <section className="pageHero"><div className="pageHeroGrid"><div><span>HOME / {crumb.toUpperCase()}</span><h1>{title}</h1>{desc&&<p>{desc}</p>}</div><div className="heroWatermark"><img src={logo}/></div></div></section>}
