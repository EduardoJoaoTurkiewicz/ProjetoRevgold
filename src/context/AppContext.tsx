import { supabase, isSupabaseConfigured } from './supabase';
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
  Tax
} from '../types';

// Utility function to transform database row to app type
function transformDatabaseRow<T>(row: any): T {
  if (!row) return row;
  
  // Transform snake_case to camelCase
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[camelKey] = value;
  }
  
  return transformed as T;
}

// Transform app type to database format
function transformToDatabase(obj: any): any {
  if (!obj) return obj;
  
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    transformed[snakeKey] = value;
  }
  
  return transformed;
}

// Image handling functions for check images
export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${checkId}-${imageType}-${Date.now()}.${fileExt}`;
  const filePath = `check-images/${fileName}`;

  const { error } = await supabase.storage
    .from('check-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Erro no upload:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  console.log('✅ Upload realizado com sucesso:', filePath);
  return filePath;
}

export async function deleteCheckImage(filePath: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente.');
  }

  const { error } = await supabase.storage
    .from('check-images')
    .remove([filePath]);

  if (error) {
    console.error('Erro ao deletar imagem:', error);
    throw new Error(`Erro ao deletar imagem: ${error.message}`);
  }

  console.log('✅ Imagem deletada com sucesso:', filePath);
}

export function getCheckImageUrl(filePath: string): string {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado, retornando URL de fallback');
    return '/logo-fallback.svg';
  }

  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Service objects for automation
export const checksService = {
  async create(checkData: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!isSupabaseConfigured()) {
      // Return mock data for local development
      return {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(checkData);
    const { data, error } = await supabase.from('checks').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Check>(data);
  },
  
  async getAll(): Promise<Check[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Check>);
  },

  async update(id: string, checkData: Partial<Check>) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    
    const dbData = transformToDatabase(checkData);
    const { error } = await supabase.from('checks').update(dbData).eq('id', id);
    if (error) throw error;
  },
  
  async delete(id: string) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) throw error;
  }
};

export const boletosService = {
  async create(boletoData: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!isSupabaseConfigured()) {
      // Return mock data for local development
      return {
        ...boletoData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(boletoData);
    const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Boleto>(data);
  },
  
  async getAll(): Promise<Boleto[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Boleto>);
  },

  async update(id: string, boletoData: Partial<Boleto>) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    
    const dbData = transformToDatabase(boletoData);
    const { error } = await supabase.from('boletos').update(dbData).eq('id', id);
    if (error) throw error;
  },
  
  async delete(id: string) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw error;
  }
};

export const employeeCommissionsService = {
  async getAll(): Promise<EmployeeCommission[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('employee_commissions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<EmployeeCommission>);
  },

  async create(commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeCommission> {
    if (!isSupabaseConfigured()) {
      return {
        ...commission,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(commission);
    const { data, error } = await supabase.from('employee_commissions').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<EmployeeCommission>(data);
  },

  async update(id: string, commission: Partial<EmployeeCommission>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(commission);
    const { error } = await supabase.from('employee_commissions').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('employee_commissions').delete().eq('id', id);
    if (error) throw error;
  }
};

export const employeePaymentsService = {
  async getAll(): Promise<EmployeePayment[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('employee_payments')
      .select('*')
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<EmployeePayment>);
  },

  async create(payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeePayment> {
    if (!isSupabaseConfigured()) {
      return {
        ...payment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(payment);
    const { data, error } = await supabase.from('employee_payments').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<EmployeePayment>(data);
  },

  async update(id: string, payment: Partial<EmployeePayment>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(payment);
    const { error } = await supabase.from('employee_payments').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('employee_payments').delete().eq('id', id);
    if (error) throw error;
  }
};

export const employeeAdvancesService = {
  async getAll(): Promise<EmployeeAdvance[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('employee_advances')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<EmployeeAdvance>);
  },

  async create(advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeAdvance> {
    if (!isSupabaseConfigured()) {
      return {
        ...advance,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(advance);
    const { data, error } = await supabase.from('employee_advances').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<EmployeeAdvance>(data);
  },

  async update(id: string, advance: Partial<EmployeeAdvance>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(advance);
    const { error } = await supabase.from('employee_advances').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('employee_advances').delete().eq('id', id);
    if (error) throw error;
  }
};

export const employeeOvertimesService = {
  async getAll(): Promise<EmployeeOvertime[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('employee_overtimes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<EmployeeOvertime>);
  },

  async create(overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeOvertime> {
    if (!isSupabaseConfigured()) {
      return {
        ...overtime,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(overtime);
    const { data, error } = await supabase.from('employee_overtimes').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<EmployeeOvertime>(data);
  },

  async update(id: string, overtime: Partial<EmployeeOvertime>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(overtime);
    const { error } = await supabase.from('employee_overtimes').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('employee_overtimes').delete().eq('id', id);
    if (error) throw error;
  }
};

export const cashBalancesService = {
  async get(): Promise<CashBalance | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('cash_balances')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformDatabaseRow<CashBalance>(data) : null;
  },

  async create(balance: Omit<CashBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashBalance> {
    if (!isSupabaseConfigured()) {
      return {
        ...balance,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(balance);
    const { data, error } = await supabase.from('cash_balances').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<CashBalance>(data);
  },

  async update(id: string, balance: Partial<CashBalance>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(balance);
    const { error } = await supabase.from('cash_balances').update(dbData).eq('id', id);
    if (error) throw error;
  }
};

export const pixFeesService = {
  async getAll(): Promise<PixFee[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('pix_fees')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<PixFee>);
  },

  async create(fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>): Promise<PixFee> {
    if (!isSupabaseConfigured()) {
      return {
        ...fee,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(fee);
    const { data, error } = await supabase.from('pix_fees').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<PixFee>(data);
  },

  async update(id: string, fee: Partial<PixFee>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(fee);
    const { error } = await supabase.from('pix_fees').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('pix_fees').delete().eq('id', id);
    if (error) throw error;
  }
};

export const cashTransactionsService = {
  async getAll(): Promise<CashTransaction[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<CashTransaction>);
  },

  async create(transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashTransaction> {
    if (!isSupabaseConfigured()) {
      return {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(transaction);
    const { data, error } = await supabase.from('cash_transactions').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<CashTransaction>(data);
  },

  async update(id: string, transaction: Partial<CashTransaction>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(transaction);
    const { error } = await supabase.from('cash_transactions').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
    if (error) throw error;
  }
};

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Employee>);
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    if (!isSupabaseConfigured()) {
      return {
        ...employee,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(employee);
    const { data, error } = await supabase.from('employees').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Employee>(data);
  },

  async update(id: string, employee: Partial<Employee>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(employee);
    const { error } = await supabase.from('employees').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  }
};

export const salesService = {
  async getAll(): Promise<Sale[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Sale>);
  },

  async create(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
    if (!isSupabaseConfigured()) {
      return {
        ...sale,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(sale);
    const { data, error } = await supabase.from('sales').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Sale>(data);
  },

  async update(id: string, sale: Partial<Sale>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(sale);
    const { error } = await supabase.from('sales').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
  }
};

export const debtsService = {
  async getAll(): Promise<Debt[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Debt>);
  },

  async create(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    if (!isSupabaseConfigured()) {
      return {
        ...debt,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(debt);
    const { data, error } = await supabase.from('debts').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Debt>(data);
  },

  async update(id: string, debt: Partial<Debt>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(debt);
    const { error } = await supabase.from('debts').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
  }
};

export const taxesService = {
  async getAll(): Promise<Tax[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('taxes')
      .select('*')
      .order('date', { ascending: false });
    
  };
}