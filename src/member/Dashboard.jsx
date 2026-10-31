import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, Award, Bell, BookOpen, CalendarDays, Camera, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, FileCheck2, FileText, GraduationCap, Home, LogOut, Menu, RefreshCw, Save, ShieldCheck, UploadCloud, UserRound, X } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { supabase } from '../firebase/config';
import logo from '../assets/ni4e-logo.png';

const APP_STATUS = {
  pending: ['Awaiting review', 'pending'], under_review: ['Under review', 'review'],
  needs_information: ['Action required', 'action'], approved: ['Approved for documents', 'approved'],
  documents_submitted: ['Documents submitted', 'review'], committee_review: ['Committee verification', 'review'], committee_verified: ['Committee verified', 'approved'],
  approved_for_payment: ['Final approval · payment due', 'approved'], approved_pending_payment: ['Approved', 'approved'], payment_pending: ['Payment pending', 'review'],
  active: ['Completed', 'active'], rejected: ['Not approved', 'rejected'],
};
const appKind = row => row.application_type === 'upgrade' ? 'Membership upgrade' : row.application_type === 'renewal' ? 'Membership renewal' : 'New membership';
const refCode = id => `NI4E-${String(id || '').replaceAll('-', '').slice(0, 8).toUpperCase()}`;
const date = value => value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const isOfficialEvent = row => !row?.metadata?.demo && !String(row?.slug || '').toLowerCase().startsWith('demo-') && !String(row?.title || '').trim().toLowerCase().startsWith('[demo]');

export default function Dashboard({ setPage }) {
  const { user, profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [active, setActive] = useState('overview');
  const [member, setMember] = useState(null);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationWrapRef = useRef(null);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [cpd, setCpd] = useState([]);
  const [membershipPolicy, setMembershipPolicy] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeGrade, setUpgradeGrade] = useState('');
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [renewBusy, setRenewBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [documentFor, setDocumentFor] = useState('');
  const [documentType, setDocumentType] = useState('Professional qualification');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [submitDocsBusy, setSubmitDocsBusy] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [evidenceOpenFor, setEvidenceOpenFor] = useState('');
  const [paymentBusyFor, setPaymentBusyFor] = useState('');

  const load = useCallback(async () => {
    if (!user?.id || !supabase) { setLoading(false); setError('Please sign in to access your member workspace.'); return; }
    setLoading(true); setError('');
    try {
      const [memberResult, appResult, docResult, eventResult, notificationResult, cpdResult, policyResult] = await Promise.all([
        supabase.from('profiles').select('id,full_name,email,phone,avatar_url,membership_category,membership_status,membership_number,membership_activated_at,membership_expires_at,certificate_reference').eq('id', user.id).maybeSingle(),
        supabase.from('membership_applications').select('id,category,status,review_notes,submitted_at,reviewed_at,application_type,previous_category,application_data,rejected_at,reapplication_eligible_at,documents_submitted_at,committee_verified_at,final_approved_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(50),
        supabase.from('membership_documents').select('id,application_id,document_type,file_name,storage_path,size_bytes,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('site_content').select('id,title,slug,summary,body,event_start,event_end,metadata').eq('content_type', 'event').eq('published', true).order('event_start', { ascending: true, nullsFirst: false }),
        supabase.from('member_notifications').select('id,title,body,category,action_url,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('member_cpd_records').select('id,activity_title,provider,completion_date,hours').eq('user_id', user.id).order('completion_date', { ascending: false }).limit(50),
        supabase.rpc('ni4e_public_membership_policy'),
      ]);
      if (memberResult.error) throw memberResult.error;
      if (appResult.error) throw appResult.error;
      setMember(memberResult.data || null); setApplications(appResult.data || []); setProfilePhone(memberResult.data?.phone || profile?.phone || '');
      setDocuments(docResult.error ? [] : (docResult.data || [])); setEvents(eventResult.error ? [] : (eventResult.data || []).filter(isOfficialEvent));
      setNotifications(notificationResult.error ? [] : (notificationResult.data || [])); setNotificationError(notificationResult.error ? 'The notification service needs its Supabase migration. Ask the NI4E administrator to apply the member notifications migrations.' : ''); setCpd(cpdResult.error ? [] : (cpdResult.data || [])); setMembershipPolicy(policyResult.error ? {} : (policyResult.data || {}));
      const firstAction = (appResult.data || []).find(a => ['needs_information', 'pending', 'under_review'].includes(a.status));
      setDocumentFor(firstAction?.id || appResult.data?.[0]?.id || '');
    } catch (e) { setError(e.message || 'We could not load your membership workspace.'); }
    finally { setLoading(false); }
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id || !supabase) return undefined;
    const channel = supabase.channel(`member-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'member_notifications', filter: `user_id=eq.${user.id}` }, payload => {
        const incoming = payload.new;
        setNotifications(current => [incoming, ...current.filter(item => item.id !== incoming.id)].slice(0, 30));
      })
      .subscribe(status => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setNotificationError('Live notifications are temporarily unavailable. Refresh the page to check for updates.'); });
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const handlePointerDown = event => {
      if (notificationWrapRef.current && !notificationWrapRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  const unreadNotifications = notifications.filter(item => !item.read_at).length;
  const markNotificationRead = async notification => {
    if (!notification?.id || notification.read_at) return;
    const readAt = new Date().toISOString();
    setNotifications(current => current.map(item => item.id === notification.id ? { ...item, read_at: readAt } : item));
    const { error: updateError } = await supabase.from('member_notifications').update({ read_at: readAt }).eq('id', notification.id).eq('user_id', user.id);
    if (updateError) {
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, read_at: null } : item));
      setNotificationError('We could not mark this notification as read. Please try again.');
    }
  };
  const markAllNotificationsRead = async () => {
    if (!unreadNotifications) return;
    setNotificationBusy(true); setNotificationError('');
    const readAt = new Date().toISOString();
    const previous = notifications;
    setNotifications(current => current.map(item => item.read_at ? item : { ...item, read_at: readAt }));
    const { error: updateError } = await supabase.from('member_notifications').update({ read_at: readAt }).eq('user_id', user.id).is('read_at', null);
    if (updateError) { setNotifications(previous); setNotificationError('Notifications could not be updated. Please try again.'); }
    setNotificationBusy(false);
  };
  const openNotification = async notification => {
    // Reading a notification must never change the current dashboard section.
    // Navigation is an explicit action from the detail dialog instead.
    setSelectedNotification(notification);
    setNotificationsOpen(false);
    await markNotificationRead(notification);
  };
  const openNotificationDestination = notification => {
    const category = String(notification?.category || '').toLowerCase();
    const destination = category === 'event' ? 'events' : category === 'membership' ? 'membership' : category === 'cpd' ? 'development' : category === 'payment' ? 'applications' : 'applications';
    setSelectedNotification(null);
    go(destination);
  };

  const currentGrade = member?.membership_category || profile?.membership_category || profile?.membershipCategory || '';
  const memberNo = member?.membership_number || profile?.membership_number || profile?.member_number || '';
  const memberStatus = String(member?.membership_status || profile?.membership_status || profile?.membershipStatus || applications[0]?.status || 'not_applied').toLowerCase();
  const isActive = memberStatus === 'active';
  const expiry = member?.membership_expires_at;
  const expiryDate = expiry ? new Date(expiry) : null;
  const now = new Date();
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000) : null;
  const expired = (isActive || memberStatus === 'expired') && expiryDate && expiryDate.getTime() < now.getTime();
  const renewalOpenDaysRaw = membershipPolicy.ni4e_renewal_open_days_before_expiry;
  const renewalGraceDaysRaw = membershipPolicy.ni4e_renewal_grace_days;
  const renewalOpenDays = renewalOpenDaysRaw !== undefined && renewalOpenDaysRaw !== null && renewalOpenDaysRaw !== '' && renewalOpenDaysRaw !== 'not_configured' && Number.isFinite(Number(renewalOpenDaysRaw)) ? Number(renewalOpenDaysRaw) : null;
  const renewalGraceDays = renewalGraceDaysRaw !== undefined && renewalGraceDaysRaw !== null && renewalGraceDaysRaw !== '' && renewalGraceDaysRaw !== 'not_configured' && Number.isFinite(Number(renewalGraceDaysRaw)) ? Number(renewalGraceDaysRaw) : null;
  const renewalEligible = Boolean(memberNo && expiryDate && renewalOpenDays !== null && renewalGraceDays !== null && daysToExpiry <= renewalOpenDays && daysToExpiry >= -renewalGraceDays && (isActive || expired || memberStatus === 'expired'));
  const activeUpgradeRequest = applications.find(a => a.application_type === 'upgrade' && ['pending','under_review','needs_information','approved','documents_submitted','committee_review','committee_verified','approved_for_payment','approved_pending_payment','payment_pending'].includes(a.status));
  const latestRejectedUpgrade = applications.find(a => a.application_type === 'upgrade' && a.status === 'rejected');
  const upgradeReapplyAt = latestRejectedUpgrade?.reapplication_eligible_at ? new Date(latestRejectedUpgrade.reapplication_eligible_at) : null;
  const canReapplyUpgrade = (!upgradeReapplyAt || upgradeReapplyAt.getTime() <= now.getTime()) && !activeUpgradeRequest;
  const upgradeWaitMonths = Number(membershipPolicy.ni4e_upgrade_reapplication_wait_months || 6);
  const latest = applications[0] || null;
  const outstanding = applications.filter(a => ['pending', 'under_review', 'needs_information', 'approved', 'documents_submitted', 'committee_review', 'committee_verified', 'approved_for_payment', 'approved_pending_payment', 'payment_pending'].includes(a.status)).length;
  const cpdHours = cpd.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const greetingName = (member?.full_name || profile?.fullName || user?.user_metadata?.full_name || user?.email || 'Member').split(' ')[0];
  const nav = [
    { id: 'overview', label: 'Overview', group: 'MEMBER SPACE', icon: Home },
    { id: 'membership', label: 'My membership', group: 'MEMBER SPACE', icon: ShieldCheck },
    { id: 'applications', label: 'Applications', group: 'MEMBER SPACE', icon: ClipboardList, count: outstanding },
    { id: 'development', label: 'Development', group: 'PROFESSIONAL GROWTH', icon: GraduationCap },
    { id: 'events', label: 'Events & activities', group: 'PROFESSIONAL GROWTH', icon: CalendarDays },
    { id: 'account', label: 'Profile & account', group: 'MY RECORDS', icon: UserRound },
  ];
  const go = id => { setActive(id); setMobileNav(false); setActionMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const submitUpgrade = async () => {
    setActionMessage('');
    if (!upgradeGrade || upgradeGrade === currentGrade) { setActionMessage('Select a membership grade different from your current grade.'); return; }
    if (!canReapplyUpgrade) { setActionMessage(`Your previous upgrade application has a reapplication waiting period. You may apply again from ${date(upgradeReapplyAt)}.`); return; }
    if (!isActive || expired) { setActionMessage('An upgrade request is available after your membership is active and in good standing. Please contact the Secretariat if your record is incorrect.'); return; }
    if (!supabase || !user?.id) return;
    setUpgradeBusy(true);
    try {
      const pending = applications.find(a => a.application_type === 'upgrade' && ['pending', 'under_review', 'needs_information', 'approved', 'documents_submitted', 'committee_review', 'committee_verified', 'approved_for_payment', 'approved_pending_payment', 'payment_pending'].includes(a.status));
      if (pending) throw new Error(`You already have an upgrade request in progress (${refCode(pending.id)}). Open Applications to continue it.`);
      const { data, error: insertError } = await supabase.from('membership_applications').insert({
        user_id: user.id, full_name: member?.full_name || profile?.fullName || user.email, email: user.email, phone: member?.phone || profile?.phone || '',
        category: upgradeGrade, previous_category: currentGrade, status: 'pending', application_type: 'upgrade',
        application_data: { request_type: 'membership_upgrade', previous_category: currentGrade, requested_category: upgradeGrade, membership_number: memberNo || null }, source: 'member-upgrade'
      }).select('id,category,status,application_type,previous_category,submitted_at,review_notes,reviewed_at,application_data,rejected_at,reapplication_eligible_at').single();
      if (insertError) throw insertError;
      setApplications(rows => [data, ...rows]); setDocumentFor(data.id); setEvidenceOpenFor(''); setUpgradeOpen(false); setActionMessage(`Upgrade request submitted: ${refCode(data.id)}. Please keep checking Applications and your notification bell for NI4E's decision. If approved, or if the Secretariat requests more information, you will upload supporting documents against this same request. Your membership number remains unchanged.`); setActive('applications');
    } catch (e) { setActionMessage(e.message || 'Your upgrade request could not be submitted.'); }
    finally { setUpgradeBusy(false); }
  };

  const requestRenewal = async () => {
    setActionMessage('');
    if (!renewalEligible) { setActionMessage(expiryDate ? `Renewal is available ${renewalOpenDays === null || renewalGraceDays === null ? 'after NI4E configures the renewal window and grace period' : `within ${renewalOpenDays} days before expiry and ${renewalGraceDays} days after expiry`}. Your recorded expiry is ${date(expiry)}.` : 'Your membership expiry date has not been recorded. Please contact the Secretariat before requesting renewal.'); return; }
    const existing = applications.find(a => a.application_type === 'renewal' && ['pending', 'under_review', 'needs_information', 'approved', 'approved_pending_payment', 'payment_pending'].includes(a.status));
    if (existing) { setActionMessage(`You already have a renewal request in progress (${refCode(existing.id)}).`); setActive('applications'); return; }
    setRenewBusy(true);
    try {
      const { data, error: insertError } = await supabase.from('membership_applications').insert({ user_id: user.id, full_name: member?.full_name || profile?.fullName || user.email, email: user.email, phone: member?.phone || profile?.phone || '', category: currentGrade || 'Member', previous_category: currentGrade, status: 'pending', application_type: 'renewal', application_data: { request_type: 'annual_membership_renewal', membership_number: memberNo || null, membership_expires_at: expiry || null }, source: 'member-annual-renewal' }).select('id,category,status,application_type,previous_category,submitted_at,review_notes,reviewed_at,rejected_at,reapplication_eligible_at').single();
      if (insertError) throw insertError;
      setApplications(rows => [data, ...rows]); setActionMessage(`Renewal request submitted: ${refCode(data.id)}. NI4E will review it and confirm the next step.`); setActive('applications');
    } catch (e) { setActionMessage(e.message || 'Your renewal request could not be submitted.'); }
    finally { setRenewBusy(false); }
  };

  const submitApplicationResponse = async application => {
    setSubmitDocsBusy(true); setActionMessage('');
    try {
      const { error: submitError } = await supabase.rpc('member_submit_membership_response', { p_application_id: application.id });
      if (submitError) throw submitError;
      const nextStatus = application.application_type === 'upgrade' && (application.status === 'approved' || application.documents_submitted_at) ? 'documents_submitted' : 'under_review';
      setApplications(rows => rows.map(row => row.id === application.id ? { ...row, status: nextStatus } : row));
      setActionMessage(application.application_type === 'upgrade' ? `Your supporting documents for ${refCode(application.id)} have been submitted for committee verification.` : `Your requested information for ${refCode(application.id)} has been resubmitted to the Secretariat.`);
      await load();
    } catch (err) { setActionMessage(err.message || 'Your documents could not be submitted for verification.'); }
    finally { setSubmitDocsBusy(false); }
  };

  const uploadDocument = async e => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setActionMessage('');
    if (!documentFor || !applications.some(a => a.id === documentFor)) { setActionMessage('Choose the exact application this document belongs to.'); return; }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { setActionMessage('Choose a PDF, JPG or PNG document.'); return; }
    if (file.size > 5 * 1024 * 1024) { setActionMessage('The maximum file size is 5 MB.'); return; }
    setUploadBusy(true); let path = '';
    try {
      const suffix = (file.name || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      path = `${user.id}/${Date.now()}-${suffix}`;
      const { error: storageError } = await supabase.storage.from('membership-documents').upload(path, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from('membership_documents').insert({ user_id: user.id, application_id: documentFor, document_type: documentType.toLowerCase().replace(/[^a-z0-9]+/g, '_'), file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size });
      if (rowError) { await supabase.storage.from('membership-documents').remove([path]); throw rowError; }
      const { data, error: readError } = await supabase.from('membership_documents').select('id,application_id,document_type,file_name,storage_path,size_bytes,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
      if (readError) throw readError;
      setDocuments(data || []); setEvidenceOpenFor(documentFor); setActionMessage('Your document has been securely uploaded and linked to the selected request.');
    } catch (err) { setActionMessage(err.message || 'Document upload failed. Check the document storage setup and try again.'); }
    finally { setUploadBusy(false); }
  };

  const title = nav.find(n => n.id === active)?.label || 'Overview';
  const renderApplication = row => {
    const [label, tone] = row.status === 'approved' && row.application_type === 'upgrade' ? ['Approved for documents', 'approved'] : row.status === 'approved' ? ['Approved for payment', 'approved'] : (APP_STATUS[row.status] || ['In progress', 'review']);
    const gradeKey = ({ 'Graduate Member':'ni4e_upgrade_graduate_required_documents', 'Associate Member':'ni4e_upgrade_associate_required_documents', 'Corporate Member':'ni4e_upgrade_corporate_required_documents', 'Fellow':'ni4e_upgrade_fellow_required_documents' })[row.category];
    const configuredGradeDocuments = gradeKey ? String(membershipPolicy[gradeKey] || '') : '';
    const gradeDocuments = configuredGradeDocuments && !configuredGradeDocuments.toLowerCase().includes('not configured') ? configuredGradeDocuments.split(/\n|[,;]\s*/).map(item => item.trim()).filter(Boolean) : [];
    return <article className="ni4e-request-card" key={row.id}>
      <div className="ni4e-request-top"><span className="ni4e-request-kind">{appKind(row)}</span><span className={`ni4e-state ${tone}`}>{label}</span></div>
      <h3>{row.application_type === 'upgrade' ? `${row.previous_category || currentGrade || 'Current grade'} → ${row.category}` : row.category || 'Membership request'}</h3>
      <div className="ni4e-request-meta"><span>Reference <b>{refCode(row.id)}</b></span><span>Submitted <b>{date(row.submitted_at)}</b></span></div>
      {row.review_notes && <div className={`ni4e-review-note ${row.status === 'needs_information' ? 'attention' : ''}`}><b>{row.status === 'needs_information' ? 'Action requested by NI4E' : 'Secretariat update'}</b><p>{row.review_notes}</p></div>}
      {(row.status === 'needs_information' || (row.application_type === 'upgrade' && row.status === 'approved')) && <><div className="ni4e-evidence-stage"><b>{row.status === 'needs_information' ? 'NI4E has requested additional information' : 'Your upgrade request has been approved'}</b><p>{row.status === 'needs_information' ? 'Please provide the documents or details requested in the Secretariat note above. Upload them here so they remain attached to this application.' : 'Your request has passed the initial review. Submit the supporting professional documents for this grade using this application. You do not need to visit another document page.'}</p>{row.application_type === 'upgrade' && row.status === 'approved' && (gradeDocuments.length ? <ul className="ni4e-grade-document-list">{gradeDocuments.map((item,index)=><li key={`${item}-${index}`}>{item}</li>)}</ul> : <small className="ni4e-grade-document-note">The Secretariat will confirm the exact document checklist for this grade in its application feedback.</small>)}</div><button className="ni4e-text-action" onClick={() => { setDocumentFor(row.id); setEvidenceOpenFor(evidenceOpenFor === row.id ? '' : row.id); }}>{row.status === 'needs_information' ? 'Upload requested documents' : 'Upload upgrade documents'} <ArrowRight size={15}/></button>{evidenceOpenFor === row.id && <div className="ni4e-inline-evidence"><p>Documents uploaded here are attached to <b>{refCode(row.id)}</b>.</p><label>Document type<select value={documentType} onChange={e=>setDocumentType(e.target.value)}><option>Academic certificate</option><option>Professional qualification</option><option>Professional registration evidence</option><option>Evidence of professional experience</option><option>CPD certificate / record</option><option>Curriculum vitae</option><option>Other supporting evidence</option></select></label><label className="ni4e-upload-button"><UploadCloud size={16}/>{uploadBusy ? 'Uploading…' : 'Choose supporting document'}<input type="file" accept="application/pdf,image/jpeg,image/png" hidden disabled={uploadBusy} onChange={uploadDocument}/></label><small>PDF, JPG or PNG · Maximum 5 MB. Each file is attached to this application reference.</small>{(row.application_type === 'upgrade' || row.status === 'needs_information') && <button className="ni4e-primary-action ni4e-submit-docs" disabled={submitDocsBusy || !documents.some(doc => doc.application_id === row.id)} onClick={() => submitApplicationResponse(row)}>{submitDocsBusy ? 'Submitting…' : row.application_type === 'upgrade' && (row.status === 'approved' || row.documents_submitted_at) ? 'Submit documents for committee verification' : 'Submit requested information'} <ArrowRight size={15}/></button>}</div>}</>}
      {row.application_type === 'upgrade' && ['documents_submitted','committee_review','committee_verified','approved_for_payment'].includes(row.status) && <div className="ni4e-upgrade-stage-note"><b>{row.status === 'documents_submitted' ? 'Your documents have been submitted' : row.status === 'committee_review' ? 'Committee verification is in progress' : row.status === 'committee_verified' ? 'Committee verification completed' : 'Final approval granted'}</b><p>{row.status === 'documents_submitted' ? 'The committee will review the evidence attached to this application.' : row.status === 'committee_review' ? 'Please check your notifications for any committee feedback or request for clarification.' : row.status === 'committee_verified' ? 'Your documents have been verified. NI4E will record the final decision before payment becomes available.' : 'Your upgrade is finally approved. You can now proceed to the configured upgrade payment.'}</p></div>}
      {row.application_type === 'upgrade' && row.status === 'rejected' && <div className="ni4e-reapply-panel"><b>Reapplication eligibility</b><p>{row.reapplication_eligible_at ? (new Date(row.reapplication_eligible_at).getTime() > Date.now() ? `You may submit another upgrade request from ${date(row.reapplication_eligible_at)}. The waiting period is set by NI4E.` : 'Your waiting period has ended. If you now meet the membership requirements, you may submit a new upgrade request.') : 'Your decision is recorded. Please contact the Secretariat to confirm when you may reapply.'}</p>{row.reapplication_eligible_at && new Date(row.reapplication_eligible_at).getTime() <= Date.now() && <button className="ni4e-primary-action" onClick={() => { setUpgradeGrade(''); setUpgradeOpen(true); }}>Apply again <ArrowRight size={15}/></button>}</div>}
      {documents.filter(doc => doc.application_id === row.id).length > 0 && <div className="ni4e-linked-evidence"><b>Documents submitted for this request</b>{documents.filter(doc => doc.application_id === row.id).map(doc => <span key={doc.id}><FileText size={14}/>{doc.file_name} <small>{date(doc.created_at)}</small></span>)}</div>}
      {row.application_type === 'upgrade' && ['pending','under_review'].includes(row.status) && <p className="ni4e-waiting-review-note"><Clock3 size={15}/> Your request is being considered. Please check your notification bell for an approval, decision or request for more information. Supporting documents will be requested here at the appropriate stage.</p>}
      {((row.status === 'approved' && row.application_type !== 'upgrade') || (row.status === 'approved_for_payment' && row.application_type === 'upgrade')) && <button className="ni4e-primary-action" disabled={paymentBusyFor === row.id} onClick={async()=>{setPaymentBusyFor(row.id);setActionMessage('');try{const {data,error:invokeError}=await supabase.functions.invoke('initialize-membership-payment',{body:{application_id:row.id}});if(invokeError||data?.error||!data?.authorization_url)throw new Error(data?.error||invokeError?.message||'Secure payment could not be started.');window.location.assign(data.authorization_url);}catch(err){setActionMessage(err.message||'Payment could not be started. Please contact the Secretariat.');setPaymentBusyFor('');}}}>{paymentBusyFor === row.id ? 'Preparing secure payment…' : 'Continue to secure payment'} <ArrowRight size={15}/></button>}
    </article>;
  };

  return <div className={`ni4e-member-app ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className={`ni4e-member-sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="ni4e-member-brand"><img src={logo} alt="NI4E"/><div><b>NI4E</b><span>MEMBER SERVICES</span></div><button className="ni4e-sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19}/></button></div>
      <div className="ni4e-sidebar-caption">YOUR PROFESSIONAL SPACE</div>
      {['MEMBER SPACE', 'PROFESSIONAL GROWTH', 'MY RECORDS'].map(group => <div className="ni4e-nav-group" key={group}><span>{group}</span>{nav.filter(item => item.group === group).map(item => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => go(item.id)}><Icon size={18}/><span>{item.label}</span>{item.count > 0 && <i>{item.count}</i>}</button>; })}</div>)}
      <div className="ni4e-sidebar-bottom"><div className="ni4e-help-card"><span>NEED ASSISTANCE?</span><b>The Secretariat is here to help.</b><p>For membership-record corrections or policy questions, contact NI4E.</p><a href="mailto:info@ni4e.org">Contact Secretariat <ArrowRight size={13}/></a></div><button className="ni4e-logout" onClick={async () => { await logout(); setPage('home'); }}><LogOut size={17}/> Sign out</button></div>
    </aside>
    {mobileNav && <button className="ni4e-mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <main className="ni4e-member-main">
      <header className="ni4e-member-topbar"><button className="ni4e-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="ni4e-breadcrumb">MEMBER SERVICES <ChevronRight size={14}/> <b>{title.toUpperCase()}</b></div><div className="ni4e-top-actions"><div className="ni4e-notification-wrap" ref={notificationWrapRef}><button type="button" className={`ni4e-notification-button ${notificationsOpen ? 'is-open' : ''}`} onClick={() => { setNotificationsOpen(open => !open); setNotificationError(''); }} aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} aria-expanded={notificationsOpen} aria-haspopup="dialog"><Bell size={18}/>{unreadNotifications > 0 && <i>{unreadNotifications > 9 ? '9+' : unreadNotifications}</i>}</button>{notificationsOpen && <section className="ni4e-notification-popover" role="dialog" aria-label="Your notifications"><header><div><b>Notifications</b><small>{unreadNotifications ? `${unreadNotifications} unread updates` : 'You are all caught up'}</small></div><button onClick={markAllNotificationsRead} disabled={!unreadNotifications || notificationBusy}>{notificationBusy ? 'Updating…' : 'Mark all read'}</button></header>{notificationError && <p className="ni4e-notification-error">{notificationError}</p>}{notifications.length ? <div className="ni4e-notification-list">{notifications.map(item => <button key={item.id} className={`ni4e-notification-item ${!item.read_at ? 'unread' : ''}`} onClick={() => openNotification(item)}><span className="ni4e-notification-dot"/><span className="ni4e-notification-copy"><b>{item.title}</b><span>{item.body}</span><small>{date(item.created_at)} · {item.category || 'Update'}</small></span></button>)}</div> : <div className="ni4e-notification-empty"><Bell size={24}/><b>No notifications yet</b><span>Membership decisions, Secretariat requests and new NI4E event announcements will appear here.</span></div>}</section>}</div><div className="ni4e-user-chip"><span>{greetingName.slice(0,1).toUpperCase()}</span><div><b>{greetingName}</b><small>{currentGrade || 'NI4E member'}</small></div></div></div></header>
      <div className="ni4e-member-content">
        {error && <div className="ni4e-alert error">{error} <button onClick={load}>Retry</button></div>}
        {actionMessage && <div className="ni4e-alert info" role="status"><CheckCircle2 size={17}/><span>{actionMessage}</span><button onClick={() => setActionMessage('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {loading ? <div className="ni4e-loading-card"><span className="ni4e-spinner"/><b>Preparing your member workspace</b><p>Loading your official membership record and services.</p></div> : <>
          {active === 'overview' && <>
            <section className="ni4e-welcome"><div><span className="ni4e-eyebrow">YOUR PROFESSIONAL JOURNEY, IN ONE PLACE</span><h1>Welcome back, {greetingName}.</h1><p>Your NI4E membership, professional development and institutional activities—thoughtfully organised.</p></div><div className="ni4e-welcome-mark"><ShieldCheck size={36}/><span>NI4E<br/>MEMBER</span></div></section>
            <section className="ni4e-member-identity"><div className="ni4e-identity-seal"><ShieldCheck size={25}/></div><div className="ni4e-identity-main"><span>YOUR MEMBERSHIP IDENTITY</span><h2>{currentGrade || 'Membership applicant'}</h2><p>{memberNo ? `Membership number · ${memberNo}` : 'Your official membership number will appear here when assigned by NI4E.'}</p></div><div className="ni4e-identity-status"><span className={`ni4e-state ${expired ? 'action' : isActive ? 'active' : 'review'}`}>{expired ? 'Renewal due' : isActive ? 'Active member' : APP_STATUS[memberStatus]?.[0] || 'Application not started'}</span><small>{expiry ? `Valid until ${date(expiry)}` : 'Membership validity not yet recorded'}</small></div></section>
            <div className="ni4e-section-heading"><div><span className="ni4e-eyebrow">AT A GLANCE</span><h2>Your membership overview</h2></div><button onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</button></div>
            <section className="ni4e-stat-grid"><button onClick={() => go('applications')}><span><ClipboardList size={18}/></span><b>{applications.length}</b><small>Applications & requests</small></button><button onClick={() => go('applications')}><span><Clock3 size={18}/></span><b>{outstanding}</b><small>Awaiting attention</small></button><button onClick={() => go('development')}><span><Award size={18}/></span><b>{cpdHours.toFixed(1)}</b><small>Recorded CPD hours</small></button><button onClick={() => go('events')}><span><CalendarDays size={18}/></span><b>{events.length}</b><small>Published events</small></button></section>
            <section className="ni4e-overview-grid"><div className="ni4e-panel ni4e-next-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">YOUR NEXT STEP</span><h2>{latest ? appKind(latest) : 'Begin your NI4E journey'}</h2></div><Activity size={20}/></div>{latest ? <><p>{latest.review_notes || (latest.status === 'needs_information' ? 'NI4E has requested additional information. Review the Secretariat note and submit the requested document.' : 'Your latest request is recorded. Follow its progress and any Secretariat updates here.')}</p><div className="ni4e-next-meta"><span className={`ni4e-state ${(APP_STATUS[latest.status] || [])[1] || 'review'}`}>{(APP_STATUS[latest.status] || ['In progress'])[0]}</span><span>{refCode(latest.id)}</span></div><button className="ni4e-primary-action" onClick={() => go('applications')}>View application <ArrowRight size={16}/></button></> : <><p>Explore membership grades and begin an application when you are ready. Your progress and submitted records will be kept here.</p><button className="ni4e-primary-action" onClick={() => setPage('register')}>Start membership application <ArrowRight size={16}/></button></>}</div>
              <div className="ni4e-panel ni4e-quick-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">MEMBER SERVICES</span><h2>Useful actions</h2></div></div><button onClick={() => go('membership')}><ShieldCheck size={18}/><span><b>View membership record</b><small>Grade, number and validity</small></span><ChevronRight size={17}/></button><button onClick={() => setUpgradeOpen(true)}><Award size={18}/><span><b>Explore a membership upgrade</b><small>Request consideration for a higher grade</small></span><ChevronRight size={17}/></button><button onClick={requestRenewal} disabled={renewBusy}><RefreshCw size={18}/><span><b>{renewBusy ? 'Submitting renewal…' : 'Request membership renewal'}</b><small>For existing active or expired members</small></span><ChevronRight size={17}/></button><button onClick={() => go('applications')}><ClipboardList size={18}/><span><b>Track applications & documents</b><small>Requests, decisions and supporting evidence</small></span><ChevronRight size={17}/></button></div></section>
            <section className="ni4e-overview-grid lower"><div className="ni4e-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">RECENT REQUESTS</span><h2>Application activity</h2></div><button onClick={() => go('applications')}>View all <ArrowRight size={14}/></button></div>{applications.slice(0,3).length ? applications.slice(0,3).map(renderApplication) : <div className="ni4e-empty"><ClipboardList size={25}/><b>No applications yet</b><p>Your membership applications, upgrades and renewals will appear here.</p></div>}</div><div className="ni4e-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">INSTITUTIONAL UPDATES</span><h2>Latest notifications</h2></div></div>{notifications.length ? notifications.slice(0,4).map(n => <div className="ni4e-notification-row" key={n.id}><span/><div><b>{n.title}</b><p>{n.body}</p><small>{date(n.created_at)}</small></div></div>) : <div className="ni4e-empty compact"><Bell size={23}/><p>Important membership updates will appear here.</p></div>}</div></section>
          </>}
          {active === 'membership' && <><div className="ni4e-page-intro"><span className="ni4e-eyebrow">YOUR OFFICIAL RECORD</span><h1>My membership</h1><p>Your institutional identity, current grade and membership standing.</p></div><section className="ni4e-member-identity large"><div className="ni4e-identity-seal"><ShieldCheck size={27}/></div><div className="ni4e-identity-main"><span>OFFICIAL MEMBERSHIP GRADE</span><h2>{currentGrade || 'Not yet assigned'}</h2><p>{memberNo ? `Membership number · ${memberNo}` : 'Membership number pending official assignment'}</p></div><span className={`ni4e-state ${isActive && !expired ? 'active' : 'review'}`}>{expired ? 'Expired' : memberStatus.replaceAll('_', ' ')}</span></section><div className="ni4e-record-grid"><article><span>Membership number</span><b>{memberNo || 'Awaiting assignment'}</b><small>Retained across membership grade upgrades.</small></article><article><span>Current grade</span><b>{currentGrade || 'Not assigned'}</b><small>Changes only after NI4E approves an upgrade.</small></article><article><span>Member since</span><b>{date(member?.membership_activated_at)}</b><small>Official activation date.</small></article><article><span>Renewal / expiry</span><b>{date(expiry)}</b><small>As recorded in your official profile.</small></article></div><div className="ni4e-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">MEMBERSHIP PROGRESSION</span><h2>Upgrade or renew</h2></div></div><p className="ni4e-panel-copy">An upgrade changes your membership grade, not your membership number. An annual renewal request asks NI4E to extend your existing membership record. The Secretariat reviews the request and confirms the applicable dues and renewal period.</p><div className="ni4e-service-actions"><button onClick={() => setUpgradeOpen(true)} disabled={!canReapplyUpgrade}><Award size={19}/><b>{activeUpgradeRequest ? 'Upgrade request in progress' : canReapplyUpgrade ? 'Request a grade upgrade' : 'Upgrade reapplication on hold'}</b><small>{activeUpgradeRequest ? `Continue request ${refCode(activeUpgradeRequest.id)} in Applications.` : canReapplyUpgrade ? 'Initial review first; supporting evidence follows approval.' : `You may reapply from ${date(upgradeReapplyAt)}.`}</small><ArrowRight size={16}/></button><button onClick={requestRenewal} disabled={renewBusy || !renewalEligible}><RefreshCw size={19}/><b>{renewBusy ? 'Submitting…' : 'Request annual renewal'}</b><small>{renewalEligible ? `Renewal window is open. Expiry: ${date(expiry)}.` : expiryDate ? (renewalOpenDays === null || renewalGraceDays === null ? 'Renewal is unavailable until NI4E configures the opening window and grace period.' : `Renewal opens ${renewalOpenDays} days before expiry; grace period ${renewalGraceDays} days. Expiry: ${date(expiry)}.`) : 'Your official expiry date must be recorded before renewal can be requested.'}</small><ArrowRight size={16}/></button></div></div></>}
          {active === 'applications' && <><div className="ni4e-page-intro"><span className="ni4e-eyebrow">YOUR REQUEST HISTORY</span><h1>Applications & decisions</h1><p>One place for new membership applications, grade upgrades and renewals—including Secretariat feedback and requested corrections.</p></div><div className="ni4e-request-summary"><span><b>{applications.length}</b> Total requests</span><span><b>{outstanding}</b> In progress</span><span><b>{applications.filter(a => a.status === 'needs_information').length}</b> Need your attention</span></div><div className="ni4e-request-list">{applications.length ? applications.map(renderApplication) : <div className="ni4e-empty"><ClipboardList size={30}/><h3>No applications yet</h3><p>When you apply for membership, request an upgrade or renew your membership, each request and its progress will appear here.</p><button className="ni4e-primary-action" onClick={() => setPage('register')}>Explore membership application <ArrowRight size={16}/></button></div>}</div></>}
          {active === 'development' && <><div className="ni4e-page-intro"><span className="ni4e-eyebrow">CONTINUOUS PROFESSIONAL DEVELOPMENT</span><h1>Professional development</h1><p>CPD means Continuing Professional Development: structured learning and professional activities that help you maintain and develop your engineering knowledge. This page shows hours formally recorded and verified by NI4E; event attendance does not automatically become CPD credit.</p></div><div className="ni4e-record-grid"><article><span>Recorded activities</span><b>{cpd.length}</b></article><article><span>Total recorded hours</span><b>{cpdHours.toFixed(1)}</b></article></div><div className="ni4e-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">YOUR LEARNING RECORD</span><h2>Verified CPD record</h2></div></div><div className="ni4e-cpd-explainer"><b>What counts as a CPD record?</b><p>Examples include approved technical seminars, conferences, workshops, professional courses and other learning activities. NI4E records the activity, provider, completion date and approved hours. If an activity is missing, contact the Secretariat with your evidence; self-submission and certificate review are not yet enabled in this portal.</p></div>{cpd.length ? cpd.map(item => <div className="ni4e-cpd-row" key={item.id}><Award size={19}/><div><b>{item.activity_title}</b><p>{item.provider || 'Professional development'} · {date(item.completion_date)}</p></div><strong>{Number(item.hours || 0).toFixed(1)} hrs</strong></div>) : <div className="ni4e-empty"><GraduationCap size={28}/><b>No CPD records yet</b><p>CPD records will appear here when submitted and recorded by NI4E. This area is not a public course catalogue.</p></div>}</div></>}
          {active === 'events' && <><div className="ni4e-page-intro"><span className="ni4e-eyebrow">NI4E PROFESSIONAL COMMUNITY</span><h1>Events & activities</h1><p>Published conferences, workshops and professional activities from the NI4E website.</p></div><div className="ni4e-event-list">{events.length ? events.map(ev => <article key={ev.id} className={`ni4e-member-event-card ${(ev.metadata?.image_url || ev.metadata?.flyer_url) ? 'has-image' : ''}`}>{(ev.metadata?.image_url || ev.metadata?.flyer_url) ? <div className="ni4e-member-event-image"><img src={ev.metadata.image_url || ev.metadata.flyer_url} alt={`${ev.title} event artwork`} loading="lazy"/></div> : null}<div className="ni4e-event-date"><CalendarDays size={19}/><b>{ev.event_start ? new Date(ev.event_start).toLocaleDateString('en-NG', { day: '2-digit' }) : 'TBA'}</b><small>{ev.event_start ? new Date(ev.event_start).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) : 'Date TBA'}</small></div><div><span className="ni4e-eyebrow">PUBLISHED NI4E EVENT</span><h3>{ev.title}</h3><p>{ev.summary || ev.body || 'Further event information will be published by NI4E.'}</p><small>{ev.metadata?.venue || 'Venue to be announced'}</small></div><button onClick={() => setPage('events')}>Event details <ArrowRight size={15}/></button></article>) : <div className="ni4e-empty"><CalendarDays size={28}/><b>No published events at the moment</b><p>When NI4E publishes an event on the public website, it will appear here too.</p><button onClick={() => setPage('events')}>Visit public events page <ArrowRight size={15}/></button></div>}</div></>}
          {active === 'account' && <><div className="ni4e-page-intro"><span className="ni4e-eyebrow">YOUR ACCOUNT</span><h1>My profile</h1><p>Your profile is the contact and identity record used for NI4E correspondence. Your legal name and membership identity remain protected.</p></div><section className="ni4e-panel ni4e-profile-editor"><div className="ni4e-profile-editor-head"><div className="ni4e-account-avatar large">{member?.avatar_url ? <img src={member.avatar_url} alt="Your profile"/> : greetingName.slice(0,1).toUpperCase()}</div><div><span className="ni4e-eyebrow">MEMBER PROFILE</span><h2>{member?.full_name || greetingName}</h2><p>{user?.email}</p><label className="ni4e-photo-action"><Camera size={15}/>{avatarBusy ? 'Uploading photo…' : 'Upload profile photo'}<input type="file" accept="image/jpeg,image/png" hidden disabled={avatarBusy} onChange={async e => { const file=e.target.files?.[0]; e.target.value=''; if(!file)return; if(!['image/jpeg','image/png'].includes(file.type)){setActionMessage('Choose a JPG or PNG profile photo.');return;} if(file.size>3*1024*1024){setActionMessage('Your profile photo must be 3 MB or smaller.');return;} setAvatarBusy(true); try { const ext=file.type==='image/png'?'png':'jpg'; const path=`${user.id}/avatar-${Date.now()}.${ext}`; const {error:upErr}=await supabase.storage.from('member-avatars').upload(path,file,{upsert:true,contentType:file.type}); if(upErr)throw upErr; const {data:publicData}=supabase.storage.from('member-avatars').getPublicUrl(path); const avatarUrl=`${publicData.publicUrl}?v=${Date.now()}`; const {error:saveErr}=await supabase.from('profiles').update({avatar_url:avatarUrl,updated_at:new Date().toISOString()}).eq('id',user.id); if(saveErr)throw saveErr; setMember(m=>({...m,avatar_url:avatarUrl})); setActionMessage('Your profile photo has been saved.'); } catch(err){setActionMessage(err.message||'Profile photo upload failed. Check the member-avatars storage setup.');} finally{setAvatarBusy(false);} }}/></label></div></div><div className="ni4e-profile-fields"><label>Registered legal name<input value={member?.full_name || greetingName} readOnly/><small>For membership integrity, name corrections are verified by the Secretariat.</small></label><label>Account email<input value={user?.email || ''} readOnly/><small>Your sign-in email is managed through account security.</small></label><label>Contact telephone<input value={profilePhone} onChange={e=>setProfilePhone(e.target.value)} placeholder="+234…"/></label><div className="ni4e-profile-official-grid"><div><span>Membership number</span><b>{memberNo || 'Not yet assigned'}</b></div><div><span>Membership grade</span><b>{currentGrade || 'Not assigned'}</b></div><div><span>Membership status</span><b>{memberStatus.replaceAll('_',' ')}</b></div></div></div><button className="ni4e-primary-action" disabled={profileSaving} onClick={async()=>{setProfileSaving(true);try{const {error:saveErr}=await supabase.from('profiles').update({phone:profilePhone.trim(),updated_at:new Date().toISOString()}).eq('id',user.id);if(saveErr)throw saveErr;setMember(m=>({...m,phone:profilePhone.trim()}));setActionMessage('Your contact information has been saved.');}catch(err){setActionMessage(err.message||'Profile could not be saved.');}finally{setProfileSaving(false);}}}><Save size={16}/>{profileSaving?'Saving profile…':'Save profile'}</button></section><div className="ni4e-panel"><div className="ni4e-panel-heading"><div><span className="ni4e-eyebrow">ACCOUNT PROTECTION</span><h2>Sign-in and security</h2></div><ShieldCheck size={21}/></div><p className="ni4e-panel-copy">Your sign-in email is {user?.email}. Password changes and account recovery are handled separately from your professional profile.</p><button className="ni4e-secondary-action" onClick={() => setPage('memberSettings')}>Open security settings <ArrowRight size={15}/></button></div></>}
        </>}
        <footer className="ni4e-member-footer"><span>NI4E · MEMBER SERVICES</span><span>Your professional journey, supported.</span></footer>
      </div>
    </main>
    {selectedNotification && <div className="ni4e-modal-backdrop ni4e-notification-detail-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedNotification(null); }}><section className="ni4e-modal ni4e-notification-detail" role="dialog" aria-modal="true" aria-labelledby="notification-detail-title"><button className="ni4e-modal-close" onClick={() => setSelectedNotification(null)} aria-label="Close notification"><X size={19}/></button><span className="ni4e-eyebrow">NI4E MEMBER NOTIFICATION · {String(selectedNotification.category || 'UPDATE').replaceAll('_',' ').toUpperCase()}</span><div className="ni4e-notification-detail-icon"><Bell size={22}/></div><h2 id="notification-detail-title">{selectedNotification.title || 'Notification'}</h2><p className="ni4e-notification-detail-body">{selectedNotification.body || 'There are no additional details for this notification.'}</p><div className="ni4e-notification-detail-meta"><span>Received</span><b>{date(selectedNotification.created_at)}</b><span>Status</span><b>{selectedNotification.read_at ? 'Read' : 'Unread'}</b></div><div className="ni4e-modal-actions"><button className="ni4e-secondary-action" onClick={() => setSelectedNotification(null)}>Close</button><button className="ni4e-primary-action" onClick={() => openNotificationDestination(selectedNotification)}>Open related section <ArrowRight size={16}/></button></div></section></div>}
    {upgradeOpen && <div className="ni4e-modal-backdrop" role="presentation" onClick={() => setUpgradeOpen(false)}><section className="ni4e-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onClick={e => e.stopPropagation()}><button className="ni4e-modal-close" onClick={() => setUpgradeOpen(false)} aria-label="Close"><X size={19}/></button><span className="ni4e-eyebrow">MEMBERSHIP PROGRESSION</span><h2 id="upgrade-title">Request a membership upgrade</h2><p>Choose the grade you wish to be considered for. NI4E will review your eligibility first. If initially approved, you will submit supporting documents in this same application. Your existing membership number remains unchanged.</p><p className="ni4e-policy-inline">If an upgrade is declined, the current NI4E reapplication waiting period is {upgradeWaitMonths} month{upgradeWaitMonths === 1 ? '' : 's'}.</p><div className="ni4e-upgrade-current"><span>YOUR CURRENT GRADE</span><b>{currentGrade || 'Not assigned'}</b><small>Membership number: {memberNo || 'Not yet assigned'}</small></div><label>Requested membership grade<select value={upgradeGrade} onChange={e => setUpgradeGrade(e.target.value)}><option value="">Select a grade</option>{['Graduate Member', 'Associate Member', 'Corporate Member', 'Fellow'].filter(g => g !== currentGrade).map(g => <option key={g} value={g}>{g}</option>)}</select></label>{upgradeGrade && <div className="ni4e-upgrade-checklist"><b>What happens next</b><p>Submit your request first. NI4E will review your eligibility and notify you of its decision. If approved, the official document checklist and upload area will appear inside your application record.</p></div>}{activeUpgradeRequest && <div className="ni4e-modal-note"><Clock3 size={17}/><span>You already have an upgrade request in progress ({refCode(activeUpgradeRequest.id)}). Continue it from Applications rather than submitting another request.</span></div>}{!activeUpgradeRequest && !canReapplyUpgrade && <div className="ni4e-modal-note"><Clock3 size={17}/><span>Your previous upgrade application is still within NI4E's reapplication waiting period. You may apply again from {date(upgradeReapplyAt)}.</span></div>}<div className="ni4e-modal-note"><Clock3 size={17}/><span>First, submit your request for Secretariat consideration. You do not need to upload documents at this stage. Keep checking Applications and your notification bell. If your request is approved, or the Secretariat asks for more information, the document upload area will appear inside this same application.</span></div><div className="ni4e-modal-actions"><button className="ni4e-secondary-action" onClick={() => setUpgradeOpen(false)}>Cancel</button><button className="ni4e-primary-action" onClick={submitUpgrade} disabled={upgradeBusy || !upgradeGrade || !canReapplyUpgrade}>{upgradeBusy ? 'Submitting…' : 'Submit upgrade request'} <ArrowRight size={16}/></button></div></section></div>}
  </div>;
}
