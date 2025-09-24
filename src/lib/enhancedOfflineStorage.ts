// Enhanced offline storage with UUID management and deduplication

import localforage from 'localforage';
import { UUIDManager } from './uuidManager';
import { DeduplicationService } from './deduplicationService';

// Configure enhanced offline storage
export const enhancedOfflineDB = localforage.createInstance({
  name: 'revgold-enhanced-offline',
  storeName: 'enhanced_offline_data',
  description: 'RevGold enhanced offline data storage with deduplication'
});

export const enhancedSyncQueueDB = localforage.createInstance({
  name: 'revgold-enhanced-sync',
  storeName: 'enhanced_sync_queue',
  description: 'RevGold enhanced sync queue'
});

export interface EnhancedOfflineData {
  id: string;
  realId?: string; // The actual UUID used in Supabase
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
  isOffline: boolean;
  hash: string; // Hash for duplicate detection
}

export interface EnhancedOfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  hash: string;
}

// Generate hash for duplicate detection
function generateDataHash(table: string, data: any): string {
  let hashString = '';
  
  switch (table) {
    case 'sales':
      hashString = `${data.client}-${data.date}-${data.totalValue}`;
      break;
    case 'debts':
      hashString = `${data.company}-${data.date}-${data.totalValue}`;
      break;
    case 'employees':
      hashString = `${data.name}-${data.position}`;
      break;
    default:
      hashString = `${data.id || ''}-${JSON.stringify(data)}`;
      break;
  }
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Enhanced save offline with deduplication
export async function saveOfflineEnhanced(table: string, data: any): Promise<string> {
  // Generate hash for duplicate detection
  const hash = generateDataHash(table, data);
  
  // Check if this data already exists offline
  const existingData = await getOfflineDataEnhanced(table);
  const duplicate = existingData.find(item => item.hash === hash);
  
  if (duplicate) {
    console.log('⚠️ Data already exists offline, returning existing ID:', duplicate.id);
    return duplicate.id;
  }

  // Generate proper ID
  let recordId = data.id;
  if (!recordId || !UUIDManager.isValidUUID(recordId)) {
    recordId = UUIDManager.generateOfflineId();
  }

  const enhancedOfflineData: EnhancedOfflineData = {
    id: recordId,
    table,
    data: { ...data, id: recordId },
    timestamp: Date.now(),
    synced: false,
    isOffline: true,
    hash
  };
  
  await enhancedOfflineDB.setItem(recordId, enhancedOfflineData);
  console.log('💾 Enhanced data saved offline:', { table, id: recordId, hash });
  
  return recordId;
}

// Enhanced get offline data with deduplication
export async function getOfflineDataEnhanced(table?: string): Promise<EnhancedOfflineData[]> {
  const items: EnhancedOfflineData[] = [];
  
  await enhancedOfflineDB.iterate((value: EnhancedOfflineData, key) => {
    if (!table || value.table === table) {
      items.push(value);
    }
  });
  
  // Remove duplicates by hash
  const uniqueItems = DeduplicationService.removeDuplicatesByLogic(
    items,
    item => item.hash
  );
  
  return uniqueItems.sort((a, b) => b.timestamp - a.timestamp);
}

// Enhanced add to sync queue with deduplication
export async function addToSyncQueueEnhanced(
  operation: Omit<EnhancedOfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'hash'>
): Promise<void> {
  const hash = generateDataHash(operation.table, operation.data);
  
  // Check if this operation already exists in queue
  const existingOperations = await getSyncQueueEnhanced();
  const duplicate = existingOperations.find(op => 
    op.hash === hash && op.type === operation.type && op.table === operation.table
  );
  
  if (duplicate) {
    console.log('⚠️ Operation already in sync queue, skipping:', hash);
    return;
  }

  const id = `sync-${Date.now()}-${UUIDManager.generateUUID()}`;
  const syncOperation: EnhancedOfflineOperation = {
    ...operation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: operation.maxRetries || 3,
    hash
  };
  
  await enhancedSyncQueueDB.setItem(id, syncOperation);
  console.log('📋 Enhanced operation added to sync queue:', { type: operation.type, table: operation.table, hash });
}

// Get enhanced sync queue
export async function getSyncQueueEnhanced(): Promise<EnhancedOfflineOperation[]> {
  const operations: EnhancedOfflineOperation[] = [];
  
  await enhancedSyncQueueDB.iterate((value: EnhancedOfflineOperation, key) => {
    operations.push(value);
  });
  
  // Remove duplicates by hash
  const uniqueOperations = DeduplicationService.removeDuplicatesByLogic(
    operations,
    op => `${op.type}-${op.table}-${op.hash}`
  );
  
  return uniqueOperations.sort((a, b) => a.timestamp - b.timestamp);
}

// Clear enhanced offline data
export async function clearOfflineDataEnhanced(id: string): Promise<void> {
  await enhancedOfflineDB.removeItem(id);
  console.log('🗑️ Enhanced offline data cleared:', id);
}

// Clear enhanced sync operation
export async function clearSyncOperationEnhanced(id: string): Promise<void> {
  await enhancedSyncQueueDB.removeItem(id);
  console.log('✅ Enhanced sync operation completed:', id);
}

// Get enhanced offline statistics
export async function getOfflineStatsEnhanced(): Promise<{
  offlineCount: number;
  syncQueueCount: number;
  lastSync: number | null;
  duplicatesRemoved: number;
}> {
  const offlineData = await getOfflineDataEnhanced();
  const syncQueue = await getSyncQueueEnhanced();
  
  const lastSyncTimestamp = await localforage.getItem<number>('last-sync-timestamp');
  const duplicatesRemoved = await localforage.getItem<number>('duplicates-removed') || 0;
  
  return {
    offlineCount: offlineData.length,
    syncQueueCount: syncQueue.length,
    lastSync: lastSyncTimestamp,
    duplicatesRemoved
  };
}

// Merge online and offline data with enhanced deduplication
export function mergeOnlineOfflineDataEnhanced<T extends { id: string }>(
  onlineData: T[], 
  offlineData: T[]
): T[] {
  console.log(`🔄 Merging data: ${onlineData.length} online + ${offlineData.length} offline`);
  
  // Remove duplicates from each dataset first
  const uniqueOnlineData = DeduplicationService.removeDuplicatesById(onlineData);
  const uniqueOfflineData = DeduplicationService.removeDuplicatesById(offlineData);
  
  // Merge datasets
  const merged = DeduplicationService.mergeArrays(uniqueOnlineData, uniqueOfflineData);
  
  console.log(`✅ Merged result: ${merged.length} unique records`);
  return merged;
}

// Clear all enhanced offline data
export async function clearAllOfflineDataEnhanced(): Promise<void> {
  await enhancedOfflineDB.clear();
  await enhancedSyncQueueDB.clear();
  await localforage.removeItem('last-sync-timestamp');
  await localforage.removeItem('duplicates-removed');
  console.log('🧹 All enhanced offline data cleared');
}