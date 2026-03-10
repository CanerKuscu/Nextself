import { OfflineService } from '../utils/offlineService';

// Mock NetInfo to control connectivity events
jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn((cb) => {
        // Immediately report online
        cb({ isConnected: true });
        return () => { };
    }),
}));

describe('OfflineService', () => {
    beforeEach(async () => {
        // Reset singleton between tests
        // @ts-ignore access private static for test reset
        (OfflineService as any).instance = undefined;
    });

    afterEach(async () => {
        // ensure cleanup
        const inst = OfflineService.getInstance();
        try { await inst.clearQueue(); } catch { };
        try { inst.cleanup(); } catch { };
        // reset again
        // @ts-ignore
        (OfflineService as any).instance = undefined;
    });

    it('pauseAndWait should timeout instead of hanging when processor is stuck', async () => {
        jest.useFakeTimers();

        const offline = OfflineService.getInstance();

        // register a handler that never resolves immediately (simulated long running op)
        offline.registerSyncHandler('delayed', async (_op) => {
            return new Promise<boolean>((resolve) => {
                setTimeout(() => resolve(true), 5000);
            });
        });

        // enqueue one delayed operation which will start processing
        await offline.queueOperation('delayed', { foo: 'bar' });

        // call pauseAndWait with a short timeout and ensure it returns after the timeout
        const p = offline.pauseAndWait(1000);

        // advance timers to trigger timeout
        jest.advanceTimersByTime(1000);

        await expect(p).resolves.toBeUndefined();

        // cleanup fake timers
        jest.useRealTimers();
    });

    it('concurrent queueOperation calls are processed exactly once each', async () => {
        const offline = OfflineService.getInstance();

        const processed: string[] = [];

        offline.registerSyncHandler('counter', async (op) => {
            processed.push(op.id);
            return true;
        });

        // enqueue multiple operations rapidly
        const ops = await Promise.all([
            offline.queueOperation('counter', { i: 1 }),
            offline.queueOperation('counter', { i: 2 }),
            offline.queueOperation('counter', { i: 3 }),
        ]);

        // Trigger a sync and wait for completion
        const res = await offline.syncNow();

        expect(res.success).toBe(true);
        expect(processed.length).toBe(3);

        // Ensure uniqueness
        const unique = new Set(processed);
        expect(unique.size).toBe(3);

        // Ensure ids match enqueued ids (order not strictly required)
        for (const id of ops) {
            expect(unique.has(id)).toBe(true);
        }
    });
});
