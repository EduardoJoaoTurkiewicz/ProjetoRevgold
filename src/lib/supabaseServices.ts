import { supabase } from './supabase';
import type { Database } from './database.types';

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
    return data;
  },

  async create(sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Sale>) {
    const { data, error } = await supabase
      .from('sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

// Employee Commissions Services
export const commissionsService = {
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
  }
};

// Employee Payments Services
export const employeePaymentsService = {
  async getAll() {
    const { data, error } = await supabase
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