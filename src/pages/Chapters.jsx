import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, MapPin, Network, Phone, RefreshCw, Search, Users, Building2, Filter } from 'lucide-react';
import { PageHero } from '../components';
import useReveal from '../hooks/useReveal';
import RelatedResources from '../components/RelatedResources';
import { supabase, supabaseConfigured } from '../firebase/config';

const NATIONAL_OFFICE = {
  address: 'Veterinary Council Building, 1st Floor, No. 8 Zambezi Crescent, off Aguiyi Ironsi Street, Maitama, Abuja.',
  phone: '+234 704 711 2162',
  phoneAlt: '+234 805 552 3211'
};

// Chapter names, contacts and chapter chairmen are transcribed from the published chapter directory.
// Only Kaduna's local profile is expanded using the details supplied for this website.
const chapterDirectory = [
  ['Aba','Ministry of Works and Transportation, 11 Ikot Ekpene Road, Aba, Abia State','07031826157','Engr. Aronu Chinedu Nnaemeka','South-East'],
  ['Abeokuta','Bolude Oyebolu Engineering Center (BOEC), opposite OOPL, Abiola Way, Abeokuta, Ogun State','08030698768','Engr. Adegbuyi Temitayo Oyebimpe','South-West'],
  ['Abuja','Veterinary Council Building, 8 Zambezi Crescent, off Aguiyi Ironsi Street, Maitama, Abuja','08065698567','Engr. Maiyaki Ohida Asema','North-Central'],
  ['Ado Ekiti','Electrical Department, Ministry of Works and Transportation, Ado Ekiti, Ekiti State','08108645078','Engr. Fakunle Samuel Ojo','South-West'],
  ['Akure','Ondo State Electricity Board, Alagbaka Road, Akure, Ondo State','08035606305','Engr. Adeyemi Adeyonu Adedokun','South-West'],
  ['Asaba','Suite A4, Divine Plaza, Summit Road, Asaba, Delta State','07030842980','Engr. Donwa Obatarhe Valentina','South-South'],
  ['Awka','NSE Secretariat Office, No. 1 Igwebuka Road, Awka, Anambra State','08036675270','Engr. Alegu Joseph Ogbonna','South-East'],
  ['Bauchi','NSE Bauchi Secretariat, Federal Secretariat Office Complex, Bauchi, Bauchi State','08130719443','Engr. Prof. Yau Haruna','North-East'],
  ['Benin City','Electricity Regulatory Commission, 6th Floor, Secretariat Block C, Sapele Road, Benin City, Edo State','07035633594','No chapter chairman listed','South-South'],
  ['Calabar','Calabar Engineering Centre, Parliamentary Extension, Calabar, Cross River State','08096774312','Dr. Ojikutu Kazeem Adedayo','South-South'],
  ['Egbin-Ikorodu','NSE Egbin-Ikorodu Branch Secretariat, Right Wing, 1st Floor, Defaks Petrol Station, Ginti, along Ijede Road, Ikorodu, Lagos','08188442294','Engr. Ajayi Adekunle Babatope','South-West'],
  ['Eket','18B Udofa Avenue, P.O. Box 981, Eket, Akwa Ibom State','07038175163','Engr. James Elijah Ini','South-South'],
  ['Enugu','NSE Enugu Branch Secretariat, No. 52 Chine Avenue, New Haven, Enugu, Enugu State','08035514365','Engr. Nwagba Mackenneth Onyekachi','South-East'],
  ['Epe/Ibeju-Lekki','Centre for Space Transport and Propulsion, PMB 1002, LASU Campus, Epe, Lagos State','08020586312','Engr. Adedoyin Mary Abosede','South-West'],
  ['Gombe','NSE Secretariat, Ministry of Works and Transportation, Gombe, Gombe State','07037711265','Engr. Muhammed Musa Wuyo','North-East'],
  ['Ibadan','NSE Secretariat, Engr. Ife Akintunde House, Kolapo Ishola GRA, Ibadan, Oyo State','08035220384','Engr. Olaifa Gabriel Ayobami','South-West'],
  ['Ikot Ekpene','Ritman University, Ikot Ekpene, Akwa Ibom State','08033103571','Engr. Essien Ime Eseme','South-South'],
  ['Ilorin','NSE BEC Office, No. 1 Engineering Close, off Tunde Idigbon Road, University of Ilorin Main Campus, Tankie, Ilorin, Kwara State','08038292878','Engr. Oyewole Michael Olusegun','North-Central'],
  ['Jos','No. 25 Panjam Street, off Ahmadu Bello Way, Jos, Plateau State','08034526055','Engr. Ayuba Sama Ibrahim','North-Central'],
  ['Kaduna','Ministry of Public Works & Infrastructure, Kaduna, Kaduna State','08054436413','Engr. Jibia Garba Iliyasu','North-West'],
  ['Kano','NSE Secretariat, Ministry of Works and Infrastructure, Kano, Kano State','08030479666','Engr. Abba Ibrahim','North-West'],
  ['Katsina','NSE Secretariat, Old Ministry of Works and Housing, No. 137 Nagogo Road, GRA, Katsina, Katsina State','08037379996','Engr. Salisu Abdulmajid Mohammed','North-West'],
  ['Lagos','Suite 24, LSDPC Phase IV Services Office, by LAWMA Transfer Loading Station, Oba Ogunji Road, Ogba-Ogbo-Pen Cinema Link Road, Lagos','08038230714','Engr. Anuoluwadiji Oluwafemi Obaloluwa Oladapo John','South-West'],
  ['Lokoja','Federal University Lokoja, Faculty of Engineering, Department of Electrical and Electronics Engineering, Lokoja, Kogi State','08028785470','Engr. Saleh Umar Abubakar','North-Central'],
  ['Maiduguri','C/O NSE Secretariat, Ramat Shopping Complex, Maiduguri, Borno State','08035103595','No chapter chairman listed','North-East'],
  ['Makurdi','C/O Oboh, Julius Ageme, Transmission Company of Nigeria (TCN), Apir Road, Makurdi, Benue State','08164521557','Engr. Dr. Atser Roy','North-Central'],
  ['Minna','NSE Minna Branch Secretariat, opposite Dogon Koli Hotel, Nnamdi Azikiwe Way, Western Bypass, Minna, Niger State','08036207089','Engr. Mohammed Abubakar Saddiq','North-Central'],
  ['Nsukka','Department of Electrical Engineering, University of Nigeria, Nsukka, Enugu State','08054092208','Engr. Assoc. Prof. U.C. Ogbuefi','South-East'],
  ['Onitsha','NSE Secretariat, 32/105 Awka Road, Onitsha, Anambra State','08036666169','Engr. Iloh John Paul Izuchukwu','South-East'],
  ['Osogbo','NSE Osogbo Permanent Secretariat, behind Zarah Guest House, Onward Area, Osogbo, Osun State','08035028640','Engr. Ugwute Francis Okoro','South-West'],
  ['Port Harcourt','NSE Port Harcourt Branch Secretariat, B3 Bernard Carr Street, Water Works Yard, Old GRA, Port Harcourt, Rivers State','08037315949','Engr. Iloanwusi Nwachukwu Aloy','South-South'],
  ['Trans-Amadi','Danalec Office, Danjuma Drive, Trans-Amadi Industrial Area, Port Harcourt, Rivers State','08033388852','Engr. Ntemuse Johnson Sunday','South-South'],
  ['Uyo','267B Oron Road, Uyo, Akwa Ibom State','08172073420','Engr. Ibanga Ekerette Bernard','South-South'],
  ['Victoria Island','NSE Headquarters Annex, No. 1 Engineering Close, off Idowu Taylor, Victoria Island, Lagos','08034183844','Engr. Augustine Chukuemeka Duru','South-West'],
  ['Warri','NSE Secretariat, ORC House, 280 Effurun-Sapele Road, Effurun-Warri, Delta State','07058456638','Engr. Olawoyin Rasaki Abiola','South-South'],
  ['Yenagoa','NSE/COREN Secretariat, Ministry of Works, Yenagoa, Bayelsa State','07039333454','Engr. Ojukonsin Tebe Larry','South-South']
].map(([name,address,phone,chairman,region]) => ({
  id: `chapter-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
  title: name,
  location: address,
  address,
  phone,
  chairman,
  region,
  summary: `${name} Chapter connects electrical and electronics engineering practitioners through local professional engagement, technical knowledge-sharing and opportunities to participate in the Institution's activities.`,
  body: `${name} Chapter is listed in the published national chapter directory. Its listed address and contact number are provided below to help members and prospective members connect with the local professional network. Contact the chapter directly to confirm meeting schedules, local activities and current office-holder details.`,
  meta: { chapter_lead: chairman, phone, address, region }
}));

const extraChapterContent = (row) => ({
  ...row,
  title: row.title || row.name || 'Chapter',
  location: row.metadata?.location || row.metadata?.address || row.location || row.address || 'Nigeria',
  summary: row.summary || 'Chapter profile and contact information published by the Institution.',
  body: row.body || row.summary || 'Contact the chapter to confirm current activities and local information.',
  meta: { ...(row.metadata || row.meta || {}), demo: false }
});

export default function Chapters({ setPage }) {
  useReveal();
  const [items, setItems] = useState(chapterDirectory);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All regions');
  const [loading, setLoading] = useState(false);
  const [page, setCurrentPage] = useState(1);
  const pageSize = 9;

  const load = async () => {
    setLoading(true);
    try {
      if (!supabaseConfigured || !supabase) return;
      const { data, error } = await supabase.from('site_content').select('*').eq('content_type','chapter').eq('published',true).order('title',{ascending:true});
      if (error) throw error;
      const extras = (data || []).filter(row => row.metadata?.demo !== true && !String(row.id || '').startsWith('chapter-')).map(extraChapterContent);
      const byName = new Map(chapterDirectory.map(ch => [ch.title.toLowerCase(), ch]));
      extras.forEach(ch => { if (!byName.has(ch.title.toLowerCase())) byName.set(ch.title.toLowerCase(), ch); });
      const merged = [...byName.values()].sort((a,b) => a.title.localeCompare(b.title));
      setItems(merged);
    } catch {
      // Keep the usable published directory in place if the optional CMS is unavailable.
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [query, region]);

  const regions = useMemo(() => ['All regions', ...new Set(items.map(x => x.region || x.meta?.region).filter(Boolean))], [items]);
  const filtered = useMemo(() => items.filter(x => {
    const text = `${x.title} ${x.summary} ${x.body} ${x.location} ${x.chairman || x.meta?.chapter_lead || ''} ${x.phone || x.meta?.phone || ''} ${x.region || x.meta?.region || ''}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (region === 'All regions' || (x.region || x.meta?.region) === region);
  }), [items, query, region]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return <>
    <PageHero title="Chapters & Network" crumb="Chapters" desc="Browse chapter contacts and connect with the professional network across Nigeria." />
    <section className="section publicContentSection chaptersDirectorySection">
      <div className="publicListToolbar"><div><span className="kicker">NATIONAL NETWORK</span><h2>Chapters across Nigeria</h2><p className="chapterIntroText">Browse chapter contacts by location, leadership or region.</p></div><label className="publicSearch"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search chapters, city or contact" aria-label="Search chapters"/></label></div>
      <div className="chapterDirectoryControls"><div className="chapterRegionFilters" aria-label="Filter chapters by region"><Filter size={16}/>{regions.map(item=><button key={item} className={region===item?'active':''} onClick={()=>setRegion(item)}>{item}</button>)}</div><div className="chapterDirectoryActions"><span className="publicDirectoryHint"><Globe2 size={16}/> {filtered.length} of {items.length} chapters</span><button className="publicRefresh" onClick={load} disabled={loading}><RefreshCw size={15} className={loading?'chapterRefreshSpin':''}/> Refresh directory</button></div></div>
      {filtered.length === 0 ? <div className="publicState"><Network size={32}/><h3>No chapters match that search</h3><p>Try another chapter name, state, region, chairman or phone number.</p><button className="textbtn" onClick={()=>{setQuery('');setRegion('All regions');}}>Clear filters</button></div> : <div className="publicCardsGrid chapterDataGrid">{pageItems.map((x,i)=><article className={`publicDataCard chapterDataCard ${x.title.toLowerCase()==='kaduna'?'chapterFeaturedCard':''}`} key={x.id || x.title} style={{'--card-index':i}}>
        <div className="chapterCardGraphic"><div className="chapterGraphicOrb"><Network size={27}/></div><div className="chapterGraphicTitle"><span>CHAPTER NETWORK</span><strong>{x.region || x.meta?.region || 'Nigeria'}</strong></div><span className="chapterCardIndex">{String(i+1).padStart(2,'0')}</span></div>
        <div className="chapterDataBody"><span className="publicTag">{x.region || x.meta?.region || 'Nigeria'}</span><h3>{x.title} Chapter</h3><p className="chapterLocation"><MapPin size={16}/>{x.location}</p><div className="chapterContactBits">{(x.chairman || x.meta?.chapter_lead) && <span><Users size={15}/><span className="chapterContactValue"><b>Chairman</b><span className="chapterContactText">{x.chairman || x.meta?.chapter_lead || 'Not listed'}</span></span></span>}{(x.phone || x.meta?.phone) && <span><Phone size={15}/><span className="chapterContactValue"><b>Phone</b><span className="chapterContactText">{x.phone || x.meta?.phone}</span></span></span>}</div><div className="publicCardFooter">{(x.phone || x.meta?.phone) ? <a className="chapterCallLink" href={`tel:${(x.phone || x.meta?.phone).replace(/[^+\d]/g,'')}`}><Phone size={15}/> Call chapter</a> : <span className="chapterCallUnavailable">Contact not listed</span>}</div></div>
      </article>)}</div>}
      {filtered.length > pageSize && <nav className="chapterPagination" aria-label="Chapter directory pages"><span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>{Array.from({length: pageCount}, (_,i) => i + 1).map(n => <button type="button" key={n} className={page === n ? 'active' : ''} aria-current={page === n ? 'page' : undefined} onClick={() => setCurrentPage(n)}>{n}</button>)}<button type="button" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} aria-label="Next page">›</button></div></nav>}
      <div className="chapterNationalContact"><div className="chapterNationalIcon"><Building2 size={24}/></div><div className="chapterNationalCopy"><span className="kicker">NATIONAL SECRETARIAT</span><h3>Contact the National Secretariat</h3><p>{NATIONAL_OFFICE.address}</p><div className="chapterNationalLinks"><a href={`tel:${NATIONAL_OFFICE.phone.replace(/[^+\d]/g,'')}`}><Phone size={16}/>{NATIONAL_OFFICE.phone}</a><a href={`tel:${NATIONAL_OFFICE.phoneAlt.replace(/[^+\d]/g,'')}`}><Phone size={16}/>{NATIONAL_OFFICE.phoneAlt}</a></div></div></div>
      <RelatedResources contentType="chapter" title="Chapter resources and activity reports" />
    </section>

  </>;
}
