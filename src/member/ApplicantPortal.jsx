import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, RefreshCw, UploadCloud } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { requireSupabase, supabase } from '../firebase/config';
import { PageHero } from '../components';

const makeUploadId = () => {
  try { if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
const statusText = status => ({ pending: 'Pending review', under_review: 'Under review', needs_information: 'More information requested', approved: 'Approved — payment due', payment_pending: 'Payment pending', active: 'Active membership', rejected: 'Application not approved' }[status] || status || 'Pending review');

export default function ApplicantPortal({ setPage }) {
  const { user, profile } = useAuth();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Passport photograph');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPortalData = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true); setError('');
    try {
      requireSupabase();
      const [{ data: app, error: appError }, { data: docs, error: docsError }] = await Promise.all([
        supabase.from('membership_applications').select('id,category,status,review_notes,submitted_at,reviewed_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('membership_documents').select('id,document_type,file_name,size_bytes,created_at').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (appError) throw appError;
      if (docsError) throw docsError;
      setApplication(app || null);
      setDocuments(docs || []);
    } catch (err) {
      setError(err.message || 'Could not load your application details.');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadPortalData(); }, [loadPortalData]);

  const uploadDocument = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setMessage('');
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { setError('Choose a PDF, JPG or PNG file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Each document must be 5 MB or smaller.'); return; }
    if (!application?.id) { setError('No membership application is linked to this account yet. Contact NI4E or submit an application first.'); return; }
    setUploading(true);
    let path = '';
    try {
      requireSupabase();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      path = `${user.id}/${makeUploadId()}-${safeName}`;
      const { error: storageError } = await supabase.storage.from('membership-documents').upload(path, file, { contentType: file.type, upsert: false });
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from('membership_documents').insert({ user_id: user.id, application_id: application.id, document_type: docType.toLowerCase().replace(/\s+/g, '_'), file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size });
      if (rowError) {
        await supabase.storage.from('membership-documents').remove([path]);
        path = '';
        throw rowError;
      }
      setMessage('Document uploaded securely and linked to your application.');
      await loadPortalData();
    } catch (err) {
      setError(err.message || 'Document upload failed. Check the Supabase storage bucket and policies, then retry.');
    } finally { setUploading(false); }
  };

  const currentStatus = application?.status || profile?.membershipStatus || 'application_pending';
  return <>
    <PageHero title="Member Portal" crumb="Member Portal" desc="Check your application, respond to review requests and submit supporting documents securely." />
    <section className="section applicantPortalSection">
      <div className="applicationPanel applicantPortalPanel">
        <div className="applicationPanelHead"><div><span className="kicker">APPLICATION ACCESS</span><h2>Your NI4E application</h2><p>Your account is signed in, but full member features remain locked until NI4E approval and verified payment.</p></div><button className="adminRefresh" onClick={loadPortalData} disabled={loading}><RefreshCw size={16}/>{loading ? 'Loading…' : 'Refresh status'}</button></div>
        {loading ? <p className="muted">Loading your application…</p> : application ? <>
          <div className="applicationStatusSummary"><span className={`applicationStatus ${application.status || 'pending'}`}>{statusText(application.status)}</span><span className="muted">Reference: {application.id}</span><span className="muted">Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : '—'}</span></div>
          {application.review_notes && <div className="applicationReviewMessage"><b>Message from NI4E</b><p>{application.review_notes}</p></div>}
        </> : <div className="publicState"><FileText size={30}/><h3>No application found</h3><p>This account does not have a linked membership application yet.</p><button className="gold" onClick={() => setPage('register')}>Start an application <ArrowRight size={16}/></button></div>}
        {currentStatus !== 'active' && <div className="applicantAccessNotice"><LockKeyhole size={20}/><div><b>Full member access is restricted</b><p>Member-only dashboard features unlock after NI4E approves the application and verifies the required payment. You can still upload or replace application documents below.</p></div></div>}
        <div className="applicantUploadArea"><div><span className="kicker">SUPPORTING DOCUMENTS</span><h3>Upload a document</h3><p>PDF, JPG or PNG · Maximum 5 MB per file. Documents are private and linked to your application.</p></div><div className="documentUploadControls"><select value={docType} onChange={e => setDocType(e.target.value)} aria-label="Document type"><option>Passport photograph</option><option>Qualification certificate</option><option>Professional certificate</option><option>Proof of payment</option><option>Other supporting document</option></select><label className="gold uploadDocumentButton">{uploading ? 'Uploading…' : 'Choose file'}<input type="file" accept="application/pdf,image/jpeg,image/png" hidden disabled={uploading || !application?.id} onChange={uploadDocument}/><UploadCloud size={16}/></label></div></div>
        {error && <p className="adminAlert" role="alert">{error}</p>}{message && <p className="applicantUploadSuccess" role="status"><CheckCircle2 size={16}/>{message}</p>}
        <div className="documentList">{documents.length ? documents.map(doc => <div key={doc.id}><FileText size={17}/><span><b>{String(doc.document_type || 'document').replaceAll('_', ' ')}</b><small>{doc.file_name} · {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB · {new Date(doc.created_at).toLocaleDateString()}</small></span></div>) : <p className="muted">No supporting documents uploaded yet.</p>}</div>
        <div className="formActions"><button className="outlineDark" onClick={() => setPage('membership')}>Membership information</button><button className="gold" onClick={() => setPage('payment')}>Application / payment status <ArrowRight size={17}/></button></div>
      </div>
    </section>
  </>;
}
