import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { auth } from '../lib/supabase';
import { getSessionExchangeUrl, isSupabaseConfigured } from '../services/api/client';

type DashboardUser = {
    id: string;
    email?: string | null;
};

type DashboardSession = {
    user: DashboardUser;
};

interface AuthContextType {
    session: DashboardSession | null;
    user: DashboardUser | null;
    authorized: boolean;
    loading: boolean;
    checkRole: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    authorized: false,
    loading: true,
    checkRole: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<DashboardSession | null>(null);
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const checkRole = useCallback(async (userId: string) => {
        try {
            const exchangeUrl = getSessionExchangeUrl();
            if (!exchangeUrl) {
                setAuthorized(false);
                return;
            }
            const endpoint = `${exchangeUrl.replace(/\/$/, '')}/proxy`;
            const csrfToken = auth.getCsrfToken ? auth.getCsrfToken() : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({
                    method: 'GET',
                    path: 'profiles',
                    query: `id=eq.${userId}&select=user_type&limit=1`,
                }),
            });
            const text = await response.text().catch(() => '');
            const data = text ? JSON.parse(text) : null;
            const profile = Array.isArray(data) ? data[0] : data;
            if (!response.ok || !profile) {
                setAuthorized(false);
                return;
            }
            const role = (profile.user_type || '').toLowerCase();
            setAuthorized(role === 'pt' || role === 'dietitian' || role === 'admin');
        } catch {
            setAuthorized(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!isSupabaseConfigured) {
            setSession(null);
            setUser(null);
            setAuthorized(false);
            setLoading(false);
            return () => {
                isMounted = false;
            };
        }

        auth.getSession()
            .then(async ({ data: { session } }) => {
                if (!isMounted) return;
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user?.id) {
                    await checkRole(session.user.id);
                }
                if (isMounted) setLoading(false);
            })
            .catch(() => {
                if (!isMounted) return;
                setSession(null);
                setUser(null);
                setAuthorized(false);
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [checkRole]);

    const contextValue = useMemo(() => ({
        session, user, authorized, loading, checkRole
    }), [session, user, authorized, loading, checkRole]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
