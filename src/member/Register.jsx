import React, { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, UploadCloud } from 'lucide-react';
import { PageHero, Field } from '../components';

export function StepForm({ title, text, fields, onNext, onBack }) {
  return (
    <>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <div className="formGrid">
        {fields.map((field) => (
          <label key={field}>
            {field}
            <input placeholder={`Enter ${field.toLowerCase()}`} />
          </label>
        ))}
      </div>
      <div className="formActions">
        <button className="outlineDark" type="button" onClick={onBack}>Back</button>
        <button className="gold" type="button" onClick={onNext}>Continue <ArrowRight size={17} /></button>
      </div>
    </>
  );
}

export default function Register({ setPage, notify }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Corporate Member',
    password: ''
  });

  const update = (key, value) => setData((current) => ({ ...current, [key]: value }));

  const next = () => {
    setStep((current) => current + 1);
    notify?.('Progress saved', 'Your application details are ready for the next step.');
  };

  if (submitted) {
    return (
      <>
        <PageHero title="Application Complete" crumb="Membership / Register" />
        <section className="success reveal visible">
          <div className="successRing"><CheckCircle2 size={50} /></div>
          <span className="kicker">DEMO APPLICATION</span>
          <h2>Your application is ready for review.</h2>
          <p>
            Your application has been captured in this prototype. A production implementation
            can connect this workflow to verification, document review and payment.
          </p>
          <div className="successRef">Application reference <b>NI4E-DEMO-2026-00123</b></div>
          <button className="gold" onClick={() => setPage('login')}>
            Continue to Member Portal <ArrowRight size={17} />
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="Membership Registration"
        crumb="Membership / Register"
        desc="Complete the guided application in a few simple steps."
      />

      <section className="formSection reveal visible">
        <div className="formBox">
          <div className="stepsNav">
            {['Account', 'Personal', 'Professional', 'Documents', 'Review'].map((label, index) => (
              <button
                type="button"
                key={label}
                className={step === index + 1 ? 'active' : ''}
                onClick={() => index + 1 < step && setStep(index + 1)}
              >
                <b>{index + 1}</b>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2>Create your NI4E account</h2>
              <p className="muted">Start your professional membership application.</p>

              <div className="formGrid">
                <Field label="Full name" value={data.name} onChange={(value) => update('name', value)} placeholder="Enter your full name" />
                <Field label="Email address" value={data.email} onChange={(value) => update('email', value)} placeholder="name@example.com" />
                <Field label="Phone number" value={data.phone} onChange={(value) => update('phone', value)} placeholder="+234 800 000 0000" />

                <label>
                  Membership category
                  <select value={data.category} onChange={(event) => update('category', event.target.value)}>
                    <option>Corporate Member</option>
                    <option>Graduate Member</option>
                    <option>Associate Member</option>
                    <option>Student Member</option>
                    <option>Fellow</option>
                  </select>
                </label>

                <label className="passwordField">
                  Create password
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(event) => update('password', event.target.value)}
                    placeholder="Create a secure password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </label>
              </div>

              <div className="formActions">
                <button className="gold" type="button" onClick={next}>Continue <ArrowRight size={17} /></button>
              </div>
            </>
          )}

          {step === 2 && (
            <StepForm
              title="Personal information"
              text="Tell us a little more about you."
              fields={['Date of birth', 'State of residence', 'Residential address', 'Nationality']}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepForm
              title="Professional details"
              text="Add your education and professional information."
              fields={['Highest qualification', 'Institution', 'Graduation year', 'Current organisation']}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <>
              <h2>Upload documents</h2>
              <p className="muted">Demo upload area — production storage can be connected later.</p>
              <div className="dropzone">
                <UploadCloud size={34} />
                <b>Drop files here or browse</b>
                <span>Passport photograph · Certificates · Supporting documents</span>
                <button className="outlineDark" type="button">Choose files</button>
              </div>
              <div className="formActions">
                <button className="outlineDark" type="button" onClick={() => setStep(3)}>Back</button>
                <button className="gold" type="button" onClick={() => setStep(5)}>Review application <ArrowRight size={17} /></button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2>Review & submit</h2>
              <p className="muted">Check the information before submitting your membership application.</p>

              <div className="reviewCard">
                <div><span>Applicant</span><b>{data.name || 'Your full name'}</b></div>
                <div><span>Membership</span><b>{data.category}</b></div>
                <div><span>Email</span><b>{data.email || 'name@example.com'}</b></div>
                <div><span>Phone</span><b>{data.phone || '+234...'}</b></div>
              </div>

              <label className="check">
                <input type="checkbox" />
                I agree to the NI4E membership terms and code of conduct.
              </label>

              <div className="formActions">
                <button className="outlineDark" type="button" onClick={() => setStep(4)}>Back</button>
                <button
                  className="gold"
                  type="button"
                  onClick={() => {
                    setSubmitted(true);
                    notify?.('Application submitted', 'Your demonstration application has been captured.');
                  }}
                >
                  Submit Application <Check size={17} />
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="why">
          <span className="kicker">APPLICATION</span>
          <h3>Designed around the member.</h3>
          {['Professional recognition', 'Technical resources', 'Industry networking', 'Events & training', 'Member community'].map((item) => (
            <p key={item}><CheckCircle2 size={16} /> {item}</p>
          ))}
          <div className="secure"><LockKeyhole size={16} /><span>Secure member experience</span></div>
        </aside>
      </section>
    </>
  );
}
