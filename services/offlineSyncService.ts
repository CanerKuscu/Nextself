import NetInfo from '@react-native-community/netinfo';
import { SupabaseService } from '@nextself/shared';
import { OfflineService } from '../utils/offlineService';

export interface MutationRecord {
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
}

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private unsubscribeNetworkListener: (() => void) | null = null;
  private handlerRegistered = false;

  private constructor() {
    this.registerHandler();
    this.setupNetworkListener();
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  private registerHandler() {
    if (this.handlerRegistered) return;
    OfflineService.getInstance().registerSyncHandler('supabase_mutation', async (operation) => {
      const mutation = operation.data as MutationRecord;
      if (!mutation?.tableName || !mutation?.operation) {
        return false;
      }
      const supabase = SupabaseService.getInstance().getClient();
      if (mutation.operation === 'INSERT') {
        const duplicate = await this.existsById(supabase, mutation.tableName, mutation.payload);
        if (duplicate) return true;
        const res = await supabase.from(mutation.tableName).insert(mutation.payload);
        return !res.error;
      }
      if (mutation.operation === 'UPDATE') {
        if (!mutation.payload?.id) return false;

        // Conflict Resolution: Optimistic Concurrency Control
        const payloadUpdatedAt = mutation.payload.updated_at || (operation.data as any)._client_updated_at;
        if (payloadUpdatedAt) {
          const { data: existingRow, error: fetchError } = await supabase
            .from(mutation.tableName)
            .select('updated_at')
            .eq('id', mutation.payload.id)
            .maybeSingle();

          if (!fetchError && existingRow?.updated_at) {
            const serverDate = new Date(existingRow.updated_at);
            const clientDate = new Date(payloadUpdatedAt);
            
            // If server has a newer timestamp, do not overwrite (skip and remove from queue)
            if (serverDate > clientDate) {
              console.warn(`[OfflineSync] Conflict detected on ${mutation.tableName} (ID: ${mutation.payload.id}). Server data is newer. Skipping update.`);
              return true; // Mark as processed to remove from queue
            }
          }
        }

        const res = await supabase.from(mutation.tableName).update(mutation.payload).eq('id', mutation.payload.id);
        return !res.error;
      }
      if (!mutation.payload?.id) return false;
      const res = await supabase.from(mutation.tableName).delete().eq('id', mutation.payload.id);
      return !res.error;
    });
    this.handlerRegistered = true;
  }

  private setupNetworkListener() {
    if (this.unsubscribeNetworkListener) return;
    this.unsubscribeNetworkListener = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncMutations();
      }
    });
  }

  public cleanup() {
    if (this.unsubscribeNetworkListener) {
      this.unsubscribeNetworkListener();
      this.unsubscribeNetworkListener = null;
    }
  }

  public queueMutation(tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
    this.registerHandler();
    OfflineService.getInstance().queueOperation('supabase_mutation', {
      tableName,
      operation,
      payload,
    });
  }

  public async syncMutations() {
    this.registerHandler();
    await OfflineService.getInstance().syncNow();
  }

  private async existsById(supabase: any, tableName: string, payload: any): Promise<boolean> {
    const rowId = payload?.id;
    if (!rowId) return false;
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', rowId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  }
}
