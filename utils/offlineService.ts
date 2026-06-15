import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus, Alert, Platform } from 'react-native';
import { CONFIG } from '@nextself/shared';
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
    private saveQueueTimer: NodeJS.Timeout | null = null;
    private isProcessing: boolean = false;
    private isPaused: boolean = false;
    private processingPromise: Promise<void> | null = null;
    private resolveProcessingPromise: (() => void) | null = null;
    private readonly STORAGE_KEY = '@NextSelf_offline_queue';
    private readonly MAX_RETRIES = 3;
    private readonly SYNC_INTERVAL = 30000; // 30 seconds

    private initPromise: Promise<void>;
    private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

    private constructor() {
        this.initPromise = this.init();
        this.setupAppStateListener();
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

    /**
     * Flush the queue to persistent storage when the app goes to background,
     * preventing data loss from the debounce window.
     */
    private setupAppStateListener() {
        this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'background' || state === 'inactive') {
                this.flushQueue();
            }
        });
    }

    /**
     * Ensure the queue has been loaded from storage before performing operations.
     */
    private async ensureReady(): Promise<void> {
        await this.initPromise;
    }

    private async loadQueue() {
        try {
            const savedQueue = await AsyncStorage.getItem(this.STORAGE_KEY);
            if (savedQueue) {
                const decrypted = await SecurityUtils.decryptAsync(savedQueue);
                this.syncQueue = decrypted ? JSON.parse(decrypted) : [];
            }
        } catch (error) {
            // Decryption / parse failed: previously we silently reset to [] which dropped
            // every pending offline mutation on the floor. Preserve the raw blob to a
            // sidecar key so it can be inspected or recovered later, then continue with
            // an empty queue rather than blocking startup.
            console.error('[OfflineService] Failed to load offline queue:', error);
            try {
                const raw = await AsyncStorage.getItem(this.STORAGE_KEY);
                if (raw) {
                    await AsyncStorage.setItem(`${this.STORAGE_KEY}.corrupted`, raw);
                }
            } catch (backupError) {
                console.warn('[OfflineService] Failed to back up corrupted queue blob:', backupError);
            }
            this.syncQueue = [];
        }

        try {
            await SecurityUtils.encryptAsync('init'); // Ensure key is initialized
            if (SecurityUtils.isVolatile && Platform.OS !== 'web') {
                Alert.alert(
                    'Security Warning',
                    'Device secure storage is unavailable. Your offline data is not encrypted.'
                );
            }
        } catch (encryptInitError) {
            console.warn('[OfflineService] Failed to verify encryption init:', encryptInitError);
        }
    }

    private async saveQueueImmediate() {
        try {
            const encrypted = await SecurityUtils.encryptAsync(JSON.stringify(this.syncQueue));
            await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
        } catch (error) {
            console.warn('[OfflineService] Failed to persist offline queue:', error);
        }
    }

    /**
     * Immediately persist the queue (e.g., before sign-out or app background).
     */
    public async flushQueue() {
        await this.saveQueueImmediate();
    }

    public async clearQueue() {
        this.syncQueue = [];
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.warn('[OfflineService] Failed to clear offline queue storage:', error);
        }
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
        await this.ensureReady();

        // Add optimistic concurrency timestamp
        const enrichedData = typeof data === 'object' && data !== null 
            ? { ...data, _client_updated_at: new Date().toISOString() } 
            : data;

        const operation: OfflineOperation = {
            id: this.generateId(),
            type,
            data: enrichedData,
            timestamp: Date.now(),
            retries: 0,
            maxRetries,
        };

        this.syncQueue.push(operation);
        await this.flushQueue();

        // Always enqueue; let the single processor handle operations to avoid
        // concurrent processing of the same item. If not paused and online,
        // trigger the centralized queue processor.
        if (this.isOnline && !this.isPaused) {
            this.processQueue();
        }

        return operation.id;
    }

    private async processOperation(operation: OfflineOperation): Promise<'success' | 'retry' | 'failed'> {
        const callback = this.syncCallbacks.get(operation.type);

        if (!callback) {
            return 'failed';
        }

        try {
            const success = await callback(operation);

            if (success) {
                return 'success';
            } else {
                operation.retries++;

                if (operation.retries >= operation.maxRetries) {
                    this.emitOperationFailed(operation, 'max_retries');
                    return 'failed';
                }

                return 'retry';
            }
        } catch (error) {
            operation.retries++;

            if (operation.retries >= operation.maxRetries) {
                this.emitOperationFailed(operation, 'error');
                return 'failed';
            }

            return 'retry';
        }
    }

    private async processQueue() {
        if (!this.isOnline || this.syncQueue.length === 0 || this.isProcessing || this.isPaused) {
            return;
        }

        this.isProcessing = true;
        this.processingPromise = new Promise<void>((resolve) => {
            this.resolveProcessingPromise = resolve;
        });

        try {
            const operations = [...this.syncQueue];
            const toRemove = new Set<string>();
            let queueModified = false;

            for (const operation of operations) {
                if (!this.isOnline || this.isPaused) {
                    break;
                }

                const result = await this.processOperation(operation);
                
                if (result === 'success' || result === 'failed') {
                    toRemove.add(operation.id);
                    queueModified = true;
                } else if (result === 'retry') {
                    queueModified = true; // retries count was updated
                }
            }

            if (queueModified) {
                if (toRemove.size > 0) {
                    this.syncQueue = this.syncQueue.filter(op => !toRemove.has(op.id));
                }
                await this.flushQueue();
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
            await this.flushQueue();
            return true;
        }

        return false;
    }

    public getIsOnline(): boolean {
        return this.isOnline;
    }

    public async syncNow(): Promise<{ success: boolean; processed: number }> {
        await this.ensureReady();
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
        if (this.saveQueueTimer) {
            clearTimeout(this.saveQueueTimer);
            this.saveQueueTimer = null;
        }
        if (this.netInfoUnsubscribe) {
            this.netInfoUnsubscribe();
            this.netInfoUnsubscribe = null;
        }
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
    }
}
