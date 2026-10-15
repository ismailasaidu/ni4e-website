import React, { useEffect } from 'react';
import { useAuth } from './auth';
import { ArrowRight, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import ApplicantPortal from '../member/ApplicantPortal';

export default function ProtectedRoute({ children, setPage, requiredRole, publicGate = false }) {
  const { user, profile, loading, configured } = useAuth();
  useEffect(() => {
    if (configured && !loading && !user && !publicGate) setPage('login');
  }, [configured, loading, user, setPage, publicGate]);

  if (!configured) return <section className="formSection"><div className="formBox"><h2>Supabase setup required</h2><p className="muted">Add your Supabase project URL and anon/publishable key to .env, then restart the app.</p></div></section>;
  if (loading) return <section className="formSection"><div className="formBox"><h2>Checking your account…</h2><p className="muted">Please wait while NI4E verifies your access.</p></div></section>;

  if (!user) {
    if (publicGate) return <section className="formSection"><div className="formBox memberPortalGate"><span className="kicker">NI4E MEMBER SERVICES</span><LockKeyhole size={34}/><h2>Member portal sign-in required</h2><p className="muted">The member portal is available to approved members whose required membership payment has been verified. Sign in to check your application or continue to your member dashboard.</p><div className="formActions"><button className="gold" onClick={() => setPage('login')}><LogIn size={17}/> Sign in</button><button className="outlineDark" onClick={() => setPage('membership')}>Membership information</button></div></div></section>;
    return null;
  }

  if (requiredRole && profile?.role !== requiredRole) return <section className="formSection"><div className="formBox"><ShieldCheck size={32}/><h2>Access restricted</h2><p className="muted">This area is available to authorised administrators only. Your account does not have the required role.</p><button className="gold" onClick={() => setPage('home')}>Return to website</button></div></section>;

  if (!requiredRole && profile?.membershipStatus !== 'active') {
    if (publicGate) return <ApplicantPortal setPage={setPage} />;
    return <section className="formSection"><div className="formBox"><h2>You are not an active NI4E member yet</h2><p className="muted">The members-only dashboard is available after your application has been approved and your payment verified. Applicants can use the limited membership payment page to check the next step.</p><div className="formActions"><button className="outlineDark" onClick={() => setPage('payment')}>Application / Payment Status</button><button className="gold" onClick={() => setPage('membership')}>Membership information</button></div></div></section>;
  }
  return children;
}
