import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../firebase/config';
import { ArrowRight, BookOpen, GraduationCap, Lightbulb, Network, ShieldCheck, Users, Zap, Compass } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';

const history = [
  { year: 'Mid-1980s', title: 'The Electrical Division takes shape', text: 'Electrical engineers organised within the Nigerian Society of Engineers to build a specialist professional platform. Historical accounts place the Division’s formation in the mid-1980s and identify Engr. Dr. Olusegun O. Ajayi as a pioneer chairman.' },
  { year: '2006–2007', title: 'A distinct institutional identity', text: 'Members voted at the Electrical Division’s Annual General Meeting on 12 October 2006 to adopt the name Nigerian Institution of Electrical and Electronic Engineers. The NSE Council approved the change in January 2007.' },
  { year: '2012', title: 'Technical exchange through ICEPT', text: 'The 8th International Conference and Exhibition on Power and Telecommunications was documented in October 2012, reflecting the Institution’s role in technical discussion across power and communications.' },
  { year: '2013', title: 'Chapter and professional activities', text: 'NSE newsletter records documented the Bayelsa Chapter inauguration, the Distinguished Electrical and Electronics Engineer Annual Lecture and a national retreat in Yenagoa.' },
  { year: '2016', title: 'Power and communications in focus', text: 'The 12th ICEPT was announced for Jos, with a programme addressing power, telecommunications, asset management, maintenance, financing and infrastructure development.' },
  { year: '2022', title: 'NSE clarification and governance milestone', text: 'On 6 December 2022, the NSE reaffirmed that it recognises the Nigerian Institution of Electrical and Electronics Engineers as a professional Division and distinguished it from a similarly named separate organisation. The clarification also recorded a caretaker committee appointed to pilot the Institution’s affairs.' },
  { year: '2026', title: 'A new national leadership chapter', text: 'The supplied inauguration brochure records the inauguration of Engr. Alkali Abba Tijjani as the 23rd National Chairman on 13 June 2026, alongside the National Executive Council.' },
];

const objectives = [
  ['01', 'Advance professional practice', 'Promote technical competence, ethical conduct and continuous improvement across electrical and electronics engineering.'],
  ['02', 'Empower engineers', 'Support professional learning, mentoring, knowledge exchange and capacity development for practising engineers, graduates and students.'],
  ['03', 'Promote innovation and research', 'Encourage engineering research, practical innovation and the adoption of relevant emerging technologies.'],
  ['04', 'Strengthen technical collaboration', 'Connect members, chapters, academia, industry, government and other professional bodies around shared engineering priorities.'],
  ['05', 'Contribute to national development', 'Use engineering knowledge to inform infrastructure, energy security, industrial growth and the reliable systems communities depend on.'],
  ['06', 'Uphold professional ethics', 'Encourage safe, responsible and standards-conscious engineering decisions that protect people and public interest.'],
];

const disciplines = [
  [Zap, 'Power & energy', 'Generation, transmission, distribution, power-system reliability, energy efficiency and renewable energy.'],
  [Network, 'Telecommunications & ICT', 'Communications networks, information technology, digital infrastructure and connected systems.'],
  [Lightbulb, 'Electronics & manufacturing', 'Electronic systems, embedded technologies, electronic manufacturing and applied innovation.'],
  [Compass, 'Control & instrumentation', 'Industrial automation, measurement, process control, instrumentation and systems integration.'],
  [ShieldCheck, 'Installations & safety', 'Sound electrical installations, protection, standards awareness, risk management and safe practice.'],
  [GraduationCap, 'Research & development', 'Technical education, professional development, applied research and knowledge transfer.'],
];

const councilHighlights = [
  ['Engr. Alkali Abba Tijjani', 'National Chairman', '/images/executive-council/alkali-abba-tijjani.jpg'],
  ['Engr. Oloekunle Ezekiel Olusegun', 'Deputy National Chairman', '/images/executive-council/oloekunle-ezekiel-olusegun.jpg'],
  ['Engr. Dr. Hassan Natala', 'National Vice Chairman, Power', '/images/executive-council/hassan-natala.jpg'],
  ['Engr. Edima Ekanem', 'National Executive Council Member', '/images/executive-council/edima-ekanem.jpg'],
];

export default function About({ setPage }) {
  useReveal();
  const [managed, setManaged] = useState(null);
  useEffect(() => { let active = true; const load = async () => { if (!supabaseConfigured || !supabase) return; const { data, error } = await supabase.from('site_content').select('*').eq('content_type','institutional_page').eq('published',true).order('updated_at',{ascending:false}).limit(1); if (!error && active && data?.[0]) setManaged(data[0]); }; load(); return () => { active = false; }; }, []);
  const meta = managed?.metadata || {};
  const historyItems = Array.isArray(meta.history) && meta.history.length ? meta.history : history;
  const objectiveItems = Array.isArray(meta.objectives) && meta.objectives.length ? meta.objectives : objectives;
  const scopeItems = Array.isArray(meta.professional_scope) && meta.professional_scope.length ? meta.professional_scope : disciplines;
  return <>
    <PageHero title="About NI4E" crumb="About" desc="The professional Division of the Nigerian Society of Engineers advancing electrical and electronics engineering practice in Nigeria." />
    <main className="section aboutPageRedesign aboutInstitutionalPage">
      <section className="aboutInstitutionalLead">
        <div className="aboutInstitutionalCopy"><span className="kicker">WHO WE ARE</span><h2>{managed?.title || meta.headline || "Engineering expertise for a technologically powered Nigeria."}</h2><p className="aboutLeadText">{meta.introduction || "The Nigerian Institution of Electrical and Electronics Engineers (NI4E) is recognised by the Nigerian Society of Engineers (NSE) as a professional Division of the Society."}</p><p>{managed?.body || meta.second_paragraph || "It brings together the professional interests of electrical and electronics engineering practitioners across power, energy, telecommunications, electronics, instrumentation, control, automation and emerging technologies. Its purpose is to strengthen professional practice, technical knowledge and engineering’s contribution to national development."}</p><div className="aboutLeadActions"><button className="darkbtn" onClick={() => setPage?.('membership')}>Explore membership <ArrowRight size={16}/></button><button className="textbtn" onClick={() => setPage?.('contact')}>Contact the Institution</button></div></div>
        <aside className="aboutChairmanFeature"><div className="aboutChairmanImage"><img src="/images/executive-council/alkali-abba-tijjani.jpg" alt="Engr. Alkali Abba Tijjani, National Chairman"/></div><span className="kicker">NATIONAL LEADERSHIP · 2026</span><h3>Engr. Alkali Abba Tijjani</h3><p>23rd National Chairman</p><span className="aboutFeatureRule"/><p className="aboutChairmanQuote">“Professionalism, excellence, innovation and service to national development.”</p><button className="textbtn" onClick={() => setPage?.('leadership')}>Meet the National Executive Council <ArrowRight size={15}/></button></aside>
      </section>

      <section className="aboutVisionMission" aria-label="Vision and mission">
        <article className="aboutVisionCard"><span className="kicker">OUR VISION</span><h2>{meta.vision || "To be Africa’s leading professional institution for Electrical and Electronics Engineering, driving innovation, excellence and sustainable development for a technologically powered Nigeria."}</h2></article>
        <article className="aboutMissionCard"><span className="kicker">OUR MISSION</span><h2>{meta.mission_heading || "Advance the practice. Empower professionals. Enable national progress."}</h2><p>{meta.mission || "To advance the practice of Electrical and Electronics Engineering in Nigeria by empowering professionals, promoting innovation and research, upholding the highest ethical standards, and influencing policies that accelerate national infrastructure, energy security and industrial growth."}</p></article>
      </section>

      <section className="aboutInstitutionalObjectives" aria-labelledby="about-objectives-title"><div className="aboutSectionHeading"><span className="kicker">OUR OBJECTIVES</span><h2 id="about-objectives-title">What the Institution works to achieve</h2><p>Our objectives reflect the professional mandate described in the supplied institutional brochure and the priorities expressed in the 2026 National Chairman’s inaugural address.</p></div><div className="aboutObjectiveCards">{objectiveItems.map((item,index)=>{ const [number,title,text] = Array.isArray(item) ? item : [item.number || String(index+1).padStart(2,"0"), item.title, item.text]; return (<article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>); })}</div></section>

      <section className="aboutHistorySection" aria-labelledby="about-history-title"><div className="aboutHistoryIntro"><span className="kicker">OUR HISTORY</span><h2 id="about-history-title">A specialist engineering community within the NSE</h2><p>From the formation of the Electrical Division in the mid-1980s to national technical programmes and the 2026 leadership transition, NI4E’s history is part of the wider development of professional engineering in Nigeria.</p><a href="https://nse.org.ng/re-disclaimer-the-nigerian-institute-of-electrical-and-electronic-engineers-is-not-the-same-as-the-nigerian-institution-of-electrical-and-electronics-engineers/" target="_blank" rel="noreferrer">Read the NSE’s 2022 clarification <ArrowRight size={15}/></a></div><div className="aboutHistoryTimeline">{historyItems.map((item,index)=><article key={`${item.year}-${index}`}><div className="aboutHistoryYear">{item.year}</div><div className="aboutHistoryMarker" aria-hidden="true"><span/></div><div className="aboutHistoryText"><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></section>

      <section className="aboutDisciplines" aria-labelledby="about-disciplines-title"><div className="aboutSectionHeading"><span className="kicker">PROFESSIONAL SCOPE</span><h2 id="about-disciplines-title">Disciplines that support essential systems</h2><p>NI4E’s professional scope covers established engineering disciplines and emerging technologies relevant to Nigeria’s infrastructure, industry and digital economy.</p></div><div className="aboutDisciplineGrid">{scopeItems.map((entry,index)=>{ const [Icon,title,text] = Array.isArray(entry) ? entry : [Zap, entry.title, entry.text]; return <article key={title || index}><span><Icon size={23}/></span><h3>{title}</h3><p>{text}</p></article>; })}</div></section>

      <section className="aboutCouncilPreview"><div className="aboutSectionHeading"><span className="kicker">NATIONAL EXECUTIVE COUNCIL</span><h2>Leadership in service of the profession</h2><p>The National Executive Council provides national leadership and coordinates institutional priorities, technical activity and professional engagement.</p></div><div className="aboutCouncilPreviewGrid">{councilHighlights.map(([name,role,image])=><article key={name}><img src={image} alt={name} loading="lazy"/><div><h3>{name}</h3><p>{role}</p></div></article>)}</div><button className="darkbtn" onClick={() => setPage?.('leadership')}>View the leadership chart <ArrowRight size={16}/></button></section>

      <section className="aboutCommitmentBand"><div><span className="kicker">OUR COMMITMENT</span><h2>Professional excellence. Ethical practice. National impact.</h2><p>The Institution’s leadership has emphasised stronger chapters, professional capacity building, youth engagement, collaboration with industry and government, and a renewed commitment to innovation and service.</p></div><div className="aboutCommitmentActions"><button className="darkbtn" onClick={() => setPage?.('events')}><BookOpen size={16}/> Explore events & learning</button><button className="textbtn" onClick={() => setPage?.('chapters')}><Users size={16}/> Discover chapters</button></div></section>

      <section className="aboutRecognitionNote"><ShieldCheck size={22}/><div><h3>Institutional identity matters</h3><p>The NSE’s clarification dated 6 December 2022 distinguishes the Nigerian Institution of Electrical and Electronics Engineers from a separate organisation with a similar name. This website presents NI4E as the professional Division recognised by the NSE.</p></div></section>
    </main>
  </>;
}
