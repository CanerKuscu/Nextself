import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const fallbackSupabaseUrl = 'https://placeholder.supabase.co';
const fallbackSupabaseAnonKey = 'placeholder-anon-key';
const resolvedSupabaseUrl = isSupabaseConfigured ? supabaseUrl : fallbackSupabaseUrl;
const resolvedSupabaseAnonKey = isSupabaseConfigured ? supabaseAnonKey : fallbackSupabaseAnonKey;

export const getSessionExchangeUrl = () => {
    const explicit = (import.meta.env.VITE_SESSION_EXCHANGE_URL || '').trim();
    if (explicit) return explicit;
    if (!supabaseUrl) return '';
    return supabaseUrl.replace('.supabase.co', '.functions.supabase.co') + '/session-exchange';
};

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
