import { getOfflineData, saveOffline, clearOfflineData } from './offlineStorage';
import { connectionManager } from './connectionManager';
import toast from 'react-hot-toast';

// Offline data manager object
export const offlineDataManager = {
  async storeData(table: string, data: any): Promise<void> {
    try {
      // Only clear existing data if we're storing fresh online data
      // Don't clear when storing new offline records
      if (!data.isOffline) {
        const existingData = await getOfflineData(table);
        for (const item of existingData) {
          if (item.synced) {
            await clearOfflineData(item.id);
          }
        }
      }
      
      // Store new data
      if (Array.isArray(data)) {
        for (const item of data) {
          // Only store if not already exists
          const existing = await getOfflineData(table);
          const alreadyExists = existing.some(existingItem => 
            existingItem.data.id === item.id ||
            (item.client && existingItem.data.client === item.client && 
             existingItem.data.date === item.date &&
             Math.abs((existingItem.data.totalValue || 0) - (item.totalValue || 0)) < 0.01)
          );
          
          if (!alreadyExists) {
            await saveOffline(table, item);
          }
        }
      } else if (data) {
        await saveOffline(table, data);
      }
    } catch (error) {
      console.error(`Error storing data for ${table}:`, error);
      throw error;
    }
  },

  async getData(table: string): Promise<any> {
    try {
      const offlineDataItems = await getOfflineData(table);
      
      if (offlineDataItems.length === 0) {
        return table === 'cashBalance' ? null : [];
      }
      
      // For single object tables like cashBalance, return the object directly
      if (table === 'cashBalance') {
        return offlineDataItems[0]?.data || null;
      }
      
      // For array tables, return array of data
      return offlineDataItems.map(item => item.data);
    } catch (error) {
      console.error(`Error getting data for ${table}:`, error);
      return table === 'cashBalance' ? null : [];
    }
  }
};

// Merge online and offline data intelligently
export function mergeOnlineOfflineData<T extends { id: string; createdAt?: string }>(
  onlineData: T[], 
  offlineData: T[]
): T[] {
  const merged = [...onlineData];
  
  // Add offline data that doesn't exist online
  offlineData.forEach(offlineItem => {
    const existsOnline = onlineData.some(onlineItem => 
      onlineItem.id === offlineItem.id || 
      // Check for potential duplicates by comparing key fields
      (onlineItem.client === offlineItem.client && 
       onlineItem.date === offlineItem.date &&
       Math.abs(onlineItem.totalValue - offlineItem.totalValue) < 0.01)
    );
    
    if (!existsOnline) {
      merged.push({
        ...offlineItem,
        isOffline: true // Mark as offline for UI indication
      } as T & { isOffline: boolean });
    }
  });
  
  return merged.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || 0);
    const dateB = new Date(b.createdAt || b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });
}

// Get combined data for a specific table
export async function getCombinedData<T extends { id: string }>(
  tableName: string,
  onlineData: T[]
): Promise<T[]> {
  try {
    const offlineDataItems = await getOfflineData(tableName);
    const offlineData = offlineDataItems.map(item => item.data);
    
    return mergeOnlineOfflineData(onlineData, offlineData);
  } catch (error) {
    console.error(`Error getting combined data for ${tableName}:`, error);
    return onlineData;
  }
}

// Clean up synced offline data
export async function cleanupSyncedData(): Promise<void> {
  try {
    const allOfflineData = await getOfflineData();
    
    for (const item of allOfflineData) {
      if (item.synced) {
        await clearOfflineData(item.id);
      }
    }
    
    console.log('🧹 Cleaned up synced offline data');
  } catch (error) {
    console.error('Error cleaning up synced data:', error);
  }
}

// Show offline data indicator
export function showOfflineDataToast(count: number) {
  if (count > 0) {
    toast(`📱 ${count} registro(s) salvos offline`, {
      icon: '💾',
      duration: 3000,
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd'
      }
    });
  }
}

// Validate offline data integrity
export async function validateOfflineData(): Promise<{
  valid: number;
  invalid: number;
  errors: string[];
}> {
  const allOfflineData = await getOfflineData();
  let valid = 0;
  let invalid = 0;
  const errors: string[] = [];
  
  for (const item of allOfflineData) {
    try {
      // Basic validation
      if (!item.data || !item.table || !item.id) {
        invalid++;
        errors.push(`Invalid offline item: ${item.id}`);
        continue;
      }
      
      // Table-specific validation
      switch (item.table) {
        case 'sales':
          if (!item.data.client || !item.data.totalValue || !item.data.paymentMethods) {
            invalid++;
            errors.push(`Invalid sale data: ${item.id}`);
            continue;
          }
          break;
        case 'employees':
          if (!item.data.name || !item.data.position) {
            invalid++;
            errors.push(`Invalid employee data: ${item.id}`);
            continue;
          }
          break;
        // Add more validations as needed
      }
      
      valid++;
    } catch (error) {
      invalid++;
      errors.push(`Validation error for ${item.id}: ${error.message}`);
    }
  }
  
  return { valid, invalid, errors };
}