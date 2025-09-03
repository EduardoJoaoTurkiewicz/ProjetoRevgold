import { supabase, isSupabaseConfigured } from './supabase';
import { AutomationService } from './automationService';
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

// Utility function to validate UUID format
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Handle different value types properly
    if (value === undefined) {
      transformed[snakeKey] = null;
    } else if (value === null) {
      transformed[snakeKey] = null;
    } else if (typeof value === 'string' && value.trim() === '') {
      transformed[snakeKey] = null;
    } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      // Keep objects and arrays as-is for JSONB fields - Supabase will handle serialization
      transformed[snakeKey] = value;
    } else {
      transformed[snakeKey] = value;
    }
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
    
    // Create database object directly without transformation
    const dbData = {
      sale_id: checkData.saleId || null,
      debt_id: checkData.debtId || null,
      client: checkData.client,
      value: checkData.value || 0,
      due_date: checkData.dueDate,
      status: checkData.status || 'pendente',
      is_own_check: checkData.isOwnCheck || false,
      observations: checkData.observations || null,
      used_for: checkData.usedFor || null,
      installment_number: checkData.installmentNumber || null,
      total_installments: checkData.totalInstallments || null,
      front_image: checkData.frontImage || null,
      back_image: checkData.backImage || null,
      selected_available_checks: checkData.selectedAvailableChecks || null,
      used_in_debt: checkData.usedInDebt || null,
      discount_date: checkData.discountDate || null,
      is_company_payable: checkData.isCompanyPayable || null,
      company_name: checkData.companyName || null,
      payment_date: checkData.paymentDate || null
    };
    
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
    
    // Create database object directly without transformation
    const dbData = {
      sale_id: boletoData.saleId || null,
      client: boletoData.client,
      value: boletoData.value || 0,
      due_date: boletoData.dueDate,
      status: boletoData.status || 'pendente',
      installment_number: boletoData.installmentNumber || 1,
      total_installments: boletoData.totalInstallments || 1,
      boleto_file: boletoData.boletoFile || null,
      observations: boletoData.observations || null,
      overdue_action: boletoData.overdueAction || null,
      interest_amount: boletoData.interestAmount || null,
      penalty_amount: boletoData.penaltyAmount || null,
      notary_costs: boletoData.notaryCosts || null,
      final_amount: boletoData.finalAmount || null,
      overdue_notes: boletoData.overdueNotes || null,
      is_company_payable: boletoData.isCompanyPayable || null,
      company_name: boletoData.companyName || null,
      payment_date: boletoData.paymentDate || null,
      interest_paid: boletoData.interestPaid || null
    };
    
    const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Boleto>(data);
  },
  
  async findDuplicate(boletoData: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Boleto | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .eq('client', boletoData.client)
      .eq('value', boletoData.value)
      .eq('due_date', boletoData.dueDate)
      .eq('installment_number', boletoData.installmentNumber || 1)
      .eq('total_installments', boletoData.totalInstallments || 1)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformDatabaseRow<Boleto>(data) : null;
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
    
    try {
      const { data, error } = await supabase
        .from('cash_balances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar saldo do caixa:', error);
        throw new Error(`Erro ao buscar saldo do caixa: ${error.message}`);
      }
      
      return data ? transformDatabaseRow<CashBalance>(data) : null;
    } catch (error) {
      console.error('Erro na busca do saldo:', error);
      throw error;
    }
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
    
    // Verificar se já existe um saldo
    const existingBalance = await this.get();
    if (existingBalance) {
      throw new Error('O caixa já foi inicializado. Use o botão "Recalcular" para atualizar o saldo.');
    }
    
    // Validate required fields
    if (typeof balance.currentBalance !== 'number') {
      throw new Error('Saldo atual deve ser um número válido');
    }
    
    if (typeof balance.initialBalance !== 'number') {
      throw new Error('Saldo inicial deve ser um número válido');
    }
    
    // Create database object directly to avoid transformation issues
    const dbData = {
      current_balance: balance.currentBalance,
      initial_balance: balance.initialBalance,
      initial_date: balance.initialDate || new Date().toISOString().split('T')[0],
      last_updated: balance.lastUpdated || new Date().toISOString()
    };
    
    console.log('🔄 Criando saldo do caixa:', dbData);
    
    const { data, error } = await supabase.from('cash_balances').insert([dbData]).select().single();
    if (error) {
      console.error('Erro ao criar saldo do caixa:', error);
      throw new Error(`Erro ao criar saldo do caixa: ${error.message}`);
    }
    
    console.log('✅ Saldo do caixa criado:', data);
    return transformDatabaseRow<CashBalance>(data);
  },

  async update(id: string, balance: Partial<CashBalance>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    // Create database object directly
    const dbData: any = {};
    
    if (typeof balance.currentBalance === 'number') {
      dbData.current_balance = balance.currentBalance;
    }
    
    if (typeof balance.initialBalance === 'number') {
      dbData.initial_balance = balance.initialBalance;
    }
    
    if (balance.initialDate) {
      dbData.initial_date = balance.initialDate;
    }
    
    // Ensure last_updated is always set
    dbData.last_updated = new Date().toISOString();
    
    console.log('🔄 Atualizando saldo do caixa:', dbData);
    
    const { error } = await supabase.from('cash_balances').update(dbData).eq('id', id);
    if (error) {
      console.error('Erro ao atualizar saldo do caixa:', error);
      throw new Error(`Erro ao atualizar saldo do caixa: ${error.message}`);
    }
    
    console.log('✅ Saldo do caixa atualizado');
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
    
    // Validate required fields
    if (!transaction.description || !transaction.description.trim()) {
      throw new Error('Descrição é obrigatória');
    }
    
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    
    if (!['entrada', 'saida'].includes(transaction.type)) {
      throw new Error('Tipo deve ser entrada ou saida');
    }
    
    // Create database object directly to avoid transformation issues
    const dbData = {
      date: transaction.date || new Date().toISOString().split('T')[0],
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description.trim(),
      category: transaction.category,
      related_id: transaction.relatedId || null,
      payment_method: transaction.paymentMethod || null
    };
    
    console.log('🔄 Criando transação de caixa:', dbData);
    
    const { data, error } = await supabase.from('cash_transactions').insert([dbData]).select().single();
    if (error) {
      console.error('Erro ao criar transação de caixa:', error);
      throw new Error(`Erro ao criar transação de caixa: ${error.message}`);
    }
    
    console.log('✅ Transação de caixa criada:', data);
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
    
    // Validate required fields
    if (!sale.client || !sale.client.trim()) {
      throw new Error('Cliente é obrigatório');
    }
    
    if (!sale.totalValue || sale.totalValue <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }
    
    if (!sale.paymentMethods || sale.paymentMethods.length === 0) {
      throw new Error('Pelo menos um método de pagamento é obrigatório');
    }
    
    // Validate payment methods structure
    for (const method of sale.paymentMethods) {
      if (!method.type || typeof method.type !== 'string') {
        throw new Error('Todos os métodos de pagamento devem ter um tipo válido');
      }
      if (typeof method.amount !== 'number' || method.amount < 0) {
        throw new Error('Todos os métodos de pagamento devem ter um valor válido');
      }
    }
    
    // Validate and clean sellerId - ensure it's either a valid UUID or null
    let cleanSellerId = null;
    if (sale.sellerId && typeof sale.sellerId === 'string') {
      const trimmedSellerId = sale.sellerId.trim();
      if (trimmedSellerId && trimmedSellerId !== '') {
        if (isValidUuid(trimmedSellerId)) {
          cleanSellerId = trimmedSellerId;
        } else {
          console.warn('Invalid UUID format for sellerId:', trimmedSellerId);
          cleanSellerId = null;
        }
      }
    }
    
    // Additional validation to ensure we never send empty strings to UUID fields
    if (cleanSellerId === '') {
        cleanSellerId = trimmedSellerId;
      cleanSellerId = null;
    }
    
    // Debug logging to inspect seller_id value
    console.log('🔍 Debug seller_id validation:', {
      original: sale.sellerId,
      cleaned: cleanSellerId,
      isValid: cleanSellerId ? isValidUuid(cleanSellerId) : 'null'
    });
    
    // Clean and validate all fields before database insertion
    const cleanedPaymentMethods = sale.paymentMethods.map(method => {
      const cleaned = { ...method };
      
      // Remove undefined and empty values
      Object.keys(cleaned).forEach(key => {
        const value = cleaned[key as keyof PaymentMethod];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          delete cleaned[key as keyof PaymentMethod];
        }
      });
      
      return cleaned;
    });
    
    // Create database object directly without transformation to avoid JSON issues
    const dbData = {
      date: sale.date,
      delivery_date: !sale.deliveryDate || sale.deliveryDate.trim() === '' ? null : sale.deliveryDate,
      client: sale.client.trim(),
      seller_id: cleanSellerId || null,
      custom_commission_rate: sale.customCommissionRate || 5,
      products: !sale.products || (typeof sale.products === 'string' && sale.products.trim() === '') ? 'Produtos vendidos' : sale.products,
      observations: !sale.observations || sale.observations.trim() === '' ? null : sale.observations.trim(),
      total_value: sale.totalValue,
      payment_methods: cleanedPaymentMethods, // Keep as object for JSONB
      payment_description: !sale.paymentDescription || sale.paymentDescription.trim() === '' ? null : sale.paymentDescription.trim(),
      payment_observations: !sale.paymentObservations || sale.paymentObservations.trim() === '' ? null : sale.paymentObservations.trim(),
      received_amount: sale.receivedAmount || 0,
      pending_amount: sale.pendingAmount || 0,
      status: sale.status || 'pendente'
    };
    
    console.log('🔄 Dados limpos para criação da venda:', dbData);
    
    // Additional debug for seller_id specifically
    console.log('🔍 Final seller_id value:', {
      value: dbData.seller_id,
      type: typeof dbData.seller_id,
      isNull: dbData.seller_id === null,
      isUuid: dbData.seller_id ? isValidUuid(dbData.seller_id) : false
    });
    
    const { data, error } = await supabase
      .from('sales')
      .insert(dbData)
      .select()
      .single();
    if (error) {
      console.error('Erro ao criar venda:', error);
      
      // Provide more specific error messages
      if (error.code === '23505') {
        throw new Error('Esta venda já existe no sistema. Verifique se não há duplicatas.');
      } else if (error.code === '23503') {
        throw new Error('Vendedor selecionado não existe. Verifique se o vendedor está ativo.');
      } else if (error.message.includes('invalid input syntax')) {
        throw new Error('Dados inválidos. Verifique os valores inseridos, especialmente datas e números.');
      } else if (error.message.includes('violates check constraint')) {
        throw new Error('Dados violam regras do sistema. Verifique se todos os valores estão corretos.');
      } else if (error.message.includes('operator does not exist: uuid = text')) {
        throw new Error('Erro de tipo de dados. Verifique se o vendedor foi selecionado corretamente.');
      } else {
        throw new Error(`Erro ao criar venda: ${error.message}`);
      }
    }
    
    const newSale = transformDatabaseRow<Sale>(data);
    
    // Create checks and boletos automatically
    try {
      await AutomationService.createChecksForSale(newSale);
      await AutomationService.createBoletosForSale(newSale);
    } catch (automationError) {
      console.warn('Erro na automação (não crítico):', automationError);
      // Don't throw automation errors as they're not critical for sale creation
    }
    
    return newSale;
  },

  async update(id: string, sale: Partial<Sale>): Promise<Sale> {
    if (!isSupabaseConfigured()) return;
    
    // Validate and clean sellerId for updates too
    let cleanSellerId: string | null | undefined = undefined;
    if (sale.sellerId !== undefined) {
      if (!sale.sellerId || sale.sellerId === '' || sale.sellerId.trim() === '') {
        cleanSellerId = null;
      } else if (typeof sale.sellerId === 'string') {
        const trimmedSellerId = sale.sellerId.trim();
        if (!trimmedSellerId || trimmedSellerId === '' || !isValidUuid(trimmedSellerId)) {
          cleanSellerId = null;
        } else {
          cleanSellerId = trimmedSellerId;
        }
      }
    }
    
    // Debug logging for updates
    if (sale.sellerId !== undefined) {
      console.log('🔍 Debug seller_id update validation:', {
        original: sale.sellerId,
        cleaned: cleanSellerId,
        isValid: cleanSellerId ? cleanSellerId.length > 0 : 'null'
      });
    }
    
    // Clean payment methods for updates
    let cleanedPaymentMethods = undefined;
    if (sale.paymentMethods) {
      cleanedPaymentMethods = sale.paymentMethods.map(method => {
        const cleaned = { ...method };
        
        // Remove undefined and empty values
        Object.keys(cleaned).forEach(key => {
          const value = cleaned[key as keyof PaymentMethod];
          if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
            delete cleaned[key as keyof PaymentMethod];
          }
        });
        
        return cleaned;
      });
    }
    
    // Create database object directly without transformation to avoid JSON issues
    const dbData: any = {};
    
    if (sale.date) dbData.date = sale.date;
    if (sale.deliveryDate !== undefined) dbData.delivery_date = !sale.deliveryDate || sale.deliveryDate.trim() === '' ? null : sale.deliveryDate;
    if (sale.client) dbData.client = sale.client.trim();
    if (sale.sellerId !== undefined) {
      dbData.seller_id = cleanSellerId;
    }
    if (sale.customCommissionRate !== undefined) dbData.custom_commission_rate = sale.customCommissionRate;
    if (sale.products !== undefined) dbData.products = !sale.products || (typeof sale.products === 'string' && sale.products.trim() === '') ? 'Produtos vendidos' : sale.products;
    if (sale.observations !== undefined) dbData.observations = !sale.observations || sale.observations.trim() === '' ? null : sale.observations.trim();
    if (sale.totalValue) dbData.total_value = sale.totalValue;
    if (cleanedPaymentMethods) dbData.payment_methods = cleanedPaymentMethods; // Keep as object for JSONB
    if (sale.paymentDescription !== undefined) dbData.payment_description = !sale.paymentDescription || sale.paymentDescription.trim() === '' ? null : sale.paymentDescription.trim();
    if (sale.paymentObservations !== undefined) dbData.payment_observations = !sale.paymentObservations || sale.paymentObservations.trim() === '' ? null : sale.paymentObservations.trim();
    if (sale.receivedAmount !== undefined) dbData.received_amount = sale.receivedAmount;
    if (sale.pendingAmount !== undefined) dbData.pending_amount = sale.pendingAmount;
    if (sale.status) dbData.status = sale.status;
    
    console.log('🔄 Dados limpos para atualização da venda:', dbData);
    
    // Additional debug for seller_id in updates
    if (dbData.seller_id !== undefined) {
      console.log('🔍 Final seller_id update value:', {
        value: dbData.seller_id,
        type: typeof dbData.seller_id,
        isNull: dbData.seller_id === null,
        isUuid: dbData.seller_id ? isValidUuid(dbData.seller_id) : false
      });
    }
    
    const { data, error } = await supabase
      .from('sales')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Erro ao atualizar venda:', error);
      
      // Provide more specific error messages for updates
      if (error.code === '23505') {
        throw new Error('Não é possível atualizar: dados duplicados detectados.');
      } else if (error.code === '23503') {
        throw new Error('Vendedor selecionado não existe ou foi removido.');
      } else if (error.message.includes('operator does not exist: uuid = text')) {
        throw new Error('Erro de tipo de dados. Verifique se o vendedor foi selecionado corretamente.');
      } else {
        throw new Error(`Erro ao atualizar venda: ${error.message}`);
      }
    }
    
    return transformDatabaseRow<Sale>(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar venda:', error);
      throw new Error(`Erro ao deletar venda: ${error.message}`);
    }
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
    
    // Validate required fields
    if (!debt.company || !debt.company.trim()) {
      throw new Error('Empresa é obrigatória');
    }
    
    if (!debt.description || !debt.description.trim()) {
      throw new Error('Descrição é obrigatória');
    }
    
    if (!debt.totalValue || debt.totalValue <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }
    
    // Validate payment methods structure
    if (debt.paymentMethods && debt.paymentMethods.length > 0) {
      for (const method of debt.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          throw new Error('Todos os métodos de pagamento devem ter um tipo válido');
        }
        if (typeof method.amount !== 'number' || method.amount < 0) {
          throw new Error('Todos os métodos de pagamento devem ter um valor válido');
        }
      }
    }
    
    // Create database object directly without transformation to avoid JSON issues
    const dbData = {
      date: debt.date,
      company: debt.company.trim(),
      description: debt.description.trim(),
      total_value: debt.totalValue,
      payment_methods: debt.paymentMethods || [], // Keep as object for JSONB
      is_paid: debt.isPaid || false,
      paid_amount: debt.paidAmount || 0,
      pending_amount: debt.pendingAmount || 0,
      payment_description: debt.paymentDescription && debt.paymentDescription.trim() !== '' ? debt.paymentDescription.trim() : null,
      debt_payment_description: debt.debtPaymentDescription && debt.debtPaymentDescription.trim() !== '' ? debt.debtPaymentDescription.trim() : null,
      checks_used: debt.checksUsed && debt.checksUsed.length > 0 ? debt.checksUsed : null // Keep as array for JSONB
    };
    
    const { data, error } = await supabase.from('debts').insert([dbData]).select().single();
    if (error) {
      console.error('Erro ao criar dívida:', error);
      throw new Error(`Erro ao criar dívida: ${error.message}`);
    }
    return transformDatabaseRow<Debt>(data);
  },

  async update(id: string, debt: Partial<Debt>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    // Create database object directly without transformation to avoid JSON issues
    const dbData: any = {};
    
    if (debt.date) dbData.date = debt.date;
    if (debt.company) dbData.company = debt.company.trim();
    if (debt.description) dbData.description = debt.description.trim();
    if (debt.totalValue) dbData.total_value = debt.totalValue;
    if (debt.paymentMethods) dbData.payment_methods = debt.paymentMethods; // Keep as object for JSONB
    if (debt.isPaid !== undefined) dbData.is_paid = debt.isPaid;
    if (debt.paidAmount !== undefined) dbData.paid_amount = debt.paidAmount;
    if (debt.pendingAmount !== undefined) dbData.pending_amount = debt.pendingAmount;
    if (debt.paymentDescription !== undefined) dbData.payment_description = debt.paymentDescription && debt.paymentDescription.trim() !== '' ? debt.paymentDescription.trim() : null;
    if (debt.debtPaymentDescription !== undefined) dbData.debt_payment_description = debt.debtPaymentDescription && debt.debtPaymentDescription.trim() !== '' ? debt.debtPaymentDescription.trim() : null;
    if (debt.checksUsed !== undefined) dbData.checks_used = debt.checksUsed && debt.checksUsed.length > 0 ? debt.checksUsed : null; // Keep as array for JSONB
    
    const { error } = await supabase.from('debts').update(dbData).eq('id', id);
    if (error) {
      console.error('Erro ao atualizar dívida:', error);
      throw new Error(`Erro ao atualizar dívida: ${error.message}`);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar dívida:', error);
      throw new Error(`Erro ao deletar dívida: ${error.message}`);
    }
  }
};

export const taxesService = {
  async getAll(): Promise<Tax[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('taxes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<Tax>);
  },

  async create(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    if (!isSupabaseConfigured()) {
      return {
        ...tax,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(tax);
    const { data, error } = await supabase.from('taxes').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<Tax>(data);
  },

  async update(id: string, tax: Partial<Tax>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(tax);
    const { error } = await supabase.from('taxes').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('taxes').delete().eq('id', id);
    if (error) throw error;
  }
};

export const agendaEventsService = {
  async getAll(): Promise<AgendaEvent[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transformDatabaseRow<AgendaEvent>);
  },

  async create(event: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendaEvent> {
    if (!isSupabaseConfigured()) {
      return {
        ...event,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    const dbData = transformToDatabase(event);
    const { data, error } = await supabase.from('agenda_events').insert([dbData]).select().single();
    if (error) throw error;
    return transformDatabaseRow<AgendaEvent>(data);
  },

  async update(id: string, event: Partial<AgendaEvent>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const dbData = transformToDatabase(event);
    const { error } = await supabase.from('agenda_events').update(dbData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase.from('agenda_events').delete().eq('id', id);
    if (error) throw error;
  }
};

// Utilitários para caixa via RPC
export const cashUtils = {
  async recalc(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase não configurado, pulando recálculo');
      return;
    }
    
    const { error } = await supabase.rpc('recalculate_cash_balance');
    if (error) {
      console.error('Erro no RPC recalculate_cash_balance:', error);
      throw error;
    }
  },
  
  async initialize(initialAmount: number): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase não configurado, pulando inicialização');
      return;
    }
    
    const { error } = await supabase.rpc('initialize_cash_balance', { initial_amount: initialAmount });
    if (error) {
      console.error('Erro no RPC initialize_cash_balance:', error);
      throw error;
    }
  },
  
  async getCurrentBalance(): Promise<CashBalance | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase.rpc('get_current_cash_balance');
    if (error) {
      console.error('Erro no RPC get_current_cash_balance:', error);
      throw error;
    }
    
    return data && data.length > 0 ? transformDatabaseRow<CashBalance>(data[0]) : null;
  }
};