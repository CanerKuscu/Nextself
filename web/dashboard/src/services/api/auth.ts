import { supabase, getSessionExchangeUrl } from './client';

let csrfToken: string | null = null;

const parseJson = async (response: Response) => {
    const text = await response.text().catch(() => '');
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
        return await fetch(input, init);
    } catch {
        return null;
    }
};

const readCsrfToken = (data: any) => {
    if (typeof data?.csrf_token === 'string' && data.csrf_token.length > 0) {
        csrfToken = data.csrf_token;
    }
};

export const AuthService = {
    signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
    },
    signIn: async (email: string, password: string) => {
        const baseUrl = getSessionExchangeUrl().replace(/\/$/, '');
        if (!baseUrl) {
            return { data: null, error: { message: 'Session endpoint is not configured' } };
        }
        const endpoint = `${baseUrl}/login`;
        const response = await safeFetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response) {
            return { data: null, error: { message: 'Authentication service unavailable' } };
        }
        const data = await parseJson(response);
        if (!response.ok) {
            return { data: null, error: { message: data?.error || 'Login failed' } };
        }
        readCsrfToken(data);
        return {
            data: {
                user: data?.user || null,
                session: data?.user ? { user: data.user } : null,
            },
            error: null,
        };
    },
    signOut: async () => {
        const baseUrl = getSessionExchangeUrl().replace(/\/$/, '');
        if (!baseUrl) {
            csrfToken = null;
            return { error: null };
        }
        const endpoint = `${baseUrl}/logout`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        const response = await safeFetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers,
        });
        csrfToken = null;
        if (!response) {
            return { error: null };
        }
        if (!response.ok) {
            const data = await parseJson(response);
            return { error: { message: data?.error || 'Logout failed' } };
        }
        return { error: null };
    },
    getSession: async () => {
        const baseUrl = getSessionExchangeUrl().replace(/\/$/, '');
        if (!baseUrl) {
            return { data: { session: null }, error: null };
        }
        const endpoint = `${baseUrl}/me`;
        const requestSession = async (token: string | null) => {
            const headers: Record<string, string> = {};
            if (token) headers['X-CSRF-Token'] = token;
            const response = await safeFetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers,
            });
            if (!response) {
                return { response: null, data: null };
            }
            const data = await parseJson(response);
            return { response, data };
        };

        let { response, data } = await requestSession(csrfToken);
        if (response?.status === 403 && data?.error === 'csrf_failed') {
            csrfToken = null;
            const retried = await requestSession(null);
            response = retried.response;
            data = retried.data;
        }

        if (!response?.ok || !data?.user) {
            return { data: { session: null }, error: null };
        }
        readCsrfToken(data);
        return { data: { session: { user: data.user } }, error: null };
    },
    resetPassword: async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { data, error };
    },
    getCsrfToken: () => csrfToken,
};
