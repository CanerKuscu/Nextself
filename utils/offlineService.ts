import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CONFIG } from '../config/config';
import { SecurityUtils } from './security';

type OfflineOperation = {
    id: string;
    type: string;
    data: any;
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
    private readonly STORAGE_KEY = '@biosync_offline_queue';
    private readonly MAX_RETRIES = 3;
    private readonly SYNC_INTERVAL = 30000; // 30 seconds

    private constructor() {
        this.init();
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
                // Decrypt the queue data
                const decrypted = SecurityUtils.decrypt(savedQueue);
                this.syncQueue = decrypted ? JSON.parse(decrypted) : [];
            }
        } catch (error) {
            console.error('Failed to load offline queue');
            this.syncQueue = [];
        }
    }

    private async saveQueue() {
        try {
            // Encrypt the queue before storing
            const encrypted = SecurityUtils.encrypt(JSON.stringify(this.syncQueue));
            await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
        } catch (error) {
            console.error('Failed to save offline queue');
        }
    }

    /**
     * Clear offline queue (call on logout to prevent cross-user data leakage)
     */
    public async clearQueue() {
        this.syncQueue = [];
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    private netInfoUnsubscribe: (() => void) | null = null;

    private monitorNetwork() {
        this.netInfoUnsubscribe = NetInfo.addEventListener((state: any) => {
            const wasOnline = this.isOnline;
            this.isOnline = state.isConnected ?? false;

            if (!wasOnline && this.isOnline) {
                // Came back online, trigger sync
                this.processQueue();
            }

            // Emit network change event if needed
            this.emitNetworkChange(this.isOnline);
        });
    }

    private emitNetworkChange(isOnline: boolean) {
        // Could be used to update UI or trigger actions
        // Example: EventEmitter.emit('networkChange', { isOnline });
    }

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

    /**
     * Register a sync handler for a specific operation type
     */
    public registerSyncHandler(type: string, callback: SyncCallback) {
        this.syncCallbacks.set(type, callback);
    }

    /**
     * Queue an operation for offline sync
     */
    public async queueOperation(type: string, data: any, maxRetries: number = this.MAX_RETRIES): Promise<string> {
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

        // If online, try to process immediately
        if (this.isOnline) {
            this.processOperation(operation);
        }

        return operation.id;
    }

    /**
     * Process a single operation
     */
    private async processOperation(operation: OfflineOperation): Promise<boolean> {
        const callback = this.syncCallbacks.get(operation.type);

        if (!callback) {
            console.warn(`No sync handler registered for type: ${operation.type}`);
            return false;
        }

        try {
            const success = await callback(operation);

            if (success) {
                // Remove from queue
                this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                await this.saveQueue();
                return true;
            } else {
                // Increment retries
                operation.retries++;

                if (operation.retries >= operation.maxRetries) {
                    // Max retries reached, remove from queue
                    this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                    await this.saveQueue();
                    this.emitOperationFailed(operation, 'max_retries');
                } else {
                    await this.saveQueue();
                }

                return false;
            }
        } catch (error) {
            console.error(`Failed to process operation ${operation.id}:`, error);
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

    /**
     * Process all queued operations
     */
    private async processQueue() {
        if (!this.isOnline || this.syncQueue.length === 0 || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        try {
            // Process operations in order
            const operations = [...this.syncQueue]; // Copy to avoid modification during iteration

            for (const operation of operations) {
                if (!this.isOnline) {
                    break; // Stop if we go offline
                }

                await this.processOperation(operation);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Get current queue status
     */
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

    /**
     * Remove a specific operation from queue
     */
    public async removeOperation(operationId: string): Promise<boolean> {
        const initialLength = this.syncQueue.length;
        this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);

        if (this.syncQueue.length < initialLength) {
            await this.saveQueue();
            return true;
        }

        return false;
    }

    /**
     * Check if device is online
     */
    public getIsOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Manually trigger sync
     */
    public async syncNow(): Promise<{ success: boolean; processed: number }> {
        if (!this.isOnline) {
            return { success: false, processed: 0 };
        }

        const initialLength = this.syncQueue.length;
        await this.processQueue();
        const processed = initialLength - this.syncQueue.length;

        return { success: true, processed };
    }

    /**
     * Generate unique ID for operations
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Emit operation failed event
     */
    private emitOperationFailed(operation: OfflineOperation, reason: string) {
        // Could be used to notify user or log analytics
        // Example: EventEmitter.emit('operationFailed', { operation, reason });
        console.warn(`Operation ${operation.id} failed: ${reason}`);
    }

    /**
     * Cleanup resources
     */
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

// Example usage:
/*
// Initialize offline service
const offlineService = OfflineService.getInstance();

// Register sync handlers
offlineService.registerSyncHandler('create_exercise', async (operation) => {
  try {
    // Call your API here
    const response = await api.createExercise(operation.data);
    return response.success;
  } catch (error) {
    return false;
  }
});

offlineService.registerSyncHandler('log_food', async (operation) => {
  try {
    const response = await api.logFood(operation.data);
    return response.success;
  } catch (error) {
    return false;
  }
});

// Queue operations when offline
await offlineService.queueOperation('create_exercise', {
  name: 'Push-ups',
  category: 'calisthenics',
  muscle_group: 'chest',
});

// Check queue status
const status = offlineService.getQueueStatus();
console.log('Queue status:', status);

// Manual sync
if (offlineService.getIsOnline()) {
  await offlineService.syncNow();
}
*/