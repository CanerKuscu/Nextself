import * as SecureStore from 'expo-secure-store';

// Expo SecureStore limits values to 2048 bytes.
// Supabase JWT session payloads can easily exceed this limit, leading to crashes.
// This adapter chunks the string into 2000-byte segments.
const CHUNK_SIZE = 2000;

const getChunkCount = (value: string | null): number | null => {
  if (!value || !/^\d+$/.test(value)) return null;
  const count = Number.parseInt(value, 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
};

const removeStoredChunks = async (key: string, count: number) => {
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
  }
};

export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const chunkCountStr = await SecureStore.getItemAsync(key);
      if (!chunkCountStr) return null;

      const chunkCount = getChunkCount(chunkCountStr);
      if (!chunkCount) {
        return chunkCountStr;
      }

      let fullString = '';
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (!chunk) {
          return null;
        }
        fullString += chunk;
      }
      return fullString || null;
    } catch (e) {
      console.warn('SecureStoreAdapter getItem Error:', e);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const previousRaw = await SecureStore.getItemAsync(key);
      const previousChunkCount = getChunkCount(previousRaw);

      if (value.length <= CHUNK_SIZE) {
        if (previousChunkCount) {
          await removeStoredChunks(key, previousChunkCount);
        }
        await SecureStore.setItemAsync(key, value);
        return;
      }

      const chunks = Math.ceil(value.length / CHUNK_SIZE);
      if (previousChunkCount) {
        await removeStoredChunks(key, previousChunkCount);
      }
      await SecureStore.setItemAsync(key, chunks.toString());

      for (let i = 0; i < chunks; i++) {
        const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
      }
    } catch (e) {
      console.warn('SecureStoreAdapter setItem Error:', e);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      const chunkCountStr = await SecureStore.getItemAsync(key);
      await SecureStore.deleteItemAsync(key);

      const chunkCount = getChunkCount(chunkCountStr);
      if (chunkCount) {
        await removeStoredChunks(key, chunkCount);
      }
    } catch (e) {
      console.warn('SecureStoreAdapter removeItem Error:', e);
    }
  }
};
