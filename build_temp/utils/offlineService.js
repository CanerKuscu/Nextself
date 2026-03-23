"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineService = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const security_1 = require("./security");
class OfflineService {
    constructor() {
        this.isOnline = true;
        this.syncQueue = [];
        this.syncCallbacks = new Map();
        this.syncInterval = null;
        this.isProcessing = false;
        this.isPaused = false;
        this.processingPromise = null;
        this.resolveProcessingPromise = null;
        this.STORAGE_KEY = '@NextSelf_offline_queue';
        this.MAX_RETRIES = 3;
        this.SYNC_INTERVAL = 30000; // 30 seconds
        this.netInfoUnsubscribe = null;
        this.init();
        // IMPORTANT: Call cleanup() when app unmounts or component unmounts:
        // useEffect(() => { return () => offlineService.cleanup(); }, []);
    }
    static getInstance() {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService();
        }
        return OfflineService.instance;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // Load saved queue from storage
            yield this.loadQueue();
            // Monitor network connectivity
            this.monitorNetwork();
            // Start sync interval
            this.startSyncInterval();
        });
    }
    loadQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const savedQueue = yield async_storage_1.default.getItem(this.STORAGE_KEY);
                if (savedQueue) {
                    const decrypted = security_1.SecurityUtils.decrypt(savedQueue);
                    this.syncQueue = decrypted ? JSON.parse(decrypted) : [];
                }
            }
            catch (error) {
                this.syncQueue = [];
            }
        });
    }
    saveQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const encrypted = security_1.SecurityUtils.encrypt(JSON.stringify(this.syncQueue));
                yield async_storage_1.default.setItem(this.STORAGE_KEY, encrypted);
            }
            catch (error) { }
        });
    }
    clearQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            this.syncQueue = [];
            try {
                yield async_storage_1.default.removeItem(this.STORAGE_KEY);
            }
            catch (_a) { }
        });
    }
    monitorNetwork() {
        this.netInfoUnsubscribe = netinfo_1.default.addEventListener((state) => {
            var _a;
            const wasOnline = this.isOnline;
            this.isOnline = (_a = state.isConnected) !== null && _a !== void 0 ? _a : false;
            if (!wasOnline && this.isOnline) {
                this.processQueue();
            }
            this.emitNetworkChange(this.isOnline);
        });
    }
    emitNetworkChange(isOnline) { }
    startSyncInterval() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                this.processQueue();
            }
        }, this.SYNC_INTERVAL);
    }
    registerSyncHandler(type, callback) {
        this.syncCallbacks.set(type, callback);
    }
    queueOperation(type_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (type, data, maxRetries = this.MAX_RETRIES) {
            const operation = {
                id: this.generateId(),
                type,
                data,
                timestamp: Date.now(),
                retries: 0,
                maxRetries,
            };
            this.syncQueue.push(operation);
            yield this.saveQueue();
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
        });
    }
    processOperation(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            const callback = this.syncCallbacks.get(operation.type);
            if (!callback) {
                return false;
            }
            try {
                const success = yield callback(operation);
                if (success) {
                    this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                    yield this.saveQueue();
                    return true;
                }
                else {
                    operation.retries++;
                    if (operation.retries >= operation.maxRetries) {
                        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                        yield this.saveQueue();
                        this.emitOperationFailed(operation, 'max_retries');
                    }
                    else {
                        yield this.saveQueue();
                    }
                    return false;
                }
            }
            catch (error) {
                operation.retries++;
                if (operation.retries >= operation.maxRetries) {
                    this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
                    yield this.saveQueue();
                    this.emitOperationFailed(operation, 'error');
                }
                else {
                    yield this.saveQueue();
                }
                return false;
            }
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isOnline || this.syncQueue.length === 0 || this.isProcessing || this.isPaused) {
                return;
            }
            // Mark processing and expose a promise that callers can await to know
            // when processing is complete (used by sign-out to wait for quiescence).
            this.isProcessing = true;
            this.processingPromise = new Promise((resolve) => {
                this.resolveProcessingPromise = resolve;
            });
            try {
                const operations = [...this.syncQueue];
                for (const operation of operations) {
                    if (!this.isOnline || this.isPaused) {
                        break;
                    }
                    yield this.processOperation(operation);
                }
            }
            finally {
                this.isProcessing = false;
                if (this.resolveProcessingPromise) {
                    this.resolveProcessingPromise();
                }
                this.processingPromise = null;
                this.resolveProcessingPromise = null;
            }
        });
    }
    /**
     * Pause processing and wait for any in-flight processing to finish.
     * After this resolves, no further processing will start until `resume()` is called.
     */
    pauseAndWait() {
        return __awaiter(this, arguments, void 0, function* (timeoutMs = 4000) {
            this.isPaused = true;
            if (!this.isProcessing)
                return;
            // Race between quiescence and a fail-safe timeout to avoid hanging forever
            const quiescentPromise = this.awaitQuiescent();
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    // If timeout fires, log a warning and resolve so callers can proceed
                    try {
                        console.warn(`[OfflineService] pauseAndWait timed out after ${timeoutMs}ms; proceeding with paused queue.`);
                    }
                    catch (_) { }
                    resolve();
                }, timeoutMs);
            });
            yield Promise.race([quiescentPromise, timeoutPromise]);
        });
    }
    resume() {
        this.isPaused = false;
        if (this.isOnline && this.syncQueue.length > 0) {
            // kick the processor again
            this.processQueue();
        }
    }
    awaitQuiescent() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isProcessing)
                return;
            return (_a = this.processingPromise) !== null && _a !== void 0 ? _a : Promise.resolve();
        });
    }
    getQueueStatus() {
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
    removeOperation(operationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const initialLength = this.syncQueue.length;
            this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
            if (this.syncQueue.length < initialLength) {
                yield this.saveQueue();
                return true;
            }
            return false;
        });
    }
    getIsOnline() {
        return this.isOnline;
    }
    syncNow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isOnline) {
                return { success: false, processed: 0 };
            }
            const initialLength = this.syncQueue.length;
            yield this.processQueue();
            const processed = initialLength - this.syncQueue.length;
            return { success: true, processed };
        });
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    emitOperationFailed(operation, reason) { }
    cleanup() {
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
exports.OfflineService = OfflineService;
