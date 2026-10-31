import React, { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, UserRound, ShieldCheck, CalendarDays, BookOpen, RefreshCw, Award, Download, Home, MoreHorizontal, MapPin, X, CheckCircle2, Ticket, ArrowRight, Clock3, FileCheck2, LockKeyhole } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { supabase } from '../firebase/config';
import { categories as membershipCategories } from '../pages/Membership';

const isOfficialEvent = row => !row?.metadata?.demo && !String(row?.slug || '').toLowerCase().startsWith('demo-') && !String(row?.title || '').trim().toLowerCase().startsWith('[demo]');

const sectionConfig = {
  memberProfile: { title: 'My Profile', description: 'Your account and contact details.', icon: UserRound },
  memberPayments: { title: 'Payment History', description: 'Membership payment records linked to your account.', icon: CreditCard },
  memberMembership: { title: 'Membership Details', description: 'Your current category, status and renewal information.', icon: ShieldCheck },
  memberEvents: { title: 'Events', description: 'Upcoming published NI4E events.', icon: CalendarDays },
  memberResources: { title: 'My Documents', description: 'Supporting evidence linked to your membership applications, upgrades and renewals.', icon: BookOpen },
};

export default function PortalSection({ page, setPage }) {
  const config = sectionConfig[page] || sectionConfig.memberProfile;
  const Icon = config.icon;
  const { user, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberRecord, setMemberRecord] = useState(null);
  const [myEventRegistrations, setMyEventRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventActionMessage, setEventActionMessage] = useState('');
  const [eventActionBusy, setEventActionBusy] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [now, setNow] = useState(Date.now());
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const refresh = async () => {
    if (!supabase || !user?.id) { setLoading(false); setError('Sign in to access your member information.'); return; }
    setLoading(true); setError('');
    try {
      let result;
      if (page === 'memberPayments') result = await supabase.from('membership_payments').select('id,category,amount_kobo,currency,provider,provider_reference,status,created_at,paid_at,payment_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
      else if (page === 'memberEvents') {
        const [eventsResult, registrationsResult] = await Promise.all([
          supabase.from('site_content').select('id,title,slug,summary,body,event_start,event_end,metadata').eq('content_type','event').eq('published',true).order('event_start',{ascending:true,nullsFirst:false}),
          supabase.from('event_registrations').select('id,event_id,event_title,status,payment_status,amount_kobo,currency,created_at,payment_reference').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100)
        ]);
        if (eventsResult.error) throw eventsResult.error;
        if (registrationsResult.error && !['42P01','PGRST205','42501'].includes(registrationsResult.error.code)) throw registrationsResult.error;
        setMyEventRegistrations(registrationsResult.error ? [] : (registrationsResult.data || []));
        result = {data:(eventsResult.data || []).filter(isOfficialEvent), error:null};
      }
      else if (page === 'memberResources') result = await supabase.from('membership_documents').select('id,application_id,document_type,file_name,storage_path,size_bytes,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
      else if (page === 'memberMembership') { const [apps, member] = await Promise.all([supabase.from('membership_applications').select('id,category,status,submitted_at,review_notes,application_type,previous_category,reviewed_at').eq('user_id',user.id).order('submitted_at',{ascending:false}).limit(20), supabase.from('profiles').select('full_name,membership_category,membership_status,membership_number,membership_activated_at,membership_expires_at').eq('id',user.id).maybeSingle()]); if (apps.error) throw apps.error; if (member.error) throw member.error; setMemberRecord(member.data || null); result = apps; }
      else result = { data: [], error: null };
      if (page === 'memberMembership') setMemberRecord(prev => prev || null);
      if (result.error) throw result.error;
      setData(result.data || []);
    } catch (e) { setError(e.message || 'Could not load this portal page.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, [page, user?.id]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const submitMembershipRequest = async (type, targetCategory) => {
    setRequestMessage(''); setRequestError('');
    if (!user?.id || !supabase) { setRequestError('Please sign in again before submitting a request.'); return; }
    const activeStatus = String(memberRecord?.membership_status || profile?.membership_status || profile?.membershipStatus || '').toLowerCase();
    if (activeStatus !== 'active') { setRequestError('Only an active member can request a grade upgrade or annual renewal.'); return; }
    const openStatuses = ['pending','under_review','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','payment_pending'];
    const existing = data.find(row => String(row.application_type || 'new').toLowerCase() === type && openStatuses.includes(String(row.status || '').toLowerCase()));
    if (existing) { setRequestError(`You already have a ${type === 'renewal' ? 'renewal' : 'grade upgrade'} request in progress. Reference: ${String(existing.id).slice(0,8).toUpperCase()}.`); return; }
    setRequestBusy(true);
    try {
      const currentCategory = memberRecord?.membership_category || profile?.membership_category || profile?.membershipCategory || data[0]?.category || 'Member';
      const { data: created, error: insertError } = await supabase.from('membership_applications').insert({
        user_id: user.id,
        full_name: profile?.fullName || profile?.full_name || user.user_metadata?.full_name || user.email,
        email: user.email,
        phone: profile?.phone || '',
        category: type === 'renewal' ? currentCategory : targetCategory,
        previous_category: currentCategory,
        application_type: type,
        status: 'pending',
        source: type === 'renewal' ? 'member-portal-renewal' : 'member-portal-upgrade',
        application_data: { request_type: type, current_category: currentCategory, requested_category: type === 'upgrade' ? targetCategory : currentCategory, submitted_from: 'member-portal', submitted_at: new Date().toISOString() }
      }).select('id').single();
      if (insertError) throw insertError;
      setRequestMessage(`${type === 'renewal' ? 'Annual renewal' : 'Grade upgrade'} request submitted. Reference: NI4E-${String(created.id).slice(0,8).toUpperCase()}. The Secretariat will review it before any payment is requested.`);
      await refresh();
    } catch (e) { setRequestError(e.message || 'Your request could not be submitted. Please try again.'); }
    finally { setRequestBusy(false); }
  };

  const registerForPortalEvent = async (event) => {
    setEventActionMessage('');
    if (!user?.id || !supabase) { setEventActionMessage('Please sign in again to register for an event.'); return; }
    if (event?.metadata?.demo || String(event?.id || '').startsWith('demo-')) { setEventActionMessage('This is sample content for preview only. Publish an approved event in the admin panel before testing real registration.'); return; }
    if (event?.metadata?.registration_open === false || String(event?.metadata?.registration_open).toLowerCase() === 'false') { setEventActionMessage('Registration for this event is currently closed.'); return; }
    const paid = event?.metadata?.is_paid === true || String(event?.metadata?.is_paid).toLowerCase() === 'true';
    const amountKobo = Number(event?.metadata?.fee_amount_kobo || 0);
    if (paid && amountKobo < 100) { setEventActionMessage('The event fee is not configured. No payment will be taken.'); return; }
    setEventActionBusy(true);
    try {
      if (paid) {
        const {data,error} = await supabase.functions.invoke('initialize-event-payment',{body:{event_id:String(event.id),full_name:profile?.fullName||profile?.full_name||user.user_metadata?.full_name||user.email,email:user.email,phone:profile?.phone||'',attendee_count:1}});
        if (error || data?.error || !data?.authorization_url) throw new Error(data?.error || error?.message || 'Could not start secure event checkout.');
        window.location.assign(data.authorization_url); return;
      }
      const {error} = await supabase.from('event_registrations').insert({event_id:String(event.id),event_title:event.title,user_id:user.id,full_name:profile?.fullName||profile?.full_name||user.user_metadata?.full_name||user.email,email:user.email,phone:profile?.phone||'',attendee_count:1,payment_status:'not_required',currency:'NGN'});
      if (error) { if (error.code === '23505') throw new Error('Your account is already registered for this event.'); if (['42P01','PGRST205'].includes(error.code)) throw new Error('The event-registration migration has not been applied to Supabase yet.'); throw error; }
      setEventActionMessage('Registration submitted successfully. It is now attached to your account.');
      const {data:rows} = await supabase.from('event_registrations').select('id,event_id,event_title,status,payment_status,amount_kobo,currency,created_at,payment_reference').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
      setMyEventRegistrations(rows||[]);
    } catch (e) { setEventActionMessage(e.message || 'Registration could not be completed. Please try again.'); }
    finally { setEventActionBusy(false); }
  };
  const money = row => row.amount_kobo == null ? '—' : new Intl.NumberFormat('en-NG',{style:'currency',currency:row.currency||'NGN'}).format(Number(row.amount_kobo)/100);
  return <section className="section portalSectionPage"><div className="portalSectionShell">
    <button className="outlineDark portalBackButton" onClick={() => setPage('dashboard')}><ArrowLeft size={16}/> Back to portal dashboard</button>
    <header className="portalSectionHeader"><span className="portalSectionIcon"><Icon size={24}/></span><div><span className="kicker">NI4E MEMBER PORTAL</span><h1>{config.title}</h1><p>{config.description}</p></div><button className="adminRefresh" onClick={refresh} disabled={loading}><RefreshCw size={15}/>{loading?'Loading…':'Refresh'}</button></header>
    {page === 'memberProfile' && <div className="portalDataGrid">{[['Full name',profile?.fullName||profile?.full_name||user?.user_metadata?.full_name||'Not recorded'],['Email',user?.email||'Not recorded'],['Phone',profile?.phone||'Not recorded'],['Account role',profile?.role||'Member']].map(([label,value])=><article key={label}><span>{label}</span><b>{value}</b></article>)}</div>}
    {page === 'memberMembership' && (() => {
      const currentCategory = memberRecord?.membership_category || profile?.membership_category || profile?.membershipCategory || data[0]?.category || 'Not recorded';
      const memberStatus = String(memberRecord?.membership_status || profile?.membershipStatus || profile?.membership_status || data[0]?.status || 'pending').toLowerCase();
      const expiry = memberRecord?.membership_expires_at ? new Date(memberRecord.membership_expires_at).getTime() : null;
      const remaining = expiry ? Math.max(0, expiry - now) : null;
      const countdown = remaining === null ? 'Not assigned' : remaining <= 0 ? 'Membership has expired' : `${Math.floor(remaining/86400000)}d ${Math.floor((remaining%86400000)/3600000)}h ${Math.floor((remaining%3600000)/60000)}m ${Math.floor((remaining%60000)/1000)}s`;
      const active = memberStatus === 'active';
      const pendingUpgrade = data.some(row => row.application_type === 'upgrade' && ['pending','under_review','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','payment_pending'].includes(String(row.status||'').toLowerCase()));
      const pendingRenewal = data.some(row => row.application_type === 'renewal' && ['pending','under_review','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','payment_pending'].includes(String(row.status||'').toLowerCase()));
      return <>
        <div className="ni4eMembershipOverview">
          <div className="ni4eMembershipOverviewMain"><span className="kicker">OFFICIAL MEMBERSHIP RECORD</span><h2>{profile?.fullName || profile?.full_name || user?.user_metadata?.full_name || 'Member'}</h2><p>{currentCategory} · {memberRecord?.membership_number || profile?.membership_number || 'Membership number pending'}</p><span className={`applicationStatus ${active ? 'active' : 'pending'}`}>{active ? 'Active member' : memberStatus.replaceAll('_',' ')}</span></div>
          <div className="ni4eMembershipCountdown"><span><Clock3 size={16}/> MEMBERSHIP VALIDITY</span><strong>{countdown}</strong><small>{expiry ? `Expires ${new Date(expiry).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'})}` : 'Expiry date has not been assigned'}</small></div>
        </div>
        <div className="portalDataGrid">{[['Membership category',currentCategory],['Membership number',memberRecord?.membership_number||profile?.membership_number||profile?.member_number||'Awaiting official assignment'],['Member since',memberRecord?.membership_activated_at?new Date(memberRecord.membership_activated_at).toLocaleDateString('en-NG'):'Not recorded'],['Membership status',memberStatus.replaceAll('_',' ')],['Expiry date',expiry?new Date(expiry).toLocaleDateString('en-NG'):'Not assigned']].map(([label,value])=><article key={label}><span>{label}</span><b>{value}</b></article>)}</div>
        {active && <div className="portalMembershipActions"><div><span className="kicker">KEEP YOUR MEMBERSHIP CURRENT</span><h3>Annual renewal</h3><p>Submit your renewal request for Secretariat review. Payment is only requested after the renewal is approved.</p></div><button className="gold" disabled={requestBusy || pendingRenewal} onClick={() => submitMembershipRequest('renewal')}>{pendingRenewal ? 'Renewal request in progress' : requestBusy ? 'Submitting…' : 'Request annual renewal'} <ArrowRight size={16}/></button></div>}
        <div className="portalPathwaysHeading"><div><span className="kicker">MEMBERSHIP DEVELOPMENT</span><h2>Membership grades & progression</h2><p>Review the published category guidance. Final eligibility and progression decisions remain subject to NI4E verification.</p></div></div>
        <div className="portalMembershipPathways">{membershipCategories.map((item,index)=>{const isCurrent=String(item.name).toLowerCase()===String(currentCategory).toLowerCase();return <article className={`portalMembershipPathway ${isCurrent?'current':''}`} key={item.name}><div className="portalPathwayTop"><span className="portalPathwayIcon"><item.icon size={20}/></span>{isCurrent?<span className="applicationStatus active">Current grade</span>:<span className="portalPathwayStep">GRADE {index+1}</span>}</div><h3>{item.name}</h3><p>{item.summary}</p><details><summary>Eligibility and supporting documents</summary><div className="portalPathwayDetails"><b>Eligibility</b><ul>{item.eligibility.map(v=><li key={v}>{v}</li>)}</ul><b>Supporting documents</b><ul>{item.documents.map(v=><li key={v}>{v}</li>)}</ul><p>{item.note}</p></div></details>{active && !isCurrent && <button className="outlineDark" disabled={requestBusy || pendingUpgrade} onClick={() => submitMembershipRequest('upgrade',item.name)}>{pendingUpgrade?'Upgrade request in progress':requestBusy?'Submitting…':'Request grade review'} <ArrowRight size={15}/></button>}{!active && <small className="portalPathwayLocked"><LockKeyhole size={13}/> Available after membership activation</small>}</article>})}</div>
        {requestError && <p className="adminAlert" role="alert">{requestError}</p>}{requestMessage && <p className="applicantUploadSuccess" role="status"><CheckCircle2 size={16}/>{requestMessage}</p>}
        {active && <div className="portalCertificateNotice"><Award size={22}/><div><b>Your membership certificate</b><p>Open your certificate options to view or print the official certificate available for your account.</p></div><button className="gold" onClick={() => setPage('dashboard')}><Download size={15}/> Certificate options</button></div>}
        <div className="portalPathwaysHeading"><div><span className="kicker">REQUEST HISTORY</span><h2>Membership applications & requests</h2><p>Track new membership, upgrade and renewal requests linked to your account.</p></div></div>
        {data.length ? <div className="portalRecordList">{data.map(row=><article key={row.id}><FileCheck2 size={20}/><div><b>{row.application_type==='upgrade'?'Grade upgrade':row.application_type==='renewal'?'Annual renewal':'Membership application'} · {row.category||'Category not recorded'}</b><span>NI4E-{String(row.id).slice(0,8).toUpperCase()} · {row.submitted_at?new Date(row.submitted_at).toLocaleDateString('en-NG'):'Date unavailable'}</span>{row.review_notes&&<p>{row.review_notes}</p>}</div><span className={`applicationStatus ${row.status==='active'?'active':'pending'}`}>{String(row.status||'pending').replaceAll('_',' ')}</span></article>)}</div> : <div className="portalEmptyState">No membership applications or requests have been recorded yet.</div>}
      </>;
    })()}
    {loading ? <p className="muted portalLoading">Loading your information…</p> : error ? <div className="portalSectionError" role="alert">{error}</div> : page === 'memberPayments' ? data.length ? <div className="portalResponsiveTable"><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead><tbody>{data.map(row=><tr key={row.id}><td>{row.created_at?new Date(row.created_at).toLocaleDateString():'—'}</td><td>{row.category||row.payment_type||'Membership'}</td><td>{money(row)}</td><td>{row.provider_reference||'—'}</td><td><span className={`applicationStatus ${row.status==='success'?'active':'pending'}`}>{row.status||'pending'}</span></td></tr>)}</tbody></table></div> : <div className="portalEmptyState">No membership payment records were found for this account.</div> : page === 'memberMembership' ? null : page === 'memberEvents' ? <div className="portalEventsWorkspace"><section className="portalEventBookings"><div className="portalWorkspaceHeading"><div><span className="kicker">YOUR ACTIVITY</span><h2>My event registrations</h2><p>Bookings and registration status linked to your signed-in account.</p></div><span className="portalCountPill">{myEventRegistrations.length} records</span></div>{myEventRegistrations.length ? <div className="portalRecordList">{myEventRegistrations.map(row=><article key={row.id}><Ticket size={20}/><div><b>{row.event_title}</b><span>{row.created_at?new Date(row.created_at).toLocaleDateString():'Date unavailable'} · {row.payment_status||'registration received'}</span>{row.payment_reference&&<small>Reference: {row.payment_reference}</small>}</div><span className={`applicationStatus ${row.status==='confirmed'||row.payment_status==='success'?'active':'pending'}`}>{row.status||row.payment_status||'submitted'}</span></article>)}</div> : <div className="portalEmptyState portalEmptyInline"><CalendarDays size={22}/><b>No event bookings yet</b><p>Browse the event programme below. When you register, your booking will appear here.</p></div>}</section><section className="portalEventBrowse"><div className="portalWorkspaceHeading"><div><span className="kicker">EVENTS & CPD</span><h2>Browse events</h2><p>View event information and start registration without leaving your Member Portal.</p></div></div>{data.length ? <><div className="portalEventFilters"><label>Search events<input value={eventSearch} onChange={e=>setEventSearch(e.target.value)} placeholder="Search workshops, conferences, CPD…"/></label><label>Programme type<select value={eventTypeFilter} onChange={e=>setEventTypeFilter(e.target.value)}><option value="all">All programmes</option>{[...new Set(data.map(row=>row.metadata?.event_type||'NI4E Event'))].map(type=><option key={type} value={type}>{type}</option>)}</select></label><span>{data.filter(row=>(row.title+' '+(row.summary||'')).toLowerCase().includes(eventSearch.toLowerCase())&&(eventTypeFilter==='all'||(row.metadata?.event_type||'NI4E Event')===eventTypeFilter)).length} events</span></div><div className="portalEventGrid">{data.filter(row=>(row.title+' '+(row.summary||'')).toLowerCase().includes(eventSearch.toLowerCase())&&(eventTypeFilter==='all'||(row.metadata?.event_type||'NI4E Event')===eventTypeFilter)).map(row=><article className="portalEventCard" key={row.id}><div className="portalEventCardTop"><span>{row.metadata?.event_type||'NI4E Event'}</span></div><h3>{row.title}</h3><p>{row.summary||row.body||'Event details will be published by NI4E.'}</p><div className="portalEventMeta"><span><CalendarDays size={15}/>{row.event_start?new Date(row.event_start).toLocaleDateString():'Date to be announced'}</span><span><MapPin size={15}/>{row.metadata?.venue||'Venue to be announced'}</span></div><button className="outlineDark" onClick={()=>{setSelectedEvent(row);setEventActionMessage('')}}>View details <ArrowRight size={15}/></button></article>)}</div></> : <div className="portalEmptyState">No published NI4E events are available at the moment. Events published on the main NI4E website will appear here automatically.</div>}</section>{selectedEvent&&<div className="portalEventModalBackdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setSelectedEvent(null)}><section className="portalEventModal" role="dialog" aria-modal="true" aria-labelledby="portal-event-title"><button className="portalEventModalClose" onClick={()=>setSelectedEvent(null)} aria-label="Close event details"><X size={20}/></button><span className="kicker">NI4E EVENTS & PROFESSIONAL DEVELOPMENT</span><h2 id="portal-event-title">{selectedEvent.title}</h2><p>{selectedEvent.summary||selectedEvent.body}</p>{selectedEvent.metadata?.agenda&&<div className="portalEventAgenda"><b>Programme / agenda</b><p>{Array.isArray(selectedEvent.metadata.agenda)?selectedEvent.metadata.agenda.join(' · '):selectedEvent.metadata.agenda}</p></div>}<div className="portalEventMeta"><span><CalendarDays size={15}/>{selectedEvent.event_start?new Date(selectedEvent.event_start).toLocaleString():'Date to be announced'}</span><span><MapPin size={15}/>{selectedEvent.metadata?.venue||'Venue to be announced'}</span></div>{eventActionMessage&&<p className="portalEventActionMessage" role="status">{eventActionMessage}</p>}<div className="portalEventModalActions"><button className="outlineDark" onClick={()=>setSelectedEvent(null)}>Close</button><button className="gold" disabled={eventActionBusy} onClick={()=>registerForPortalEvent(selectedEvent)}>{eventActionBusy?'Processing…':'Register from portal'}</button></div></section></div>}</div> : page === 'memberResources' ? data.length ? <div className="portalRecordList">{data.map(row=><article key={row.id}><BookOpen size={20}/><div><b>{String(row.document_type||'Document').replaceAll('_',' ')}</b><span>{row.file_name} · {row.size_bytes?`${(row.size_bytes/1048576).toFixed(2)} MB · `:''}{row.created_at?new Date(row.created_at).toLocaleDateString():''}</span><small>{row.application_id ? `Linked to application ${String(row.application_id).slice(0,8)}` : 'Member document'}</small></div>{row.storage_path&&<button className="outlineDark" onClick={async()=>{const {data:link,error:linkError}=await supabase.storage.from('membership-documents').createSignedUrl(row.storage_path,60);if(linkError){setError(linkError.message||'Document could not be opened.');return;}window.open(link.signedUrl,'_blank','noopener,noreferrer');}}><Download size={15}/> Open</button>}</article>)}</div> : <div className="portalEmptyState">Your submitted membership documents will appear here, grouped by their application. Public journals, books and technical papers are available in the Publications section of the main website.</div> : null}
  </div><nav className="memberMobileDock portalSectionMobileDock" aria-label="Member portal navigation"><button onClick={() => setPage('dashboard')}><Home size={19}/><span>Home</span></button><button className={page==='memberMembership'?'active':''} onClick={() => setPage('memberMembership')}><ShieldCheck size={19}/><span>Membership</span></button><button className={page==='memberPayments'?'active':''} onClick={() => setPage('memberPayments')}><CreditCard size={19}/><span>Payments</span></button><button className={page==='memberEvents'?'active':''} onClick={() => setPage('memberEvents')}><CalendarDays size={19}/><span>Events</span></button><button className={page==='memberProfile'||page==='memberResources'?'active':''} onClick={() => setPage(page==='memberResources'?'memberProfile':'memberResources')}><MoreHorizontal size={19}/><span>More</span></button></nav></section>;
}
