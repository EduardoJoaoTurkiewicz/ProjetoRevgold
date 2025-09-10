import { 
  getSyncQueue, 
  clearSyncOperation, 
  updateSyncRetry, 
  getOfflineData, 
  clearOfflineData,
  updateLastSyncTimestamp,
  addToSyncQueue
} from './offlineStorage';
import { connectionManager } from './connectionManager';
import { supabase } from './supabase';
import { ErrorHandler } from './errorHandler';
import toast from 'react-hot-toast';

class SyncManager {
  private isSyncing = false;
  private syncListeners: ((status: { isSyncing: boolean; progress: number; total: number }) => void)[] = [];

  constructor() {
    // Listen for connection changes
    connectionManager.addListener((status) => {
      if (status.isOnline && status.isSupabaseReachable && !this.isSyncing) {
        this.startSync();
      }
    });
  }

  public async startSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting offline data synchronization...');

    try {
      // Get all pending operations
      const syncQueue = await getSyncQueue();
      const offlineData = await getOfflineData();
      
      const totalOperations = syncQueue.length + offlineData.filter(d => !d.synced).length;
      
      if (totalOperations === 0) {
        console.log('✅ No offline data to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`📊 Found ${totalOperations} operations to sync`);
      this.notifyListeners({ isSyncing: true, progress: 0, total: totalOperations });

      let completed = 0;

      // Process sync queue first (updates/deletes)
      for (const operation of syncQueue) {
        try {
          await this.processSyncOperation(operation);
          await clearSyncOperation(operation.id);
          completed++;
          this.notifyListeners({ isSyncing: true, progress: completed, total: totalOperations });
        } catch (error) {
          console.error('❌ Failed to sync operation:', operation.id, error);
          const shouldRetry = await updateSyncRetry(operation.id);
          if (!shouldRetry) {
            completed++; // Count failed operations as completed to avoid infinite loop
          }
        }
      }

      // Process offline data (creates)
      const unsyncedData = offlineData.filter(d => !d.synced);
      for (const data of unsyncedData) {
        try {
          await this.syncOfflineData(data);
          await clearOfflineData(data.id);
          completed++;
          this.notifyListeners({ isSyncing: true, progress: completed, total: totalOperations });
        } catch (error) {
          console.error('❌ Failed to sync offline data:', data.id, error);
          // For offline data, we'll retry on next sync
        }
      }

      await updateLastSyncTimestamp();
      
      if (completed > 0) {
        toast.success(`✅ ${completed} operação(ões) sincronizada(s) com sucesso!`);
      }
      
      console.log('✅ Sync completed successfully');
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Sync Manager');
      toast.error('❌ Erro durante sincronização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ isSyncing: false, progress: 0, total: 0 });
    }
  }

  private async processSyncOperation(operation: OfflineOperation): Promise<void> {
    console.log(`🔄 Processing ${operation.type} operation for ${operation.table}`);
    
    switch (operation.type) {
      case 'create':
        await this.syncCreate(operation.table, operation.data);
        break;
      case 'update':
        await this.syncUpdate(operation.table, operation.data);
        break;
      case 'delete':
        await this.syncDelete(operation.table, operation.data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async syncOfflineData(data: OfflineData): Promise<void> {
    console.log(`🔄 Syncing offline ${data.table} data:`, data.id);
    await this.syncCreate(data.table, data.data);
  }

  private async syncCreate(table: string, data: any): Promise<void> {
    // Remove offline ID and add proper data
    const { id: offlineId, ...cleanData } = data;
    
    switch (table) {
      case 'sales':
        const { data: saleData, error: saleError } = await supabase.rpc('create_sale', { 
          payload: this.transformToSnakeCase(cleanData) 
        });
        if (saleError) throw saleError;
        console.log('✅ Sale synced:', saleData);
        break;
        
      case 'employees':
        const { error: empError } = await supabase
          .from('employees')
          .insert([this.transformToSnakeCase(cleanData)]);
        if (empError) throw empError;
        break;
        
      case 'debts':
        const { error: debtError } = await supabase
          .from('debts')
          .insert([this.transformToSnakeCase(cleanData)]);
        if (debtError) throw debtError;
        break;
        
      case 'checks':
        const { error: checkError } = await supabase
          .from('checks')
          .insert([this.transformToSnakeCase(cleanData)]);
        if (checkError) throw checkError;
        break;
        
      case 'boletos':
        const { error: boletoError } = await supabase
          .from('boletos')
          .insert([this.transformToSnakeCase(cleanData)]);
        if (boletoError) throw boletoError;
        break;
        
      default:
        throw new Error(`Unknown table for sync: ${table}`);
    }
  }

  private async syncUpdate(table: string, data: any): Promise<void> {
    const { id, ...updateData } = data;
    
    const { error } = await supabase
      .from(table)
      .update(this.transformToSnakeCase(updateData))
      .eq('id', id);
      
    if (error) throw error;
  }

  private async syncDelete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }

  private transformToSnakeCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformToSnakeCase(item));
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[snakeKey] = this.transformToSnakeCase(value);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map(item => 
          typeof item === 'object' ? this.transformToSnakeCase(item) : item
        );
      } else {
        result[snakeKey] = value;
      }
    }
    
    return result;
  }

  public addSyncListener(listener: (status: { isSyncing: boolean; progress: number; total: number }) => void): () => void {
    this.syncListeners.push(listener);
    
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(status: { isSyncing: boolean; progress: number; total: number }) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  public getStatus() {
    return {
      isSyncing: this.isSyncing,
      connectionStatus: connectionManager.getStatus()
    };
  }

  public async forcSync(): Promise<void> {
    if (connectionManager.isConnected()) {
      await this.startSync();
    } else {
      toast.error('❌ Não é possível sincronizar: sem conexão com o servidor');
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();