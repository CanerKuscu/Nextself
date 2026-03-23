import * as SecureStore from 'expo-secure-store';

// Expo SecureStore limits values to 2048 bytes.
// Supabase JWT session payloads can easily exceed this limit, leading to crashes.
// This adapter chunks the string into 2000-byte segments.
const CHUNK_SIZE = 2000;

export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Fetch the master manifest/count
      const chunkCountStr = await SecureStore.getItemAsync(key);
      if (!chunkCountStr) return null;
      
      const chunkCount = parseInt(chunkCountStr, 10);
      if (isNaN(chunkCount)) {
        // Fallback for legacy un-chunked data
        return chunkCountStr;
      }
      
      let fullString = '';
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (chunk) {
          fullString += chunk;
        }
      }
      return fullString || null;
    } catch (e) {
      console.warn('SecureStoreAdapter getItem Error:', e);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        // Fast path for small values
        await SecureStore.setItemAsync(key, value);
        return;
      }
      
      const chunks = Math.ceil(value.length / CHUNK_SIZE);
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
      
      if (chunkCountStr) {
        const chunkCount = parseInt(chunkCountStr, 10);
        if (!isNaN(chunkCount)) {
          for (let i = 0; i < chunkCount; i++) {
            await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
          }
        }
      }
    } catch (e) {
      console.warn('SecureStoreAdapter removeItem Error:', e);
    }
  }
};
