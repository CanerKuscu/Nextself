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
exports.offlineCache = void 0;
const platformStorage_1 = __importDefault(require("../utils/platformStorage"));
const CACHE_KEY_PREFIX = 'NextSelf_cache_';
const CACHE_KEYS_INDEX = 'NextSelf_cache_keys_index';
exports.offlineCache = {
    /**
     * Internal: Get all registered keys
     */
    _getKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keysStr = yield platformStorage_1.default.getItem(CACHE_KEYS_INDEX);
                return keysStr ? JSON.parse(keysStr) : [];
            }
            catch (_a) {
                return [];
            }
        });
    },
    /**
     * Internal: Add a key to the registry
     */
    _addKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keys = yield this._getKeys();
                if (!keys.includes(key)) {
                    keys.push(key);
                    yield platformStorage_1.default.setItem(CACHE_KEYS_INDEX, JSON.stringify(keys));
                }
            }
            catch (e) {
                console.error('Error adding key to index:', e);
            }
        });
    },
    /**
    * Internal: Remove a key from the registry
    */
    _removeKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let keys = yield this._getKeys();
                keys = keys.filter(k => k !== key);
                yield platformStorage_1.default.setItem(CACHE_KEYS_INDEX, JSON.stringify(keys));
            }
            catch (e) {
                console.error('Error removing key from index:', e);
            }
        });
    },
    /**
     * Save data to offline cache
     * @param key Unique identifier for the cached data
     * @param data The data to stringify and store
     */
    set(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonValue = JSON.stringify(data);
                yield platformStorage_1.default.setItem(`${CACHE_KEY_PREFIX}${key}`, jsonValue);
                yield this._addKey(`${CACHE_KEY_PREFIX}${key}`);
            }
            catch (e) {
                console.error(`Error saving to offline cache for key ${key}:`, e);
            }
        });
    },
    /**
     * Retrieve data from offline cache
     * @param key Unique identifier for the cached data
     * @returns Parsed data or null if not found
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jsonValue = yield platformStorage_1.default.getItem(`${CACHE_KEY_PREFIX}${key}`);
                return jsonValue != null ? JSON.parse(jsonValue) : null;
            }
            catch (e) {
                console.error(`Error reading from offline cache for key ${key}:`, e);
                return null;
            }
        });
    },
    /**
     * Remove specific data from offline cache
     * @param key Unique identifier for the cached data
     */
    remove(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield platformStorage_1.default.removeItem(`${CACHE_KEY_PREFIX}${key}`);
                yield this._removeKey(`${CACHE_KEY_PREFIX}${key}`);
            }
            catch (e) {
                console.error(`Error removing from offline cache for key ${key}:`, e);
            }
        });
    },
    /**
     * Clear all app cache
     */
    clearAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keys = yield this._getKeys();
                for (const key of keys) {
                    yield platformStorage_1.default.removeItem(key);
                }
                yield platformStorage_1.default.setItem(CACHE_KEYS_INDEX, JSON.stringify([]));
            }
            catch (e) {
                console.error('Error clearing all cache:', e);
            }
        });
    }
};
