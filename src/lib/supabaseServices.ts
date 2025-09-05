import { supabase } from './supabase';
import type { Database } from './database.types';

// Helper function to validate UUID format
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Helper function to sanitize payload data, especially UUID fields
export const sanitizePayload = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sanitized.hasOwnProperty(key)) {
      const value = sanitized[key];
      
      // Check if this is a UUID field (ends with _id or is exactly 'id')
      if (key.endsWith('_id') || key === 'id') {
        if (value === '' || value === null || value === undefined) {
          // Convert empty strings, null, or undefined to null
          sanitized[key] = null;
        } else if (typeof value === 'string' && !isValidUUID(value)) {
          // Log warning for invalid UUID strings and convert to null
          console.warn(`Invalid UUID format for field '${key}': '${value}'. Converting to null.`);
          sanitized[key] = null;
        }
        // Otherwise, keep the original value (valid UUID)
      }
      // For all other keys, keep the original value
    }
  }

  return sanitized;
};

// Helper function to map frontend fields to database fields
export const mapSaleFieldsToDatabase = (saleData: any): any => {
  if (!saleData || typeof saleData !== 'object') {
    return saleData;
  }

  const mapped = { ...saleData };

  // Map camelCase frontend fields to snake_case database fields
  const fieldMappings = {
    deliveryDate: 'delivery_date',
    sellerId: 'seller_id',
    totalValue: 'total_value',
    paymentMethods: 'payment_methods',
    receivedAmount: 'received_amount',
    pendingAmount: 'pending_amount',
    paymentDescription: 'payment_description',
    paymentObservations: 'payment_observations',
    customCommissionRate: 'custom_commission_rate',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  };

  // Apply field mappings
  for (const [frontendField, dbField] of Object.entries(fieldMappings)) {
    if (frontendField in mapped) {
      mapped[dbField] = mapped[frontendField];
      delete mapped[frontendField];
    }
  }

  // Handle special cases
  if ('delivery_date' in mapped) {
    // Ensure delivery_date is properly formatted or null
    if (!mapped.delivery_date || mapped.delivery_date.trim() === '') {
      mapped.delivery_date = null;
    }
  }

  if ('seller_id' in mapped) {
    // Ensure seller_id is properly formatted or null
    if (!mapped.seller_id || mapped.seller_id.toString().trim() === '') {
      mapped.seller_id = null;
    }
  }

  return mapped;
};

// Helper function to map database fields back to frontend fields
export const mapSaleFieldsFromDatabase = (dbData: any): any => {
  if (!dbData || typeof dbData !== 'object') {
    return dbData;
  }

  const mapped = { ...dbData };

  // Map snake_case database fields to camelCase frontend fields
  const fieldMappings = {
    delivery_date: 'deliveryDate',
    seller_id: 'sellerId',
    total_value: 'totalValue',
    payment_methods: 'paymentMethods',
    received_amount: 'receivedAmount',
    pending_amount: 'pendingAmount',
    payment_description: 'paymentDescription',
    payment_observations: 'paymentObservations',
    custom_commission_rate: 'custom_commission_rate', // Keep as is for now
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  };

  // Apply field mappings
  for (const [dbField, frontendField] of Object.entries(fieldMappings)) {
    if (dbField in mapped) {
      mapped[frontendField] = mapped[dbField];
      delete mapped[dbField];
    }
  }

  return mapped;
};
// Add missing CreateSalePayload type
export interface CreateSalePayload {
  date: string;
  deliveryDate?: string | null;
  client: string;
  sellerId?: string | null;
  products?: string | any[] | null;
  observations?: string | null;
  totalValue: number;
  paymentMethods: any[];
  paymentDescription?: string | null;
  paymentObservations?: string | null;
  receivedAmount: number;
  pendingAmount: number;
  status: 'pago' | 'pendente' | 'parcial';
  custom_commission_rate?: number;
}

// Add missing SaleBoleto and SaleCheque types
export interface SaleBoleto {
  number: string;
  due_date: string;
  value: number;
  observations?: string;
}

export interface SaleCheque {
  bank?: string;
  number?: string;
  due_date: string;
  value: number;
  used_for_debt: boolean;
  observations?: string;
}

// Image Upload Services
export const uploadCheckImage = async (file: File, checkId: string, type: 'front' | 'back'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${checkId}_${type}.${fileExt}`;
  const filePath = `checks/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('check_images')
    .upload(filePath, file, {
      upsert: true
    });

  if (uploadError) throw uploadError;
  return filePath;
};

export const deleteCheckImage = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('check_images')
    .remove([filePath]);

  if (error) throw error;
};

export const getCheckImageUrl = async (filePath: string): Promise<string> => {
  const { data } = supabase.storage
    .from('check_images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

type Tables = Database['public']['Tables'];
type Sale = Tables['sales']['Row'];
type Debt = Tables['debts']['Row'];
type Employee = Tables['employees']['Row'];
type Check = Tables['checks']['Row'];
type Boleto = Tables['boletos']['Row'];
type CashTransaction = Tables['cash_transactions']['Row'];
type AgendaEvent = Tables['agenda_events']['Row'];
type Tax = Tables['taxes']['Row'];
type PixFee = Tables['pix_fees']['Row'];

// Sales Services
export const salesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    // Map database fields to frontend fields
    return data.map(mapSaleFieldsFromDatabase);
  },

  async create(sale: any) {
    console.log('🔄 salesService.create - dados recebidos:', sale);
    
    // First sanitize UUID fields
    const sanitizedSale = sanitizePayload(sale);
    console.log('🔧 Após sanitização UUID:', sanitizedSale);
    
    // Then map frontend fields to database fields
    const mappedSale = mapSaleFieldsToDatabase(sanitizedSale);
    console.log('🗃️ Dados mapeados para o banco:', mappedSale);
    
    const { data, error } = await supabase
      .from('sales')
      .insert(mappedSale)
      .select()
      .single();
    
    if (error) throw error;
    
    // Map response back to frontend format
    return mapSaleFieldsFromDatabase(data);
  },

  async update(id: string, updates: any) {
    console.log('🔄 salesService.update - dados recebidos:', updates);
    
    // First sanitize UUID fields
    const sanitizedUpdates = sanitizePayload(updates);
    console.log('🔧 Após sanitização UUID:', sanitizedUpdates);
    
    // Then map frontend fields to database fields
    const mappedUpdates = mapSaleFieldsToDatabase(sanitizedUpdates);
    console.log('🗃️ Dados mapeados para o banco:', mappedUpdates);
    
    const { data, error } = await supabase
      .from('sales')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Map response back to frontend format
    return mapSaleFieldsFromDatabase(data);
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Debts Services
export const debtsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('debts')
      .insert(debt)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Debt>) {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employees Services
export const employeesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Checks Services
export const checksService = {
  async getAll() {
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(check: Omit<Check, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('checks')
      .insert(check)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Check>) {
    const { data, error } = await supabase
      .from('checks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('checks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Boletos Services
export const boletosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(boleto: Omit<Boleto, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('boletos')
      .insert(boleto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Boleto>) {
    const { data, error } = await supabase
      .from('boletos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Cash Transactions Services
export const cashTransactionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(transaction: Omit<CashTransaction, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('cash_transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<CashTransaction>) {
    const { data, error } = await supabase
      .from('cash_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCurrentBalance() {
    const { data, error } = await supabase
      .from('cash_balances')
      .select('current_balance')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data?.current_balance || 0;
  }
};

// Cash Balances Services
export const cashBalancesService = {
  async get() {
    const { data, error } = await supabase
      .from('cash_balances')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(balance: Omit<Tables['cash_balances']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('cash_balances')
      .insert(balance)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['cash_balances']['Row']>) {
    const { data, error } = await supabase
      .from('cash_balances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Sale Boletos Services
export const saleBoletosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sale_boletos')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(boleto: Omit<Tables['sale_boletos']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sale_boletos')
      .insert(boleto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['sale_boletos']['Row']>) {
    const { data, error } = await supabase
      .from('sale_boletos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sale_boletos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAsPaid(boletoId: string, paidAt?: string, interest?: number) {
    const updates: any = {
      status: 'pago',
      paid_at: paidAt || new Date().toISOString()
    };
    
    if (interest !== undefined) {
      updates.interest = interest;
    }
    
    const { data, error } = await supabase
      .from('sale_boletos')
      .update(updates)
      .eq('id', boletoId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Sale Cheques Services
export const saleChequesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sale_cheques')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(cheque: Omit<Tables['sale_cheques']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sale_cheques')
      .insert(cheque)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['sale_cheques']['Row']>) {
    const { data, error } = await supabase
      .from('sale_cheques')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sale_cheques')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAsPaid(chequeId: string, paidAt?: string) {
    const updates = {
      status: 'pago',
      paid_at: paidAt || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('sale_cheques')
      .update(updates)
      .eq('id', chequeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Agenda Events Services
export const agendaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(event: Omit<AgendaEvent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('agenda_events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<AgendaEvent>) {
    const { data, error } = await supabase
      .from('agenda_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('agenda_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Taxes Services
export const taxesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('taxes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(tax: Omit<Tax, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('taxes')
      .insert(tax)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tax>) {
    const { data, error } = await supabase
      .from('taxes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('taxes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// PIX Fees Services
export const pixFeesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('pix_fees')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(fee: Omit<PixFee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pix_fees')
      .insert(fee)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<PixFee>) {
    const { data, error } = await supabase
      .from('pix_fees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('pix_fees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Add missing services that are referenced in context
export const employeePaymentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employee_payments')
      .select('*')
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(payment: Omit<Tables['employee_payments']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employee_payments')
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['employee_payments']['Row']>) {
    const { data, error } = await supabase
      .from('employee_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employee_payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const employeeAdvancesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employee_advances')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(advance: Omit<Tables['employee_advances']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employee_advances')
      .insert(advance)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['employee_advances']['Row']>) {
    const { data, error } = await supabase
      .from('employee_advances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employee_advances')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const employeeOvertimesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employee_overtimes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(overtime: Omit<Tables['employee_overtimes']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employee_overtimes')
      .insert(overtime)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['employee_overtimes']['Row']>) {
    const { data, error } = await supabase
      .from('employee_overtimes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employee_overtimes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Commissions Services
export const employeeCommissionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employee_commissions')
      .select(`
        *,
        employees(name),
        sales(client, date, total_value)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('employee_commissions')
      .select(`
        *,
        sales(client, date, total_value)
      `)
      .eq('employee_id', employeeId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(commission: Omit<Tables['employee_commissions']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employee_commissions')
      .insert(commission)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Tables['employee_commissions']['Row']>) {
    const { data, error } = await supabase
      .from('employee_commissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employee_commissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Payments Services
export const employeePaymentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employee_payments')
      .select(`
        *,
        employees(name, position)
      `)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(payment: Omit<Tables['employee_payments']['Row'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
  async delete(id: string) {
    const { error } = await supabase
      .from('employee_payments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Reports Services
export const reportsService = {
  async getSalesReport(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getCashFlowReport(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getReceivablesReport() {
    const { data, error } = await supabase
      .from('v_a_receber')
      .select('*');
    
    if (error) throw error;
    return data;
  }
};