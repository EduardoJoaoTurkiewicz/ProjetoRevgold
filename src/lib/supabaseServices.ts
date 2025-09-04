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
    
    // Special handling for UUID fields - convert empty strings to null
    if ((snakeKey === 'seller_id' || snakeKey.endsWith('_id')) && 
        (value === '' || value === 'null' || value === 'undefined')) {
      transformed[snakeKey] = null;
    } else if (value === '' || value === null || value === undefined) {
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
  client: string;
  seller_id?: string | null;
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
    
    // CRITICAL: Fix sellerId empty string issue BEFORE transformation
    if (sale.sellerId === '' || sale.sellerId === 'null' || sale.sellerId === 'undefined') {
      sale.sellerId = null;
    }
    
    // Transform to database format with proper UUID handling
    const dbData = transformToSnakeCase(sale);
    
    console.log('📝 Sale data after transformation:', dbData);
    
    // Create the sale first
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([dbData])
      .select()
      .single();
    
    if (saleError) {
      console.error('❌ Sales insert error:', saleError);
      throw new Error(`Erro ao criar venda: ${saleError.message}`);
    }
    
    console.log('✅ Sale created:', saleData);
    
    // Now create boletos and cheques based on payment methods
    await createBoletosAndChequesFromSale(saleData, sale.paymentMethods || []);
    
    return transformToCamelCase(saleData);
  },

  async update(id: string, sale: Partial<Sale>): Promise<Sale> {
    // Fix sellerId for updates too
    if (sale.sellerId === '' || sale.sellerId === 'null' || sale.sellerId === 'undefined') {
      sale.sellerId = null;
    }
    
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

// Function to create boletos and cheques from sale payment methods
async function createBoletosAndChequesFromSale(saleData: any, paymentMethods: any[]) {
  console.log('🔄 Creating boletos and cheques for sale:', saleData.id);
  
  for (const method of paymentMethods) {
    if (method.type === 'boleto' && method.installments && method.installments > 1) {
      // Create multiple boletos
      for (let i = 1; i <= method.installments; i++) {
        const dueDate = new Date(method.firstInstallmentDate || saleData.date);
        dueDate.setDate(dueDate.getDate() + (i - 1) * (method.installmentInterval || 30));
        
        const boletoData = {
          sale_id: saleData.id,
          client: saleData.client,
          value: method.installmentValue || (method.amount / method.installments),
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          installment_number: i,
          total_installments: method.installments,
          observations: `Parcela ${i}/${method.installments} da venda para ${saleData.client}`,
          is_company_payable: false
        };
        
        const { error } = await supabase.from('boletos').insert([boletoData]);
        if (error) {
          console.error('Error creating boleto:', error);
        }
      }
    } else if (method.type === 'boleto') {
      // Single boleto
      const boletoData = {
        sale_id: saleData.id,
        client: saleData.client,
        value: method.amount,
        due_date: method.firstInstallmentDate || saleData.date,
        status: 'pendente',
        installment_number: 1,
        total_installments: 1,
        observations: `Boleto da venda para ${saleData.client}`,
        is_company_payable: false
      };
      
      const { error } = await supabase.from('boletos').insert([boletoData]);
      if (error) {
        console.error('Error creating single boleto:', error);
      }
    }
    
    if (method.type === 'cheque' && method.installments && method.installments > 1) {
      // Create multiple cheques
      for (let i = 1; i <= method.installments; i++) {
        const dueDate = new Date(method.firstInstallmentDate || saleData.date);
        dueDate.setDate(dueDate.getDate() + (i - 1) * (method.installmentInterval || 30));
        
        const checkData = {
          sale_id: saleData.id,
          client: saleData.client,
          value: method.installmentValue || (method.amount / method.installments),
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          is_own_check: method.isOwnCheck || false,
          installment_number: i,
          total_installments: method.installments,
          observations: `Parcela ${i}/${method.installments} da venda para ${saleData.client}`,
          used_for: `Venda para ${saleData.client}`,
          is_company_payable: false
        };
        
        const { error } = await supabase.from('checks').insert([checkData]);
        if (error) {
          console.error('Error creating check:', error);
        }
      }
    } else if (method.type === 'cheque') {
      // Single cheque
      const checkData = {
        sale_id: saleData.id,
        client: saleData.client,
        value: method.amount,
        due_date: method.firstInstallmentDate || saleData.date,
        status: 'pendente',
        is_own_check: method.isOwnCheck || false,
        installment_number: 1,
        total_installments: 1,
        observations: `Cheque da venda para ${saleData.client}`,
        used_for: `Venda para ${saleData.client}`,
        is_company_payable: false
      };
      
      const { error } = await supabase.from('checks').insert([checkData]);
      if (error) {
        console.error('Error creating single check:', error);
      }
    }
  }
}

// Function to create boletos and cheques from debt payment methods
async function createBoletosAndChequesFromDebt(debtData: any, paymentMethods: any[]) {
  console.log('🔄 Creating boletos and cheques for debt:', debtData.id);
  
  for (const method of paymentMethods) {
    if (method.type === 'boleto' && method.installments && method.installments > 1) {
      // Create multiple boletos for debt payment
      for (let i = 1; i <= method.installments; i++) {
        const dueDate = new Date(method.firstInstallmentDate || debtData.date);
        dueDate.setDate(dueDate.getDate() + (i - 1) * (method.installmentInterval || 30));
        
        const boletoData = {
          debt_id: debtData.id,
          client: debtData.company,
          value: method.installmentValue || (method.amount / method.installments),
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          installment_number: i,
          total_installments: method.installments,
          observations: `Parcela ${i}/${method.installments} do pagamento da dívida para ${debtData.company}`,
          is_company_payable: true,
          company_name: debtData.company
        };
        
        const { error } = await supabase.from('boletos').insert([boletoData]);
        if (error) {
          console.error('Error creating debt boleto:', error);
        }
      }
    } else if (method.type === 'boleto') {
      // Single boleto for debt
      const boletoData = {
        debt_id: debtData.id,
        client: debtData.company,
        value: method.amount,
        due_date: method.firstInstallmentDate || debtData.date,
        status: 'pendente',
        installment_number: 1,
        total_installments: 1,
        observations: `Boleto do pagamento da dívida para ${debtData.company}`,
        is_company_payable: true,
        company_name: debtData.company
      };
      
      const { error } = await supabase.from('boletos').insert([boletoData]);
      if (error) {
        console.error('Error creating single debt boleto:', error);
      }
    }
    
    if (method.type === 'cheque' && method.installments && method.installments > 1) {
      // Create multiple cheques for debt payment
      for (let i = 1; i <= method.installments; i++) {
        const dueDate = new Date(method.firstInstallmentDate || debtData.date);
        dueDate.setDate(dueDate.getDate() + (i - 1) * (method.installmentInterval || 30));
        
        const checkData = {
          debt_id: debtData.id,
          client: debtData.company,
          value: method.installmentValue || (method.amount / method.installments),
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          is_own_check: true, // Company's own check for paying debt
          installment_number: i,
          total_installments: method.installments,
          observations: `Parcela ${i}/${method.installments} do pagamento da dívida para ${debtData.company}`,
          used_for: `Pagamento da dívida para ${debtData.company}`,
          is_company_payable: true,
          company_name: debtData.company
        };
        
        const { error } = await supabase.from('checks').insert([checkData]);
        if (error) {
          console.error('Error creating debt check:', error);
        }
      }
    } else if (method.type === 'cheque') {
      // Single cheque for debt
      const checkData = {
        debt_id: debtData.id,
        client: debtData.company,
        value: method.amount,
        due_date: method.firstInstallmentDate || debtData.date,
        status: 'pendente',
        is_own_check: true, // Company's own check for paying debt
        installment_number: 1,
        total_installments: 1,
        observations: `Cheque do pagamento da dívida para ${debtData.company}`,
        used_for: `Pagamento da dívida para ${debtData.company}`,
        is_company_payable: true,
        company_name: debtData.company
      };
      
      const { error } = await supabase.from('checks').insert([checkData]);
      if (error) {
        console.error('Error creating single debt check:', error);
      }
    }
  }
}

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
    
    // Create boletos and cheques for debt payment methods
    await createBoletosAndChequesFromDebt(data, debt.paymentMethods || []);
    
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
  },

  // New functions for receivables and payables
  async getAllReceivables() {
    const receivables = [];
    
    // Get pending checks (to receive)
    const { data: checksData, error: checksError } = await supabase
      .from('checks')
      .select('*')
      .eq('status', 'pendente')
      .eq('is_company_payable', false);
    
    if (!checksError && checksData) {
      checksData.forEach(check => {
        receivables.push({
          id: check.id,
          type: 'Cheque',
          client: check.client,
          amount: check.value,
          dueDate: check.due_date,
          description: `Cheque - Parcela ${check.installment_number}/${check.total_installments}`,
          status: check.status,
          saleId: check.sale_id,
          debtId: check.debt_id,
          installment: `${check.installment_number}/${check.total_installments}`,
          usedFor: check.used_for,
          observations: check.observations
        });
      });
    }
    
    // Get pending boletos (to receive)
    const { data: boletosData, error: boletosError } = await supabase
      .from('boletos')
      .select('*')
      .eq('status', 'pendente')
      .eq('is_company_payable', false);
    
    if (!boletosError && boletosData) {
      boletosData.forEach(boleto => {
        receivables.push({
          id: boleto.id,
          type: 'Boleto',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.due_date,
          description: `Boleto - Parcela ${boleto.installment_number}/${boleto.total_installments}`,
          status: boleto.status,
          saleId: boleto.sale_id,
          installment: `${boleto.installment_number}/${boleto.total_installments}`,
          observations: boleto.observations
        });
      });
    }
    
    // Get pending sales amounts
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .gt('pending_amount', 0);
    
    if (!salesError && salesData) {
      salesData.forEach(sale => {
        receivables.push({
          id: sale.id,
          type: 'Venda Pendente',
          client: sale.client,
          amount: sale.pending_amount,
          dueDate: sale.date,
          description: `Valor pendente da venda`,
          status: sale.status,
          saleId: sale.id,
          observations: sale.observations
        });
      });
    }
    
    return receivables.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  async getAllPayables() {
    const payables = [];
    
    // Get company payable checks
    const { data: checksData, error: checksError } = await supabase
      .from('checks')
      .select('*')
      .eq('status', 'pendente')
      .eq('is_company_payable', true);
    
    if (!checksError && checksData) {
      checksData.forEach(check => {
        payables.push({
          id: check.id,
          type: 'Cheque a Pagar',
          company: check.company_name || check.client,
          amount: check.value,
          dueDate: check.due_date,
          description: `Cheque - Parcela ${check.installment_number}/${check.total_installments}`,
          status: check.status,
          debtId: check.debt_id,
          installment: `${check.installment_number}/${check.total_installments}`,
          usedFor: check.used_for,
          observations: check.observations
        });
      });
    }
    
    // Get company payable boletos
    const { data: boletosData, error: boletosError } = await supabase
      .from('boletos')
      .select('*')
      .eq('status', 'pendente')
      .eq('is_company_payable', true);
    
    if (!boletosError && boletosData) {
      boletosData.forEach(boleto => {
        payables.push({
          id: boleto.id,
          type: 'Boleto a Pagar',
          company: boleto.company_name || boleto.client,
          amount: boleto.value,
          dueDate: boleto.due_date,
          description: `Boleto - Parcela ${boleto.installment_number}/${boleto.total_installments}`,
          status: boleto.status,
          debtId: boleto.debt_id,
          installment: `${boleto.installment_number}/${boleto.total_installments}`,
          observations: boleto.observations
        });
      });
    }
    
    // Get pending debts
    const { data: debtsData, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('is_paid', false);
    
    if (!debtsError && debtsData) {
      debtsData.forEach(debt => {
        payables.push({
          id: debt.id,
          type: 'Dívida Pendente',
          company: debt.company,
          amount: debt.pending_amount,
          dueDate: debt.date,
          description: debt.description,
          status: debt.is_paid ? 'pago' : 'pendente',
          debtId: debt.id,
          observations: debt.payment_description || debt.debt_payment_description
        });
      });
    }
    
    return payables.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
};