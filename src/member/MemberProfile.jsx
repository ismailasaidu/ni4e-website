import React, { useEffect, useState } from 'react';
import { Camera, Save, RefreshCw, UserRound, ShieldCheck, Mail, Phone, BadgeCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../firebase/auth';
import { supabase } from '../firebase/config';

export default function MemberProfile({ setPage }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase || !user?.id) { setLoading(false); return; }
      const { data, error: e } = await supabase.from('profiles').select('id,full_name,email,phone,avatar_url,membership_category,membership_status,membership_number').eq('id', user.id).maybeSingle();
      if (!alive) return;
      if (e) setError(e.message);
      setForm({ full_name: data?.full_name || profile?.fullName || user.user_metadata?.full_name || '', phone: data?.phone || profile?.phone || '', avatar_url: data?.avatar_url || '' });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.id]);
  const save = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    if (!supabase || !user?.id) return setError('Sign in again to update your profile.');
    if (form.full_name.trim().length < 2) return setError('Enter your full name.');
    setSaving(true);
    try {
      const { error: updateError } = await supabase.from('profiles').update({ full_name: form.full_name.trim(), phone: form.phone.trim(), avatar_url: form.avatar_url || null, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (updateError) throw updateError;
      await supabase.auth.updateUser({ data: { full_name: form.full_name.trim() } });
      setMessage('Profile saved successfully. Your membership category and official membership number remain controlled by NI4E.');
    } catch (e2) { setError(e2.message || 'We could not save your profile.'); }
    finally { setSaving(false); }
  };
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(''); setMessage('');
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    if (file.size > 3 * 1024 * 1024) return setError('Profile photos must be 3 MB or smaller.');
    if (!supabase || !user?.id) return setError('Sign in again before uploading a profile photo.');
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('member-avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('member-avatars').getPublicUrl(path);
      setForm(v => ({ ...v, avatar_url: data.publicUrl }));
      setMessage('Photo uploaded. Save your profile to confirm the change.');
    } catch (e2) { setError(e2.message || 'Photo upload failed. Confirm the member-avatars storage bucket and policies are installed.'); }
    finally { setUploading(false); e.target.value = ''; }
  };
  return <section className="memberProfilePage"><div className="memberProfileShell">
    <button className="outlineDark" onClick={() => setPage('dashboard')}>← Back to member dashboard</button>
    <header className="memberProfileHero"><div className="memberProfileAvatar">{form.avatar_url ? <img src={form.avatar_url} alt="Your profile"/> : <UserRound size={36}/>}<label title="Upload profile photo"><Camera size={17}/><input type="file" accept="image/*" onChange={uploadAvatar} hidden/></label></div><div><span className="kicker">MEMBER ACCOUNT</span><h1>My profile</h1><p>Keep your contact details current so NI4E can contact you about applications, renewals and professional activities.</p><div className="memberProfileChips"><span><Mail size={14}/>{user?.email}</span><span><ShieldCheck size={14}/>{profile?.role === 'admin' ? 'Administrator account' : 'Member account'}</span></div></div></header>
    {error && <div className="memberProfileMessage error"><AlertCircle size={17}/>{error}</div>}{message && <div className="memberProfileMessage success"><BadgeCheck size={17}/>{message}</div>}
    <div className="memberProfileGrid"><form className="memberProfileCard" onSubmit={save}><div className="memberProfileCardHead"><div><h2>Personal information</h2><p>Update your name, telephone number and profile photo.</p></div></div>{loading ? <p>Loading your profile…</p> : <><label>Full legal name<input required minLength={2} value={form.full_name} onChange={e=>setForm(v=>({...v,full_name:e.target.value}))} autoComplete="name"/></label><label>Email address<input value={user?.email || ''} readOnly disabled/><small>Your sign-in email is managed under account security.</small></label><label>Phone number<input value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} autoComplete="tel" placeholder="e.g. +234 800 000 0000"/><small>Use a number where the NI4E Secretariat can reach you.</small></label><div className="memberProfileActions"><button className="gold" type="submit" disabled={saving||uploading}><Save size={16}/>{saving?'Saving…':'Save profile'}</button><button className="outlineDark" type="button" onClick={()=>setPage('memberSettings')}><ShieldCheck size={16}/> Account security</button></div></>}</form>
    <aside className="memberProfileCard"><div className="memberProfileCardHead"><div><h2>Official membership record</h2><p>These details are controlled by NI4E and cannot be edited here.</p></div></div><div className="memberProfileOfficial"><span>Membership category</span><b>{profile?.membershipCategory || profile?.membership_category || 'Not assigned'}</b></div><div className="memberProfileOfficial"><span>Membership status</span><b>{profile?.membershipStatus || profile?.membership_status || 'Application not started'}</b></div><div className="memberProfileOfficial"><span>Membership number</span><b>{profile?.membership_number || 'Assigned when membership is activated'}</b></div><div className="memberProfilePhotoHelp"><Camera size={18}/><div><b>{uploading?'Uploading photo…':'Profile photo'}</b><p>Use a clear headshot, JPG or PNG, maximum 3 MB. Your photo is stored in the member-avatars bucket.</p></div></div></aside></div>
  </div></section>;
}
