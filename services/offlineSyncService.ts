import NetInfo from '@react-native-community/netinfo';
import { SupabaseService } from '@nextself/shared';
import { OfflineService } from '../utils/offlineService';

export interface MutationRecord {
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
}

/**
 * Process a single offline mutation against the given Supabase client.
 *
 * Exported so it can be unit-tested without spinning up the full OfflineSyncService
 * + OfflineService + NetInfo singleton chain.
 *
 * Returns true if the queue entry should be removed (success OR known no-op),
 * false to retry later.
 */
export async function processOfflineMutation(
  supabase: any,
  mutation: MutationRecord,
  options?: { existsById?: (supabase: any, tableName: string, payload: any) => Promise<boolean>; clientUpdatedAt?: string },
): Promise<boolean> {
  if (!mutation?.tableName || !mutation?.operation) {
    return false;
  }
  if (mutation.operation === 'INSERT') {
    const existsCheck = options?.existsById ?? defaultExistsById;
    const duplicate = await existsCheck(supabase, mutation.tableName, mutation.payload);
    if (duplicate) return true;
    const res = await supabase.from(mutation.tableName).insert(mutation.payload);
    return !res.error;
  }
  if (mutation.operation === 'UPDATE') {
    if (!mutation.payload?.id) return false;

    // Conflict Resolution: Optimistic Concurrency Control
    const payloadUpdatedAt = mutation.payload.updated_at || options?.clientUpdatedAt;
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
  if (mutation.operation === 'DELETE') {
    if (!mutation.payload?.id) return false;
    const res = await supabase.from(mutation.tableName).delete().eq('id', mutation.payload.id);
    return !res.error;
  }
  // Unknown operation — previously fell through to a DELETE which silently
  // destroyed rows on any malformed queue entry. Refuse instead.
  console.warn(`[OfflineSync] Refusing to process unknown operation: ${String(mutation.operation)}`);
  return false;
}

async function defaultExistsById(supabase: any, tableName: string, payload: any): Promise<boolean> {
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
      const supabase = SupabaseService.getInstance().getClient();
      return processOfflineMutation(supabase, mutation, {
        existsById: (s, t, p) => this.existsById(s, t, p),
        clientUpdatedAt: (operation.data as any)?._client_updated_at,
      });
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
