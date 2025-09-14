import { supabase, isSupabaseConfigured, healthCheck } from './supabase';
import { connectionManager } from './connectionManager';
import { saveOffline, addToSyncQueue } from './offlineStorage';
import { ErrorHandler } from './errorHandler';
import type { 
  Sale, 
  Employee, 
  Debt, 
  Check, 
  Boleto, 
  CashTransaction, 
  AgendaEvent, 
  Tax, 
  PixFee,
  CashBalance
} from '../types';

// Enhanced UUID validation function
export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Enhanced payload sanitization
export function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized = { ...payload };
  
  // List of all possible UUID fields
  const uuidFields = [
    'id', 'sellerId', 'customerId', 'productId', 'paymentMethodId',
    'seller_id', 'customer_id', 'product_id', 'payment_method_id',
    'saleId', 'sale_id', 'debtId', 'debt_id', 'checkId', 'check_id',
    'boletoId', 'boleto_id', 'employeeId', 'employee_id',
    'relatedId', 'related_id', 'parentId', 'parent_id'
  ];
  
  uuidFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      const value = sanitized[field];
      if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
        sanitized[field] = null;
        console.log(`🧹 Sanitized ${field}: empty string → null`);
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          sanitized[field] = null;
          console.log(`🧹 Sanitized ${field}: "${value}" → null`);
        } else if (trimmed.startsWith('offline-') || trimmed.startsWith('temp-')) {
          sanitized[field] = null;
          console.log(`🧹 Sanitized ${field}: offline ID "${trimmed}" → null`);
        } else if (!isValidUUID(trimmed)) {
          console.warn(`⚠️ Invalid UUID for ${field}:`, trimmed, '- converting to null');
          sanitized[field] = null;
        } else {
          sanitized[field] = trimmed;
        }
      }
    }
  });
  
  // Sanitize payment methods
  if (sanitized.paymentMethods && Array.isArray(sanitized.paymentMethods)) {
    sanitized.paymentMethods = sanitized.paymentMethods.map((method: any) => {
      const cleanedMethod = { ...method };
      uuidFields.forEach(field => {
        if (cleanedMethod.hasOwnProperty(field)) {
          const value = cleanedMethod[field];
          if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
            cleanedMethod[field] = null;
          } else if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
              cleanedMethod[field] = null;
            } else if (trimmed.startsWith('offline-') || trimmed.startsWith('temp-')) {
              cleanedMethod[field] = null;
            } else if (!isValidUUID(trimmed)) {
              console.warn(`⚠️ Invalid UUID in payment method for ${field}:`, trimmed, '- converting to null');
              cleanedMethod[field] = null;
            } else {
              cleanedMethod[field] = trimmed;
            }
          }
        }
      });
      return cleanedMethod;
    });
  }
  
  return sanitized;
}

// Transform camelCase to snake_case for database
export function transformToSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item));
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = transformToSnakeCase(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        typeof item === 'object' ? transformToSnakeCase(item) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

// Enhanced connection check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('❌ Supabase not configured');
      return false;
    }

    console.log('🔍 Testing Supabase connection...');
    
    const { error } = await supabase.from('sales').select('id').limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase check failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection verified');
    return true;
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return false;
  }
}

// Enhanced RPC function for creating sales
export async function createSaleRPC(payload: any): Promise<string> {
  console.log('🔄 createSaleRPC called with payload:', payload);
  
  // Check connection first
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    console.log('📱 Supabase not reachable, saving offline...');
    const offlineId = await saveOffline('sales', payload);
    console.log('💾 Sale saved offline with ID:', offlineId);
    return offlineId;
  }
  
  console.log('🌐 Supabase reachable, saving online...');
  
  // Sanitize and transform payload
  const sanitizedPayload = sanitizePayload(payload);
  const snakeCasePayload = transformToSnakeCase(sanitizedPayload);
  
  console.log('📦 Sanitized payload:', sanitizedPayload);
  console.log('🐍 Snake case payload:', snakeCasePayload);
  
  try {
    const { data, error } = await supabase.rpc('create_sale', { 
      payload: snakeCasePayload 
    });
    
    if (error) {
      console.error('❌ Supabase RPC error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Failed payload:', JSON.stringify(snakeCasePayload, null, 2));
      throw error;
    }
    
    console.log('✅ Sale created successfully via RPC:', data);
    return data;
  } catch (error) {
    console.error('❌ RPC call failed, attempting offline save...');
    ErrorHandler.logProjectError(error, 'Create Sale RPC');
    
    // Fallback to offline storage
    const offlineId = await saveOffline('sales', payload);
    console.log('💾 Sale saved offline as fallback with ID:', offlineId);
    return offlineId;
  }
}

// Base service class with enhanced connection handling
class BaseService<T> {
  constructor(private tableName: string) {}

  async create(data: Partial<T>): Promise<string> {
    console.log(`🔄 Creating ${this.tableName}:`, data);
    
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Supabase not reachable, saving ${this.tableName} offline...`);
      const offlineId = await saveOffline(this.tableName, data);
      console.log(`💾 ${this.tableName} saved offline with ID:`, offlineId);
      return offlineId;
    }
    
    console.log(`🌐 Supabase reachable, saving ${this.tableName} online...`);
    
    try {
      const sanitizedData = sanitizePayload(data);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      console.log(`📦 Sanitized ${this.tableName} data:`, sanitizedData);
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Supabase insert error for ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} created successfully:`, result.id);
      return result.id;
    } catch (error) {
      console.error(`❌ Failed to create ${this.tableName} online, saving offline...`);
      ErrorHandler.logProjectError(error, `Create ${this.tableName}`);
      
      // Fallback to offline storage
      const offlineId = await saveOffline(this.tableName, data);
      console.log(`💾 ${this.tableName} saved offline as fallback with ID:`, offlineId);
      return offlineId;
    }
  }

  async getAll(): Promise<T[]> {
    console.log(`🔄 Loading all ${this.tableName}...`);
    
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Supabase not reachable, loading ${this.tableName} from offline storage...`);
      // TODO: Load from offline storage
      return [];
    }
    
    console.log(`🌐 Supabase reachable, loading ${this.tableName} online...`);
    
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`❌ Error loading ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data.length} ${this.tableName} records`);
      return data as T[];
    } catch (error) {
      console.error(`❌ Failed to load ${this.tableName}:`, error);
      ErrorHandler.logProjectError(error, `Load ${this.tableName}`);
      return [];
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    console.log(`🔄 Updating ${this.tableName} ${id}:`, data);
    
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Supabase not reachable, queuing ${this.tableName} update for sync...`);
      await addToSyncQueue({
        type: 'update',
        table: this.tableName,
        data: { id, ...data },
        maxRetries: 3
      });
      return { id, ...data } as T;
    }
    
    console.log(`🌐 Supabase reachable, updating ${this.tableName} online...`);
    
    try {
      const sanitizedData = sanitizePayload(data);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error updating ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} updated successfully`);
      return result as T;
    } catch (error) {
      console.error(`❌ Failed to update ${this.tableName}, queuing for sync...`);
      ErrorHandler.logProjectError(error, `Update ${this.tableName}`);
      
      // Queue for sync
      await addToSyncQueue({
        type: 'update',
        table: this.tableName,
        data: { id, ...data },
        maxRetries: 3
      });
      
      return { id, ...data } as T;
    }
  }

  async delete(id: string): Promise<void> {
    console.log(`🔄 Deleting ${this.tableName} ${id}`);
    
    // Check connection first
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Supabase not reachable, queuing ${this.tableName} deletion for sync...`);
      await addToSyncQueue({
        type: 'delete',
        table: this.tableName,
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    console.log(`🌐 Supabase reachable, deleting ${this.tableName} online...`);
    
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Error deleting ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete ${this.tableName}, queuing for sync...`);
      ErrorHandler.logProjectError(error, `Delete ${this.tableName}`);
      
      // Queue for sync
      await addToSyncQueue({
        type: 'delete',
        table: this.tableName,
        data: { id },
        maxRetries: 3
      });
    }
  }
}

// Sales service with enhanced connection handling
export const salesService = {
  async create(saleData: Partial<Sale>): Promise<string> {
    console.log('🔄 salesService.create called with:', saleData);
    
    // Enhanced validation
    if (!saleData.client || (typeof saleData.client === 'string' && !saleData.client.trim())) {
      throw new Error('Cliente é obrigatório e não pode estar vazio');
    }
    
    if (!saleData.totalValue || saleData.totalValue <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }
    
    if (!saleData.paymentMethods || !Array.isArray(saleData.paymentMethods) || saleData.paymentMethods.length === 0) {
      throw new Error('Pelo menos um método de pagamento é obrigatório');
    }
    
    // Use the enhanced RPC function
    return await createSaleRPC(saleData);
  },

  async getAll(): Promise<Sale[]> {
    console.log('🔄 Loading all sales...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, loading sales from offline storage...');
      // TODO: Load from offline storage
      return [];
    }
    
    console.log('🌐 Supabase reachable, loading sales online...');
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error loading sales:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data.length} sales`);
      return data as Sale[];
    } catch (error) {
      console.error('❌ Failed to load sales:', error);
      ErrorHandler.logProjectError(error, 'Load Sales');
      return [];
    }
  },

  async update(id: string, saleData: Partial<Sale>): Promise<Sale> {
    console.log(`🔄 Updating sale ${id}:`, saleData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, queuing sale update for sync...');
      await addToSyncQueue({
        type: 'update',
        table: 'sales',
        data: { id, ...saleData },
        maxRetries: 3
      });
      return { id, ...saleData } as Sale;
    }
    
    console.log('🌐 Supabase reachable, updating sale online...');
    
    try {
      const sanitizedData = sanitizePayload(saleData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('sales')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating sale:', error);
        throw error;
      }
      
      console.log('✅ Sale updated successfully');
      return result as Sale;
    } catch (error) {
      console.error('❌ Failed to update sale, queuing for sync...');
      ErrorHandler.logProjectError(error, 'Update Sale');
      
      await addToSyncQueue({
        type: 'update',
        table: 'sales',
        data: { id, ...saleData },
        maxRetries: 3
      });
      
      return { id, ...saleData } as Sale;
    }
  },

  async delete(id: string): Promise<void> {
    console.log(`🔄 Deleting sale ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, queuing sale deletion for sync...');
      await addToSyncQueue({
        type: 'delete',
        table: 'sales',
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    console.log('🌐 Supabase reachable, deleting sale online...');
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting sale:', error);
        throw error;
      }
      
      console.log('✅ Sale deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete sale, queuing for sync...');
      ErrorHandler.logProjectError(error, 'Delete Sale');
      
      await addToSyncQueue({
        type: 'delete',
        table: 'sales',
        data: { id },
        maxRetries: 3
      });
    }
  }
};

// Create service instances with enhanced connection handling
export const employeesService = new BaseService<Employee>('employees');
export const debtsService = new BaseService<Debt>('debts');
export const checksService = new BaseService<Check>('checks');
export const boletosService = new BaseService<Boleto>('boletos');
export const agendaService = new BaseService<AgendaEvent>('agenda_events');
export const taxesService = new BaseService<Tax>('taxes');
export const pixFeesService = new BaseService<PixFee>('pix_fees');

// Cash service with enhanced connection handling
export const cashService = {
  async getBalance(): Promise<CashBalance | null> {
    console.log('🔄 Loading cash balance...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, cash balance unavailable offline');
      return null;
    }
    
    console.log('🌐 Supabase reachable, loading cash balance online...');
    
    try {
      const { data, error } = await supabase
        .from('cash_balances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No cash balance found');
          return null;
        }
        console.error('❌ Error loading cash balance:', error);
        throw error;
      }
      
      console.log('✅ Cash balance loaded:', data);
      return data as CashBalance;
    } catch (error) {
      console.error('❌ Failed to load cash balance:', error);
      ErrorHandler.logProjectError(error, 'Load Cash Balance');
      return null;
    }
  },

  async getTransactions(): Promise<CashTransaction[]> {
    console.log('🔄 Loading cash transactions...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, cash transactions unavailable offline');
      return [];
    }
    
    console.log('🌐 Supabase reachable, loading cash transactions online...');
    
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Error loading cash transactions:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data.length} cash transactions`);
      return data as CashTransaction[];
    } catch (error) {
      console.error('❌ Failed to load cash transactions:', error);
      ErrorHandler.logProjectError(error, 'Load Cash Transactions');
      return [];
    }
  },

  async initializeBalance(initialAmount: number): Promise<void> {
    console.log('🔄 Initializing cash balance with amount:', initialAmount);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, cannot initialize cash balance offline');
      throw new Error('Conexão com servidor necessária para inicializar o caixa');
    }
    
    console.log('🌐 Supabase reachable, initializing cash balance online...');
    
    try {
      const { error } = await supabase
        .from('cash_balances')
        .insert([{
          current_balance: initialAmount,
          initial_balance: initialAmount,
          initial_date: new Date().toISOString().split('T')[0]
        }]);
      
      if (error) {
        console.error('❌ Error initializing cash balance:', error);
        throw error;
      }
      
      console.log('✅ Cash balance initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize cash balance:', error);
      ErrorHandler.logProjectError(error, 'Initialize Cash Balance');
      throw error;
    }
  },

  async recalculateBalance(): Promise<void> {
    console.log('🔄 Recalculating cash balance...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, cannot recalculate cash balance offline');
      throw new Error('Conexão com servidor necessária para recalcular o saldo');
    }
    
    console.log('🌐 Supabase reachable, recalculating cash balance online...');
    
    try {
      // Call the recalculate function (if it exists)
      const { error } = await supabase.rpc('recalculate_cash_balance');
      
      if (error) {
        console.error('❌ Error recalculating cash balance:', error);
        throw error;
      }
      
      console.log('✅ Cash balance recalculated successfully');
    } catch (error) {
      console.error('❌ Failed to recalculate cash balance:', error);
      ErrorHandler.logProjectError(error, 'Recalculate Cash Balance');
      throw error;
    }
  },

  async createTransaction(transactionData: Partial<CashTransaction>): Promise<string> {
    console.log('🔄 Creating cash transaction:', transactionData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, saving cash transaction offline...');
      const offlineId = await saveOffline('cash_transactions', transactionData);
      console.log('💾 Cash transaction saved offline with ID:', offlineId);
      return offlineId;
    }
    
    console.log('🌐 Supabase reachable, creating cash transaction online...');
    
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('cash_transactions')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating cash transaction:', error);
        throw error;
      }
      
      console.log('✅ Cash transaction created successfully:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Failed to create cash transaction online, saving offline...');
      ErrorHandler.logProjectError(error, 'Create Cash Transaction');
      
      const offlineId = await saveOffline('cash_transactions', transactionData);
      console.log('💾 Cash transaction saved offline as fallback with ID:', offlineId);
      return offlineId;
    }
  },

  async updateTransaction(id: string, transactionData: Partial<CashTransaction>): Promise<CashTransaction> {
    console.log(`🔄 Updating cash transaction ${id}:`, transactionData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, queuing cash transaction update for sync...');
      await addToSyncQueue({
        type: 'update',
        table: 'cash_transactions',
        data: { id, ...transactionData },
        maxRetries: 3
      });
      return { id, ...transactionData } as CashTransaction;
    }
    
    console.log('🌐 Supabase reachable, updating cash transaction online...');
    
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('cash_transactions')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating cash transaction:', error);
        throw error;
      }
      
      console.log('✅ Cash transaction updated successfully');
      return result as CashTransaction;
    } catch (error) {
      console.error('❌ Failed to update cash transaction, queuing for sync...');
      ErrorHandler.logProjectError(error, 'Update Cash Transaction');
      
      await addToSyncQueue({
        type: 'update',
        table: 'cash_transactions',
        data: { id, ...transactionData },
        maxRetries: 3
      });
      
      return { id, ...transactionData } as CashTransaction;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    console.log(`🔄 Deleting cash transaction ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Supabase not reachable, queuing cash transaction deletion for sync...');
      await addToSyncQueue({
        type: 'delete',
        table: 'cash_transactions',
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    console.log('🌐 Supabase reachable, deleting cash transaction online...');
    
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting cash transaction:', error);
        throw error;
      }
      
      console.log('✅ Cash transaction deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete cash transaction, queuing for sync...');
      ErrorHandler.logProjectError(error, 'Delete Cash Transaction');
      
      await addToSyncQueue({
        type: 'delete',
        table: 'cash_transactions',
        data: { id },
        maxRetries: 3
      });
    }
  }
};

// Employee-related services
export const employeePaymentsService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Payments');
      return [];
    }
  },

  async create(paymentData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_payments', paymentData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(paymentData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_payments')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Payment');
      const offlineId = await saveOffline('employee_payments', paymentData);
      return offlineId;
    }
  }
};

export const employeeAdvancesService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Advances');
      return [];
    }
  },

  async create(advanceData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_advances', advanceData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_advances')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Advance');
      const offlineId = await saveOffline('employee_advances', advanceData);
      return offlineId;
    }
  },

  async update(id: string, advanceData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_advances',
        data: { id, ...advanceData },
        maxRetries: 3
      });
      return { id, ...advanceData };
    }
    
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_advances')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Advance');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_advances',
        data: { id, ...advanceData },
        maxRetries: 3
      });
      return { id, ...advanceData };
    }
  }
};

export const employeeOvertimesService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Overtimes');
      return [];
    }
  },

  async create(overtimeData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_overtimes', overtimeData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_overtimes')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Overtime');
      const offlineId = await saveOffline('employee_overtimes', overtimeData);
      return offlineId;
    }
  },

  async update(id: string, overtimeData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_overtimes',
        data: { id, ...overtimeData },
        maxRetries: 3
      });
      return { id, ...overtimeData };
    }
    
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_overtimes')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Overtime');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_overtimes',
        data: { id, ...overtimeData },
        maxRetries: 3
      });
      return { id, ...overtimeData };
    }
  }
};

export const employeeCommissionsService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Commissions');
      return [];
    }
  },

  async update(id: string, commissionData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_commissions',
        data: { id, ...commissionData },
        maxRetries: 3
      });
      return { id, ...commissionData };
    }
    
    try {
      const sanitizedData = sanitizePayload(commissionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_commissions')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Commission');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_commissions',
        data: { id, ...commissionData },
        maxRetries: 3
      });
      return { id, ...commissionData };
    }
  }
};

// Debug service for error logging
export const debugService = {
  async getRecentSaleErrors(limit: number = 50): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('create_sale_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Sale Errors');
      return [];
    }
  },

  async cleanupOldErrors(daysOld: number = 7): Promise<number> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return 0;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { data, error } = await supabase
        .from('create_sale_errors')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Cleanup Sale Errors');
      return 0;
    }
  }
};

// Image upload service
export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    throw new Error('Conexão com servidor necessária para upload de imagens');
  }
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${checkId}-${imageType}.${fileExt}`;
    const filePath = `checks/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    return data.path;
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Upload Check Image');
    throw error;
  }
}

export async function deleteCheckImage(imagePath: string): Promise<void> {
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    throw new Error('Conexão com servidor necessária para deletar imagens');
  }
  
  try {
    const { error } = await supabase.storage
      .from('check-images')
      .remove([imagePath]);
    
    if (error) throw error;
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Delete Check Image');
    throw error;
  }
}

export function getCheckImageUrl(imagePath: string): string {
  if (!isSupabaseConfigured()) {
    return '';
  }
  
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}