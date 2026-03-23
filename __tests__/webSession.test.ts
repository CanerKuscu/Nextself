import { Session } from '@supabase/supabase-js';

jest.mock('react-native-url-polyfill/auto', () => ({}));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn()
}));
jest.mock('react-native', () => ({
    Platform: { OS: 'web' },
}));

jest.mock('@nextself/shared', () => {
    const originalModule = jest.requireActual('@nextself/shared');
    return {
        ...originalModule,
        CONFIG: {
            ...originalModule.CONFIG,
            SESSION_EXCHANGE_URL: 'https://edge.example.com/session-exchange',
            SUPABASE_URL: 'https://project.supabase.co',
            SUPABASE_PUBLISHABLE_KEY: 'test-anon-key'
        }
    };
});

describe('webSession auth and edge integration', () => {
    const loadModule = () => {
        let loaded: unknown;
        jest.isolateModules(() => {
            loaded = require('../services/webSession');
        });
        return loaded as typeof import('../services/webSession');
    };

    beforeEach(() => {
        jest.resetModules();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('signInAndExchange sends refresh token to edge function on web', async () => {
        const { signInAndExchange } = loadModule();
        const supabaseClient = {
            auth: {
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: { session: { refresh_token: 'refresh-token-123' } },
                }),
                setSession: jest.fn().mockResolvedValue({}),
            },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue(JSON.stringify({ success: true })),
        });

        const result = await signInAndExchange(supabaseClient as never, 'a@b.com', 'pass123');

        expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith(
            'https://edge.example.com/session-exchange/set-session',
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
            }),
        );
        expect(supabaseClient.auth.setSession).toHaveBeenCalledWith({ access_token: '', refresh_token: '' });
        expect(result).toHaveProperty('exchange');
    });

    it('signInAndExchange skips edge exchange when refresh token is absent', async () => {
        const { signInAndExchange } = loadModule();
        const supabaseClient = {
            auth: {
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: { session: null },
                }),
            },
        };

        await signInAndExchange(supabaseClient as never, 'a@b.com', 'pass123');

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('proxiedRequest posts method and path to edge proxy endpoint', async () => {
        const { proxiedRequest } = loadModule();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            text: jest.fn().mockResolvedValue(JSON.stringify({ rows: [] })),
        });

        const result = await proxiedRequest('https://edge.example.com/session-exchange', 'GET', 'profiles', { query: 'id=eq.1' });

        expect(global.fetch).toHaveBeenCalledWith(
            'https://edge.example.com/session-exchange/proxy',
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
            }),
        );
        expect(result.ok).toBe(true);
        expect(result.data).toEqual({ rows: [] });
    });
});
