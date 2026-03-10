import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { CONFIG } from '../config/config';
import { SecurityUtils } from './security';

type OfflineOperation = {
    id: string;
    type: string;
    data: unknown;
    timestamp: number;
    retries: number;
    maxRetries: number;
};

type SyncCallback = (operation: OfflineOperation) => Promise<boolean>;

export class OfflineService {
    private static instance: OfflineService;
    private isOnline: boolean = true;
    private syncQueue: OfflineOperation[] = [];
    private syncCallbacks: Map<string, SyncCallback> = new Map();
    private syncInterval: NodeJS.Timeout | null = null;
    private isProcessing: boolean = false;
    private isPaused: boolean = false;
    private processingPromise: Promise<void> | null = null;
    private resolveProcessingPromise: (() => void) | null = null;
    private readonly STORAGE_KEY = '@biosync_offline_queue';
    private readonly MAX_RETRIES = 3;
    private readonly SYNC_INTERVAL = 30000; // 30 seconds

    private constructor() {
        this.init();
        // IMPORTANT: Call cleanup() when app unmounts or component unmounts:
        // useEffect(() => { return () => offlineService.cleanup(); }, []);
    }

    public static getInstance(): OfflineService {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService();
        }
        return OfflineService.instance;
    }

    private async init() {
        // Load saved queue from storage
        await this.loadQueue();

        // Monitor network connectivity
        this.monitorNetwork();

        // Start sync interval
        this.startSyncInterval();
    }

    private async loadQueue() {
        try {
            const savedQueue = await AsyncStorage.getItem(this.STORAGE_KEY);
            if (savedQueue) {
                const decrypted = SecurityUtils.decrypt(savedQueue);
                this.syncQueue = decrypted ? JSON.parse(decrypted) : [];
            }
        } catch (error) {
            this.syncQueue = [];
        }
    }

    private async saveQueue() {
        try {
            const encrypted = SecurityUtils.encrypt(JSON.stringify(this.syncQueue));
            await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
        } catch (error) { }
    }

    public async clearQueue() {
        this.syncQueue = [];
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
        } catch { }
    }

    private netInfoUnsubscribe: (() => void) | null = null;

    private monitorNetwork() {
        this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const wasOnline = this.isOnline;
            this.isOnline = state.isConnected ?? false;

            if (!wasOnline && this.isOnline) {
                this.processQueue();
            }

            this.emitNetworkChange(this.isOnline);
        });
    }

    private emitNetworkChange(isOnline: boolean) { }

    private startSyncInterval() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processQueue();
            }
        }, this.SYNC_INTERVAL);
    }

    public registerSyncHandler(type: string, callback: SyncCallback) {
        this.syncCallbacks.set(type, callback);
    }

    public async queueOperation(type: string, data: unknown, maxRetries: number = this.MAX_RETRIES): Promise<string> {
        const operation: OfflineOperation = {
            id: this.generateId(),
            type,
            data,
            timestamp: Date.now(),
            retries: 0,
            maxRetries,
        };

        this.syncQueue.push(operation);
        await this.saveQueue();

        // Always enqueue; let the single processor handle operations to avoid
        // concurrent processing of the same item. If not paused and online,
        // trigger the centralized queue processor.
        if (this.isOnline && !this.isPaused) {
            // Defer processing to next tick to avoid racing with multiple rapid enqueues
            setTimeout(() => {
                this.processQueue();
            }, 0);
        }

        return operation.id;
    }

    private async processOperation(operation: OfflineOperation): Promise<boolean> {
        const callback = this.syncCallbacks.get(operation.type);

        if (!callback) {
            return false;
        }

        try {
            const success = await callback(operation);

            if (success) {
                this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                await this.saveQueue();
                return true;
            } else {
                operation.retries++;

                if (operation.retries >= operation.maxRetries) {
                    this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                    await this.saveQueue();
                    this.emitOperationFailed(operation, 'max_retries');
                } else {
                    await this.saveQueue();
                }

                return false;
            }
        } catch (error) {
            operation.retries++;

            if (operation.retries >= operation.maxRetries) {
                this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                await this.saveQueue();
                this.emitOperationFailed(operation, 'error');
            } else {
                await this.saveQueue();
            }

            return false;
        }
    }

    private async processQueue() {
        if (!this.isOnline || this.syncQueue.length === 0 || this.isProcessing || this.isPaused) {
            return;
        }

        // Mark processing and expose a promise that callers can await to know
        // when processing is complete (used by sign-out to wait for quiescence).
        this.isProcessing = true;
        this.processingPromise = new Promise<void>((resolve) => {
            this.resolveProcessingPromise = resolve;
        });

        try {
            const operations = [...this.syncQueue];

            for (const operation of operations) {
                if (!this.isOnline || this.isPaused) {
                    break;
                }

                await this.processOperation(operation);
            }
        } finally {
            this.isProcessing = false;
            if (this.resolveProcessingPromise) {
                this.resolveProcessingPromise();
            }
            this.processingPromise = null;
            this.resolveProcessingPromise = null;
        }
    }

    /**
     * Pause processing and wait for any in-flight processing to finish.
     * After this resolves, no further processing will start until `resume()` is called.
     */
    public async pauseAndWait(timeoutMs: number = 4000): Promise<void> {
        this.isPaused = true;

        if (!this.isProcessing) return;

        // Race between quiescence and a fail-safe timeout to avoid hanging forever
        const quiescentPromise = this.awaitQuiescent();
        const timeoutPromise = new Promise<void>((resolve) => {
            setTimeout(() => {
                // If timeout fires, log a warning and resolve so callers can proceed
                try {
                    console.warn(`[OfflineService] pauseAndWait timed out after ${timeoutMs}ms; proceeding with paused queue.`);
                } catch (_) { }
                resolve();
            }, timeoutMs);
        });

        await Promise.race([quiescentPromise, timeoutPromise]);
    }

    public resume(): void {
        this.isPaused = false;
        if (this.isOnline && this.syncQueue.length > 0) {
            // kick the processor again
            this.processQueue();
        }
    }

    public async awaitQuiescent(): Promise<void> {
        if (!this.isProcessing) return;
        return this.processingPromise ?? Promise.resolve();
    }

    public getQueueStatus() {
        return {
            isOnline: this.isOnline,
            queueLength: this.syncQueue.length,
            operations: this.syncQueue.map(op => ({
                id: op.id,
                type: op.type,
                timestamp: op.timestamp,
                retries: op.retries,
                maxRetries: op.maxRetries,
            })),
        };
    }

    public async removeOperation(operationId: string): Promise<boolean> {
        const initialLength = this.syncQueue.length;
        this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);

        if (this.syncQueue.length < initialLength) {
            await this.saveQueue();
            return true;
        }

        return false;
    }

    public getIsOnline(): boolean {
        return this.isOnline;
    }

    public async syncNow(): Promise<{ success: boolean; processed: number }> {
        if (!this.isOnline) {
            return { success: false, processed: 0 };
        }

        const initialLength = this.syncQueue.length;
        await this.processQueue();
        const processed = initialLength - this.syncQueue.length;

        return { success: true, processed };
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    private emitOperationFailed(operation: OfflineOperation, reason: string) { }

    public cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.netInfoUnsubscribe) {
            this.netInfoUnsubscribe();
            this.netInfoUnsubscribe = null;
        }
    }
}