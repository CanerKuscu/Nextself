import { Platform } from 'react-native';
import { CONFIG } from '@nextself/shared';
import { importMetaFallback } from '../utils/importMetaFallback';

// Helper utilities to integrate the `session-exchange` Edge Function for web
// - signInAndExchange: sign in using Supabase client, send refresh_token to Edge Function /set-session
// - setSessionCookieFromRefreshToken: send refresh token to Edge Function (used after OAuth or sign-in)
// - proxiedRequest: proxy REST calls via Edge Function /proxy (credentials included)
// - clearClientSession: best-effort to remove in-memory session from supabase client on web

let webCsrfToken: string | null = null;

export async function setSessionCookieFromRefreshToken(edgeFunctionUrl: string, refreshToken: string) {
    if (!edgeFunctionUrl) throw new Error('edgeFunctionUrl is required');
    if (!refreshToken) throw new Error('refreshToken is required');

    const url = edgeFunctionUrl.replace(/\/$/, '') + '/set-session';
    const anonKey = CONFIG.SUPABASE_PUBLISHABLE_KEY || '';
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(anonKey ? { 'Authorization': `Bearer ${anonKey}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const text = await res.text().catch(() => '');
    let json: any;
    try { json = text ? JSON.parse(text) : null; } catch { json = { ok: false, text }; }
    if (!res.ok) {
        return { error: json || { status: res.status, text } };
    }
    const csrfToken = json?.csrf_token;
    if (typeof csrfToken === 'string' && csrfToken.length > 0) {
        webCsrfToken = csrfToken;
    }
    return { data: json };
}

export async function clearClientSession(supabaseClient: any) {
    try {
        // Best-effort: supabase-js v2 exposes auth.setSession - if present, call with nulls
        if (supabaseClient?.auth?.setSession && typeof supabaseClient.auth.setSession === 'function') {
            await supabaseClient.auth.setSession({ access_token: '', refresh_token: '' });
            return { ok: true };
        }

        // Fallback: if session is stored in memory and there's a signOut that doesn't revoke server tokens
        if (supabaseClient?.auth?.signOut && typeof supabaseClient.auth.signOut === 'function') {
            try {
                await supabaseClient.auth.signOut();
            } catch (e) {
                // ignore signOut errors; we don't want to block the flow
            }
        }
    } catch (err) {
        // swallow errors - this is best-effort
    }
    return { ok: true };
}

export async function signInAndExchange(supabaseClient: any, email: string, password: string, opts?: { edgeFunctionUrl?: string }) {
    const edgeFunctionUrl = opts?.edgeFunctionUrl || (CONFIG as any).SESSION_EXCHANGE_URL || defaultEdgeFunctionUrl();

    // First, perform the normal Supabase sign-in which tests expect to be called.
    const result = await supabaseClient.auth.signInWithPassword({ email, password });

    const session = (result as any)?.data?.session || (result as any)?.data || (result as any)?.session || null;
    const refreshToken = session?.refresh_token || session?.refreshToken || (result as any)?.data?.refresh_token || null;

    // If there's no refresh token, do not attempt edge exchange - preserve caller behavior
    if (!refreshToken) {
        return result;
    }

    // On web, send the refresh token to the Edge Function to set an HttpOnly cookie
    if (Platform.OS === 'web' && edgeFunctionUrl) {
        const setRes = await setSessionCookieFromRefreshToken(edgeFunctionUrl, refreshToken).catch(err => ({ error: err }));
        await clearClientSession(supabaseClient);
        return { ...result, exchange: setRes };
    }

    return result;
}

export async function proxiedRequest(edgeFunctionUrl: string, method: string, path: string, options?: { query?: string; body?: any }) {
    if (!edgeFunctionUrl) throw new Error('edgeFunctionUrl is required');
    const url = edgeFunctionUrl.replace(/\/$/, '') + '/proxy';
    const anonKey = CONFIG.SUPABASE_PUBLISHABLE_KEY || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (anonKey) {
        headers['Authorization'] = `Bearer ${anonKey}`;
    }
    if (webCsrfToken) {
        headers['X-CSRF-Token'] = webCsrfToken;
    }
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ method, path, query: options?.query, body: options?.body }),
    });
    const text = await res.text().catch(() => '');
    let json: any;
    try { json = text ? JSON.parse(text) : null; } catch { json = { text }; }
    return { status: res.status, ok: res.ok, data: json };
}

// Small helper to choose the Edge Function URL from CONFIG or environment
export function defaultEdgeFunctionUrl() {
    // Prefer explicit config/env value, otherwise attempt to derive from SUPABASE_URL
    const explicit = (CONFIG as any).SESSION_EXCHANGE_URL || (importMetaFallback.env && importMetaFallback.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL) || process.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL || (importMetaFallback.env && importMetaFallback.env.SESSION_EXCHANGE_URL) || process.env.SESSION_EXCHANGE_URL;
    if (explicit) {
        console.debug('[webSession] defaultEdgeFunctionUrl - explicit:', explicit);
        return explicit;
    }

    const supabaseUrl = CONFIG.SUPABASE_URL || '';
    try {
        // Typical Supabase functions host uses the same subdomain prefix with `.functions.supabase.co`.
        // e.g. https://xyz.supabase.co -> https://xyz.functions.supabase.co/session-exchange
        if (supabaseUrl.includes('.supabase.co')) {
            const derived = supabaseUrl.replace('.supabase.co', '.functions.supabase.co').replace(/\/$/, '') + '/session-exchange';
            console.debug('[webSession] defaultEdgeFunctionUrl - derived from SUPABASE_URL:', derived);
            return derived;
        }
    } catch (e) {
        console.debug('[webSession] defaultEdgeFunctionUrl - error deriving URL', e);
    }

    console.debug('[webSession] defaultEdgeFunctionUrl - none found, returning empty string');
    return '';
}
