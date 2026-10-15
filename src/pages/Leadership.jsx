import React from 'react';
import { ArrowRight, ExternalLink, Users, ShieldCheck } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';

const parentExecutives = [
 ['Engr. Ali Alimasuya Rabiu, FNSE, F.ASCE, FAEng, MFR','President'],
 ['Engr. Valerie Ifueko Agberagba, FNSE','Deputy President'],
 ['Engr. (Dr.) Halimat S. C. Adediran, FNSE','Vice-President — Engineering Technology & Innovation Management'],
 ['Engr. Ben Osy Okoh, FNSE, F.ASCE','Vice-President — Corporate Services'],
 ['Engr. Aluyah Dauda Okodugha, PhD, FNSE','Vice-President — Professional Development'],
 ['Engr. Rachel Serumun Ugye, FNSE','Vice-President — Assets Management'],
 ['Engr. Usman Tijjani, FNSE, mni','Vice-President — Membership Services'],
 ['Engr. Usman Abdu Abubakar, FNSE','EXCO Member — Engineering Technology & Innovation Management'],
 ['Engr. Ayotunde Olukayode Ogunnioki, FNSE, FNICE, FNIHTE','EXCO Member — Assets Management'],
 ['Engr. Evukowhiroro Ojegba, PhD, FNSE','EXCO Member — Membership Services'],
 ['Engr. Tijjani Dayyabu, FNSE','EXCO Member — Professional Development'],
 ['Engr. Dauda Musa, FNSE','EXCO Member — Corporate Services'],
 ['Engr. Nze Mathew Chuks Madu, FNSE, MNIEE, MNIEEE, MNIIndE, NIFEngM','EXCO Member — Collaboration and Linkages'],
 ['Engr. Margaret Aina Oguntala, FNSE','Immediate Past President'],
 ['Engr. Ibrahim Aliyu Dustinma, FNSE','Executive Secretary']
];
export default function Leadership({setPage}){useReveal();return <><PageHero title="Leadership" crumb="Leadership" desc="Explore the executive directory and institutional leadership information."/><section className="section reveal"><div className="sectionHead"><div><span className="kicker">EXECUTIVE DIRECTORY</span><h2>Executive Leadership</h2></div><a className="textbtn" href="https://nse.org.ng/2026-exco-members/" target="_blank" rel="noreferrer">View official source <ExternalLink size={16}/></a></div><div className="leaderMiniGrid parentLeadershipGrid">{parentExecutives.map(([name,role],i)=><article key={name} className="parentLeaderCard"><div className="miniPortrait">{name.replace(/^Engr\.? /,'').split(/\s+/).slice(0,2).map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div><b>{name}</b><span>{role}</span>{i===0&&<em>President</em>}</article>)}</div></section></>}
