import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { ErrorHandler } from './errorHandler';
import { safeSupabaseCall } from './connectionManager';
import { saveOffline, addToSyncQueue } from './offlineStorage';
import toast from 'react-hot-toast';
import type { 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  Employee,
  EmployeePayment,
  EmployeeAdvance,
  EmployeeOvertime,
  EmployeeCommission,
  CashTransaction,
  PixFee,
  CashBalance,
  Tax,
  AgendaEvent,
} from '../types';

// UUID validation utility
export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Enhanced payload sanitization with UUID validation
export function sanitizePayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Handle UUID fields specifically - expanded list to catch all UUID fields
    if (key.endsWith('_id') || key.endsWith('Id') || key === 'id' || 
        key === 'customerId' || key === 'paymentMethodId' || key === 'saleId' ||
        key === 'customer_id' || key === 'product_id' || key === 'seller_id' ||
        key === 'employee_id' || key === 'sale_id' || key === 'debt_id' ||
        key === 'check_id' || key === 'boleto_id' || key === 'related_id') {
      if (value === '' || value === 'null' || value === 'undefined' || value === undefined || value === null) {
        // Auto-generate UUID for primary key fields when missing
        if (key === 'id') {
          sanitized[key] = uuidv4();
        } else if (key === 'customer_id' || key === 'product_id') {
          // For customer_id and product_id, generate UUID if empty (as per requirements)
          sanitized[key] = uuidv4();
        } else {
          sanitized[key] = null;
        }
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          // Auto-generate UUID for primary key fields when empty
          if (key === 'id') {
            sanitized[key] = uuidv4();
          } else if (key === 'customer_id' || key === 'product_id') {
            // For customer_id and product_id, generate UUID if empty (as per requirements)
            sanitized[key] = uuidv4();
          } else {
            sanitized[key] = null;
          }
        } else if (isValidUUID(trimmed)) {
          sanitized[key] = trimmed;
        } else {
          console.warn(`⚠️ Invalid UUID for ${key}:`, value, '- converting to null');
          // Auto-generate UUID for primary key fields when invalid
          if (key === 'id') {
            sanitized[key] = uuidv4();
          } else if (key === 'customer_id' || key === 'product_id') {
            // For customer_id and product_id, generate UUID if invalid (as per requirements)
            sanitized[key] = uuidv4();
          } else {
            sanitized[key] = null;
          }
        }
      } else {
        sanitized[key] = value;
      }
    }
    // Handle string fields
    else if (typeof value === 'string') {
      const trimmed = value.trim();
      sanitized[key] = trimmed === '' ? null : trimmed;
    }
    // Handle arrays and objects
    else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizePayload(item) : item
      );
    }
    else if (value && typeof value === 'object') {
      sanitized[key] = sanitizePayload(value);
    }
    // Handle other types
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Enhanced UUID cleaning function
export function cleanUUIDFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = { ...obj };
  
  Object.keys(cleaned).forEach(key => {
    // Expanded UUID field detection to catch all possible UUID fields
    if (key.endsWith('_id') || key.endsWith('Id') || key === 'id' || 
        key === 'customerId' || key === 'paymentMethodId' || key === 'saleId' ||
        key === 'customer_id' || key === 'product_id' || key === 'seller_id' ||
        key === 'employee_id' || key === 'sale_id' || key === 'debt_id' ||
        key === 'check_id' || key === 'boleto_id' || key === 'related_id') {
      const value = cleaned[key];
      if (value === '' || value === 'null' || value === 'undefined' || !value) {
        // Auto-generate UUID for specific fields that require it
        if (key === 'id' || key === 'customer_id' || key === 'product_id') {
          cleaned[key] = uuidv4();
          console.log(`🔧 Auto-generated UUID for ${key}:`, cleaned[key]);
        } else {
          cleaned[key] = null;
        }
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          // Auto-generate UUID for specific fields that require it
          if (key === 'id' || key === 'customer_id' || key === 'product_id') {
            cleaned[key] = uuidv4();
            console.log(`🔧 Auto-generated UUID for empty ${key}:`, cleaned[key]);
          } else {
            cleaned[key] = null;
          }
        } else if (!isValidUUID(trimmed)) {
          console.warn(`⚠️ Invalid UUID for ${key}:`, trimmed, '- converting to null');
          // Auto-generate UUID for specific fields that require it
          if (key === 'id' || key === 'customer_id' || key === 'product_id') {
            cleaned[key] = uuidv4();
            console.log(`🔧 Auto-generated UUID for invalid ${key}:`, cleaned[key]);
          } else {
            cleaned[key] = null;
          }
        } else {
          cleaned[key] = trimmed;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
}

// Transform camelCase to snake_case for database operations
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

// Enhanced create sale function using RPC
export async function createSaleRPC(payload: any): Promise<string> {
  try {
    console.log('🔄 Creating sale with RPC...');
    console.log('📤 Original payload:', payload);
    
    // Step 0: Ensure payload has an ID if missing
    if (!payload.id || payload.id === '' || payload.id === 'null' || payload.id === 'undefined') {
      payload.id = uuidv4();
      console.log('🆔 Generated new sale ID:', payload.id);
    }
    
    // Step 1: Enhanced UUID field cleaning first
    const uuidCleaned = cleanUUIDFields(payload);
    console.log('🔧 UUID cleaned payload:', uuidCleaned);
    
    // Step 2: Sanitize the payload
    const sanitized = sanitizePayload(uuidCleaned);
    console.log('🧹 Sanitized payload:', sanitized);
    
    // Step 3: Transform to snake_case
    const snakeCasePayload = transformToSnakeCase(sanitized);
    console.log('🐍 Snake case payload:', snakeCasePayload);
    
    // Step 4: Final comprehensive UUID validation before sending to database
    Object.keys(snakeCasePayload).forEach(key => {
      // Check all possible UUID field patterns
      if ((key.endsWith('_id') || key === 'customer_id' || key === 'product_id' || 
           key === 'payment_method_id' || key === 'seller_id' || key === 'employee_id' ||
           key === 'sale_id' || key === 'debt_id' || key === 'check_id' || key === 'boleto_id' ||
           key === 'related_id') && 
          (snakeCasePayload[key] === '' || snakeCasePayload[key] === 'null' || snakeCasePayload[key] === 'undefined')) {
        console.warn(`⚠️ Found empty string UUID field ${key}`);
        // Auto-generate for required fields, null for optional fields
        if (key === 'id' || key === 'customer_id' || key === 'product_id') {
          snakeCasePayload[key] = uuidv4();
          console.log(`🔧 Auto-generated UUID for ${key}:`, snakeCasePayload[key]);
        } else {
          snakeCasePayload[key] = null;
          console.log(`🔧 Set ${key} to null`);
        }
      }
    });
    
    // Step 5: Additional validation for payment methods array
    if (snakeCasePayload.payment_methods && Array.isArray(snakeCasePayload.payment_methods)) {
      snakeCasePayload.payment_methods = snakeCasePayload.payment_methods.map((method: any, index: number) => {
        const cleanedMethod = { ...method };
        
        // Clean UUID fields in payment methods
        Object.keys(cleanedMethod).forEach(methodKey => {
          if ((methodKey.endsWith('_id') || methodKey === 'customer_id' || methodKey === 'product_id') &&
              (cleanedMethod[methodKey] === '' || cleanedMethod[methodKey] === 'null' || cleanedMethod[methodKey] === 'undefined')) {
            if (methodKey === 'customer_id' || methodKey === 'product_id') {
              cleanedMethod[methodKey] = uuidv4();
              console.log(`🔧 Auto-generated UUID for payment method ${index} ${methodKey}:`, cleanedMethod[methodKey]);
            } else {
              cleanedMethod[methodKey] = null;
            }
          }
        });
        
        return cleanedMethod;
      });
    }
    
    console.log('🔍 Final payload before RPC call:', JSON.stringify(snakeCasePayload, null, 2));
    
    // Step 6: Try to call the RPC function with offline support
    const result = await safeSupabaseCall(async () => {
      const { data, error } = await supabase.rpc('create_sale', { 
        payload: snakeCasePayload 
      });
      if (error) throw error;
      return data;
    });
    
    // Handle offline mode
    if (result.offline) {
      console.log('📴 Working offline, saving sale locally...');
      const offlineId = await saveOffline('sales', sanitized);
      await addToSyncQueue({
        type: 'create',
        table: 'sales',
        data: sanitized,
        maxRetries: 5
      });
      
      toast.success('💾 Venda salva localmente. Será sincronizada quando online.');
      return offlineId;
    }
    
    // Handle errors
    if (result.error) {
      ErrorHandler.logProjectError(result.error, 'RPC create_sale');
      console.group('💥 RPC create_sale failed');
      console.error('Error details:', result.error);
      console.log('Failed payload:', JSON.stringify(snakeCasePayload, null, 2));
      console.log('Original payload:', JSON.stringify(payload, null, 2));
      console.groupEnd();
      throw new Error(ErrorHandler.handleSupabaseError(result.error));
    }
    
    console.log('✅ Sale created successfully with ID:', result.data);
    toast.success('✅ Venda criada com sucesso!');
    return result.data;
    
  } catch (error) {
    ErrorHandler.logProjectError(error, 'createSaleRPC');
    
    // Enhanced error logging with full context
    console.group('🚨 createSaleRPC Error Details');
    console.error('Error:', error);
    console.log('Original payload:', JSON.stringify(payload, null, 2));
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.groupEnd();
    
    throw error;
  }
}

// Utility function to sanitize payloads
// Note: Enhanced sanitizePayload function is defined above

// Utility function to check Supabase client initialization
function checkSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables in your .env file.');
  }
}

// Transform camelCase to snake_case for database
// Note: Enhanced transformToSnakeCase function is defined above

// Transform snake_case to camelCase from database
function toCamelCase(obj: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Create Sale Payload type
export interface CreateSalePayload {
  client: string;
  date: string;
  deliveryDate?: string;
  sellerId?: string;
  products?: any;
  observations?: string;
  totalValue: number;
  paymentMethods: Array<{
    method: string;
    amount: number;
    installments?: number;
    dueDate?: string;
    details?: any;
  }>;
  receivedAmount: number;
  pendingAmount: number;
  status: string;
  paymentDescription?: string;
  paymentObservations?: string;
  customCommissionRate?: number;
}

// Sales Service
export const salesService = {
  async getAll(): Promise<Sale[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Sales');
      throw error;
    }
  },

  async create(saleData: CreateSalePayload | Partial<Sale>): Promise<string> {
    try {
      console.log('🔄 salesService.create called with:', saleData);
      
      // Step 1: Clean UUID fields first
      const uuidCleanedData = cleanUUIDFields(saleData);
      console.log('🔧 UUID cleaned data:', uuidCleanedData);
      
      // Validate required fields before processing
      if (!uuidCleanedData.client || (typeof uuidCleanedData.client === 'string' && !uuidCleanedData.client.trim())) {
        throw new Error('Cliente é obrigatório e não pode estar vazio');
      }
      
      if (!uuidCleanedData.totalValue || uuidCleanedData.totalValue <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }
      
      if (!uuidCleanedData.paymentMethods || !Array.isArray(uuidCleanedData.paymentMethods) || uuidCleanedData.paymentMethods.length === 0) {
        throw new Error('Pelo menos um método de pagamento é obrigatório');
      }
      
      // Use the robust RPC function
      const saleId = await createSaleRPC(uuidCleanedData);
      return saleId;
      
    } catch (error) {
      ErrorHandler.logProjectError(error, 'salesService.create');
      throw error;
    }
  },

  async update(id: string, saleData: Partial<Sale>): Promise<Sale> {
    try {
      console.log('🔄 Updating sale:', id, saleData);
      
      // Enhanced sanitization for updates
      const sanitizedData = sanitizePayload(saleData);
      console.log('🧹 Sanitized update data:', sanitizedData);
      
      const dbData = transformToSnakeCase(sanitizedData);
      console.log('🐍 Snake case update data:', dbData);
      
      const result = await safeSupabaseCall(async () => {
        const { data, error } = await supabase
          .from('sales')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      });
      
      // Handle offline mode
      if (result.offline) {
        console.log('📴 Working offline, queuing sale update...');
        await addToSyncQueue({
          type: 'update',
          table: 'sales',
          data: { id, ...sanitizedData },
          maxRetries: 3
        });
        
        toast.success('💾 Atualização salva localmente. Será sincronizada quando online.');
        return { ...sanitizedData, id } as Sale;
      }
      
      if (result.error) throw result.error;
      
      console.log('✅ Sale updated successfully');
      toast.success('✅ Venda atualizada com sucesso!');
      return toCamelCase(result.data);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Sale');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log('🔄 Deleting sale:', id);
      
      const result = await safeSupabaseCall(async () => {
        const { error } = await supabase
          .from('sales')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      });
      
      // Handle offline mode
      if (result.offline) {
        console.log('📴 Working offline, queuing sale deletion...');
        await addToSyncQueue({
          type: 'delete',
          table: 'sales',
          data: { id },
          maxRetries: 3
        });
        
        toast.success('💾 Exclusão salva localmente. Será sincronizada quando online.');
        return;
      }
      
      if (result.error) throw result.error;
      
      console.log('✅ Sale deleted successfully');
      toast.success('✅ Venda excluída com sucesso!');
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Delete Sale');
      throw error;
    }
  }
};

// Debts Service
export const debtsService = {
  async getAll(): Promise<Debt[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading debts:', error);
      throw error;
    }
  },

  async create(debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    try {
      const sanitizedData = sanitizePayload(debtData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('debts')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  },

  async update(id: string, debtData: Partial<Debt>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(debtData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('debts')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  }
};

// Checks Service
export const checksService = {
  async getAll(): Promise<Check[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading checks:', error);
      throw error;
    }
  },

  async create(checkData: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>): Promise<Check> {
    try {
      const sanitizedData = sanitizePayload(checkData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('checks')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating check:', error);
      throw error;
    }
  },

  async update(id: string, checkData: Partial<Check>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(checkData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('checks')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating check:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting check:', error);
      throw error;
    }
  }
};

// Boletos Service
export const boletosService = {
  async getAll(): Promise<Boleto[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading boletos:', error);
      throw error;
    }
  },

  async create(boletoData: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Boleto> {
    try {
      const sanitizedData = sanitizePayload(boletoData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('boletos')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating boleto:', error);
      throw error;
    }
  },

  async update(id: string, boletoData: Partial<Boleto>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(boletoData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('boletos')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating boleto:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('boletos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting boleto:', error);
      throw error;
    }
  }
};

// Employees Service
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading employees:', error);
      throw error;
    }
  },

  async create(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const sanitizedData = sanitizePayload(employeeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const result = await safeSupabaseCall(async () => {
        const { data, error } = await supabase
          .from('employees')
          .insert([dbData])
          .select()
          .single();
        if (error) throw error;
        return data;
      });
      
      // Handle offline mode
      if (result.offline) {
        const offlineId = await saveOffline('employees', sanitizedData);
        await addToSyncQueue({
          type: 'create',
          table: 'employees',
          data: sanitizedData,
          maxRetries: 3
        });
        
        toast.success('💾 Funcionário salvo localmente. Será sincronizado quando online.');
        return { ...sanitizedData, id: offlineId } as Employee;
      }
      
      if (result.error) throw result.error;
      
      toast.success('✅ Funcionário criado com sucesso!');
      return toCamelCase(result.data);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  async update(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(employeeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('employees')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
};

// Employee Payments Service
export const employeePaymentsService = {
  async getAll(): Promise<EmployeePayment[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading employee payments:', error);
      throw error;
    }
  },

  async create(paymentData: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeePayment> {
    try {
      const sanitizedData = sanitizePayload(paymentData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('employee_payments')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating employee payment:', error);
      throw error;
    }
  },

  async update(id: string, paymentData: Partial<EmployeePayment>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(paymentData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('employee_payments')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee payment:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee payment:', error);
      throw error;
    }
  }
};

// Employee Advances Service
export const employeeAdvancesService = {
  async getAll(): Promise<EmployeeAdvance[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading employee advances:', error);
      throw error;
    }
  },

  async create(advanceData: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeAdvance> {
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('employee_advances')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating employee advance:', error);
      throw error;
    }
  },

  async update(id: string, advanceData: Partial<EmployeeAdvance>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('employee_advances')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee advance:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_advances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee advance:', error);
      throw error;
    }
  }
};

// Employee Overtimes Service
export const employeeOvertimesService = {
  async getAll(): Promise<EmployeeOvertime[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading employee overtimes:', error);
      throw error;
    }
  },

  async create(overtimeData: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeOvertime> {
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('employee_overtimes')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating employee overtime:', error);
      throw error;
    }
  },

  async update(id: string, overtimeData: Partial<EmployeeOvertime>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('employee_overtimes')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee overtime:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_overtimes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee overtime:', error);
      throw error;
    }
  }
};

// Employee Commissions Service
export const employeeCommissionsService = {
  async getAll(): Promise<EmployeeCommission[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading employee commissions:', error);
      throw error;
    }
  },

  async create(commissionData: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeCommission> {
    try {
      const sanitizedData = sanitizePayload(commissionData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('employee_commissions')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating employee commission:', error);
      throw error;
    }
  },

  async update(id: string, commissionData: Partial<EmployeeCommission>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(commissionData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('employee_commissions')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating employee commission:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting employee commission:', error);
      throw error;
    }
  }
};

// Cash Transactions Service
export const cashTransactionsService = {
  async getAll(): Promise<CashTransaction[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading cash transactions:', error);
      throw error;
    }
  },

  async create(transactionData: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashTransaction> {
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('cash_transactions')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating cash transaction:', error);
      throw error;
    }
  },

  async update(id: string, transactionData: Partial<CashTransaction>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('cash_transactions')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating cash transaction:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting cash transaction:', error);
      throw error;
    }
  }
};

// PIX Fees Service
export const pixFeesService = {
  async getAll(): Promise<PixFee[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('pix_fees')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading pix fees:', error);
      throw error;
    }
  },

  async create(feeData: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>): Promise<PixFee> {
    try {
      const sanitizedData = sanitizePayload(feeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('pix_fees')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating pix fee:', error);
      throw error;
    }
  },

  async update(id: string, feeData: Partial<PixFee>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(feeData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('pix_fees')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating pix fee:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pix_fees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pix fee:', error);
      throw error;
    }
  }
};

// Cash Balances Service
export const cashBalancesService = {
  async get(): Promise<CashBalance | null> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('cash_balances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? toCamelCase(data) : null;
    } catch (error) {
      console.error('Error loading cash balance:', error);
      return null;
    }
  },

  async create(balanceData: Omit<CashBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashBalance> {
    try {
      const sanitizedData = sanitizePayload(balanceData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('cash_balances')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating cash balance:', error);
      throw error;
    }
  },

  async update(id: string, balanceData: Partial<CashBalance>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(balanceData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('cash_balances')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating cash balance:', error);
      throw error;
    }
  }
};

// Taxes Service
export const taxesService = {
  async getAll(): Promise<Tax[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('taxes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading taxes:', error);
      throw error;
    }
  },

  async create(taxData: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    try {
      const sanitizedData = sanitizePayload(taxData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('taxes')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating tax:', error);
      throw error;
    }
  },

  async update(id: string, taxData: Partial<Tax>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(taxData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('taxes')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating tax:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('taxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tax:', error);
      throw error;
    }
  }
};

// Sale Boletos Service
export const saleBoletosService = {
  async getAll(): Promise<any[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('sale_boletos')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading sale boletos:', error);
      throw error;
    }
  },

  async markAsPaid(boletoId: string, paidAt?: string, interest?: number): Promise<void> {
    try {
      const updateData: any = {
        status: 'pago',
        paid_at: paidAt || new Date().toISOString()
      };
      
      if (interest !== undefined) {
        updateData.interest = interest;
      }
      
      const { error } = await supabase
        .from('sale_boletos')
        .update(updateData)
        .eq('id', boletoId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking sale boleto as paid:', error);
      throw error;
    }
  }
};

// Sale Cheques Service
export const saleChequesService = {
  async getAll(): Promise<any[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('sale_cheques')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading sale cheques:', error);
      throw error;
    }
  },

  async markAsPaid(chequeId: string, paidAt?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sale_cheques')
        .update({
          status: 'pago',
          paid_at: paidAt || new Date().toISOString()
        })
        .eq('id', chequeId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking sale cheque as paid:', error);
      throw error;
    }
  }
};

// Reports Service
export const reportsService = {
  async getFinancialSummary(startDate: string, endDate: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_financial_summary', {
        start_date: startDate,
        end_date: endDate
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  },

  async getCashFlow(startDate: string, endDate: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cash_flow', {
        start_date: startDate,
        end_date: endDate
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting cash flow:', error);
      throw error;
    }
  }
};

// Image Upload Functions for Checks
export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${checkId}_${imageType}.${fileExt}`;
    const filePath = `check-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('check-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading check image:', error);
    throw error;
  }
}

export async function deleteCheckImage(imagePath: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imagePath);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // Get last two parts: folder/filename

    const { error } = await supabase.storage
      .from('check-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting check image:', error);
    throw error;
  }
}

export function getCheckImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}

// Agenda Events Service
export const agendaService = {
  async getAll(): Promise<AgendaEvent[]> {
    try {
      checkSupabaseClient();
      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(toCamelCase);
    } catch (error) {
      console.error('Error loading agenda events:', error);
      throw error;
    }
  },

  async create(eventData: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendaEvent> {
    try {
      const sanitizedData = sanitizePayload(eventData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('agenda_events')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating agenda event:', error);
      throw error;
    }
  },

  async update(id: string, eventData: Partial<AgendaEvent>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(eventData);
      const dbData = transformToSnakeCase(sanitizedData);
      
      const { error } = await supabase
        .from('agenda_events')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating agenda event:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting agenda event:', error);
      throw error;
    }
  }
};

// Cash Service (wrapper for cash transactions and balances)
export const cashService = {
  async getTransactions(): Promise<CashTransaction[]> {
    return await cashTransactionsService.getAll();
  },

  async getBalance(): Promise<CashBalance | null> {
    return await cashBalancesService.get();
  },

  async getCurrentBalance(): Promise<number> {
    try {
      const balance = await cashBalancesService.get();
      return balance?.currentBalance || 0;
    } catch (error) {
      console.error('Error getting cash balance:', error);
      return 0;
    }
  },
  
  async initializeBalance(initialAmount: number): Promise<void> {
    try {
      await cashBalancesService.create({
        currentBalance: initialAmount,
        initialBalance: initialAmount,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error initializing cash balance:', error);
      throw error;
    }
  },
  
  async recalculateBalance(): Promise<void> {
    try {
      // This would typically call a stored procedure to recalculate
      // For now, we'll just refresh the balance
      const balance = await cashBalancesService.get();
      if (balance) {
        await cashBalancesService.update(balance.id!, {
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error recalculating cash balance:', error);
      throw error;
    }
  },

  async createTransaction(transactionData: Partial<CashTransaction>): Promise<string> {
    const transaction = await cashTransactionsService.create(transactionData as Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>);
    return transaction.id;
  },

  async updateTransaction(id: string, transactionData: Partial<CashTransaction>): Promise<CashTransaction> {
    await cashTransactionsService.update(id, transactionData);
    // Since the underlying service doesn't return the updated object, we need to fetch it
    const transactions = await cashTransactionsService.getAll();
    const updatedTransaction = transactions.find(t => t.id === id);
    if (!updatedTransaction) {
      throw new Error('Transaction not found after update');
    }
    return updatedTransaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await cashTransactionsService.delete(id);
  }
};

// Debug service for sale creation errors
export const debugService = {
  async getRecentSaleErrors(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_sale_errors', { 
        limit_count: limit 
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting sale creation errors:', error);
      return [];
    }
  },

  async cleanupOldErrors(daysOld: number = 30): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_sale_errors', { 
        days_old: daysOld 
      });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up old errors:', error);
      return 0;
    }
  }
};