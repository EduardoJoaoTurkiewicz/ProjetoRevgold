// Enhanced sync manager with robust deduplication and UUID handling

import { 
  getSyncQueue, 
  clearSyncOperation, 
  updateSyncRetry, 
  getOfflineData, 
  clearOfflineData,
  updateLastSyncTimestamp
} from './offlineStorage';
import { connectionManager } from './connectionManager';
import { supabase } from './supabase';
import { UUIDManager } from './uuidManager';
import { DeduplicationService } from './deduplicationService';
import { transformToSnakeCase } from '../utils/numberUtils';
import toast from 'react-hot-toast';

interface SyncStatus {
  isSyncing: boolean;
  progress: number;
  total: number;
  currentOperation?: string;
}

class EnhancedSyncManager {
  private isSyncing = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private syncPromise: Promise<void> | null = null;

  constructor() {
    // Listen for connection changes
    connectionManager.addListener((status) => {
      if (status.isOnline && status.isSupabaseReachable && !this.isSyncing) {
        // Auto-sync when connection is restored (with debounce)
        this.debouncedSync();
      }
    });

    // Auto-sync every 30 seconds if connected
    setInterval(() => {
      if (connectionManager.isConnected() && !this.isSyncing) {
        this.startSync();
      }
    }, 30000);
  }

  private debouncedSync = (() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!this.isSyncing) {
          this.startSync();
        }
      }, 2000);
    };
  })();

  public async startSync(): Promise<void> {
    // If already syncing, wait for current sync to complete
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.performSync();
    
    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  private async performSync(): Promise<void> {
    if (this.isSyncing) return;

    // Check connection first
    if (!connectionManager.isConnected()) {
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting enhanced sync with deduplication...');

    try {
      // Get all pending operations
      const syncQueue = await getSyncQueue();
      const offlineData = await getOfflineData();
      
      const unsyncedOfflineData = offlineData.filter(d => !d.synced);
      const totalOperations = syncQueue.length + unsyncedOfflineData.length;
      
      if (totalOperations === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`📊 Found ${totalOperations} operations to sync`);
      this.notifyListeners({ 
        isSyncing: true, 
        progress: 0, 
        total: totalOperations,
        currentOperation: 'Starting sync...'
      });

      let completed = 0;

      // Process sync queue first (updates/deletes)
      for (const operation of syncQueue) {
        try {
          this.notifyListeners({ 
            isSyncing: true, 
            progress: completed, 
            total: totalOperations,
            currentOperation: `${operation.type} ${operation.table}`
          });

          await this.processSyncOperation(operation);
          await clearSyncOperation(operation.id);
          completed++;
        } catch (error) {
          console.error('❌ Failed to sync operation:', operation.id, error);
          const shouldRetry = await updateSyncRetry(operation.id);
          if (!shouldRetry) {
            completed++; // Count failed operations as completed to avoid infinite loop
          }
        }
      }

      // Process offline data (creates) with enhanced deduplication
      for (const data of unsyncedOfflineData) {
        try {
          this.notifyListeners({ 
            isSyncing: true, 
            progress: completed, 
            total: totalOperations,
            currentOperation: `Syncing ${data.table}`
          });

          await this.syncOfflineDataWithDeduplication(data);
          await clearOfflineData(data.id);
          completed++;
        } catch (error) {
          console.error('❌ Failed to sync offline data:', data.id, error);
          // Don't clear failed offline data - will retry next time
        }
      }

      await updateLastSyncTimestamp();
      
      if (completed > 0) {
        console.log(`✅ Enhanced sync completed: ${completed} operation(s)`);
        
        // Only show toast for significant syncs
        if (completed >= 3) {
          toast.success(`✅ ${completed} operação(ões) sincronizada(s)!`);
        }
      }
    } catch (error) {
      console.error('❌ Error during enhanced sync:', error);
      toast.error('❌ Erro durante sincronização');
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ 
        isSyncing: false, 
        progress: 0, 
        total: 0 
      });
    }
  }

  private async syncOfflineDataWithDeduplication(data: any): Promise<void> {
    const { table, data: recordData } = data;
    
    console.log(`🔄 Syncing ${table} with enhanced deduplication:`, recordData.id);

    // Clean the data and assign proper UUID
    const cleanedData = UUIDManager.cleanObjectUUIDs(recordData);
    
    // Generate new UUID for offline records
    if (!cleanedData.id || UUIDManager.isOfflineId(cleanedData.id)) {
      const newId = UUIDManager.generateUUID();
      if (UUIDManager.isOfflineId(cleanedData.id)) {
        UUIDManager.mapOfflineToReal(cleanedData.id, newId);
      }
      cleanedData.id = newId;
    }

    // Check for duplicates based on table type
    let duplicateCheck: any = { isDuplicate: false };
    
    switch (table) {
      case 'sales':
        duplicateCheck = await DeduplicationService.checkSaleDuplicate(cleanedData);
        break;
      case 'debts':
        duplicateCheck = await DeduplicationService.checkDebtDuplicate(cleanedData);
        break;
      case 'employees':
        duplicateCheck = await DeduplicationService.checkEmployeeDuplicate(cleanedData);
        break;
      default:
        // For other tables, use generic check
        const uniqueFields = this.getUniqueFieldsForTable(table);
        duplicateCheck = await DeduplicationService.checkGenericDuplicate(
          table, 
          cleanedData, 
          uniqueFields
        );
        break;
    }

    if (duplicateCheck.isDuplicate) {
      console.log(`⚠️ Duplicate ${table} detected, skipping sync:`, duplicateCheck.reason);
      return;
    }

    // Proceed with sync
    await this.insertRecord(table, cleanedData);
    console.log(`✅ ${table} synced successfully:`, cleanedData.id);
  }

  private async insertRecord(table: string, data: any): Promise<void> {
    const supabaseTableName = this.getSupabaseTableName(table);
    
    // Special handling for sales using RPC
    if (table === 'sales') {
      const { data: saleId, error } = await supabase.rpc('create_sale', { 
        payload: transformToSnakeCase(data) 
      });
      
      if (error) throw error;
      
      // Map the offline ID to the real ID
      if (UUIDManager.isOfflineId(data.id)) {
        UUIDManager.mapOfflineToReal(data.id, saleId);
      }
      
      return;
    }

    // For other tables, use direct insert with upsert
    const { error } = await supabase
      .from(supabaseTableName)
      .upsert([transformToSnakeCase(data)], { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });
      
    if (error) throw error;
  }

  private async processSyncOperation(operation: any): Promise<void> {
    const supabaseTableName = this.getSupabaseTableName(operation.table);
    
    switch (operation.type) {
      case 'create':
        await this.insertRecord(operation.table, operation.data);
        break;
      case 'update':
        const { id, ...updateData } = operation.data;
        const cleanedUpdateData = UUIDManager.cleanObjectUUIDs(updateData);
        
        const { error: updateError } = await supabase
          .from(supabaseTableName)
          .update(transformToSnakeCase(cleanedUpdateData))
          .eq('id', id);
          
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from(supabaseTableName)
          .delete()
          .eq('id', operation.data.id);
          
        if (deleteError) throw deleteError;
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private getSupabaseTableName(tableName: string): string {
    const tableNameMap: Record<string, string> = {
      'cashBalance': 'cash_balances',
      'cashTransactions': 'cash_transactions',
      'employeePayments': 'employee_payments',
      'employeeAdvances': 'employee_advances',
      'employeeOvertimes': 'employee_overtimes',
      'employeeCommissions': 'employee_commissions',
      'pixFees': 'pix_fees',
      'agendaEvents': 'agenda_events'
    };
    
    return tableNameMap[tableName] || tableName;
  }

  private getUniqueFieldsForTable(table: string): string[] {
    const uniqueFieldsMap: Record<string, string[]> = {
      'checks': ['client', 'due_date', 'value'],
      'boletos': ['client', 'due_date', 'value'],
      'cash_transactions': ['date', 'description', 'amount'],
      'employee_payments': ['employee_id', 'payment_date', 'amount'],
      'employee_advances': ['employee_id', 'date', 'amount'],
      'employee_overtimes': ['employee_id', 'date', 'hours'],
      'pix_fees': ['date', 'bank', 'amount'],
      'taxes': ['date', 'tax_type', 'amount'],
      'agenda_events': ['title', 'date', 'time'],
      'acertos': ['client_name', 'total_amount']
    };
    
    return uniqueFieldsMap[table] || ['id'];
  }

  public addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  public async forceSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 Sync already in progress, waiting...');
      if (this.syncPromise) {
        await this.syncPromise;
      }
      return;
    }

    if (!connectionManager.isConnected()) {
      toast.error('❌ Não é possível sincronizar: sem conexão com o servidor');
      return;
    }

    console.log('🔄 Force sync initiated');
    await this.startSync();
  }

  public getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      progress: 0,
      total: 0
    };
  }
}

// Singleton instance
export const enhancedSyncManager = new EnhancedSyncManager();