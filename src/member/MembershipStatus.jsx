import React, { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardCheck, RefreshCw, FileText, CalendarClock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { supabase, supabaseConfigured } from '../firebase/config';
import { PageHero } from '../components';

const pretty = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const dateText = value => value ? new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
const humanLabel = key => String(key || '').replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function MembershipStatus({ setPage }) {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [hasSuccessfulPayment, setHasSuccessfulPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      if (!supabaseConfigured || !supabase) throw new Error('The membership database is not configured.');
      if (!user?.id) throw new Error('Please sign in to view your application.');
      const { data, error: queryError } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(50);
      if (queryError) throw queryError;
      const found = (data || []).find(row =>
        !String(row.category || '').toLowerCase().includes('fellowship') &&
        !['renewal', 'upgrade'].includes(String(row.application_type || '').toLowerCase())
      );
      const [{ data: profileData }, { data: paymentData }] = await Promise.all([
        supabase.from('profiles').select('full_name,email,phone,membership_category,membership_status,membership_number,membership_activated_at,membership_expires_at').eq('id', user.id).maybeSingle(),
        supabase.from('membership_payments').select('id,application_id,status,paid_at,amount_kobo,category,provider_reference').eq('user_id', user.id).eq('status', 'success').order('created_at', { ascending: false }).limit(10)
      ]);
      setMemberProfile(profileData || null);
      setHasSuccessfulPayment(Boolean((found?.id && paymentData?.some(payment => payment.application_id === found.id)) || (!found && paymentData?.length))); 
      const profileIsActive = String(profileData?.membership_status || '').toLowerCase() === 'active';
      setApplication(found || (profileIsActive ? { user_id: user.id, full_name: profileData?.full_name || user?.user_metadata?.full_name || user?.email, category: profileData?.membership_category || 'Member', status: 'active', application_type: 'member_record' } : null));
      if (!found && !profileIsActive) setError('No membership application linked to this signed-in account was returned by the database. If you have already applied, the record ownership or database access policy needs to be checked.');
    } catch (e) {
      setError(e?.message || 'Unable to load your application. Please try again.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user?.id]);

  const payload = application?.application_data && typeof application.application_data === 'object' ? application.application_data : {};
  const status = String((String(memberProfile?.membership_status || '').toLowerCase() === 'active' || String(application?.status || '').toLowerCase() === 'active') ? 'active' : (application?.status || memberProfile?.membership_status || 'pending')).toLowerCase();
  const statusLabel = ({ pending: 'Awaiting review', under_review: 'Under review', needs_information: 'Corrections requested', approved: 'Approved — payment next', payment_pending: 'Payment pending', active: 'Membership active', rejected: 'Application rejected' })[status] || pretty(status);
  const displayFields = Object.entries(payload).filter(([key, value]) => {
    if (value === null || value === undefined || value === '' || typeof value === 'object') return false;
    return !/password|token|secret|signed.?url|base64/i.test(key);
  }).slice(0, 40);

  return <>
    <PageHero title={String(memberProfile?.membership_status || '').toLowerCase() === 'active' ? "My Membership" : "My Membership Application"} crumb={String(memberProfile?.membership_status || '').toLowerCase() === 'active' ? "Membership / Member details" : "Membership / Application status"} desc={String(memberProfile?.membership_status || '').toLowerCase() === 'active' ? "Your NI4E membership details and direct access to member services." : "View your submitted membership details, current review status and the next step for your application."} />
    <section className="section">
      <div className="sectionHead membershipStatusSectionHead"><div><span className="kicker">{status === 'active' ? 'MEMBER PORTAL ACCESS' : 'APPLICANT PORTAL'}</span><h2>{status === 'active' ? 'Your membership' : 'Application details and status'}</h2></div>{status !== 'active' && <button className="outlineDark" onClick={() => setPage('membership')}><ArrowLeft size={16}/> Back to Membership</button>}</div>
      {loading ? <div className="applicationReviewMessage"><b>Loading your application…</b><p>Checking the membership record linked to your account.</p></div> : error ? <div className="applicationReviewMessage" role="alert"><b>{application ? 'Some application information could not be loaded' : 'We could not find your application'}</b><p>{error}</p><div className="formActions"><button className="gold" onClick={load}><RefreshCw size={16}/> Try again</button><button className="outlineDark" onClick={() => setPage('membership')}>Membership information</button></div></div> : (application || String(memberProfile?.membership_status || '').toLowerCase() === 'active') && <article className={`membershipApplicationStatusCard ${status === 'active' ? 'premiumActiveMemberCard ni4ePremiumMemberCard' : ''}`}>
        {status === 'active' ? <>
          <div className="ni4eMemberCardMasthead">
            <div className="ni4eMemberCardSeal"><ShieldCheck size={25}/></div>
            <div className="ni4eMemberCardBrand"><strong>NI4E</strong><span>Nigerian Institute for Energy, Electrical &amp; Electronics Engineers</span></div>
            <span className="ni4eMemberCardActive"><i/> Active member</span>
          </div>
          <div className="ni4eMemberCardDivider"/>
          <span className="ni4eMemberCardEyebrow">OFFICIAL MEMBERSHIP</span>
          <h2 className="ni4eMemberCardName">{memberProfile?.full_name || application?.full_name || user?.user_metadata?.full_name || 'Name not recorded'}</h2>
          <div className="ni4eMemberCardFacts"><div><span>MEMBERSHIP CATEGORY</span><b>{memberProfile?.membership_category || application?.category || 'Not recorded'}</b></div><div><span>MEMBERSHIP NUMBER</span><b>{memberProfile?.membership_number || 'Pending official assignment'}</b></div><div><span>MEMBER SINCE</span><b>{dateText(memberProfile?.membership_activated_at)}</b></div><div><span>RENEWAL / EXPIRY</span><b>{dateText(memberProfile?.membership_expires_at)}</b></div></div>
          <p className="ni4eMemberCardNote">Your membership is active. Your member services and account details are available in your portal.</p>
        </> : <>
          <div className="membershipServicesIcon"><ClipboardCheck size={27}/></div>
          <span className="tag">{memberProfile?.membership_category || application?.category || 'Membership application'}</span>
          <h2>{statusLabel}</h2>
          <p>{status === 'approved' ? 'Your application has been approved. Continue to the payment page to check the configured membership fee and available payment options.' : application?.review_notes || 'Your application has been recorded. This page will show status updates and any reviewer notes.'}</p>
        </> }
        {application && status !== 'active' && <div className="membershipFeePanel"><span>Application reference</span><b>NI4E-{String(application.id || '').replaceAll('-', '').slice(0, 8).toUpperCase()}</b><small>Submitted: {dateText(application.submitted_at)}</small></div>}
        {status !== 'active' && <><div className="membershipRequirementColumns">
          {application && <div className="membershipRequirementBlock"><h3><ShieldCheck size={18}/> Applicant information</h3><p><b>Full name:</b> {application.full_name || 'Not recorded'}</p><p><b>Email:</b> {application.email || user?.email || 'Not recorded'}</p><p><b>Phone:</b> {application.phone || 'Not recorded'}</p><p><b>Category:</b> {application.category || 'Not recorded'}</p><p><b>Last updated:</b> {dateText(application.updated_at)}</p></div>}
          {application && <div className="membershipRequirementBlock"><h3><CalendarClock size={18}/> Review information</h3><p><b>Status:</b> {statusLabel}</p><p><b>Application type:</b> {pretty(application.application_type || 'new')}</p><p><b>Reviewer notes:</b> {application.review_notes || 'No reviewer notes recorded.'}</p></div>}
        </div>
        {application && displayFields.length > 0 && status !== 'active' && <div className="membershipRequirementBlock"><h3><FileText size={18}/> Submitted details</h3><dl className="membershipSubmittedDetails">{displayFields.map(([key, value]) => <div key={key}><dt>{humanLabel(key)}</dt><dd>{String(value)}</dd></div>)}</dl></div>}</>}
        <div className="formActions">
          {status === 'approved' && <button className="gold" onClick={() => setPage('payment')}>Continue to payment</button>}
          {status === 'active' && <button className="gold ni4eMemberCardPortalButton" onClick={() => setPage('dashboard')}>View Membership Portal <span aria-hidden="true">→</span></button>}
          {status === 'needs_information' && <button className="gold" onClick={() => { try { sessionStorage.setItem('ni4e_membership_category', application.category || ''); } catch {} setPage('register'); }}>Update application</button>}
          {status === 'rejected' && <p>Review the notes above for the decision and contact the Secretariat if you need clarification about the permitted next step.</p>}
          <button className="outlineDark" onClick={load}><RefreshCw size={16}/> Refresh status</button>
        </div>
      </article>}
    </section>
  </>;
}
