import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase';
import { OfflineService } from '../utils/offlineService';
import { ContentModerationService } from '../services/contentModerationService';
import { Platform } from 'react-native';
import { signInAndExchange, proxiedRequest, defaultEdgeFunctionUrl } from '../services/webSession';
import { importMetaFallback } from '../utils/importMetaFallback';

interface AuthContextType {
  session: Session | null;
  user: any | null;
  loading: boolean;
  isBanned: boolean;
  banMessage: string | null;
  signOut: () => Promise<void>;
  signIn?: (email: string, password: string) => Promise<any>;
  proxiedFetch?: (method: string, path: string, options?: { query?: string; body?: any }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banMessage, setBanMessage] = useState<string | null>(null);

  const supabaseService = SupabaseService.getInstance();

  // Edge function URL for proxy calls (web)
  // Resolve edge function URL, preferring explicit config, then importMeta fallback, then env
  const EDGE_FN = defaultEdgeFunctionUrl() || (importMetaFallback.env && importMetaFallback.env.EXPO_PUBLIC_SESSION_EXCHANGE_URL) || (importMetaFallback.env && importMetaFallback.env.SESSION_EXCHANGE_URL) || '';

  // Debug: log the resolved Edge Function URL on provider mount so web startup reveals runtime value
  useEffect(() => {
    try {
      if (__DEV__) {
        console.debug('[SupabaseProvider] EDGE_FN:', EDGE_FN, 'Platform:', Platform.OS);
      }
    } catch (e) {
      if (__DEV__) {
        console.debug('[SupabaseProvider] EDGE_FN log failed', e);
      }
    }
  }, [EDGE_FN]);

  // Check ban status whenever user changes
  useEffect(() => {
    if (user?.id) {
      ContentModerationService.getInstance().checkBanStatus(user.id).then(status => {
        setIsBanned(status.isBanned);
        if (status.isBanned) {
          const msg = ContentModerationService.getInstance().getBanMessage(status, false);
          setBanMessage(msg.message);
        } else {
          setBanMessage(null);
        }
      }).catch(() => { });
    } else {
      setIsBanned(false);
      setBanMessage(null);
    }
  }, [user?.id]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabaseService.getClient().auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseService.getClient().auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      const offline = OfflineService.getInstance();

      // Pause offline processing and wait for any in-flight sync to finish
      // to avoid operations being sent under the wrong user context.
      await offline.pauseAndWait();

      await supabaseService.signOut();

      // Clear offline queue to prevent cross-user data leakage
      await offline.clearQueue();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Resume offline processor so the service can continue operating
      try {
        OfflineService.getInstance().resume();
      } catch (_) { }

      // Always clear local state regardless of signOut success
      setSession(null);
      setUser(null);
    }
  }, [supabaseService]);

  // Sign-in wrapper that uses signInAndExchange on web to set HttpOnly cookie and clear client session
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInAndExchange(supabaseService.getClient(), email, password, { edgeFunctionUrl: EDGE_FN });
      // If web, client session is cleared; keep user info from result if available
      const userFromResult = (result as any)?.data?.user || (result as any)?.user || null;
      if (Platform.OS === 'web') {
        setUser(userFromResult);
        setSession(null);
      } else {
        const sessionObj = (result as any)?.data?.session || null;
        setSession(sessionObj);
        setUser(sessionObj?.user ?? userFromResult);
      }
      return result;
    } catch (err) {
      return { error: err };
    }
  }, [supabaseService]);

  // Proxied fetch helper - on web routes through Edge Function, on native uses client directly for simple GETs
  const proxiedFetch = useCallback(async (method: string, path: string, options?: { query?: string; body?: any }) => {
    if (Platform.OS === 'web') {
      return proxiedRequest(EDGE_FN, method, path, options);
    }
    try {
      const client = supabaseService.getClient();
      if (method.toUpperCase() === 'GET') {
        const selectQuery = options?.query || '*';
        const { data, error } = await client.from(path).select(selectQuery);
        return { ok: !error, data, error };
      }
      // For non-GET on native, prefer using Supabase client methods directly
      return { ok: false, error: 'Use Supabase client directly for non-GET requests on native' };
    } catch (err) {
      return { ok: false, error: err };
    }
  }, [supabaseService]);

  const value = useMemo<AuthContextType>(() => ({
    session,
    user,
    loading,
    isBanned,
    banMessage,
    signOut,
    signIn,
    proxiedFetch,
  }), [session, user, loading, isBanned, banMessage, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
