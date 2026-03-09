import PlatformStorage from '../utils/platformStorage';

const CACHE_KEY_PREFIX = '@biosync_cache_';
const CACHE_KEYS_INDEX = '@biosync_cache_keys_index';

export const offlineCache = {
    /**
     * Internal: Get all registered keys
     */
    async _getKeys(): Promise<string[]> {
        try {
            const keysStr = await PlatformStorage.getItem(CACHE_KEYS_INDEX);
            return keysStr ? JSON.parse(keysStr) : [];
        } catch {
            return [];
        }
    },

    /**
     * Internal: Add a key to the registry
     */
    async _addKey(key: string): Promise<void> {
        try {
            const keys = await this._getKeys();
            if (!keys.includes(key)) {
                keys.push(key);
                await PlatformStorage.setItem(CACHE_KEYS_INDEX, JSON.stringify(keys));
            }
        } catch (e) {
            console.error('Error adding key to index:', e);
        }
    },

    /**
    * Internal: Remove a key from the registry
    */
    async _removeKey(key: string): Promise<void> {
        try {
            let keys = await this._getKeys();
            keys = keys.filter(k => k !== key);
            await PlatformStorage.setItem(CACHE_KEYS_INDEX, JSON.stringify(keys));
        } catch (e) {
            console.error('Error removing key from index:', e);
        }
    },

    /**
     * Save data to offline cache
     * @param key Unique identifier for the cached data
     * @param data The data to stringify and store
     */
    async set<T>(key: string, data: T): Promise<void> {
        try {
            const jsonValue = JSON.stringify(data);
            await PlatformStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, jsonValue);
            await this._addKey(`${CACHE_KEY_PREFIX}${key}`);
        } catch (e) {
            console.error(`Error saving to offline cache for key ${key}:`, e);
        }
    },

    /**
     * Retrieve data from offline cache
     * @param key Unique identifier for the cached data
     * @returns Parsed data or null if not found
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const jsonValue = await PlatformStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error(`Error reading from offline cache for key ${key}:`, e);
            return null;
        }
    },

    /**
     * Remove specific data from offline cache
     * @param key Unique identifier for the cached data
     */
    async remove(key: string): Promise<void> {
        try {
            await PlatformStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
            await this._removeKey(`${CACHE_KEY_PREFIX}${key}`);
        } catch (e) {
            console.error(`Error removing from offline cache for key ${key}:`, e);
        }
    },

    /**
     * Clear all app cache
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await this._getKeys();
            for (const key of keys) {
                await PlatformStorage.removeItem(key);
            }
            await PlatformStorage.setItem(CACHE_KEYS_INDEX, JSON.stringify([]));
        } catch (e) {
            console.error('Error clearing all cache:', e);
        }
    }
};
