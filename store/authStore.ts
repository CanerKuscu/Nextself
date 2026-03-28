import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureStoreAdapter } from '@nextself/shared';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '@nextself/shared';
import { Platform } from 'react-native';
import { signInAndExchange, proxiedRequest, defaultEdgeFunctionUrl } from '../services/webSession';
import { OfflineService } from '../utils/offlineService';
import { DeepLinkingService } from '../utils/deepLinking';

const noopStorage = {
    getItem: async (): Promise<string | null> => null,
    setItem: async (): Promise<void> => { },
    removeItem: async (): Promise<void> => { },
};

const isSessionValid = (session: Session | null | undefined): session is Session => {
    return !!session && (!session.expires_at || session.expires_at * 1000 > Date.now());
};

const hasWebAuthCookie = (): boolean => {
    if (Platform.OS !== 'web') return false;
    if (__DEV__) return false; // In local development, we don't use the Edge Function cookie flow
    try {
        const cookie = document.cookie || '';
        // Check for sb_csrf_token instead since sb_refresh_token is HttpOnly
        return /(?:^|;\s*)sb_csrf_token=/.test(cookie);
    } catch {
        return false;
    }
};

export type UserRole = 'user' | 'pt' | 'dietitian' | 'trainer';

export interface NextSelfUserProfile {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    fullName?: string;
    dob?: string;   // ISO Date String
    height?: number; // cm
    weight?: number; // kg
    gender?: 'male' | 'female' | 'other';
}

interface AuthState {
    session: Session | null;
    user: User | null;
    profile: NextSelfUserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (session: Session | null) => void;
    setUser: (user: User | null) => void;
    setProfile: (profile: NextSelfUserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
    initializeAuth: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    proxiedFetch: (method: string, path: string, options?: { query?: string; body?: unknown }) => Promise<unknown>;
    logout: () => Promise<void>;
}

let authInitPromise: Promise<void> | null = null;
let authSubscription: { unsubscribe: () => void } | null = null;

/**
 * Register a callback to be invoked on sign-out (e.g., resetting module-level flags).
 * This avoids circular dependencies from dynamic require() calls in signOut.
 */
const signOutCallbacks: Array<() => void> = [];
export const registerSignOutCallback = (cb: () => void) => {
    signOutCallbacks.push(cb);
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            session: null,
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: true,

            setSession: (session) => {
                const isValid = isSessionValid(session);
                const isWebVerified = Platform.OS === 'web' && !__DEV__ && hasWebAuthCookie();
                set({
                    session: isValid ? session : null,
                    user: isValid ? session?.user ?? get().user : get().user,
                    isAuthenticated: isValid || (!!get().user && isWebVerified),
                    profile: isValid ? get().profile : null,
                });
            },
            setUser: (user) => {
                const isWebVerified = Platform.OS === 'web' && !__DEV__ && hasWebAuthCookie();
                set({
                    user,
                    isAuthenticated: !!(get().session || (user && isWebVerified)),
                });
            },

            setProfile: (profile) => {
                set({ profile });
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            initializeAuth: async () => {
                if (authInitPromise) return authInitPromise;
                authInitPromise = (async () => {
                const supabase = SupabaseService.getInstance();
                set({ isLoading: true });
                try {
                    if (Platform.OS === 'web') {
                        const edgeFunctionUrl = defaultEdgeFunctionUrl();
                        const res = await proxiedRequest(edgeFunctionUrl, 'GET', 'auth/v1/user');
                        let verifiedUser = res.data?.user || res.data;
                        let isOk = res.ok;

                        if (!isOk) {
                            try {
                                const getCsrf = () => {
                                    const match = document.cookie.match(/(?:^|;\s*)sb_csrf_token=([^;]+)/);
                                    return match ? match[1] : '';
                                };
                                const meRes = await fetch(edgeFunctionUrl.replace(/\/$/, '') + '/me', {
                                    method: 'GET',
                                    credentials: 'include',
                                    headers: { 
                                        'Content-Type': 'application/json',
                                        'X-CSRF-Token': getCsrf()
                                    }
                                });
                                const meData = await meRes.json();
                                if (meRes.ok && meData?.user) {
                                    verifiedUser = meData.user;
                                    isOk = true;
                                }
                            } catch (err) {
                                console.error('Error fetching /me in init', err);
                            }
                        }

                        if (isOk && verifiedUser) {
                            set({
                                isAuthenticated: true,
                                user: verifiedUser,
                                isLoading: false,
                            });
                        } else {
                            set({ session: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
                        }
                    } else {
                        const { data: { session } } = await supabase.getClient().auth.getSession();
                        const isValid = isSessionValid(session);
                        set({
                            session: isValid ? session : null,
                            user: isValid ? session?.user ?? null : null,
                            isAuthenticated: !!isValid,
                            profile: isValid ? get().profile : null,
                            isLoading: false,
                        });
                    }
                } catch {
                    set({ session: null, user: null, profile: null, isAuthenticated: false, isLoading: false });
                }

                if (!authSubscription) {
                    const { data } = supabase.getClient().auth.onAuthStateChange((_event, session) => {
                        const isValid = isSessionValid(session);
                        const isWebVerified = Platform.OS === 'web' && !__DEV__ && hasWebAuthCookie();
                        set({
                            session: isValid ? session : null,
                            user: isValid ? session?.user ?? null : null,
                            isAuthenticated: !!isValid || (!!get().user && isWebVerified),
                            profile: isValid ? get().profile : null,
                            isLoading: false,
                        });
                            // Link processing moved to AppBootstrapper
                    });
                    authSubscription = data.subscription;
                }

                supabase.onRefreshFailure(async () => {
                    await get().signOut();
                });
                })();
                return authInitPromise;
            },

            signIn: async (email: string, password: string) => {
                const supabase = SupabaseService.getInstance();
                if (Platform.OS === 'web') {
                    const result = await signInAndExchange(supabase.getClient(), email, password, { edgeFunctionUrl: defaultEdgeFunctionUrl() });
                    const authError = (result as any)?.error || (result as any)?.data?.error || null;
                    if (authError) return result;
                    const userFromResult = (result as any)?.data?.user || (result as any)?.user || null;
                    set({
                        user: userFromResult,
                        session: null,
                        isAuthenticated: !!userFromResult,
                    });
                    return result;
                }
                const result = await supabase.getClient().auth.signInWithPassword({ email, password });
                const session = (result as any)?.data?.session ?? null;
                const isValid = isSessionValid(session);
                set({
                    session: isValid ? session : null,
                    user: isValid ? session?.user ?? null : null,
                    isAuthenticated: !!isValid,
                    profile: isValid ? get().profile : null,
                });
                return result;
            },

            signOut: async () => {
                const offline = OfflineService.getInstance();
                try {
                    await offline.pauseAndWait();
                } catch { }
                set({ session: null, user: null, profile: null, isAuthenticated: false });
                signOutCallbacks.forEach(cb => { try { cb(); } catch {} });
                try {
                    const supa = SupabaseService.getInstance();
                    await supa.getClient().auth.signOut();
                } catch { }
                try {
                    await offline.clearQueue();
                } catch { }
                try {
                    offline.resume();
                } catch { }
            },

            proxiedFetch: async (method: string, path: string, options?: { query?: string; body?: unknown }) => {
                const allowedPaths = ['profiles', 'workouts', 'auth/v1/user'];
                if (!allowedPaths.includes(path)) {
                    return { ok: false, error: 'Target path is not whitelisted for proxiedFetch via client store.' };
                }

                if (Platform.OS === 'web' && !__DEV__) {
                    const edgeFunctionUrl = defaultEdgeFunctionUrl();
                    return proxiedRequest(edgeFunctionUrl, method, path, options as any);
                }
                try {
                    const client = SupabaseService.getInstance().getClient();
                    if (method.toUpperCase() === 'GET') {
                        const selectQuery = options?.query || '*';
                        const { data, error } = await client.from(path).select(selectQuery as string);
                        return { ok: !error, data, error };
                    }
                    return { ok: false, error: 'Use Supabase client directly for non-GET requests on native' };
                } catch (err) {
                    return { ok: false, error: err };
                }
            },

            logout: async () => get().signOut(),
        }),
        {
            name: 'NextSelf-auth-storage',
            storage: createJSONStorage(() => (Platform.OS === 'web' ? noopStorage : SecureStoreAdapter)),
            partialize: (state) => ({
                session: state.session,
                profile: state.profile,
            }),
            merge: (persistedState, currentState) => {
                const state = (persistedState as Partial<AuthState>) || {};
                const safeSession = isSessionValid(state.session) ? state.session : null;
                const isWebVerified = Platform.OS === 'web' && !__DEV__ && hasWebAuthCookie();
                return {
                    ...currentState,
                    ...state,
                    session: safeSession,
                    user: safeSession ? safeSession.user ?? currentState.user : currentState.user,
                    profile: safeSession ? state.profile ?? currentState.profile : null,
                    isAuthenticated: !!safeSession || (!!currentState.user && isWebVerified),
                    isLoading: false,
                };
            },
        }
    )
);
