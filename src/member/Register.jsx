import React, { useEffect, useState } from 'react';
import { useAuth } from '../firebase/auth';
import { supabase, requireSupabase } from '../firebase/config';
import { ArrowRight, Check, CheckCircle2, UploadCloud, FileText } from 'lucide-react';
import { PageHero, Field } from '../components';
import FileUpload from '../components/FileUpload';

const documentKey = label => `custom_${String(label).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48)}`;
const configuredDocuments = value => String(value || '').split(/\n|;|,\s*/).map(item => item.trim()).filter(item => item && !/not configured|not confirmed|ni4e (approval|clarification) required/i.test(item));
const STEP_FIELDS = {
  2: [
    {key:'dateOfBirth',label:'Date of birth',type:'date'},
    {key:'nationality',label:'Nationality'},
    {key:'stateOfResidence',label:'State of residence'},
    {key:'address',label:'Residential address'},
    {key:'gender',label:'Gender (optional)',optional:true,type:'select',options:['Female','Male','Prefer not to say']},
    {key:'preferredContactMethod',label:'Preferred contact method',type:'select',options:['Email','Phone','Either']}
  ],
  3: [
    {key:'studentProgramme',label:'Current programme',type:'select',options:['B.Eng. Electrical Engineering','B.Eng. Electronic Engineering','B.Eng. Electrical & Electronic Engineering','B.Eng. Energy Engineering','B.Sc. Engineering','B.Tech. Engineering','HND','OND / ND','ND / HND top-up','PGD','M.Eng.','M.Sc. Engineering','PhD','Other'],categories:['Student Member']},
    {key:'studentLevel',label:'Current level / year of study (select your present level)',type:'select',options:['ND 1','ND 2','HND 1','HND 2','100 Level','200 Level','300 Level','400 Level','500 Level','600 Level','PGD 1','PGD 2','Masters 1','Masters 2','Doctoral / PhD','Other'],categories:['Student Member']},
    {key:'studentProgrammeOther',label:'Enter your current programme',optional:true,categories:['Student Member'],showWhen:{key:'studentProgramme',value:'Other'}},
    {key:'qualification',label:'Highest completed qualification',type:'select',options:['B.Eng.','B.Sc. Engineering','B.Tech.','B.Eng. Technology','HND','OND / ND','M.Eng.','M.Sc. Engineering','PGD','PhD','Other'],categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'qualificationOther',label:'Enter your qualification',optional:true,categories:['Graduate Member','Associate Member','Corporate Member'],showWhen:{key:'qualification',value:'Other'}},
    {key:'discipline',label:'Engineering discipline / specialisation',type:'select',options:['Electrical Engineering','Electronic Engineering','Electrical & Electronic Engineering','Power Systems','Power Electronics','Telecommunications','Computer Engineering','Energy Engineering','Renewable Energy','Control & Instrumentation','Mechatronics','Biomedical Engineering','Mechanical Engineering','Civil Engineering','Chemical Engineering','Other']},
    {key:'disciplineOther',label:'Enter your engineering discipline',optional:true,showWhen:{key:'discipline',value:'Other'}},
    {key:'institution',label:'Institution attended / currently attending'},
    {key:'expectedGraduationYear',label:'Expected year of completion',type:'number',categories:['Student Member']},
    {key:'graduationYear',label:'Year of graduation',type:'number',categories:['Graduate Member']},
    {key:'graduationClass',label:'Class of degree / result (if available)',optional:true,categories:['Graduate Member']},
    {key:'associateBasis',label:'Basis for Associate membership application',type:'select',options:['Relevant technical qualification','Technical / industry experience','Academic or research contribution','Other'],categories:['Associate Member']},
    {key:'associateBasisDetails',label:'Explain your relevant technical background and why you qualify for Associate membership',type:'textarea',categories:['Associate Member']},
    {key:'corporateRegistrationBody',label:'Professional registration body',type:'select',options:['COREN','NSE','NIEEE','Other','Not applicable / not registered'],categories:['Corporate Member']},
    {key:'corporateRegistrationStatus',label:'Professional registration status',type:'select',options:['Registered','In progress','Not professionally registered'],categories:['Corporate Member']},
    {key:'corporateMembershipEvidence',label:'Professional membership / registration number (if applicable)',optional:true,categories:['Corporate Member']}
    ,{key:'corporateRegistrationOther',label:'Specify professional registration body',optional:true,categories:['Corporate Member'],showWhen:{key:'corporateRegistrationBody',value:'Other'}}
  ],
  4: [
    {key:'currentRole',label:'Current role / designation',categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'organisation',label:'Current organisation / employer',categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'yearsExperience',label:'Years of professional experience',type:'select',options:['No professional experience yet','Less than 1 year','1–2 years','3–5 years','6–10 years','11–15 years','16–20 years','More than 20 years'],categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'graduateCareerPlan',label:'Intended engineering career / area of practice',type:'textarea',categories:['Graduate Member']},
    {key:'associateTechnicalRole',label:'Technical role, service or industry experience relevant to NI4E',type:'textarea',categories:['Associate Member']},
    {key:'associateContribution',label:'Technical contributions, projects or evidence of practical experience',type:'textarea',categories:['Associate Member']},
    {key:'corporatePracticeArea',label:'Area of professional practice / specialisation',type:'textarea',categories:['Corporate Member']},
    {key:'corporateResponsibilities',label:'Current responsibilities and significant projects',type:'textarea',categories:['Corporate Member']},
    {key:'corporateYearsPractice',label:'Years practising in the profession',type:'select',options:['Less than 1 year','1–2 years','3–5 years','6–10 years','11–15 years','16–20 years','More than 20 years'],categories:['Corporate Member']},
    {key:'professionalRegistration',label:'Professional registration body (if applicable)',optional:true,categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'professionalRegistrationNumber',label:'Professional registration number (if applicable)',optional:true,categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'nseStatus',label:'NSE membership status (if applicable)',type:'select',options:['Not a member','Student member','Graduate member','Corporate member','Other'],optional:true,categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'nseNumber',label:'NSE membership number (if applicable)',optional:true,categories:['Graduate Member','Associate Member','Corporate Member']},
    {key:'specialistInterests',label:'Technical interests / areas of practice',type:'textarea',optional:true,categories:['Student Member','Graduate Member','Associate Member','Corporate Member']}
  ]
};
export function StepForm({ title, text, fields, values, onChange, onNext, onBack }) {
  const validate = () => {
    // Validate only fields actually rendered for the selected category. Hidden category fields
    // must never block progress (this caused Student/Graduate cross-category errors).
    const visibleFields = fields.filter(field => (!field.categories || field.categories.includes(values.category)) && (!field.showWhen || values[field.showWhen.key] === field.showWhen.value));
    const missing = visibleFields.filter(field => !field.optional && !/optional|if applicable|if any|if required/i.test(field.label) && !String(values[field.key] ?? '').trim());
    if (missing.length) { window.dispatchEvent(new CustomEvent('ni4e-form-validation', { detail: `Please complete: ${missing.map(field => field.label.replace(/\s*\([^)]*\)/g, '')).join(', ')}.` })); return; }
    for (const field of visibleFields.filter(item => item.type === 'email' && values[item.key])) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values[field.key]).trim())) { window.dispatchEvent(new CustomEvent('ni4e-form-validation', { detail: `Enter a valid email address for ${field.label}.` })); return; }
    }
    onNext();
  };
  return <><h2>{title}</h2><p className="muted">{text}</p><div className="formGrid comprehensiveFields">{fields.filter(field => (!field.categories || field.categories.includes(values.category)) && (!field.showWhen || values[field.showWhen.key] === field.showWhen.value)).map((field) => <label key={field.key}>{field.label}{field.type==='select'?<select required={!field.optional && !/optional|if applicable|if any|if required/i.test(field.label)} value={values[field.key]||''} onChange={e=>onChange(field.key,e.target.value)}><option value="">Choose an option</option>{(field.options||[]).map(option=><option key={option}>{option}</option>)}</select>:field.type==='textarea'?<textarea required={!field.optional && !/optional|if applicable|if any|if required/i.test(field.label)} rows={3} value={values[field.key]||''} onChange={e=>onChange(field.key,e.target.value)} placeholder="Describe your interests and areas of practice"/>:<input required={!field.optional && !/optional|if applicable|if any|if required/i.test(field.label)} type={field.type||'text'} value={values[field.key]||''} onChange={e=>onChange(field.key,e.target.value)} placeholder={field.type==='date'?'':`Enter ${field.label.toLowerCase()}`} min={field.type==='number'?'0':undefined} max={field.key==='graduationYear'?new Date().getFullYear():field.key==='dateOfBirth'?new Date().toISOString().slice(0,10):undefined}/>}</label>)}</div><div className="formActions"><button className="outlineDark" type="button" onClick={onBack}>Back</button><button className="gold" type="button" onClick={validate}>Continue <ArrowRight size={17}/></button></div></>;
}

export default function Register({ setPage, notify }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const showValidation = event => setError(event.detail || 'Please complete the required fields.'); window.addEventListener('ni4e-form-validation', showValidation); return () => window.removeEventListener('ni4e-form-validation', showValidation); }, []);
  const [applicationRef, setApplicationRef] = useState('');
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [existingApplication, setExistingApplication] = useState(null);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [documents, setDocuments] = useState({student_id:null, proof_of_enrolment:null, degree_certificate:null, statement_of_result:null, supporting_document:null, corporate_registration_evidence:null});
  const [policy, setPolicy] = useState({ reviewTimeline: '', maxDocumentSizeMb: 5, allowedTypes: ['pdf','jpg','jpeg','png'], rejectionWaitDays: null, correctionPolicy: 'same_application', associateEligibility: '', corporateDefinition: '', associateDocuments: '', corporateDocuments: '' });
  const [documentMessage, setDocumentMessage] = useState('');
  const [data, setData] = useState({ name: user?.user_metadata?.full_name || '', email: user?.email || '', phone: user?.user_metadata?.phone || '', category: (()=>{try{const saved=sessionStorage.getItem('ni4e_membership_category');return ['Student Member','Graduate Member','Associate Member','Corporate Member'].includes(saved)?saved:''}catch{return ''}})(), dateOfBirth:'', gender:'', preferredContactMethod:'Email', stateOfResidence:'', address:'', nationality:'', qualification:'', qualificationOther:'', discipline:'', disciplineOther:'', institution:'', graduationYear:'', studentProgramme:'', studentLevel:'', studentProgrammeOther:'', expectedGraduationYear:'', graduationClass:'', associateBasis:'', associateBasisDetails:'', corporateRegistrationBody:'', corporateRegistrationStatus:'', corporateMembershipEvidence:'', graduateCareerPlan:'', associateTechnicalRole:'', associateContribution:'', corporatePracticeArea:'', corporateResponsibilities:'', corporateYearsPractice:'', currentRole:'', organisation:'', yearsExperience:'', professionalRegistration:'', professionalRegistrationNumber:'', nseStatus:'', nseNumber:'', specialistInterests:'' });
  const update = (key, value) => setData(current => ({...current,[key]:value}));
  useEffect(() => { if (data.category) { try { sessionStorage.removeItem('ni4e_membership_category'); } catch {} } }, []);
  useEffect(() => { if (user?.id) setData(current => ({ ...current, name: current.name || user.user_metadata?.full_name || '', email: user.email || current.email, phone: current.phone || user.user_metadata?.phone || '' })); }, [user?.id]);
  const associateRequiredDocs = configuredDocuments(policy.associateDocuments).length ? configuredDocuments(policy.associateDocuments) : ['Relevant qualification certificate or statement of result','Current CV or résumé','Evidence of technical or industry experience','Professional background statement'];
  const corporateRequiredDocs = configuredDocuments(policy.corporateDocuments).length ? configuredDocuments(policy.corporateDocuments) : ['Relevant qualification certificate','Detailed current CV or résumé','Evidence of current professional practice'];
  useEffect(() => {
    let cancelled = false;
    const loadPolicy = async () => {
      if (!supabase) return;
      try {
        const { data: policyData, error: policyError } = await supabase.rpc('ni4e_public_membership_policy');
        if (policyError) throw policyError;
        const values = policyData || {};
        const timeline = typeof values.ni4e_review_timeline === 'string' ? values.ni4e_review_timeline : '';
        const configuredLimit = Number(values.ni4e_max_document_size_mb);
        const types = typeof values.ni4e_allowed_document_types === 'string' ? values.ni4e_allowed_document_types.split(',').map(v => v.trim().toLowerCase().replace(/^\./, '')).filter(Boolean) : ['pdf','jpg','jpeg','png'];
        const waitDaysRaw = values.ni4e_rejection_wait_days;
        const waitDays = waitDaysRaw === null || waitDaysRaw === undefined || waitDaysRaw === '' || waitDaysRaw === 'not_configured' ? null : Number(waitDaysRaw);
        if (!cancelled) setPolicy({ reviewTimeline: timeline && !timeline.toLowerCase().includes('not configured') ? timeline : '', correctionPolicy: typeof values.ni4e_correction_policy === 'string' ? values.ni4e_correction_policy : 'same_application', maxDocumentSizeMb: Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 5, allowedTypes: types.length ? types : ['pdf','jpg','jpeg','png'], rejectionWaitDays: Number.isFinite(waitDays) && waitDays >= 0 ? waitDays : null, associateEligibility: typeof values.ni4e_associate_eligibility === 'string' ? values.ni4e_associate_eligibility : '', corporateDefinition: typeof values.ni4e_corporate_membership_definition === 'string' ? values.ni4e_corporate_membership_definition : '', associateDocuments: typeof values.ni4e_associate_required_documents === 'string' ? values.ni4e_associate_required_documents : '', corporateDocuments: typeof values.ni4e_corporate_required_documents === 'string' ? values.ni4e_corporate_required_documents : '' });
      } catch { /* Membership application remains usable if optional policy settings are not migrated yet. */ }
    };
    loadPolicy();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadApplicationForForm = async () => {
      if (!user?.id || !supabase) { setApplicationLoading(false); return; }
      setApplicationLoading(true);
      try {
        const { data: rows, error: lookupError } = await supabase
          .from('membership_applications')
          .select('id,status,application_data,full_name,email,phone,category,application_type,review_notes,reviewed_by,reviewed_at,submitted_at')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });
        if (lookupError) throw lookupError;
        if (cancelled) return;
        const app = (rows || []).find(row => !['renewal', 'upgrade'].includes(row.application_type));
        setExistingApplication(app || null);
        if (app?.id) {
          const { data: docs, error: docsError } = await supabase.from('membership_documents').select('id,document_type,file_name,created_at').eq('user_id', user.id).eq('application_id', app.id).order('created_at', { ascending: false });
          if (!docsError && !cancelled) setExistingDocuments(docs || []);
        }
        if (app && ['rejected', 'needs_information'].includes(app.status)) {
          const saved = app.application_data && typeof app.application_data === 'object' ? app.application_data : {};
          setData(current => ({ ...current, ...saved, name: app.full_name || saved.name || current.name, email: app.email || saved.email || current.email, phone: app.phone || saved.phone || current.phone, category: app.category || saved.category || current.category }));
          setError(app.status === 'needs_information'
            ? `NI4E requested corrections or clarification${app.review_notes ? `: ${app.review_notes}` : '.'} Your saved application is loaded below. Correct it and resubmit the same application.`
            : `This application has a final rejection${app.review_notes ? `: ${app.review_notes}` : '.'} A new application may only be submitted after the NI4E-configured waiting period. The rejected record remains in history.`);
        } else if (app && ['pending', 'under_review'].includes(app.status)) {
          const saved = app.application_data && typeof app.application_data === 'object' ? app.application_data : {};
          setData(current => ({ ...current, ...saved, name: app.full_name || saved.name || current.name, email: app.email || saved.email || current.email, phone: app.phone || saved.phone || current.phone, category: app.category || saved.category || current.category }));
          setError('Your application is already with NI4E for review. You can inspect the saved details, but you cannot submit a duplicate while it is under review.');
        }
      } catch (err) {
        if (!cancelled) setError(`We could not load your existing application: ${err.message || 'Please try again.'}`);
      } finally {
        if (!cancelled) setApplicationLoading(false);
      }
    };
    loadApplicationForForm();
    return () => { cancelled = true; };
  }, [user?.id]);
  if (!user) return <PageHero title="Sign in required" crumb="Membership / Register" desc="Please sign in before starting a membership application." />;
  const next = () => { setError(''); setStep(current => Math.min(6,current+1)); };
  const submit = async () => {
    setError(''); setLoading(true);
    try {
      requireSupabase();
      if (!agree) throw new Error('Please accept the membership terms and code of conduct.');
      if (!privacyAgree) throw new Error('Please confirm the privacy and qualification-verification declaration.');
      if (!user) throw new Error('Please sign in before submitting a membership application.');
      if (!data.name.trim() || !data.email.trim() || !data.phone.trim()) throw new Error('Complete all required application fields.');
      if (data.email.trim().toLowerCase() !== String(user.email || '').trim().toLowerCase()) throw new Error('Use the email address associated with your signed-in NI4E account.');
      if (!data.address.trim() || !data.stateOfResidence.trim() || !data.nationality.trim()) throw new Error('Complete your residential address, state of residence and nationality.');
      if (!data.institution.trim() || !data.discipline.trim()) throw new Error('Complete your institution and engineering discipline.');
      if (data.category === 'Student Member' && (!String(data.studentProgramme || '').trim() || !String(data.studentLevel || '').trim() || !String(data.expectedGraduationYear || '').trim())) throw new Error('Student applicants must provide their current programme, current level/year of study and expected year of completion.');
      if (data.category === 'Student Member' && data.studentProgramme === 'Other' && !String(data.studentProgrammeOther||'').trim()) throw new Error('Please specify the current programme you selected as Other.');
      if (data.category === 'Graduate Member' && (!String(data.graduationYear||'').trim() || !String(data.institution||'').trim())) throw new Error('Graduate applicants must provide their institution and year of graduation.');
      if (data.category === 'Associate Member' && (!String(data.associateBasis||'').trim() || !String(data.associateBasisDetails||'').trim() || !String(data.associateTechnicalRole||'').trim())) throw new Error('Associate applicants must explain their membership basis, relevant technical background and role or experience.');
      if (data.category === 'Corporate Member' && (!String(data.corporateRegistrationBody||'').trim() || !String(data.corporateRegistrationStatus||'').trim() || !String(data.corporatePracticeArea||'').trim() || !String(data.corporateResponsibilities||'').trim() || !String(data.corporateYearsPractice||'').trim())) throw new Error('Corporate applicants must provide professional registration details, area of practice, responsibilities/projects and years practising.');
      if (data.category === 'Student Member' && data.studentProgramme === 'Other' && !String(data.studentProgrammeOther || '').trim()) throw new Error('Specify your current programme.');
      if (data.category !== 'Student Member' && !String(data.qualification || '').trim()) throw new Error('Select your highest completed qualification.');
      if (data.category !== 'Student Member' && data.qualification === 'Other' && !data.qualificationOther.trim()) throw new Error('Specify your other qualification.');
      if (data.discipline === 'Other' && !data.disciplineOther.trim()) throw new Error('Enter your engineering discipline.');
      if (data.category === 'Student Member' && data.studentProgramme === 'Other' && !String(data.studentProgrammeOther||'').trim()) throw new Error('Enter the name of your current programme.');
      if (['Graduate Member','Associate Member','Corporate Member'].includes(data.category) && data.qualification === 'Other' && !String(data.qualificationOther||'').trim()) throw new Error('Enter your qualification.');
      if (data.category === 'Corporate Member' && data.corporateRegistrationBody === 'Other' && !String(data.corporateRegistrationOther||'').trim()) throw new Error('Enter the professional registration body.');
      if (data.category === 'Student Member' && (!data.institution.trim() || !data.studentProgramme.trim())) throw new Error('Student applicants must provide their current programme and institution.');
      if (data.category === 'Graduate Member' && !String(data.graduationYear || '').trim()) throw new Error('Graduate applicants must provide their graduation year.');
      if (data.graduationYear && (Number(data.graduationYear) < 1950 || Number(data.graduationYear) > new Date().getFullYear() + 1)) throw new Error('Enter a valid graduation year.');
      const attachedTypes = new Set((existingApplication?.status === 'needs_information' ? existingDocuments : []).map(doc => String(doc.document_type || '').toLowerCase()));
      const hasFile = key => Boolean(documents[key]) || attachedTypes.has(key);
      if (data.category === 'Student Member' && (!hasFile('student_id') || !hasFile('proof_of_enrolment'))) throw new Error('Student Membership requires both a Student ID and proof of enrolment. Upload both documents before submitting.');
      if (data.category === 'Graduate Member' && !hasFile('degree_certificate') && !hasFile('statement_of_result')) throw new Error('Graduate Membership requires a degree certificate or statement of result. Upload at least one before submitting.');
      const configuredRequiredDocs = data.category === 'Associate Member' ? associateRequiredDocs : data.category === 'Corporate Member' ? corporateRequiredDocs : [];
      if (data.category === 'Corporate Member' && data.corporateRegistrationStatus === 'Registered' && !hasFile('corporate_registration_evidence')) throw new Error('You selected Registered. Upload your professional registration certificate or current practising licence as applicable.');
      const missingConfiguredDocs = configuredRequiredDocs.filter(label => !hasFile(documentKey(label)));
      if (missingConfiguredDocs.length) throw new Error(`Upload all required supporting documents: ${missingConfiguredDocs.join(', ')}.`);
      if (['Associate Member','Corporate Member'].includes(data.category) && !configuredRequiredDocs.every(label=>hasFile(documentKey(label)))) throw new Error('Upload each required document listed for your selected membership category.');
      for (const file of Object.values(documents).filter(Boolean)) {
        if (file.size > policy.maxDocumentSizeMb * 1024 * 1024) throw new Error(`Each document must be no larger than ${policy.maxDocumentSizeMb} MB.`);
        const extension = (file.name.split('.').pop() || '').toLowerCase();
        if (!policy.allowedTypes.includes(extension)) throw new Error(`The file type .${extension} is not allowed. Accepted types: ${policy.allowedTypes.join(', ')}.`);
      }
      const applicationData = { ...data };
      const currentUser = user;
      const { data: applicationRows, error: appLookupError } = await supabase.from('membership_applications').select('id,status,application_type,application_data,review_notes,reviewed_by,reviewed_at,submitted_at').eq('user_id', currentUser.id).order('submitted_at', { ascending: false });
      if (appLookupError) throw appLookupError;
      const existingApp = (applicationRows || []).find(row => !['renewal', 'upgrade'].includes(row.application_type)) || null;
      let appRow;
      if (existingApp && existingApp.status === 'needs_information') {
        if (!['same_application','allow_resubmission','enabled'].includes(String(policy.correctionPolicy||'').toLowerCase())) throw new Error('NI4E has disabled correction resubmission in Membership Policies. Your application remains saved; contact the Secretariat for guidance.');
        // A SECURITY DEFINER RPC checks ownership and status, preserves the prior review in history,
        // and reopens this same application row without granting applicants general update access.
        const { data: updatedApp, error: updateAppError } = await supabase.rpc('resubmit_membership_application', {
          p_application_id: existingApp.id,
          p_full_name: data.name.trim(),
          p_email: data.email.trim().toLowerCase(),
          p_phone: data.phone.trim(),
          p_category: data.category,
          p_application_data: { ...applicationData, resubmitted_at: new Date().toISOString() }
        });
        if (updateAppError) throw updateAppError;
        appRow = Array.isArray(updatedApp) ? updatedApp[0] : updatedApp;
        if (!appRow?.id) throw new Error('The application was not resubmitted. Refresh the page and try again.');
      } else {
        if (existingApp && existingApp.status === 'rejected') {
          const rejectedAt = existingApp.reviewed_at || existingApp.submitted_at;
          const waitDays = policy.rejectionWaitDays;
          if (waitDays === null || !rejectedAt || (Date.now() - new Date(rejectedAt).getTime()) < waitDays * 86400000) throw new Error(waitDays === null ? 'NI4E has not configured the reapplication waiting period yet. Please contact the Secretariat.' : `You may submit a new application after the ${waitDays}-day waiting period has elapsed.`);
        } else if (existingApp) {
          throw new Error(['pending', 'under_review'].includes(existingApp.status) ? 'Your application is already being reviewed. Check the application tracker for updates. You cannot submit a duplicate application.' : `An application already exists with status "${existingApp.status}". Please use your application tracker or contact NI4E before starting another application.`);
        }
        const { data: createdApp, error: createAppError } = await supabase.from('membership_applications').insert({
          user_id: currentUser.id, full_name: data.name.trim(), email: data.email.trim().toLowerCase(), phone: data.phone.trim(),
          category: data.category, status: 'pending', application_data: applicationData, source: 'website-registration'
        }).select('id').single();
        if (createAppError) throw createAppError;
        appRow = createdApp;
      }
      const ref = `NI4E-${String(appRow.id).slice(0,8).toUpperCase()}`;
      setApplicationRef(ref);
      const chosen = Object.entries(documents).filter(([,file])=>file);
      const uploaded = [];
      const failed = [];
      for (const [kind,file] of chosen) {
        let path = '';
        try {
          if (file.size > policy.maxDocumentSizeMb*1024*1024) throw new Error(`file exceeds the ${policy.maxDocumentSizeMb} MB limit`);
          const extension = (file.name.split('.').pop() || '').toLowerCase();
          if (!policy.allowedTypes.includes(extension)) throw new Error(`unsupported file type .${extension}`);
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
  const rejectedAt = existingApplication?.reviewed_at || existingApplication?.submitted_at;
  const reapplicationAllowed = Boolean(existingApplication?.status === 'rejected' && policy.rejectionWaitDays !== null && rejectedAt && (Date.now() - new Date(rejectedAt).getTime()) >= policy.rejectionWaitDays * 86400000);
  const correctionAllowed = existingApplication?.status === 'needs_information';
  const canSubmit = !existingApplication || correctionAllowed || reapplicationAllowed;
  if (applicationLoading) return <><PageHero title="Membership Application" crumb="Membership / Register" desc="Loading your saved application securely."/><section className="section"><div className="formBox"><h2>Loading your application…</h2><p className="muted">We’re checking whether you have an application to continue or correct. Please wait so you don’t start a duplicate.</p></div></section></>;
  if (submitted) return <><PageHero title="Application Submitted" crumb="Membership / Register"/><section className="success reveal visible"><div className="successRing"><CheckCircle2 size={50}/></div><span className="kicker">APPLICATION RECEIVED</span><h2>Your application has been saved.</h2><p>Your membership application has been submitted from your signed-in account. {policy.reviewTimeline ? `NI4E's stated review timeline: ${policy.reviewTimeline}. ` : 'The official review timeline will be communicated by NI4E. '}Payment remains locked until approval.</p><div className="successRef">Application reference <b>{applicationRef}</b></div><div className="successRef">Supporting documents <b>{documentMessage}</b></div><div className="successRef">Application status <b>Pending review · Payment not yet available</b></div><div className="formActions"><button className="gold" onClick={()=>setPage('dashboard')}>View application status <ArrowRight size={17}/></button><button className="outlineDark" onClick={()=>setPage('home')}>Return Home</button></div></section></>;
  if (existingApplication && ['pending','under_review','approved','payment_pending','active'].includes(existingApplication.status)) { const approved = ['approved','payment_pending'].includes(existingApplication.status); const activeMember = existingApplication.status === 'active'; const statusText = ({pending:'Submitted — awaiting review',under_review:'Under review',approved:'Approved — payment due',payment_pending:'Payment processing',active:'Membership active'}[existingApplication.status] || existingApplication.status); return <><PageHero title={activeMember?'Membership Active':'Application Already Submitted'} crumb="Membership / Register" desc="Your existing application is linked to this account."/><section className="section"><div className="formBox existingApplicationStatusCard"><span className="kicker">APPLICATION TRACKER</span><h2>{statusText}</h2><p>{existingApplication.status==='pending'?'Your application has been received and is waiting for NI4E review. You do not need to submit another application.':existingApplication.status==='under_review'?'An authorised reviewer is assessing your application. You can follow the status from your member dashboard.':approved?'NI4E has approved this application. Continue to the payment page to see whether the official fee is configured and payment is available.':'Your payment and membership activation are recorded. Open the member portal to manage your membership.'}</p><div className="successRef">Application reference <b>NI4E-{String(existingApplication.id).slice(0,8).toUpperCase()}</b></div><div className="successRef">Membership category <b>{existingApplication.category}</b></div><div className="formActions"><button className="gold" onClick={()=>setPage(activeMember?'dashboard':approved?'payment':'dashboard')}>{activeMember?'Open member portal':approved?'Continue to payment':'Track application'} <ArrowRight size={17}/></button><button className="outlineDark" onClick={()=>setPage('membership')}>View membership information</button></div></div></section></>; }
  return <><PageHero title="Membership Registration" crumb="Membership / Register" desc="Complete the guided application in a few simple steps."/><section className="formSection reveal visible"><div className="formBox"><div className="stepsNav">{(['Student Member','Graduate Member','Associate Member','Corporate Member'].includes(data.category) ? (data.category==='Student Member'?['Account','Personal','Study details','Technical interests','Documents','Review']:data.category==='Graduate Member'?['Account','Personal','Qualifications','Career profile','Documents','Review']:data.category==='Associate Member'?['Account','Personal','Qualifications','Professional profile','Documents','Review']:['Account','Personal','Qualifications','Corporate profile','Documents','Review']) : ['Account','Personal','Education','Professional','Documents','Review']).map((label,index)=><button type="button" key={label} className={step===index+1?'active':''} onClick={()=>index+1<step&&setStep(index+1)}><b>{index+1}</b><span>{label}</span></button>)}</div>
    {step===1&&<><h2>{existingApplication?.status === 'needs_information' ? 'Correct your NI4E membership application' : existingApplication?.status === 'rejected' ? 'Start a new membership application' : 'Your NI4E membership application'}</h2><p className="muted">You are signed in as {user.email}. {existingApplication?.status === 'needs_information' ? 'Your saved details have been restored. Correct the requested information and resubmit the same application.' : existingApplication?.status === 'rejected' ? 'Your previous details have been restored for reference. A new application can only be submitted after the configured waiting period; the rejected application will remain in your history.' : 'Complete your application details below.'}</p>{existingApplication && ['rejected','needs_information'].includes(existingApplication.status) && <div className="applicationReviewMessage"><b>{existingApplication.status === 'rejected' ? 'Final rejection record' : 'Correction request'}</b><p>{existingApplication.review_notes || 'No reviewer note was recorded.'}</p><small>Previous application reference: NI4E-{String(existingApplication.id).slice(0,8).toUpperCase()}</small>{existingApplication.status === 'rejected' && <p>{policy.rejectionWaitDays === null ? 'Reapplication is currently unavailable because NI4E has not configured the waiting period.' : reapplicationAllowed ? 'The waiting period has elapsed. Submitting will create a new application reference; the rejected record remains in history.' : `The configured waiting period is ${policy.rejectionWaitDays} days. You cannot submit a new application yet.`}</p>}</div>}<div className="formGrid"><Field label="Full name" value={data.name} onChange={v=>update('name',v)} placeholder="Enter your full name"/><label>Email address<input type="email" value={user.email||data.email} readOnly aria-readonly="true" autoComplete="email"/></label><Field label="Phone number" value={data.phone} onChange={v=>update('phone',v)} placeholder="+234 800 000 0000"/><label>Membership category<select value={data.category} onChange={e=>{const category=e.target.value;setError('');setStep(1);setData(current=>({...current,category,qualification:category==='Student Member'?'':current.qualification,qualificationOther:category==='Student Member'?'':current.qualificationOther,studentProgramme:category==='Student Member'?current.studentProgramme:'',studentProgrammeOther:category==='Student Member'?current.studentProgrammeOther:'',graduationYear:category==='Graduate Member'?current.graduationYear:'',currentRole:['Graduate Member','Associate Member','Corporate Member'].includes(category)?current.currentRole:'',organisation:['Graduate Member','Associate Member','Corporate Member'].includes(category)?current.organisation:'',yearsExperience:['Graduate Member','Associate Member','Corporate Member'].includes(category)?current.yearsExperience:''}));}}><option value="">Select membership category</option><option>Student Member</option><option>Graduate Member</option><option>Associate Member</option><option>Corporate Member</option></select></label></div>{data.category === 'Associate Member' && policy.associateEligibility && !policy.associateEligibility.toLowerCase().includes('not configured') && <div className="applicationReviewMessage"><b>NI4E Associate eligibility guidance</b><p>{policy.associateEligibility}</p></div>}{data.category === 'Corporate Member' && policy.corporateDefinition && !policy.corporateDefinition.toLowerCase().includes('not confirmed') && !policy.corporateDefinition.toLowerCase().includes('not configured') && <div className="applicationReviewMessage"><b>NI4E Corporate Membership guidance</b><p>{policy.corporateDefinition}</p></div>}<div className="formActions"><button className="gold" type="button" onClick={()=>{if(!data.name.trim()||!data.email.trim()||!data.phone.trim()){setError('Complete all required account fields before continuing.');return;}if(!data.category){setError('Select a membership category before continuing.');return;}setError('');next();}}>Continue <ArrowRight size={17}/></button></div></>}
    {step===2&&<StepForm title="Personal information" text="Provide accurate identity and contact details. NI4E uses these details to administer your application and communicate review decisions." fields={STEP_FIELDS[2]} values={data} onChange={update} onBack={()=>setStep(1)} onNext={next}/>}
    {step===3&&<StepForm title="Education & qualifications" text="Enter your academic qualification or current programme, the institution and the engineering discipline relevant to your application." fields={STEP_FIELDS[3]} values={data} onChange={update} onBack={()=>setStep(2)} onNext={next}/>}
    {step===4&&<StepForm title={data.category === 'Student Member' ? 'Student Technical Interests' : data.category === 'Graduate Member' ? 'Graduate Career Profile' : data.category === 'Associate Member' ? 'Associate Professional Profile' : data.category === 'Corporate Member' ? 'Corporate Professional Profile' : 'Professional experience'} text={data.category === 'Student Member' ? 'Tell NI4E which engineering areas interest you. Students are not asked for employment history or professional references.' : 'Describe your work, professional registration and technical practice. Professional referees are not required on this general membership form; NI4E can request specific evidence during review.'} fields={STEP_FIELDS[4]} values={data} onChange={update} onBack={()=>setStep(3)} onNext={next}/>}
    {step===5&&<><h2>Supporting documents</h2><p className="muted">Upload documents relevant to your category. The current upload limit and allowed file types are shown below. You must be signed in to upload documents. Selected files are previewed before submission, and upload errors are shown so you can retry from the Membership Application area.</p>{existingDocuments.length > 0 && <div className="existingApplicationDocuments"><b>Documents already attached to this application</b><p className="muted">These files remain on your record. Add a new file below if a document was missing, incorrect or needs replacing.</p>{existingDocuments.map(doc => <div key={doc.id}><FileText size={16}/><span>{String(doc.document_type || 'document').replaceAll('_',' ')} — {doc.file_name}</span></div>)}</div>}<div className="formGrid">{data.category === 'Student Member' ? <><FileUpload label="Student ID (required)" accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.student_id} onChange={file=>setDocuments(old=>({...old,student_id:file}))}/><FileUpload label="Proof of enrolment (required)" accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.proof_of_enrolment} onChange={file=>setDocuments(old=>({...old,proof_of_enrolment:file}))}/></> : data.category === 'Graduate Member' ? <><FileUpload label="Degree certificate (optional if statement supplied)" accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.degree_certificate} onChange={file=>setDocuments(old=>({...old,degree_certificate:file}))}/><FileUpload label="Statement of result (optional if degree certificate supplied)" accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.statement_of_result} onChange={file=>setDocuments(old=>({...old,statement_of_result:file}))}/></> : <>{(data.category === 'Associate Member' ? associateRequiredDocs : corporateRequiredDocs).length ? <><div className="dropzone"><FileText size={20}/><span>Required documents for this category. Upload each item to continue. This list can be adjusted by an authorised NI4E administrator when policy is formally approved.</span></div>{(data.category === 'Associate Member' ? associateRequiredDocs : corporateRequiredDocs).map(label => { const key = documentKey(label); return <FileUpload key={key} label={`${label} (required)`} required accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents[key] || null} onChange={file=>setDocuments(old=>({...old,[key]:file}))}/>; })}{data.category === 'Corporate Member' && <FileUpload label={`Professional registration certificate / practising licence ${data.corporateRegistrationStatus === 'Registered' ? '(required)' : '(optional, if available)'}`} required={data.corporateRegistrationStatus === 'Registered'} accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.corporate_registration_evidence || null} onChange={file=>setDocuments(old=>({...old,corporate_registration_evidence:file}))}/>}</> : <><div className="dropzone"><FileText size={20}/><span>{data.category === 'Associate Member' ? (policy.associateDocuments && !policy.associateDocuments.toLowerCase().includes('not configured') ? policy.associateDocuments : 'Upload evidence of your highest relevant qualification, a current CV/resume, and evidence of relevant technical or industry experience (such as an employment letter, project record, professional training certificate or portfolio). NI4E may request further evidence during review.') : (policy.corporateDocuments && !policy.corporateDocuments.toLowerCase().includes('not configured') ? policy.corporateDocuments : 'Upload your degree certificate or statement of result, current CV/resume, and available professional registration or membership evidence. Include project or employment evidence supporting your stated professional practice. Registration evidence is required where you state that you are registered.')}</span></div><FileUpload label={data.category === 'Associate Member' ? 'Qualification / experience evidence (required)' : data.category === 'Corporate Member' ? 'Qualification / professional practice evidence (required)' : 'Supporting document (if applicable)'} required={data.category === 'Associate Member' || data.category === 'Corporate Member'} accept={policy.allowedTypes.map(type=>`.${type}`).join(',')} maxSize={policy.maxDocumentSizeMb*1024*1024} value={documents.supporting_document} onChange={file=>setDocuments(old=>({...old,supporting_document:file}))}/></>}</>}</div><div className="dropzone"><UploadCloud size={25}/><span>Accepted file types: {policy.allowedTypes.join(', ')}. Maximum {policy.maxDocumentSizeMb} MB per file. Documents are stored privately for NI4E review.</span></div><div className="formActions"><button className="outlineDark" type="button" onClick={()=>setStep(4)}>Back</button><button className="gold" type="button" onClick={()=>setStep(6)}>Review application <ArrowRight size={17}/></button></div></>}
    {step===6&&<><h2>Review & submit</h2><p className="muted">Check the information before submitting your membership application.</p><div className="reviewCard comprehensiveReview"><div><span>Applicant</span><b>{data.name}</b></div><div><span>Membership</span><b>{data.category}</b></div><div><span>Email</span><b>{data.email}</b></div><div><span>Phone</span><b>{data.phone}</b></div><div><span>Date of birth</span><b>{data.dateOfBirth||'Not provided'}</b></div><div><span>Residence</span><b>{[data.address,data.stateOfResidence,data.nationality].filter(Boolean).join(', ')||'Not provided'}</b></div><div><span>{data.category === 'Student Member' ? 'Current programme and level' : 'Highest completed qualification'}</span><b>{data.category === 'Student Member' ? `${data.studentProgramme === 'Other' ? data.studentProgrammeOther : (data.studentProgramme || 'Not provided')} — ${data.studentLevel || 'Level not provided'}` : (data.qualification === 'Other' ? data.qualificationOther : (data.qualification || 'Not provided'))}</b></div><div><span>Discipline</span><b>{data.discipline==='Other'?data.disciplineOther:(data.discipline||'Not provided')}</b></div><div><span>{data.category === 'Student Member' ? 'Institution / expected completion' : 'Institution / graduation year'}</span><b>{[data.institution, data.category === 'Student Member' ? data.expectedGraduationYear : data.category === 'Graduate Member' ? data.graduationYear : ''].filter(Boolean).join(' · ')||'Not provided'}</b></div><div><span>Category-specific details</span><b>{data.category === 'Associate Member' ? [data.associateBasis,data.associateTechnicalRole].filter(Boolean).join(' · ') : data.category === 'Corporate Member' ? [data.corporateRegistrationBody,data.corporateRegistrationStatus,data.corporatePracticeArea,data.corporateYearsPractice].filter(Boolean).join(' · ') : data.category === 'Graduate Member' ? [data.graduationClass,data.graduateCareerPlan].filter(Boolean).join(' · ') : [data.studentLevel,data.expectedGraduationYear].filter(Boolean).join(' · ') || 'Not provided'}</b></div><div><span>Organisation / role</span><b>{[data.organisation,data.currentRole].filter(Boolean).join(' · ')||'Not provided'}</b></div><div><span>Professional registration</span><b>{[data.professionalRegistration,data.professionalRegistrationNumber].filter(Boolean).join(' · ')||'Not provided'}</b></div><div><span>NSE membership</span><b>{[data.nseStatus,data.nseNumber].filter(Boolean).join(' · ')||'Not provided'}</b></div><div><span>Technical interests</span><b>{data.specialistInterests||'Not provided'}</b></div><div><span>Experience</span><b>{data.yearsExperience||'Not applicable / not provided'}</b></div></div><div className="membershipDeclarationChecks"><label className="check"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> I confirm that the information and documents supplied are accurate and agree to the NI4E membership terms and code of conduct.</label><label className="check"><input type="checkbox" checked={privacyAgree} onChange={e=>setPrivacyAgree(e.target.checked)}/> I understand that NI4E may securely review my submitted documents and verify qualifications, registrations or referee details where required for this application.</label></div><div className="formActions"><button className="outlineDark" type="button" onClick={()=>setStep(5)}>Back</button><button className="gold" type="button" disabled={loading||!agree||!privacyAgree||!canSubmit} onClick={submit}>{loading?<><span className="buttonSpinner" aria-hidden="true"/> Submitting application…</>:<>Submit Application <Check size={17}/></>}</button></div></>}
    {error&&<p role="status" style={{color:error.includes('loaded for correction')?'#176b50':'#b42318',marginTop:16}}>{error}</p>}
  </div></section></>;
}
