import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import PlatformStorage from '../utils/platformStorage';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase';

// Custom Storage adapter for Zustand using PlatformStorage (web-safe)
const zustandSecureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await PlatformStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await PlatformStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await PlatformStorage.removeItem(name);
    },
};

export type UserRole = 'user' | 'pt' | 'dietitian';

export interface BioSyncUserProfile {
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
    profile: BioSyncUserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    setProfile: (profile: BioSyncUserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,

            setSession: (session) => {
                const isValid = !!session && (!session.expires_at || session.expires_at * 1000 > Date.now());
                set({ session: isValid ? session : null, isAuthenticated: isValid });
            },

            setProfile: (profile) => {
                set({ profile });
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            logout: async () => {
                // Always clear local state first to prevent stale sessions
                set({ session: null, profile: null, isAuthenticated: false });
                try {
                    const supa = SupabaseService.getInstance();
                    await supa.getClient().auth.signOut();
                } catch (e) {
                    console.warn('Supabase signOut failed:', e);
                }
            },
        }),
        {
            name: 'biosync-auth-storage', // The key by which it will be saved in SecureStore
            storage: createJSONStorage(() => zustandSecureStorage),
            // Partialize dictates what is stored. `isLoading` should be omitted as we only want session data.
            partialize: (state) => ({
                session: state.session,
                profile: state.profile,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
