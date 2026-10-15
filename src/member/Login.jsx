import React, { useState } from 'react';
import { supabase, requireSupabase } from '../firebase/config';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/ni4e-logo.png';

export default function Login({ setPage, notify }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const login = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      requireSupabase();
      if (createAccount) {
        if (!fullName.trim() || !phone.trim()) throw new Error('Enter your full name and phone number to create an account.');
        if (password.length < 6) throw new Error('Choose a password with at least 6 characters.');
        const { data: created, error: createError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: fullName.trim(), phone: phone.trim(), membership_category: 'Graduate Member' } } });
        if (createError) throw createError;
        if (!created.session) { notify?.('Account created', 'Confirm your email, then sign in to submit your membership application.'); setCreateAccount(false); setPassword(''); return; }
        notify?.('Account created', 'You are signed in. Continue to your membership application.');
        setPage('register');
        return;
      }
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      const { data: accountProfile } = await supabase.from('profiles').select('membership_status,role').eq('id', signInData.user.id).maybeSingle();
      let requestedDestination = ''; try { requestedDestination = sessionStorage.getItem('ni4e_after_login') || ''; sessionStorage.removeItem('ni4e_after_login'); } catch {}
      if (accountProfile?.role === 'admin') {
        notify?.('Administrator signed in', 'Opening the administration portal.');
        setPage('admin');
        return;
      }
      if (requestedDestination === 'register') { notify?.('Signed in', 'Continue with your membership application.'); setPage('register'); return; }
      if (accountProfile?.membership_status !== 'active') {
        notify?.('Your member portal is not active yet', 'You can track your application here. Full member access unlocks after approval and verified payment.');
        setPage('payment');
        return;
      }
      notify?.('Welcome back', 'You are signed in successfully.');
      setPage('dashboard');
    } catch (err) {
      const messages = { 'invalid_credentials': 'Email or password is incorrect.', 'user_banned': 'This account has been disabled.', 'email_not_confirmed': 'Please confirm your email address first.', 'invalid_email': 'Enter a valid email address.' };
      setError(messages[err.code] || err.message || 'Unable to sign in.');
    } finally { setLoading(false); }
  };
  const resetPassword = async () => {
    setError('');
    try { requireSupabase(); if (!email.trim()) { setError('Enter your email address first.'); return; } const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim()); if (resetError) throw resetError; notify?.('Reset email sent', 'Check your inbox for password reset instructions.'); }
    catch (err) { setError(err.message || 'Unable to send password reset email.'); }
  };
  return <section className="loginPage"><div className="loginBackdrop"><span/><span/><span/></div><form className="loginCard reveal visible" onSubmit={login}><div className="loginLogo"><img src={logo} alt="NI4E logo"/></div><span className="kicker">NI4E ACCOUNT ACCESS</span><h1>{createAccount ? 'Create your account.' : 'Welcome back.'}</h1><p className="muted">{createAccount ? 'Create your secure NI4E account first. Confirm your email if requested, then sign in to submit a membership application.' : 'Sign in to track your application or access your NI4E account. Full member portal access is reserved for activated members.'}</p>{createAccount && <><label>Full name<input autoComplete="name" required value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Enter your full name"/></label><label>Phone number<input autoComplete="tel" required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000"/></label></>}<label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email"/></label><label className="passwordField">Password<input type={show?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></label><div className="loginOptions"><span></span><button type="button" onClick={resetPassword}>Forgot password?</button></div>{error&&<p role="alert" style={{color:'#b42318',fontSize:'.9rem'}}>{error}</p>}<button className="gold wide" type="submit" disabled={loading}>{loading?<><span className="buttonSpinner"/> {createAccount ? 'Creating account…' : 'Signing in…'}</>:<>{createAccount ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></>}</button><div className="loginFoot"><button type="button" onClick={()=>{setCreateAccount(value=>!value);setError('');}}>{createAccount ? 'Already have an account? Sign in' : 'Create an account'}</button><span>Secure NI4E account</span></div></form></section>;
}
