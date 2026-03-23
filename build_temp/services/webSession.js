"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSessionCookieFromRefreshToken = setSessionCookieFromRefreshToken;
exports.clearClientSession = clearClientSession;
exports.signInAndExchange = signInAndExchange;
exports.proxiedRequest = proxiedRequest;
exports.defaultEdgeFunctionUrl = defaultEdgeFunctionUrl;
const react_native_1 = require("react-native");
const config_1 = require("../config/config");
const importMetaFallback_1 = require("../utils/importMetaFallback");
// Helper utilities to integrate the `session-exchange` Edge Function for web
// - signInAndExchange: sign in using Supabase client, send refresh_token to Edge Function /set-session
// - setSessionCookieFromRefreshToken: send refresh token to Edge Function (used after OAuth or sign-in)
// - proxiedRequest: proxy REST calls via Edge Function /proxy (credentials included)
// - clearClientSession: best-effort to remove in-memory session from supabase client on web
function setSessionCookieFromRefreshToken(edgeFunctionUrl, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!edgeFunctionUrl)
            throw new Error('edgeFunctionUrl is required');
        if (!refreshToken)
            throw new Error('refreshToken is required');
        const url = edgeFunctionUrl.replace(/\/$/, '') + '/set-session';
        const res = yield fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const text = yield res.text().catch(() => '');
        let json;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch (_a) {
            json = { ok: false, text };
        }
        if (!res.ok) {
            return { error: json || { status: res.status, text } };
        }
        return { data: json };
    });
}
function clearClientSession(supabaseClient) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Best-effort: supabase-js v2 exposes auth.setSession - if present, call with nulls
            if (((_a = supabaseClient === null || supabaseClient === void 0 ? void 0 : supabaseClient.auth) === null || _a === void 0 ? void 0 : _a.setSession) && typeof supabaseClient.auth.setSession === 'function') {
                yield supabaseClient.auth.setSession({ access_token: '', refresh_token: '' });
                return { ok: true };
            }
            // Fallback: if session is stored in memory and there's a signOut that doesn't revoke server tokens
            if (((_b = supabaseClient === null || supabaseClient === void 0 ? void 0 : supabaseClient.auth) === null || _b === void 0 ? void 0 : _b.signOut) && typeof supabaseClient.auth.signOut === 'function') {
                try {
                    yield supabaseClient.auth.signOut();
                }
                catch (e) {
                    // ignore signOut errors; we don't want to block the flow
                }
            }
        }
        catch (err) {
            // swallow errors - this is best-effort
        }
        return { ok: true };
    });
}
function signInAndExchange(supabaseClient, email, password, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const edgeFunctionUrl = (opts === null || opts === void 0 ? void 0 : opts.edgeFunctionUrl) || config_1.CONFIG.SESSION_EXCHANGE_URL || defaultEdgeFunctionUrl();
        const result = yield supabaseClient.auth.signInWithPassword({ email, password });
        const session = ((_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.session) || (result === null || result === void 0 ? void 0 : result.data) || (result === null || result === void 0 ? void 0 : result.session) || null;
        const refreshToken = (session === null || session === void 0 ? void 0 : session.refresh_token) || (session === null || session === void 0 ? void 0 : session.refreshToken) || ((_b = result === null || result === void 0 ? void 0 : result.data) === null || _b === void 0 ? void 0 : _b.refresh_token) || null;
        if (!refreshToken) {
            // Nothing to exchange; return original result
            return result;
        }
        if (react_native_1.Platform.OS === 'web') {
            // Send refresh token to Edge Function to set HttpOnly cookie
            const setRes = yield setSessionCookieFromRefreshToken(edgeFunctionUrl, refreshToken).catch(err => ({ error: err }));
            // Clear client-side in-memory session to avoid storing tokens
            yield clearClientSession(supabaseClient);
            return Object.assign(Object.assign({}, result), { exchange: setRes });
        }
        return result;
    });
}
function proxiedRequest(edgeFunctionUrl, method, path, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!edgeFunctionUrl)
            throw new Error('edgeFunctionUrl is required');
        const url = edgeFunctionUrl.replace(/\/$/, '') + '/proxy';
        const res = yield fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, path, query: options === null || options === void 0 ? void 0 : options.query, body: options === null || options === void 0 ? void 0 : options.body }),
        });
        const text = yield res.text().catch(() => '');
        let json;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch (_a) {
            json = { text };
        }
        return { status: res.status, ok: res.ok, data: json };
    });
}
// Small helper to choose the Edge Function URL from CONFIG or environment
function defaultEdgeFunctionUrl() {
    // Prefer explicit config/env value, otherwise attempt to derive from SUPABASE_URL
    const explicit = config_1.CONFIG.SESSION_EXCHANGE_URL || (importMetaFallback_1.importMetaFallback.env && importMetaFallback_1.importMetaFallback.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL) || process.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL || (importMetaFallback_1.importMetaFallback.env && importMetaFallback_1.importMetaFallback.env.SESSION_EXCHANGE_URL) || process.env.SESSION_EXCHANGE_URL;
    if (explicit) {
        console.debug('[webSession] defaultEdgeFunctionUrl - explicit:', explicit);
        return explicit;
    }
    const supabaseUrl = config_1.CONFIG.SUPABASE_URL || '';
    try {
        // Typical Supabase functions host uses the same subdomain prefix with `.functions.supabase.co`.
        // e.g. https://xyz.supabase.co -> https://xyz.functions.supabase.co/session-exchange
        if (supabaseUrl.includes('.supabase.co')) {
            const derived = supabaseUrl.replace('.supabase.co', '.functions.supabase.co').replace(/\/$/, '') + '/session-exchange';
            console.debug('[webSession] defaultEdgeFunctionUrl - derived from SUPABASE_URL:', derived);
            return derived;
        }
    }
    catch (e) {
        console.debug('[webSession] defaultEdgeFunctionUrl - error deriving URL', e);
    }
    console.debug('[webSession] defaultEdgeFunctionUrl - none found, returning empty string');
    return '';
}
