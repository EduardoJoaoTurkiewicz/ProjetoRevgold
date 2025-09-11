import localforage from 'localforage';
// Use crypto.randomUUID() for better UUID generation
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configure offline storage
export const offlineDB = localforage.createInstance({
  name: 'revgold-offline',
  storeName: 'offline_data',
  description: 'RevGold offline data storage'
});

export const syncQueueDB = localforage.createInstance({
  name: 'revgold-sync',
  storeName: 'sync_queue',
  description: 'RevGold sync queue for offline operations'
});

// Types for offline operations
export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineData {
  id: string;
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
  isOffline: boolean;
}

// Save data offline
export async function saveOffline(table: string, data: any): Promise<string> {
  // Generate a proper offline ID that won't conflict with UUIDs
  const id = `offline-${Date.now()}-${generateUUID()}`;
  const offlineData: OfflineData = {
    id,
    table,
    data: { ...data, id, isOffline: true },
    timestamp: Date.now(),
    synced: false,
    isOffline: true
  };
  
  await offlineDB.setItem(id, offlineData);
  console.log('💾 Data saved offline:', { table, id });
  return id;
}

// Add operation to sync queue
export async function addToSyncQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  const id = `sync-${Date.now()}-${generateUUID()}`;
  const syncOperation: OfflineOperation = {
    ...operation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: operation.maxRetries || 3
  };
  
  await syncQueueDB.setItem(id, syncOperation);
  console.log('📋 Operation added to sync queue:', { type: operation.type, table: operation.table });
}

// Get all offline data for a table
export async function getOfflineData(table?: string): Promise<OfflineData[]> {
  const items: OfflineData[] = [];
  
  await offlineDB.iterate((value: OfflineData, key) => {
    if (!table || value.table === table) {
      items.push(value);
    }
  });
  
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

// Get all pending sync operations
export async function getSyncQueue(): Promise<OfflineOperation[]> {
  const operations: OfflineOperation[] = [];
  
  await syncQueueDB.iterate((value: OfflineOperation, key) => {
    operations.push(value);
  });
  
  return operations.sort((a, b) => a.timestamp - b.timestamp);
}

// Clear offline data after successful sync
export async function clearOfflineData(id: string): Promise<void> {
  await offlineDB.removeItem(id);
  console.log('🗑️ Offline data cleared:', id);
}

// Clear sync operation after completion
export async function clearSyncOperation(id: string): Promise<void> {
  await syncQueueDB.removeItem(id);
  console.log('✅ Sync operation completed:', id);
}

// Update retry count for failed sync
export async function updateSyncRetry(id: string): Promise<boolean> {
  const operation = await syncQueueDB.getItem<OfflineOperation>(id);
  if (!operation) return false;
  
  operation.retryCount += 1;
  
  if (operation.retryCount >= operation.maxRetries) {
    console.error('❌ Max retries reached for sync operation:', id);
    await clearSyncOperation(id);
    return false;
  }
  
  await syncQueueDB.setItem(id, operation);
  console.log(`🔄 Retry count updated: ${operation.retryCount}/${operation.maxRetries}`);
  return true;
}

// Get offline statistics
export async function getOfflineStats(): Promise<{
  offlineCount: number;
  syncQueueCount: number;
  lastSync: number | null;
}> {
  const offlineData = await getOfflineData();
  const syncQueue = await getSyncQueue();
  
  const lastSyncTimestamp = await localforage.getItem<number>('last-sync-timestamp');
  
  return {
    offlineCount: offlineData.length,
    syncQueueCount: syncQueue.length,
    lastSync: lastSyncTimestamp
  };
}

// Update last sync timestamp
export async function updateLastSyncTimestamp(): Promise<void> {
  await localforage.setItem('last-sync-timestamp', Date.now());
}

// Clear all offline data (for debugging)
export async function clearAllOfflineData(): Promise<void> {
  await offlineDB.clear();
  await syncQueueDB.clear();
  await localforage.removeItem('last-sync-timestamp');
  console.log('🧹 All offline data cleared');
}