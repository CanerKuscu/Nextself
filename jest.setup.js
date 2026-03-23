// Jest setup file
// Removed @testing-library/jest-native/extend-expect as it's deprecated

// Set environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
// 32-char test key for AES-256 in tests
process.env.EXPO_PUBLIC_ENCRYPTION_KEY = '01234567890123456789012345678901';
process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY = 'test-deepseek-key';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            supabaseUrl: 'https://test.supabase.co',
            supabaseAnonKey: 'test-key',
        },
    },
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    setUser: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signInWithOtp: jest.fn(() => Promise.resolve({ data: null, error: null })),
            verifyOtp: jest.fn(() => Promise.resolve({ data: null, error: null })),
            signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
            signOut: jest.fn(() => Promise.resolve({ error: null })),
            getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                })),
                ilike: jest.fn(() => ({
                    order: jest.fn(() => ({
                        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
                    })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    })),
                })),
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
        })),
    })),
}));

// Mock React Native - Commented out as it may not exist in newer versions
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
    }),
    useRoute: () => ({
        params: {},
    }),
}));

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    }),
    SafeAreaProvider: ({ children }) => children,
}));

// Mock CryptoJS – functional mock that supports encrypt/decrypt roundtrip,
// deterministic SHA256, HmacSHA256, and proper WordArray.random.
jest.mock('crypto-js', () => {
    // Simple deterministic hash for consistent results per input
    const simpleHash = (str) => {
        let h = 0;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h = h & h;
        }
        return Math.abs(h).toString(16).padStart(64, '0').substring(0, 64);
    };

    return {
        AES: {
            encrypt: jest.fn((data, key) => {
                // Reversible encoding so decrypt can recover the original data
                const encoded = Buffer.from(JSON.stringify({ d: data, r: Math.random() })).toString('base64');
                return { toString: () => encoded };
            }),
            decrypt: jest.fn((encryptedData, key) => {
                try {
                    const decoded = JSON.parse(Buffer.from(String(encryptedData), 'base64').toString());
                    return { toString: (enc) => decoded.d || '' };
                } catch {
                    return { toString: () => '' };
                }
            }),
        },
        SHA256: jest.fn((data) => ({
            toString: () => simpleHash(data),
        })),
        HmacSHA256: jest.fn((data, key) => ({
            toString: () => simpleHash(String(data) + String(key)),
        })),
        enc: {
            Utf8: 'utf8',
            Latin1: 'latin1',
            Hex: 'hex',
        },
        lib: {
            WordArray: {
                create: jest.fn(),
                random: jest.fn((length) => ({
                    toString: (enc) => {
                        const chars = '0123456789abcdef';
                        let result = '';
                        for (let i = 0; i < (length || 32) * 2; i++) {
                            result += chars[Math.floor(Math.random() * chars.length)];
                        }
                        return result;
                    },
                    words: [Math.floor(Math.random() * 1000000)],
                })),
            },
        },
    };
});

// Clear all mocks after each test - removed as afterEach is not available in global scope
