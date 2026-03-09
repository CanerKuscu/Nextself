// Use a stable std version compatible with Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Simple Supabase session-to-cookie exchange + proxy for web clients
// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (recommended)
// - SUPABASE_ANON_KEY (for proxied REST calls)
// Optional:
// - COOKIE_DOMAIN (e.g. example.com) to scope cookie

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const COOKIE_DOMAIN = Deno.env.get('COOKIE_DOMAIN');
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((s: string) => s.trim()).filter(Boolean); // comma-separated list
const ALLOW_EXTERNAL_PROXY = Deno.env.get('ALLOW_EXTERNAL_PROXY') === '1';
const ALLOW_INSECURE_COOKIES = Deno.env.get('ALLOW_INSECURE_COOKIES') === '1';

function determineAllowedOrigin(requestOrigin: string) {
    // If ALLOWED_ORIGINS env is set, only allow origins listed there.
    if (ALLOWED_ORIGINS.length > 0) {
        if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
        return 'null';
    }
    // If no whitelist provided, echo the origin if present (required when using credentials).
    return requestOrigin || 'null';
}

function buildSetCookieHeader(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
    // HttpOnly, SameSite=Strict to reduce XSS/CSRF risks. Make cookie value URL-safe.
    const safeValue = encodeURIComponent(value);
    const parts = [`${name}=${safeValue}`, `Max-Age=${maxAgeSeconds}`, 'HttpOnly', 'SameSite=Strict', 'Path=/'];
    // Only set Secure by default; allow opt-out for local dev with env var
    if (!ALLOW_INSECURE_COOKIES) parts.splice(3, 0, 'Secure');
    if (COOKIE_DOMAIN) parts.push(`Domain=${COOKIE_DOMAIN}`);
    return parts.join('; ');
}

async function exchangeRefreshTokenForAccessToken(refreshToken: string) {
    // Exchange refresh token for a short-lived access token using Supabase Auth token endpoint.
    // We use the service role key in Authorization header to ensure the request succeeds.
    const tokenUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token`;
    const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
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
            const headers = {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            } as Record<string, string>;
            return new Response(null, { status: 204, headers });
        }

        if (req.method === 'POST') {
            const path = url.pathname.replace(/\/$/, '');

            // 1) Set-session endpoint: accepts { refresh_token }
            if (path.endsWith('/set-session') || path.endsWith('/session')) {
                const payload = await req.json().catch(() => ({}));
                const refreshToken = payload?.refresh_token;
                if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.length > 2000) {
                    return new Response(JSON.stringify({ error: 'refresh_token required or invalid' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                // Set HttpOnly cookie with the refresh token (value URL-encoded)
                const cookie = buildSetCookieHeader('sb_refresh_token', refreshToken, 60 * 60 * 24 * 30);
                const origin = req.headers.get('origin') || '';
                const allowOrigin = determineAllowedOrigin(origin);
                const headers = new Headers({ 'Set-Cookie': cookie, 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Credentials': 'true' });

                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }

            // 2) Proxy endpoint: server-side proxy that uses the refresh token cookie to call Supabase REST
            // Request body: { method: 'GET'|'POST'..., path: 'profiles', query?: 'select=..&id=eq...', body?: {...} }
            if (path.endsWith('/proxy')) {
                // Read cookies (robust parsing - only split on first '=')
                const cookieHeader = req.headers.get('cookie') || '';
                const cookies = Object.fromEntries(cookieHeader.split(';').map((s: string) => s.trim()).filter(Boolean).map((pair: string) => {
                    const idx = pair.indexOf('=');
                    const name = idx > -1 ? pair.slice(0, idx) : pair;
                    const val = idx > -1 ? pair.slice(idx + 1) : '';
                    try {
                        return [decodeURIComponent(name), decodeURIComponent(val)];
                    } catch {
                        return [name, val];
                    }
                }) as [string, string][]);
                const refreshToken = cookies['sb_refresh_token'] ? decodeURIComponent(cookies['sb_refresh_token']) : undefined;
                if (!refreshToken) {
                    return new Response(JSON.stringify({ error: 'no refresh token cookie present' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }

                const { method, path: targetPath, query, body: reqBody } = await req.json().catch(() => ({}));
                if (!method || !targetPath) {
                    return new Response(JSON.stringify({ error: 'proxy requires method and path' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                // Disallow external proxying by default
                if (targetPath.startsWith('http') && !ALLOW_EXTERNAL_PROXY) {
                    return new Response(JSON.stringify({ error: 'external proxying disabled' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }

                // Exchange refresh token for access token
                const tokenResp = await exchangeRefreshTokenForAccessToken(refreshToken);
                const accessToken = tokenResp?.access_token;
                if (!accessToken) {
                    return new Response(JSON.stringify({ error: 'failed to obtain access token', details: tokenResp }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }

                // Construct supabase REST URL (rest/v1) or use any full path passed
                let supabaseEndpoint = '';
                if (targetPath.startsWith('http')) {
                    supabaseEndpoint = targetPath; // allow full URL if provided
                } else {
                    supabaseEndpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${targetPath}` + (query ? `?${query}` : '');
                }

                const proxyHeaders: Record<string, string> = {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: ANON_KEY || '',
                };
                if (reqBody) proxyHeaders['Content-Type'] = 'application/json';

                const proxied = await fetch(supabaseEndpoint, {
                    method,
                    headers: proxyHeaders,
                    body: reqBody ? JSON.stringify(reqBody) : undefined,
                });

                const text = await proxied.text();
                const contentType = proxied.headers.get('content-type') || 'text/plain';
                const origin = req.headers.get('origin') || '';
                const allowOrigin = determineAllowedOrigin(origin);
                const headers = new Headers({ 'Content-Type': contentType, 'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Credentials': 'true' });
                return new Response(text, { status: proxied.status, headers });
            }
        }

        return new Response('Not found', { status: 404 });
    } catch (err) {
        console.error('Function error', err);
        return new Response(JSON.stringify({ error: 'internal_error', details: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
