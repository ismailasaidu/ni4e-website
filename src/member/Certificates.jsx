import React, { useEffect, useState } from 'react';
import { Award, ArrowLeft, Download, ShieldCheck, CalendarDays, Hash, FileCheck2, Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { supabase } from '../firebase/config';

const fmt = value => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not recorded';
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export default function Certificates({ setPage }) {
  const { user, profile } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printError, setPrintError] = useState('');
  useEffect(() => {
    let live = true;
    (async () => {
      if (!supabase || !user) { if (live) setLoading(false); return; }
      const { data, error: queryError } = await supabase.from('profiles').select('id,full_name,email,membership_category,membership_status,membership_number,membership_issued_at,certificate_reference,membership_activated_at,membership_expires_at').eq('id', user.id).maybeSingle();
      if (!live) return;
      if (queryError) setError(queryError.message || 'We could not load your membership record.');
      else setRecord(data || null);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [user?.id]);

  const active = record?.membership_status === 'active' && (!record?.membership_expires_at || new Date(record.membership_expires_at).getTime() > Date.now());
  const ready = Boolean(active && record?.membership_number && record?.certificate_reference);
  const printCertificate = () => {
    setPrintError('');
    if (!ready) { setPrintError('Your certificate is not available yet. NI4E must activate your membership and assign the official membership number and certificate reference.'); return; }
    const name = esc(record.full_name || profile?.fullName || user?.email || 'Member');
    const category = esc(record.membership_category || 'Member');
    const number = esc(record.membership_number);
    const reference = esc(record.certificate_reference);
    const issued = fmt(record.membership_issued_at || record.membership_activated_at);
    const expiry = record.membership_expires_at ? fmt(record.membership_expires_at) : 'As recorded in the NI4E register';
    const win = window.open('', '_blank', 'width=1200,height=850');
    if (!win) { setPrintError('Your browser blocked the certificate window. Allow pop-ups for this website, then select Download certificate again.'); return; }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NI4E Membership Certificate - ${name}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#eef2ee;color:#15392c;font-family:Georgia,'Times New Roman',serif}.toolbar{padding:14px;text-align:center;font:14px Arial,sans-serif}.toolbar button{border:0;border-radius:8px;padding:12px 20px;background:#07543c;color:#fff;font-weight:800;cursor:pointer}.sheet{min-height:180mm;margin:0 auto;background:#fffdf7;border:5px double #b89a4d;outline:1px solid #07543c;outline-offset:-16px;padding:18mm 22mm;text-align:center;position:relative}.brand{font:800 12px Arial,sans-serif;letter-spacing:2px;color:#07543c;text-transform:uppercase}.sub{margin-top:7px;font:10px Arial,sans-serif;letter-spacing:3px;color:#7b826f}.rule{width:55%;height:1px;background:#b89a4d;margin:18px auto}.heading{font-size:32px;letter-spacing:2px;text-transform:uppercase;margin:10px}.intro{font-size:16px}.name{font-size:38px;color:#07543c;font-weight:bold;margin:16px 0}.category{font-size:22px;margin:8px}.copy{font-size:15px;line-height:1.7;max-width:780px;margin:12px auto}.meta{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;margin:22px 0;font:11px Arial,sans-serif}.meta span{display:block;color:#6b776e}.meta b{display:block;color:#15392c;margin-top:5px;font-size:12px}.sign{display:flex;justify-content:space-around;gap:45px;margin:27px 5% 0;font:11px Arial,sans-serif}.sign div{border-top:1px solid #6e786f;padding:9px 22px 0;min-width:210px}.foot{font:9px Arial,sans-serif;color:#758078;margin-top:16px}@media print{body{background:#fff}.toolbar{display:none}.sheet{min-height:180mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button><span> Choose “Save as PDF” in your print dialog to download a copy.</span></div><main class="sheet"><div class="brand">Nigerian Institution of Energy, Electrical &amp; Electronics Engineers</div><div class="sub">NI4E · OFFICIAL MEMBERSHIP RECORD</div><div class="rule"></div><h1 class="heading">Certificate of Membership</h1><p class="intro">This is to certify that</p><div class="name">${name}</div><p class="intro">has been admitted as a</p><div class="category">${category}</div><p class="copy">of the Nigerian Institution of Energy, Electrical &amp; Electronics Engineers, subject to the Institution's constitution and membership regulations.</p><div class="meta"><div><span>MEMBERSHIP NUMBER</span><b>${number}</b></div><div><span>DATE ISSUED</span><b>${esc(issued)}</b></div><div><span>VALIDITY</span><b>${esc(expiry)}</b></div><div><span>CERTIFICATE REFERENCE</span><b>${reference}</b></div></div><div class="sign"><div>President, NI4E<br><small>Authorised signature</small></div><div>NI4E Secretariat<br><small>Authorised signature</small></div></div><div class="foot">Generated from the NI4E member record. Formal institutional issuance and authorised signatures remain subject to NI4E approval.</div></main></body></html>`);
    win.document.close();
  };

  return <div className="certificatePage">
    <button className="certificateBack" onClick={() => setPage('dashboard')}><ArrowLeft size={17}/> Back to dashboard</button>
    <header className="certificatePageHero"><div className="certificateHeroIcon"><Award size={28}/></div><div><span>MEMBER SERVICES / DOCUMENTS</span><h1>Membership certificate</h1><p>View your official membership details and print or save your certificate as a PDF when your record is eligible.</p></div><div className="certificateHeroBadge"><ShieldCheck size={17}/>{loading ? 'Checking record' : ready ? 'Eligible for certificate' : 'Certificate not issued'}</div></header>
    {error && <div className="certificateAlert"><AlertCircle size={18}/><span>{error}</span></div>}
    <div className="certificateContentGrid"><section className="certificatePreviewCard"><div className="certificatePreviewTop"><div className="certificateMiniLogo"><Award size={24}/></div><span>NI4E · OFFICIAL DOCUMENT</span></div><div className="certificatePreviewBody"><div className="certificatePreviewRule"/><h2>Certificate of<br/>Membership</h2><p>This is to certify that</p><strong>{record?.full_name || profile?.fullName || user?.email || 'Member name'}</strong><p>has been admitted as a</p><h3>{record?.membership_category || profile?.membershipCategory || 'Membership category'}</h3><div className="certificatePreviewSeal">NI4E<br/><small>MEMBER</small></div></div><div className="certificatePreviewFooter">Preview only · Final document opens in print-ready format</div></section>
    <aside className="certificateDetailsCard"><div className="certificateCardTitle"><FileCheck2 size={20}/><div><h2>Your certificate record</h2><p>Details pulled from your NI4E profile.</p></div></div>{loading ? <div className="certificateLoading">Loading your official record…</div> : <div className="certificateFacts"><div><span><Hash size={15}/> Membership number</span><b>{record?.membership_number || 'Not assigned'}</b></div><div><span><FileCheck2 size={15}/> Certificate reference</span><b>{record?.certificate_reference || 'Not issued'}</b></div><div><span><ShieldCheck size={15}/> Membership status</span><b className={active ? 'certificateFactActive' : 'certificateFactPending'}>{record?.membership_status || 'No status found'}</b></div><div><span><CalendarDays size={15}/> Issue date</span><b>{fmt(record?.membership_issued_at || record?.membership_activated_at)}</b></div><div><span><CalendarDays size={15}/> Expiry date</span><b>{record?.membership_expires_at ? fmt(record.membership_expires_at) : 'Not assigned — NI4E renewal policy pending'}</b></div></div>}
    {printError && <div className="certificateAlert"><AlertCircle size={18}/><span>{printError}</span></div>}
    {!ready && !loading && <div className="certificateEligibility"><LockIcon/><div><b>Certificate unavailable</b><p>A certificate can be generated after NI4E activates your membership and confirms the official number and certificate reference. If your membership is active but the certificate remains unavailable, ask the Secretariat to check the official profile record.</p></div></div>}
    <button className="certificateDownloadButton" onClick={printCertificate} disabled={loading}><Download size={18}/>{ready ? 'Download / Print certificate' : 'Check certificate availability'}</button><p className="certificateDownloadHint"><Printer size={14}/> Opens a print-ready document. Choose “Save as PDF” to download it.</p></aside></div>
  </div>;
}
function LockIcon(){return <ShieldCheck size={21}/>;}
