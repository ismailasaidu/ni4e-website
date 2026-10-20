import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from './config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) { setLoading(false); return undefined; }
    let active = true;
    const loadProfile = async (nextUser) => {
      if (!active) return;
      setUser(nextUser || null);
      if (!nextUser) { setProfile(null); setLoading(false); return; }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', nextUser.id).maybeSingle();
      if (error) console.error('Unable to load NI4E profile', error.message);
      if (active) {
        const resolved = data || { id: nextUser.id, full_name: nextUser.user_metadata?.full_name || '', email: nextUser.email || '', role: 'member' };
        // An account is not a membership application. Do not infer category or review status until a real application/member record exists.
        setProfile({ ...resolved, uid: resolved.id, fullName: resolved.full_name || resolved.fullName || '', membershipStatus: resolved.membership_status || resolved.membershipStatus || 'not_applied', membershipCategory: resolved.membership_category || resolved.membershipCategory || '' });
        setLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer database work until after the auth callback to avoid locking the auth client.
      Promise.resolve().then(() => loadProfile(session?.user || null));
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    user, profile, loading, configured: supabaseConfigured,
    logout: async () => { if (supabase) await supabase.auth.signOut(); }
  }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
