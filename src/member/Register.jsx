import React, { useState } from 'react';
import { useAuth } from '../firebase/auth';
import { supabase, requireSupabase } from '../firebase/config';
import { ArrowRight, Check, CheckCircle2, LockKeyhole, UploadCloud } from 'lucide-react';
import { PageHero, Field } from '../components';
import FileUpload from '../components/FileUpload';

const STEP_FIELDS = {
  2: [{key:'dateOfBirth',label:'Date of birth',type:'date'},{key:'stateOfResidence',label:'State of residence'},{key:'address',label:'Residential address'},{key:'nationality',label:'Nationality'}],
  3: [{key:'qualification',label:'Highest qualification'},{key:'institution',label:'Institution attended'},{key:'graduationYear',label:'Graduation year'},{key:'organisation',label:'Current organisation'}],
};
export function StepForm({ title, text, fields, values, onChange, onNext, onBack }) {
  return <><h2>{title}</h2><p className="muted">{text}</p><div className="formGrid">{fields.map((field) => <label key={field.key}>{field.label}<input type={field.type || 'text'} value={values[field.key] || ''} onChange={e=>onChange(field.key,e.target.value)} placeholder={field.type==='date'?'':`Enter ${field.label.toLowerCase()}`}/></label>)}</div><div className="formActions"><button className="outlineDark" type="button" onClick={onBack}>Back</button><button className="gold" type="button" onClick={onNext}>Continue <ArrowRight size={17}/></button></div></>;
}

export default function Register({ setPage, notify }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [applicationRef, setApplicationRef] = useState('');
  const [documents, setDocuments] = useState({passport_photo:null, qualification_certificate:null, supporting_document:null});
  const [documentMessage, setDocumentMessage] = useState('');
  const [data, setData] = useState({ name: user?.user_metadata?.full_name || '', email: user?.email || '', phone: user?.user_metadata?.phone || '', category: user?.user_metadata?.membership_category || 'Graduate Member', dateOfBirth:'', stateOfResidence:'', address:'', nationality:'', qualification:'', institution:'', graduationYear:'', organisation:'' });
  const update = (key, value) => setData(current => ({...current,[key]:value}));
  if (!user) return <PageHero title="Sign in required" crumb="Membership / Register" desc="Please sign in before starting a membership application." />;
  const next = () => { setError(''); setStep(current => Math.min(5,current+1)); };
  const submit = async () => {
    setError(''); setLoading(true);
    try {
      requireSupabase();
      if (!agree) throw new Error('Please accept the membership terms and code of conduct.');
      if (!user) throw new Error('Please sign in before submitting a membership application.');
      if (!data.name.trim() || !data.email.trim() || !data.phone.trim()) throw new Error('Complete all required application fields.');
      const applicationData = { ...data };
      const currentUser = user;
      const { data: existingApp, error: appLookupError } = await supabase.from('membership_applications').select('id,status').eq('user_id', currentUser.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      if (appLookupError) throw appLookupError;
      if (existingApp && !['rejected'].includes(existingApp.status)) throw new Error('You already have a membership application. Open Membership Application from your account menu to check its status.');
      const { data: appRow, error: createAppError } = await supabase.from('membership_applications').insert({
        user_id: currentUser.id, full_name: data.name.trim(), email: data.email.trim().toLowerCase(), phone: data.phone.trim(),
        category: data.category, status: 'pending', application_data: applicationData, source: 'website-registration'
      }).select('id').single();
      if (createAppError) throw createAppError;
      const ref = `NI4E-${String(appRow.id).slice(0,8).toUpperCase()}`;
      setApplicationRef(ref);
      const chosen = Object.entries(documents).filter(([,file])=>file);
      const uploaded = [];
      const failed = [];
      for (const [kind,file] of chosen) {
        let path = '';
        try {
          if (file.size > 5*1024*1024) throw new Error('file exceeds the 5 MB limit');
          const allowedTypes = kind === 'passport_photo' ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png'];
          if (!allowedTypes.includes(file.type)) throw new Error('unsupported file type');
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); path = `${currentUser.id}/${Date.now()}-${kind}-${safeName}`;
          const {error: uploadError} = await supabase.storage.from('membership-documents').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
          if(uploadError) throw uploadError;
          const {error: docError} = await supabase.from('membership_documents').insert({user_id:currentUser.id,application_id:appRow.id,document_type:kind,file_name:file.name,storage_path:path,mime_type:file.type||'application/octet-stream',size_bytes:file.size});
          if(docError) { await supabase.storage.from('membership-documents').remove([path]); throw docError; }
          uploaded.push(file.name);
        } catch (uploadFailure) { failed.push(`${file.name}: ${uploadFailure.message || 'upload failed'}`); }
      }
      setDocumentMessage(failed.length
        ? `${uploaded.length} document(s) uploaded. ${failed.length} could not be uploaded; open Membership Application from your account menu to retry. ${failed.join('; ')}`
        : chosen.length ? `${chosen.length} document(s) uploaded securely.` : 'No supporting files were selected. Upload your supporting documents from the application page before review.');
      setSubmitted(true);
      notify?.('Application received', 'Your membership application has been submitted.');
    } catch (err) {
      const messages = { 'user_already_exists':'An account already exists with this email. Please log in instead.', 'invalid_email':'Enter a valid email address.', 'weak_password':'Choose a stronger password of at least 6 characters.' };
      setError(messages[err.code] || err.message || 'Unable to submit your application.');
    } finally { setLoading(false); }
  };
  if (submitted) return <><PageHero title="Application Submitted" crumb="Membership / Register"/><section className="success reveal visible"><div className="successRing"><CheckCircle2 size={50}/></div><span className="kicker">APPLICATION RECEIVED</span><h2>Your application has been saved.</h2><p>Your membership application has been submitted from your signed-in account. NI4E aims to review applications within 24 hours; this is an intended review target, not a guaranteed SLA. Payment remains locked until approval.</p><div className="successRef">Application reference <b>{applicationRef}</b></div><div className="successRef">Supporting documents <b>{documentMessage}</b></div><div className="successRef">Application status <b>Pending review · Payment not yet available</b></div><div className="formActions"><button className="gold" onClick={()=>setPage('dashboard')}>View Membership Application <ArrowRight size={17}/></button><button className="outlineDark" onClick={()=>setPage('home')}>Return Home</button></div></section></>;
  return <><PageHero title="Membership Registration" crumb="Membership / Register" desc="Complete the guided application in a few simple steps."/><section className="formSection reveal visible"><div className="formBox"><div className="stepsNav">{['Account','Personal','Professional','Documents','Review'].map((label,index)=><button type="button" key={label} className={step===index+1?'active':''} onClick={()=>index+1<step&&setStep(index+1)}><b>{index+1}</b><span>{label}</span></button>)}</div>
    {step===1&&<><h2>Your NI4E membership application</h2><p className="muted">You are signed in as {user.email}. Complete your application details below.</p><div className="formGrid"><Field label="Full name" value={data.name} onChange={v=>update('name',v)} placeholder="Enter your full name"/><Field label="Email address" value={data.email} onChange={v=>update('email',v)} placeholder="name@example.com"/><Field label="Phone number" value={data.phone} onChange={v=>update('phone',v)} placeholder="+234 800 000 0000"/><label>Membership category<select value={data.category} onChange={e=>update('category',e.target.value)}><option>Corporate Member</option><option>Graduate Member</option><option>Associate Member</option><option>Student Member</option><option>Fellow</option></select></label></div><div className="formActions"><button className="gold" type="button" onClick={()=>{if(!data.name.trim()||!data.email.trim()||!data.phone.trim()){setError('Complete all required account fields before continuing.');return;}setError('');next();}}>Continue <ArrowRight size={17}/></button></div></>}
    {step===2&&<StepForm title="Personal information" text="Tell us a little more about you." fields={STEP_FIELDS[2]} values={data} onChange={update} onBack={()=>setStep(1)} onNext={next}/>}
    {step===3&&<StepForm title="Professional details" text="Add your education and professional information." fields={STEP_FIELDS[3]} values={data} onChange={update} onBack={()=>setStep(2)} onNext={next}/>}
    {step===4&&<><h2>Supporting documents</h2><p className="muted">Upload documents relevant to your category. Files are limited to 5 MB each. You must be signed in to upload documents. Selected files are previewed before submission, and upload errors are shown so you can retry from the Membership Application area.</p><div className="formGrid"><FileUpload label="Passport photograph" accept="image/jpeg,image/png" value={documents.passport_photo} onChange={file=>setDocuments(old=>({...old,passport_photo:file}))}/><FileUpload label="Qualification certificate" accept="application/pdf,image/jpeg,image/png" value={documents.qualification_certificate} onChange={file=>setDocuments(old=>({...old,qualification_certificate:file}))}/><FileUpload label="Other supporting document" accept="application/pdf,image/jpeg,image/png" value={documents.supporting_document} onChange={file=>setDocuments(old=>({...old,supporting_document:file}))}/></div><div className="dropzone"><UploadCloud size={25}/><span>Do not upload documents unrelated to your membership category. Fellowship and other categories may have additional requirements.</span></div><div className="formActions"><button className="outlineDark" type="button" onClick={()=>setStep(3)}>Back</button><button className="gold" type="button" onClick={()=>setStep(5)}>Review application <ArrowRight size={17}/></button></div></>}
    {step===5&&<><h2>Review & submit</h2><p className="muted">Check the information before submitting your membership application.</p><div className="reviewCard"><div><span>Applicant</span><b>{data.name}</b></div><div><span>Membership</span><b>{data.category}</b></div><div><span>Email</span><b>{data.email}</b></div><div><span>Phone</span><b>{data.phone}</b></div><div><span>Qualification</span><b>{data.qualification||'Not provided'}</b></div><div><span>Organisation</span><b>{data.organisation||'Not provided'}</b></div></div><label className="check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> I agree to the NI4E membership terms and code of conduct.</label><div className="formActions"><button className="outlineDark" type="button" onClick={()=>setStep(4)}>Back</button><button className="gold" type="button" disabled={loading||!agree} onClick={submit}>{loading?<><span className="buttonSpinner" aria-hidden="true"/> Submitting application…</>:<>Submit Application <Check size={17}/></>}</button></div></>}
    {error&&<p role="alert" style={{color:'#b42318',marginTop:16}}>{error}</p>}
  </div><aside className="why"><span className="kicker">APPLICATION</span><h3>Designed around the member.</h3>{['Professional recognition','Technical resources','Industry networking','Events & training','Member community'].map(item=><p key={item}><CheckCircle2 size={16}/>{item}</p>)}<div className="secure"><LockKeyhole size={16}/><span>Secure member experience</span></div></aside></section></>;
}
