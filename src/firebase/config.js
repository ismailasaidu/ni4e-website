import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet. Add your Supabase project URL and anon/publishable key to .env, then restart the dev server.');
  }
}
