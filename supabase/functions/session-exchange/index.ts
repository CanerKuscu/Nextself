/// <reference path="./deno-std.d.ts" />
// Use a stable std version compatible with Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Simple Supabase session-to-cookie exchange + proxy for web clients
// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (recommended)
// - SUPABASE_ANON_KEY (for proxied REST calls)
// Optional:
// - COOKIE_DOMAIN (e.g. example.com) to scope cookie

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').trim();
const SERVICE_ROLE = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
const ANON_KEY = (Deno.env.get('SUPABASE_ANON_KEY') || '').trim();
const COOKIE_DOMAIN = Deno.env.get('COOKIE_DOMAIN')?.trim();
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
const ALLOW_INSECURE_COOKIES = Deno.env.get('ALLOW_INSECURE_COOKIES') === '1';

function determineAllowedOrigin(requestOrigin: string): string | false {
    if (!requestOrigin) return false;

    // Always allow localhost for local development
    if (requestOrigin.startsWith('http://localhost') || requestOrigin.startsWith('http://127.0.0.1')) {
        return requestOrigin;
    }

    // If ALLOWED_ORIGINS env is set, only allow origins listed there.
    if (ALLOWED_ORIGINS.length > 0) {
        if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
        console.warn(`[SECURITY] Blocked CORS request from unauthorized origin: ${requestOrigin}`);
        return false;
    }

    console.warn(`[SECURITY] Blocked CORS request from origin: ${requestOrigin} (ALLOWED_ORIGINS not configured)`);
    return false;
}

function buildSetCookieHeader(
    name: string,
    value: string,
    maxAgeSeconds = 60 * 60 * 24 * 30,
    options?: { httpOnly?: boolean }
) {
    const safeValue = encodeURIComponent(value);
    const parts = [`${name}=${safeValue}`, `Max-Age=${maxAgeSeconds}`, 'SameSite=Strict', 'Path=/'];
    if (options?.httpOnly !== false) parts.push('HttpOnly');
    if (!ALLOW_INSECURE_COOKIES) parts.splice(3, 0, 'Secure');
    if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
    return parts.join('; ');
}

function createCsrfToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(cookieHeader: string): Record<string, string> {
    return Object.fromEntries(
        cookieHeader
            .split(';')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .map((pair: string) => {
                const idx = pair.indexOf('=');
                const name = idx > -1 ? pair.slice(0, idx) : pair;
                const val = idx > -1 ? pair.slice(idx + 1) : '';
                try {
                    return [decodeURIComponent(name), decodeURIComponent(val)];
                } catch {
                    return [name, val];
                }
            }) as [string, string][]
    );
}

async function authenticateWithPassword(email: string, password: string) {
    const tokenUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=password`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (ANON_KEY) headers['apikey'] = ANON_KEY;
    const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
    });
    return resp.json();
}

async function getUserByAccessToken(accessToken: string) {
    const userUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`;
    const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
    };
    if (ANON_KEY) headers['apikey'] = ANON_KEY;
    const resp = await fetch(userUrl, { method: 'GET', headers });
    return resp.json();
}

async function exchangeRefreshTokenForAccessToken(refreshToken: string) {
    // Exchange refresh token for a short-lived access token using Supabase Auth token endpoint.
    // We use the service role key in Authorization header to ensure the request succeeds.
    const tokenUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`;
    const body = JSON.stringify({ refresh_token: refreshToken });

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (SERVICE_ROLE) headers['Authorization'] = `Bearer ${SERVICE_ROLE}`;
    if (ANON_KEY) headers['apikey'] = ANON_KEY;

    const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers,
        body,
    });
    const json = await resp.json();
    return json; // { access_token, expires_in, refresh_token, token_type, ... }
}

serve(async (req: Request) => {
    try {
        const url = new URL(req.url);
        // Support CORS preflight
        if (req.method === 'OPTIONS') {
            const origin = req.headers.get('origin') || '*';
            const allowOrigin = determineAllowedOrigin(origin);
            const headers: Record<string, string> = {
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token, Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            };
            if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;
            return new Response(null, { status: 204, headers });
        }

        const path = url.pathname.replace(/\/$/, '');
        const origin = req.headers.get('origin') || '';
        const allowOrigin = determineAllowedOrigin(origin);
        const baseHeaders = new Headers({ 'Content-Type': 'application/json', 'Access-Control-Allow-Credentials': 'true' });
        if (allowOrigin) baseHeaders.set('Access-Control-Allow-Origin', allowOrigin);

        if (req.method === 'GET' && path.endsWith('/me')) {
            const cookies = parseCookies(req.headers.get('cookie') || '');
            const refreshToken = cookies['sb_refresh_token'] ? decodeURIComponent(cookies['sb_refresh_token']) : undefined;
            if (!refreshToken) {
                return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: baseHeaders });
            }
            const csrfCookie = cookies['sb_csrf_token'] || '';
            const csrfHeader = req.headers.get('x-csrf-token') || '';
            if (csrfHeader && csrfCookie && csrfCookie !== csrfHeader) {
                return new Response(JSON.stringify({ error: 'csrf_failed' }), { status: 403, headers: baseHeaders });
            }
            const tokenResp = await exchangeRefreshTokenForAccessToken(refreshToken);
            const accessToken = tokenResp?.access_token;
            if (!accessToken) {
                return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: baseHeaders });
            }
            const user = await getUserByAccessToken(accessToken);
            if (!user?.id) {
                return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: baseHeaders });
            }
            const nextCsrfToken = csrfCookie || createCsrfToken();
            const headers = new Headers(baseHeaders);
            if (!csrfCookie) {
                headers.append('Set-Cookie', buildSetCookieHeader('sb_csrf_token', nextCsrfToken, 60 * 60 * 24 * 30, { httpOnly: false }));
            }
            return new Response(JSON.stringify({ user, csrf_token: nextCsrfToken }), { status: 200, headers });
        }

        if (req.method === 'POST') {
            // 1) Set-session endpoint: accepts { refresh_token }
            if (path.endsWith('/set-session') || path.endsWith('/session')) {
                const payload = await req.json().catch(() => ({}));
                const refreshToken = payload?.refresh_token;
                if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.length > 2000) {
                    return new Response(JSON.stringify({ error: 'refresh_token required or invalid' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                const csrfToken = createCsrfToken();
                const cookie = buildSetCookieHeader('sb_refresh_token', refreshToken, 60 * 60 * 24 * 30);
                const csrfCookie = buildSetCookieHeader('sb_csrf_token', csrfToken, 60 * 60 * 24 * 30, { httpOnly: false });
                const headers = new Headers(baseHeaders);
                headers.append('Set-Cookie', cookie);
                headers.append('Set-Cookie', csrfCookie);
                return new Response(JSON.stringify({ success: true, csrf_token: csrfToken }), { status: 200, headers });
            }

            if (path.endsWith('/login')) {
                const payload = await req.json().catch(() => ({}));
                const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
                const password = typeof payload?.password === 'string' ? payload.password : '';
                if (!email || !password) {
                    return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 400, headers: baseHeaders });
                }
                const tokenResp = await authenticateWithPassword(email, password);
                const refreshToken = tokenResp?.refresh_token;
                const accessToken = tokenResp?.access_token;
                if (!refreshToken || !accessToken) {
                    return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401, headers: baseHeaders });
                }
                const user = await getUserByAccessToken(accessToken);
                if (!user?.id) {
                    return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401, headers: baseHeaders });
                }
                const csrfToken = createCsrfToken();
                const cookie = buildSetCookieHeader('sb_refresh_token', refreshToken, 60 * 60 * 24 * 30);
                const csrfCookie = buildSetCookieHeader('sb_csrf_token', csrfToken, 60 * 60 * 24 * 30, { httpOnly: false });
                const headers = new Headers(baseHeaders);
                headers.append('Set-Cookie', cookie);
                headers.append('Set-Cookie', csrfCookie);
                return new Response(JSON.stringify({ success: true, csrf_token: csrfToken, user }), { status: 200, headers });
            }

            if (path.endsWith('/logout')) {
                const cookies = parseCookies(req.headers.get('cookie') || '');
                const csrfCookie = cookies['sb_csrf_token'] || '';
                const csrfHeader = req.headers.get('x-csrf-token') || '';
                if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
                    return new Response(JSON.stringify({ error: 'csrf_failed' }), { status: 403, headers: baseHeaders });
                }
                const headers = new Headers(baseHeaders);
                headers.append('Set-Cookie', buildSetCookieHeader('sb_refresh_token', '', 0));
                headers.append('Set-Cookie', buildSetCookieHeader('sb_csrf_token', '', 0, { httpOnly: false }));
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }

            // 2) Proxy endpoint: server-side proxy that uses the refresh token cookie to call Supabase REST
            // Request body: { method: 'GET'|'POST'..., path: 'profiles', query?: 'select=..&id=eq...', body?: {...} }
            if (path.endsWith('/proxy')) {
                const cookies = parseCookies(req.headers.get('cookie') || '');
                const refreshToken = cookies['sb_refresh_token'] ? decodeURIComponent(cookies['sb_refresh_token']) : undefined;
                if (!refreshToken) {
                    return new Response(JSON.stringify({ error: 'no refresh token cookie present' }), { status: 401, headers: baseHeaders });
                }
                const csrfCookie = cookies['sb_csrf_token'] || '';
                const csrfHeader = req.headers.get('x-csrf-token') || '';
                if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
                    return new Response(JSON.stringify({ error: 'csrf_failed' }), { status: 403, headers: baseHeaders });
                }

                const { method, path: targetPath, query, body: reqBody } = await req.json().catch(() => ({}));
                if (!method || !targetPath) {
                    return new Response(JSON.stringify({ error: 'proxy requires method and path' }), { status: 400, headers: baseHeaders });
                }

                // 1. Validate targetPath contains only alphanumeric, hyphens, slashes and underscores
                if (!/^[a-zA-Z0-9_\-\/]+$/.test(targetPath)) {
                    return new Response(JSON.stringify({ error: 'invalid path format' }), { status: 400, headers: baseHeaders });
                }

                // 2. Whitelist allowed paths or allow specific REST calls
                const ALLOWED_PATHS = ['profiles', 'workouts', 'nutrition_logs', 'health_data', 'user_currencies', 'user_inventory_items', 'store_items', 'forum_topics', 'forum_posts', 'auth/v1/user'];
                if (!ALLOWED_PATHS.find(p => targetPath.startsWith(p))) {
                    return new Response(JSON.stringify({ error: 'path not allowed' }), { status: 403, headers: baseHeaders });
                }

                // Exchange refresh token for access token
                const tokenResp = await exchangeRefreshTokenForAccessToken(refreshToken);
                const accessToken = tokenResp?.access_token;
                if (!accessToken) {
                    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: baseHeaders });
                }

                // Construct supabase REST URL (rest/v1) or Auth URL
                let supabaseEndpoint = '';
                if (targetPath.startsWith('auth/')) {
                    supabaseEndpoint = `${SUPABASE_URL.replace(/\/$/, '')}/${targetPath}` + (query ? `?${query}` : '');
                } else {
                    supabaseEndpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${targetPath}` + (query ? `?${query}` : '');
                }

                const proxyHeaders: Record<string, string> = {
                    'Authorization': `Bearer ${accessToken}`
                };
                
                if (ANON_KEY) proxyHeaders['apikey'] = ANON_KEY;
                if (reqBody) proxyHeaders['Content-Type'] = 'application/json';

                const proxied = await fetch(supabaseEndpoint, {
                    method,
                    headers: proxyHeaders,
                    body: reqBody ? JSON.stringify(reqBody) : undefined,
                });

                const text = await proxied.text();
                const contentType = proxied.headers.get('content-type') || 'text/plain';
                const headers = new Headers({ 'Content-Type': contentType, 'Access-Control-Allow-Credentials': 'true' });
                if (allowOrigin) headers.set('Access-Control-Allow-Origin', allowOrigin);
                
                return new Response(text, { status: proxied.status, headers });
            }
        }

        return new Response('Not found', { status: 404 });
    } catch (err) {
        console.error('Function error:', err);
        const origin = req.headers.get('origin') || '*';
        const allowOrigin = determineAllowedOrigin(origin) || 'http://localhost:8081';
        return new Response(JSON.stringify({ error: 'internal_error' }), { 
            status: 500, 
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Origin': allowOrigin
            } 
        });
    }
});
