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
import { checkSupabaseConnection, isValidUUID, transformToSnakeCase, sanitizePayload } from './supabaseServices';
import toast from 'react-hot-toast';

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineData {
  id: string;
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class SyncManager {
  private isSyncing = false;
  private syncListeners: ((status: { isSyncing: boolean; progress: number; total: number }) => void)[] = [];

  constructor() {
    // Escutar mudanças de conexão
    connectionManager.addListener((status) => {
      // Sincronizar automaticamente quando conexão for restabelecida
      if (status.isOnline && status.isSupabaseReachable && !this.isSyncing) {
        // Pequeno delay para evitar múltiplas sincronizações simultâneas
        setTimeout(() => {
          if (!this.isSyncing) {
            this.startSync();
          }
        }, 1000);
      }
    });

    // Sincronização automática a cada 30 segundos se conectado
    setInterval(() => {
      if (connectionManager.isConnected() && !this.isSyncing) {
        this.startSync();
      }
    }, 30000);
  }

  public async startSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 Sincronização já em andamento...');
      return;
    }

    // Verificar conexão antes de iniciar
    const connectionResult = await checkSupabaseConnection();
    if (!connectionResult.success) {
      // Silenciar logs repetitivos de sincronização
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronização de dados offline...');

    try {
      // Obter todas as operações pendentes
      const syncQueue = await getSyncQueue();
      const offlineData = await getOfflineData();
      
      const totalOperations = syncQueue.length + offlineData.filter(d => !d.synced).length;
      
      if (totalOperations === 0) {
        // Silenciar quando não há dados para sincronizar
        this.isSyncing = false;
        return;
      }

      console.log(`📊 Encontradas ${totalOperations} operações para sincronizar`);
      this.notifyListeners({ isSyncing: true, progress: 0, total: totalOperations });

      let completed = 0;

      // Processar fila de sincronização primeiro (updates/deletes)
      for (const operation of syncQueue) {
        try {
          await this.processSyncOperation(operation);
          await clearSyncOperation(operation.id);
          completed++;
          this.notifyListeners({ isSyncing: true, progress: completed, total: totalOperations });
        } catch (error) {
          console.error('❌ Falha ao sincronizar operação:', operation.id, error);
          const shouldRetry = await updateSyncRetry(operation.id);
          if (!shouldRetry) {
            completed++; // Contar operações falhadas como completas para evitar loop infinito
          }
        }
      }

      // Processar dados offline (creates)
      const unsyncedData = offlineData.filter(d => !d.synced);
      for (const data of unsyncedData) {
        try {
          await this.syncOfflineData(data);
          await clearOfflineData(data.id);
          completed++;
          this.notifyListeners({ isSyncing: true, progress: completed, total: totalOperations });
        } catch (error) {
          console.error('❌ Falha ao sincronizar dados offline:', data.id, error);
          // Para dados offline, tentaremos novamente na próxima sincronização
        }
      }

      await updateLastSyncTimestamp();
      
      if (completed > 0) {
        // Apenas mostrar toast para sincronizações manuais ou com muitos itens
        if (completed >= 5) {
          toast.success(`✅ ${completed} operação(ões) sincronizada(s) com sucesso!`);
        }
      }
      
      if (process.env.NODE_ENV === 'development' && completed > 0) {
        console.log(`✅ Sincronização concluída: ${completed} operação(ões)`);
      }
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Sync Manager');
      toast.error('❌ Erro durante sincronização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ isSyncing: false, progress: 0, total: 0 });
    }
  }

  private async processSyncOperation(operation: OfflineOperation): Promise<void> {
    console.log(`🔄 Processando operação ${operation.type} para ${operation.table}`);
    
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
        throw new Error(`Tipo de operação desconhecido: ${operation.type}`);
    }
  }

  private async syncOfflineData(data: OfflineData): Promise<void> {
    console.log(`🔄 Sincronizando dados offline ${data.table}:`, data.id);
    try {
      await this.syncCreate(data.table, data.data);
      console.log('✅ Dados offline sincronizados com sucesso:', data.id);
    } catch (error) {
      console.error('❌ Falha ao sincronizar dados offline:', data.id, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao sincronizar ${data.table}: ${errorMessage}`);
      
      throw error;
    }
  }

  private async syncCreate(table: string, data: any): Promise<void> {
    const { isOffline, ...cleanData } = data;
    
    // Limpar UUIDs para sincronização
    const uuidCleanedData = this.cleanUUIDFieldsForSync(cleanData);
    
    // Gerar novo UUID para dados offline
    if (!uuidCleanedData.id || (typeof uuidCleanedData.id === 'string' && uuidCleanedData.id.startsWith('offline-'))) {
      uuidCleanedData.id = this.generateUUID();
      console.log(`🆔 Novo UUID gerado para ${table} offline:`, uuidCleanedData.id);
    }
    
    console.log(`🔄 Sincronizando ${table} com dados limpos:`, uuidCleanedData);
    
    switch (table) {
      case 'sales':
        // Usar RPC para vendas
        const { data: saleData, error: saleError } = await supabase.rpc('create_sale', { 
          payload: transformToSnakeCase(uuidCleanedData) 
        });
        if (saleError) throw saleError;
        console.log('✅ Venda sincronizada:', saleData);
        break;
        
      default:
        // Para outras tabelas, usar insert direto
        const { error } = await supabase
          .from(table)
          .upsert([transformToSnakeCase(uuidCleanedData)], { onConflict: 'id' });
        if (error) throw error;
        console.log(`✅ ${table} sincronizado:`, cleanData.id);
        break;
    }
  }

  private async syncUpdate(table: string, data: any): Promise<void> {
    const { id, ...updateData } = data;
    
    const { error } = await supabase
      .from(table)
      .update(transformToSnakeCase(updateData))
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

  private cleanUUIDFieldsForSync(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const cleaned = { ...obj };
    
    Object.keys(cleaned).forEach(key => {
      const isUUIDField = key.endsWith('_id') || key.endsWith('Id') || key === 'id' || 
          ['customerId', 'paymentMethodId', 'saleId', 'customer_id', 'product_id', 
           'seller_id', 'employee_id', 'sale_id', 'debt_id', 'check_id', 'boleto_id', 
           'related_id', 'transaction_id', 'reference_id', 'parent_id'].includes(key);
      
      if (isUUIDField) {
        const value = cleaned[key];
        if (value === '' || value === 'null' || value === 'undefined' || !value) {
          cleaned[key] = null;
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
            cleaned[key] = null;
          } else if (trimmed.startsWith('offline-')) {
            if (key === 'id') {
              cleaned[key] = this.generateUUID();
            } else {
              cleaned[key] = null;
            }
          } else if (!isValidUUID(trimmed)) {
            console.warn(`⚠️ UUID inválido para ${key} durante sincronização:`, trimmed);
            cleaned[key] = null;
          } else {
            cleaned[key] = trimmed;
          }
        }
      }
    });
    
    // Sanitizar payment methods
    if (cleaned.paymentMethods && Array.isArray(cleaned.paymentMethods)) {
      cleaned.paymentMethods = cleaned.paymentMethods.map((method: any) => {
        const cleanedMethod = { ...method };
        Object.keys(cleanedMethod).forEach(methodKey => {
          const isMethodUUIDField = methodKey.endsWith('_id') || methodKey.endsWith('Id');
          
          if (isMethodUUIDField) {
            const methodValue = cleanedMethod[methodKey];
            if (methodValue === '' || methodValue === 'null' || methodValue === 'undefined') {
              cleanedMethod[methodKey] = null;
            } else if (typeof methodValue === 'string') {
              const trimmed = methodValue.trim();
              if (trimmed.startsWith('offline-') || trimmed.startsWith('temp-')) {
                cleanedMethod[methodKey] = null;
              } else if (trimmed && !isValidUUID(trimmed)) {
                cleanedMethod[methodKey] = null;
              } else {
                cleanedMethod[methodKey] = trimmed || null;
              }
            }
          }
        });
        return cleanedMethod;
      });
    }
    
    return cleaned;
  }
  
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores mais antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
        console.error('Erro no listener de sincronização:', error);
      }
    });
  }

  public getStatus() {
    return {
      isSyncing: this.isSyncing,
      connectionStatus: connectionManager.getStatus()
    };
  }

  public async forceSync(): Promise<void> {
    const connectionResult = await checkSupabaseConnection();
    if (connectionResult.success) {
      console.log('🔄 Sincronização forçada iniciada');
      await this.startSync();
    } else {
      console.log('❌ Sincronização forçada falhou - sem conexão');
      toast.error('❌ Não é possível sincronizar: sem conexão com o servidor');
    }
  }
}

// Instância singleton
export const syncManager = new SyncManager();