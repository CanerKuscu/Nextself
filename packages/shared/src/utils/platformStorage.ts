/**
 * Platform-aware storage utility.
 * Uses @react-native-async-storage/async-storage on native (iOS/Android) and localStorage on web.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlatformStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        }
        return AsyncStorage.getItem(key);
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
        return AsyncStorage.setItem(key, value);
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
        return AsyncStorage.removeItem(key);
    },
};

export default PlatformStorage;
