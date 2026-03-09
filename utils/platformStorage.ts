/**
 * Platform-aware secure storage utility.
 * Uses expo-secure-store on native (iOS/Android) and localStorage on web.
 */
import { Platform } from 'react-native';

const PlatformStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        }
        const SecureStore = require('expo-secure-store');
        return SecureStore.getItemAsync(key);
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch {
                // quota exceeded or private browsing
            }
            return;
        }
        const SecureStore = require('expo-secure-store');
        return SecureStore.setItemAsync(key, value);
    },

    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore
            }
            return;
        }
        const SecureStore = require('expo-secure-store');
        return SecureStore.deleteItemAsync(key);
    },
};

export default PlatformStorage;
