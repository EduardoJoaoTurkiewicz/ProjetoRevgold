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
  AgendaEvent
} from '../types';

// Transform database row to camelCase
function transformToCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[camelKey] = value;
  }
  return transformed;
}

// Transform camelCase to snake_case for database
function transformToSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    // Convert empty strings, null, undefined to null for database
    if (value === '' || value === null || value === undefined) {
      transformed[snakeKey] = null;
    } else {
      transformed[snakeKey] = value;
    }
  }
  return transformed;
}

// Sale types for RPC
export type SaleBoleto = { 
  number: string; 
  due_date: string; 
  value: number; 
  observations?: string;
};

export type SaleCheque = { 
  bank?: string; 
  number?: string; 
  due_date: string; 
  value: number; 
  used_for_debt?: boolean;
  observations?: string;
};

export type CreateSalePayload = {
  date: string;
  delivery_date?: string;
  client: string;                  // Client name (text)
  seller_id?: string;              // UUID of seller
  custom_commission_rate?: number;
  products?: any[];
  observations?: string;
  total_value: number;
  payment_methods?: any[];
  payment_description?: string;
  payment_observations?: string;
  received_amount?: number;
  pending_amount?: number;
  status?: 'pago' | 'pendente' | 'parcial';
  boletos?: SaleBoleto[];
  cheques?: SaleCheque[];
};

// Sales Service
export const salesService = {
  async getAll(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(sale: Partial<Sale>): Promise<Sale> {
    console.log('🔄 Creating sale:', sale);
    
    // Critical validation before sending to Supabase
    if (!sale.client || typeof sale.client !== 'string' || sale.client.trim() === '') {
      throw new Error('Cliente é obrigatório e deve ser um texto válido');
    }
    
    if (!sale.totalValue || typeof sale.totalValue !== 'number' || sale.totalValue <= 0) {
      throw new Error('Valor total deve ser um número maior que zero');
    }
    
    // Validate seller_id specifically for UUID issues
    if (sale.sellerId !== undefined && sale.sellerId !== null) {
      if (typeof sale.sellerId !== 'string') {
        throw new Error('seller_id deve ser uma string UUID válida ou null');
      }
      
      const trimmedSellerId = sale.sellerId.trim();
      if (trimmedSellerId === '' || trimmedSellerId === 'null' || trimmedSellerId === 'undefined') {
        // Convert invalid values to null
        sale.sellerId = null;
      } else {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(trimmedSellerId)) {
          throw new Error(`seller_id inválido: "${trimmedSellerId}" não é um UUID válido`);
        }
        sale.sellerId = trimmedSellerId;
      }
    }
    
    // Transform to database format
    const dbData = transformToSnakeCase(sale);
    
    console.log('📝 Sale data after validation and cleaning:', dbData);
    
    // Use direct insert
    const { data, error } = await supabase
      .from('sales')
      .insert([dbData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Sales insert error:', error);
      throw new Error(`Erro ao criar venda: ${error.message}`);
    }
    
    console.log('✅ Sale created:', data);
    return transformToCamelCase(data);
  },

  async update(id: string, sale: Partial<Sale>): Promise<Sale> {
    const dbData = transformToSnakeCase(sale);
    const { data, error } = await supabase
      .from('sales')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Sale Boletos Service
export const saleBoletosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sale_boletos')
      .select(`
        *,
        sales!inner(client, date)
      `)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async markAsPaid(boletoId: string, paidAt?: string, interest?: number) {
    const { error } = await supabase.rpc('mark_sale_boleto_paid', {
      p_boleto_id: boletoId,
      p_paid_at: paidAt ? new Date(paidAt).toISOString() : null,
      p_interest: interest ?? 0
    });
    
    if (error) throw new Error(`Erro ao marcar boleto como pago: ${error.message}`);
  }
};

// Sale Cheques Service
export const saleChequesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sale_cheques')
      .select(`
        *,
        sales!inner(client, date)
      `)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async markAsPaid(chequeId: string, paidAt?: string) {
    const { error } = await supabase.rpc('mark_sale_cheque_paid', {
      p_cheque_id: chequeId,
      p_paid_at: paidAt ? new Date(paidAt).toISOString() : null
    });
    
    if (error) throw new Error(`Erro ao marcar cheque como pago: ${error.message}`);
  }
};

// Debts Service
export const debtsService = {
  async getAll(): Promise<Debt[]> {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const dbData = transformToSnakeCase(debt);
    const { data, error } = await supabase
      .from('debts')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, debt: Partial<Debt>): Promise<void> {
    const dbData = transformToSnakeCase(debt);
    const { error } = await supabase
      .from('debts')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Checks Service
export const checksService = {
  async getAll(): Promise<Check[]> {
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>): Promise<Check> {
    const dbData = transformToSnakeCase(check);
    const { data, error } = await supabase
      .from('checks')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, check: Partial<Check>): Promise<void> {
    const dbData = transformToSnakeCase(check);
    const { error } = await supabase
      .from('checks')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('checks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Boletos Service
export const boletosService = {
  async getAll(): Promise<Boleto[]> {
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Boleto> {
    const dbData = transformToSnakeCase(boleto);
    const { data, error } = await supabase
      .from('boletos')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, boleto: Partial<Boleto>): Promise<void> {
    const dbData = transformToSnakeCase(boleto);
    const { error } = await supabase
      .from('boletos')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employees Service
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const dbData = transformToSnakeCase(employee);
    const { data, error } = await supabase
      .from('employees')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, employee: Partial<Employee>): Promise<void> {
    const dbData = transformToSnakeCase(employee);
    const { error } = await supabase
      .from('employees')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Payments Service
export const employeePaymentsService = {
  async getAll(): Promise<EmployeePayment[]> {
    const { data, error } = await supabase
      .from('employee_payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeePayment> {
    const dbData = transformToSnakeCase(payment);
    const { data, error } = await supabase
      .from('employee_payments')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, payment: Partial<EmployeePayment>): Promise<void> {
    const dbData = transformToSnakeCase(payment);
    const { error } = await supabase
      .from('employee_payments')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Advances Service
export const employeeAdvancesService = {
  async getAll(): Promise<EmployeeAdvance[]> {
    const { data, error } = await supabase
      .from('employee_advances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeAdvance> {
    const dbData = transformToSnakeCase(advance);
    const { data, error } = await supabase
      .from('employee_advances')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, advance: Partial<EmployeeAdvance>): Promise<void> {
    const dbData = transformToSnakeCase(advance);
    const { error } = await supabase
      .from('employee_advances')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_advances')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Overtimes Service
export const employeeOvertimesService = {
  async getAll(): Promise<EmployeeOvertime[]> {
    const { data, error } = await supabase
      .from('employee_overtimes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeOvertime> {
    const dbData = transformToSnakeCase(overtime);
    const { data, error } = await supabase
      .from('employee_overtimes')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, overtime: Partial<EmployeeOvertime>): Promise<void> {
    const dbData = transformToSnakeCase(overtime);
    const { error } = await supabase
      .from('employee_overtimes')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_overtimes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Commissions Service
export const employeeCommissionsService = {
  async getAll(): Promise<EmployeeCommission[]> {
    const { data, error } = await supabase
      .from('employee_commissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeCommission> {
    const dbData = transformToSnakeCase(commission);
    const { data, error } = await supabase
      .from('employee_commissions')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, commission: Partial<EmployeeCommission>): Promise<void> {
    const dbData = transformToSnakeCase(commission);
    const { error } = await supabase
      .from('employee_commissions')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_commissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Cash Transactions Service
export const cashTransactionsService = {
  async getAll(): Promise<CashTransaction[]> {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashTransaction> {
    const dbData = transformToSnakeCase(transaction);
    const { data, error } = await supabase
      .from('cash_transactions')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, transaction: Partial<CashTransaction>): Promise<void> {
    const dbData = transformToSnakeCase(transaction);
    const { error } = await supabase
      .from('cash_transactions')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Cash Balances Service
export const cashBalancesService = {
  async get(): Promise<CashBalance | null> {
    const { data, error } = await supabase
      .from('cash_balances')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data ? transformToCamelCase(data) : null;
  },

  async create(balance: Omit<CashBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashBalance> {
    const dbData = transformToSnakeCase(balance);
    const { data, error } = await supabase
      .from('cash_balances')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  }
};

// PIX Fees Service
export const pixFeesService = {
  async getAll(): Promise<PixFee[]> {
    const { data, error } = await supabase
      .from('pix_fees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>): Promise<PixFee> {
    const dbData = transformToSnakeCase(fee);
    const { data, error } = await supabase
      .from('pix_fees')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, fee: Partial<PixFee>): Promise<void> {
    const dbData = transformToSnakeCase(fee);
    const { error } = await supabase
      .from('pix_fees')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pix_fees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Taxes Service
export const taxesService = {
  async getAll(): Promise<Tax[]> {
    const { data, error } = await supabase
      .from('taxes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const dbData = transformToSnakeCase(tax);
    const { data, error } = await supabase
      .from('taxes')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, tax: Partial<Tax>): Promise<void> {
    const dbData = transformToSnakeCase(tax);
    const { error } = await supabase
      .from('taxes')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('taxes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Agenda Events Service
export const agendaEventsService = {
  async getAll(): Promise<AgendaEvent[]> {
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async create(event: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendaEvent> {
    const dbData = transformToSnakeCase(event);
    const { data, error } = await supabase
      .from('agenda_events')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw error;
    return transformToCamelCase(data);
  },

  async update(id: string, event: Partial<AgendaEvent>): Promise<void> {
    const dbData = transformToSnakeCase(event);
    const { error } = await supabase
      .from('agenda_events')
      .update(dbData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agenda_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Image upload functions (for checks)
export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${checkId}_${imageType}.${fileExt}`;
  const filePath = `checks/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('check-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteCheckImage(imageUrl: string): Promise<void> {
  const path = imageUrl.split('/').pop();
  if (!path) return;

  const { error } = await supabase.storage
    .from('check-images')
    .remove([`checks/${path}`]);

  if (error) throw error;
}

export function getCheckImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) return imagePath;
  
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(`checks/${imagePath}`);

  return data.publicUrl;
}

// Reports and Views Service
export const reportsService = {
  async getBoletosReceber() {
    const { data, error } = await supabase
      .from('v_boletos_receber')
      .select('*');
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async getChequesReceber() {
    const { data, error } = await supabase
      .from('v_cheques_receber')
      .select('*');
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  },

  async getAReceber() {
    const { data, error } = await supabase
      .from('v_a_receber')
      .select('*');
    
    if (error) throw error;
    return (data || []).map(transformToCamelCase);
  }
};