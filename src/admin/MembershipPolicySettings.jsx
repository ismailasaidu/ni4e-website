import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Save, Settings2 } from 'lucide-react';
import { requireSupabase, supabase } from '../firebase/config';
import { useAuth } from '../firebase/auth';

const POLICY_FIELDS = [
  { key:'ni4e_corporate_membership_definition', group:'Category policy', label:'Corporate Membership definition', type:'textarea', help:'Not confirmed. Describe whether this is an individual grade or organisation membership only after NI4E confirms.' },
  { key:'ni4e_associate_eligibility', group:'Category policy', label:'Associate Membership eligibility', type:'textarea', help:'Official criteria are not yet confirmed. Keep this as a draft policy until approved.' },
  { key:'ni4e_student_required_documents', group:'Document requirements', label:'Student required documents', type:'textarea', readOnly:true, defaultValue:'Student ID\nProof of enrolment', help:'Confirmed requirements; these are read-only here.' },
  { key:'ni4e_graduate_required_documents', group:'Document requirements', label:'Graduate required documents', type:'textarea', readOnly:true, defaultValue:'Degree certificate or statement of result', help:'Confirmed requirements; these are read-only here.' },
  { key:'ni4e_associate_required_documents', group:'Document requirements', label:'Associate required documents', type:'textarea', defaultValue:'Not configured — NI4E approval required', help:'Do not treat this placeholder as an official requirement.' },
  { key:'ni4e_corporate_required_documents', group:'Document requirements', label:'Corporate required documents', type:'textarea', defaultValue:'Not configured — NI4E clarification required', help:'Do not treat this placeholder as an official requirement.' },
  { key:'ni4e_application_fee_policy', group:'Fees and payment', label:'Payment timing', type:'select', options:[['after_approval','All fees after approval']], defaultValue:'after_approval', help:'Fixed by the approved Stage 3 decision. Applicants must not pay before approval.' },
  { key:'ni4e_correction_policy', group:'Application lifecycle', label:'Correction request behaviour', type:'select', options:[['same_application_editable','Applicant edits the same application (recommended)'],['admin_reopens','Admin reopens after applicant responds'],['not_configured','Not decided — use safe default']], defaultValue:'not_configured', help:'This remains a policy decision. The system should preserve application reference and history for corrections.' },
  { key:'ni4e_rejection_wait_days', group:'Application lifecycle', label:'Reapplication waiting period (days)', type:'number', defaultValue:'', help:'Required before enforcing a wait. Leave blank until NI4E confirms the period; blank means no invented period is enforced.' },
  { key:'ni4e_review_timeline', group:'Application lifecycle', label:'Official review timeline wording', type:'text', defaultValue:'Not configured — enter the official NI4E review timeline', help:'Enter the exact approved timeline and wording. Do not promise an unconfirmed number of days.' },
  { key:'ni4e_renewal_basis', group:'Renewal', label:'Annual renewal date calculation', type:'select', options:[['not_configured','Not decided — payments blocked until configured'],['anniversary','One year from activation / current expiry']], defaultValue:'not_configured', help:'Choose only the method approved by NI4E. The system will not guess a renewal date basis.' },
  { key:'ni4e_annual_renewal_policy', group:'Renewal', label:'Renewal cycle', type:'select', options:[['annual','Annual']], defaultValue:'annual', help:'Annual renewal is confirmed. Grace periods, late fees and reactivation rules remain separate policy decisions.' },
  { key:'ni4e_public_directory_statuses', group:'Directory and privacy', label:'Statuses visible in public directory', type:'text', defaultValue:'active', help:'Comma-separated status values. Recommended default is active only; verification must remain privacy-safe.' },
  { key:'ni4e_max_document_size_mb', group:'Document requirements', label:'Maximum document size (MB)', type:'number', defaultValue:'5', help:'Technical upload limit, not an eligibility requirement. Ensure the Storage bucket limit matches this setting.' },
  { key:'ni4e_allowed_document_types', group:'Document requirements', label:'Allowed document file extensions', type:'text', defaultValue:'pdf,jpg,jpeg,png', help:'Comma-separated extensions. Server/storage validation must match this setting.' },
];

const groupOrder = [...new Set(POLICY_FIELDS.map(f => f.group))];

export default function MembershipPolicySettings() {
  const { profile } = useAuth();
  const [values, setValues] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      requireSupabase();
      const { data, error: queryError } = await supabase.from('site_settings').select('setting_key,setting_value,description');
      if (queryError) throw queryError;
      const map = {};
      (data || []).forEach(row => {
        let value = row.setting_value;
        if (typeof value === 'string') {
          try { const parsed = JSON.parse(value); if (typeof parsed === 'string') value = parsed; } catch { /* plain text */ }
        }
        map[row.setting_key] = value ?? '';
      });
      POLICY_FIELDS.forEach(field => { if (map[field.key] === undefined) map[field.key] = field.defaultValue ?? ''; });
      setValues(map); setOriginal(map);
    } catch (e) { setError(e.message || 'Unable to load membership policy settings.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const setValue = (key, value) => setValues(current => ({ ...current, [key]: value }));
  const changed = POLICY_FIELDS.some(field => String(values[field.key] ?? '') !== String(original[field.key] ?? ''));

  const save = async event => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      requireSupabase();
      const rows = POLICY_FIELDS.map(field => {
        const raw = String(values[field.key] ?? '');
        let value = raw;
        if (field.type === 'number') value = raw.trim() === '' ? 'not_configured' : Number(raw);
        if (field.type === 'number' && raw.trim() !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) throw new Error(`${field.label} must be a non-negative number.`);
        return { setting_key: field.key, setting_value: value, description: field.help, updated_by: profile?.id || null, updated_at: new Date().toISOString() };
      });
      const { error: upsertError } = await supabase.from('site_settings').upsert(rows, { onConflict: 'setting_key' });
      if (upsertError) throw upsertError;
      await load(); setNotice('Membership policy settings saved. Changes are stored in Supabase. Confirm any public-facing policy changes with NI4E before publishing them.');
    } catch (e) { setError(e.message || 'Unable to save membership policy settings.'); }
    finally { setSaving(false); }
  };

  if (loading) return <section className="applicationPanel"><p className="muted">Loading membership policy settings…</p></section>;
  return <section className="applicationPanel ni4ePolicyPanel">
    <div className="applicationPanelHead"><div><span className="kicker">STAGE 3 CONFIGURATION</span><h2>Membership policy settings</h2><p>Manage unconfirmed NI4E rules here instead of hard-coding assumptions into the application. These settings are stored in the existing protected <code>site_settings</code> table. Set actual fee amounts in the separate Fees & Membership admin section so checkout uses the same approved fee records.</p></div><button type="button" className="adminRefresh" onClick={load} disabled={loading || saving}><RefreshCw size={16}/> Refresh</button></div>
    <div className="applicationReviewMessage"><Settings2 size={18}/><div><b>Policy safety</b><p>Do not publish invented fees, eligibility rules, review deadlines or waiting periods. A saved value is configuration, not evidence that NI4E has approved that policy. Payment timing is fixed to after approval.</p></div></div>
    {error && <div className="publicState publicStateError" role="alert"><AlertCircle size={18}/>{error}</div>}
    {notice && <div className="applicationReviewMessage" role="status"><CheckCircle2 size={18}/><p>{notice}</p></div>}
    <form onSubmit={save} className="ni4ePolicyForm">
      {groupOrder.map(group => <fieldset className="ni4ePolicyGroup" key={group}><legend>{group}</legend><div className="ni4ePolicyGrid">{POLICY_FIELDS.filter(field => field.group === group).map(field => <label className="ni4ePolicyField" key={field.key}><span>{field.label}</span>{field.type === 'textarea' ? <textarea rows={3} disabled={field.readOnly} value={String(values[field.key] ?? '')} onChange={e => setValue(field.key, e.target.value)}/> : field.type === 'select' ? <select value={String(values[field.key] ?? '')} onChange={e => setValue(field.key, e.target.value)}>{field.options.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} min={field.type === 'number' ? '0' : undefined} step={field.type === 'number' ? '1' : undefined} value={String(values[field.key] ?? '')} onChange={e => setValue(field.key, e.target.value)} /> }<small>{field.help}</small></label>)}</div></fieldset>)}
      <div className="formActions ni4ePolicyActions"><span className="muted">{changed ? 'Unsaved changes' : 'All changes saved'}</span><button className="gold" type="submit" disabled={saving || !changed}>{saving ? 'Saving policies…' : <><Save size={16}/> Save membership policies</>}</button></div>
    </form>
  </section>;
}
