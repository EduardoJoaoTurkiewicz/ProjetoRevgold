import { supabase } from './supabase';
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

// Utility function to sanitize payloads
export function sanitizePayload(payload: any): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue; // Skip undefined values
    }
    
    if (typeof value === 'string') {
      sanitized[key] = value.trim() || null;
    } else if (value === null || value === '') {
      sanitized[key] = null;
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Utility function to check Supabase client initialization
function checkSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables in your .env file.');
  }
}

// Transform camelCase to snake_case for database
function toSnakeCase(obj: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

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
      console.error('Error loading sales:', error);
      throw error;
    }
  },

  async create(saleData: CreateSalePayload | Partial<Sale>): Promise<Sale> {
    try {
      // Sanitize and validate the payload
      const sanitizedData = sanitizePayload(saleData);
      
      // Convert to snake_case for database
      const dbData = toSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('sales')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  async update(id: string, saleData: Partial<Sale>): Promise<Sale> {
    try {
      const sanitizedData = sanitizePayload(saleData);
      const dbData = toSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('sales')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting sale:', error);
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
      const { data, error } = await supabase
        .from('employees')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      return toCamelCase(data);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  async update(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      const sanitizedData = sanitizePayload(employeeData);
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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
      const dbData = toSnakeCase(sanitizedData);
      
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