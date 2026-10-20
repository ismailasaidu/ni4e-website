import React, { useEffect, useState } from 'react';
import { ArrowRight, CreditCard, ShieldCheck, CircleAlert, CheckCircle2 } from 'lucide-react';
import { supabase, requireSupabase } from '../firebase/config';
import { useAuth } from '../firebase/auth';
import { PageHero } from '../components';

export default function Payments({ setPage }) {
  const { user, profile } = useAuth();
  const [fee, setFee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [application, setApplication] = useState(null);
  const category = application?.category || (profile?.membership_number ? (profile?.membership_category || profile?.membershipCategory || '') : '');
  const canPay = Boolean(user && application && application.status === 'approved' && !history.some(item => item.application_id === application.id && item.status === 'success'));
  const payableAmount = application?.application_type === 'upgrade' ? fee?.upgrade_amount_kobo : application?.application_type === 'renewal' ? fee?.renewal_amount_kobo : fee?.amount_kobo;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        requireSupabase();
        const { data: appData, error: appError } = user ? await supabase.from('membership_applications').select('id,category,status,application_type,previous_category,submitted_at').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle() : { data: null, error: null };
        if (appError && appError.code !== '42P01') throw appError;
        if (active) setApplication(appData || null);
        const effectiveCategory = appData?.category || category;
        const { data: feeData, error: feeError } = await supabase.from('membership_fee_schedule').select('category,amount_kobo,upgrade_amount_kobo,renewal_amount_kobo,currency,active').eq('category', effectiveCategory).eq('active', true).maybeSingle();
        if (feeError) throw feeError;
        const { data: paymentData, error: paymentError } = user ? await supabase.from('membership_payments').select('id,application_id,category,payment_type,amount_kobo,currency,status,created_at,provider_reference').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20) : { data: [], error: null };
        if (paymentError && paymentError.code !== '42P01') throw paymentError;
        if (active) { setFee(feeData); setHistory(paymentData || []); }
      } catch (err) { if (active) setMessage(err.message || 'Unable to load payment information.'); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [category, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'verify' || !params.get('reference') || !user) return;
    let active = true;
    (async () => {
      setProcessing(true); setMessage('Verifying payment with the provider…');
      try {
        const { data, error } = await supabase.functions.invoke('verify-membership-payment', { body: { reference: params.get('reference') } });
        if (error) throw error; if (data?.error) throw new Error(data.error);
        if (active) { setPaymentResult(data); setMessage(data.message || 'Payment verification complete.'); }
        const cleanUrl = new URL(window.location.href); cleanUrl.searchParams.delete('payment'); cleanUrl.searchParams.delete('reference'); window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.hash);
        const { data: rows } = await supabase.from('membership_payments').select('id,application_id,category,payment_type,amount_kobo,currency,status,created_at,provider_reference').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
        if (active) setHistory(rows || []);
      } catch (err) { if (active) setMessage(err.message || 'Unable to verify payment.'); }
      finally { if (active) setProcessing(false); }
    })(); return () => { active = false; };
  }, [user?.id]);

  const startPayment = async () => {
    setMessage('');
    if (!user) { setMessage('Application received. Please confirm your email and sign in after NI4E sends the approval email. Payment is not available while the application is under review.'); return; }
    if (!application || application.status !== 'approved') { setMessage(application?.status === 'rejected' ? 'This application was not approved. Please check your email for the decision and next steps.' : 'Your application is awaiting NI4E approval. Payment will unlock after approval. Check your dashboard and email for the decision.'); return; }
    if (!payableAmount) { setMessage(application?.application_type === 'upgrade' ? 'NI4E has not configured the approved upgrade fee yet. No amount has been guessed.' : application?.application_type === 'renewal' ? 'NI4E has not configured the approved annual renewal fee for this category yet. No amount has been guessed.' : 'NI4E has not configured the approved fee for this membership category yet. No amount has been guessed.'); return; }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('initialize-membership-payment', { body: { category, application_id: application.id } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
      if (!data?.authorization_url) throw new Error('The payment provider did not return a checkout link.');
      window.location.assign(data.authorization_url);
    } catch (err) { setMessage(err.message || 'Unable to start payment.'); }
    finally { setProcessing(false); }
  };

  const naira = (kobo) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(kobo) / 100);
  return <><PageHero title="Membership Payments" crumb="Membership / Payments" desc="Review the approved membership fee and track payment status."/><section className="section paymentPage"><div className="paymentIntro"><span className="kicker">MEMBERSHIP DUES</span><h2>Complete your membership payment.</h2><p>Payment is enabled only after NI4E approves your application or membership upgrade. The official review timeline is published when configured by NI4E.</p></div><div className="paymentCard"><div className="paymentCardIcon"><CreditCard size={24}/></div><span className="kicker">MEMBERSHIP PAYMENT</span><h3>{category || 'No category selected yet'}</h3>{!user?<div className="paymentNotice"><CircleAlert size={19}/><span>Sign in and submit a membership application first. Payment becomes available after NI4E approval.</span></div>:!application?<div className="paymentNotice"><CircleAlert size={19}/><span>You have not submitted a membership application yet. Start your application to select a category and provide the required details.</span><button className="textbtn" onClick={()=>setPage('register')}>Start application <ArrowRight size={16}/></button></div>:application.status!=='approved'?<div className="paymentNotice"><CircleAlert size={19}/><span>{application?.status==='rejected'?'This application was not approved. Please check your email for next steps.':application?.status==='needs_information'?'NI4E has requested corrections. Update and resubmit your application before payment can be considered.':'Your application has been received and is awaiting the next review decision. Payment becomes available after approval.'}</span></div>:loading?<p>Loading approved fee…</p>:payableAmount?<><div className="paymentAmount">{naira(payableAmount)}</div><p>{application?.application_type === 'upgrade' ? 'Upgrade fee configured by NI4E.' : application?.application_type === 'renewal' ? 'Annual renewal fee configured by NI4E.' : 'Official application fee configured by NI4E.'}</p></>:<div className="paymentNotice"><CircleAlert size={19}/><span>{application?.application_type === 'upgrade' ? 'The approved upgrade fee has not been configured. NI4E must enter it before checkout can begin.' : application?.application_type === 'renewal' ? 'The official annual renewal fee for this category has not been configured. NI4E must enter the approved amount before checkout can begin.' : 'The official fee for this category has not been configured yet. NI4E must enter the approved amount before checkout can begin.'}</span></div>}<button className="gold wide" onClick={startPayment} disabled={loading||processing||!canPay||!payableAmount}><CreditCard size={17}/> {processing?'Processing…':'Proceed to payment'}</button><div className="paymentSecurity"><ShieldCheck size={16}/> Payments must be verified by the payment provider.</div>{paymentResult?.verified&&<p className="paymentNotice"><CheckCircle2 size={18}/><span>{paymentResult.activated?'Payment verified and membership activated. Your membership certificate will be available in the portal.':'Payment verified by the provider. Check your membership status for any remaining NI4E approval step.'}</span></p>}{message&&<p role="status" className="paymentMessage">{message}</p>}</div><div className="paymentHistory"><h3>Payment history</h3>{history.length?history.map(item=><div className="paymentHistoryRow" key={item.id}><div><b>{item.category} {item.payment_type === 'renewal' ? 'annual renewal' : item.payment_type === 'upgrade' ? 'upgrade' : 'membership'} fee</b><small>{new Date(item.created_at).toLocaleDateString()}</small></div><strong>{naira(item.amount_kobo)}</strong><span className={`paymentStatus ${item.status}`}>{item.status}</span></div>):<p className="muted">{user?'No membership payments have been recorded yet.':'Sign in to view your payment history.'}</p>}{!user&&<button className="outlineDark" onClick={()=>setPage('login')}>Sign in to your account <ArrowRight size={16}/></button>}</div></section></>;
}
