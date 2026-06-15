import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityUtils } from '../utils/security';
import { OfflineService } from '../utils/offlineService';

jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(() => () => {}),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
    const store: Record<string, string> = {};
    return {
        getItem: jest.fn(async (key: string) => store[key] ?? null),
        setItem: jest.fn(async (key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn(async (key: string) => {
            delete store[key];
        }),
        __resetStore: () => {
            for (const k of Object.keys(store)) delete store[k];
        },
    };
});

describe('OfflineService — corrupted queue handling', () => {
    const STORAGE_KEY = '@NextSelf_offline_queue';

    beforeEach(() => {
        // Reset singleton + storage between tests
        (OfflineService as any).instance = undefined;
        (AsyncStorage as any).__resetStore?.();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        try {
            const inst = OfflineService.getInstance();
            await inst.clearQueue();
            inst.cleanup?.();
        } catch (e) {
            // ignore teardown errors
        }
        (OfflineService as any).instance = undefined;
    });

    it('preserves an undecryptable blob to the .corrupted sidecar key instead of silently wiping', async () => {
        // Seed AsyncStorage with a blob that decryptAsync will reject.
        const garbage = 'not-encrypted-or-parsable-blob';
        await AsyncStorage.setItem(STORAGE_KEY, garbage);

        const decryptSpy = jest
            .spyOn(SecurityUtils, 'decryptAsync')
            .mockRejectedValue(new Error('decrypt failed'));

        // Force a synchronous error path in console.error / console.warn so the test does not pollute output
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Constructing the singleton triggers init -> loadQueue
        const inst = OfflineService.getInstance();
        // Wait for the init promise to settle (private field, accessed for testing only)
        await (inst as any).initPromise;

        const backup = await AsyncStorage.getItem(`${STORAGE_KEY}.corrupted`);
        expect(backup).toBe(garbage);

        decryptSpy.mockRestore();
    });
});
