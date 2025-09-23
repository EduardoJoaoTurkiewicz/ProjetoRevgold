import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
import { ErrorHandler } from './errorHandler';
import { sanitizeSupabaseData, safeNumber, logMonetaryValues } from '../utils/numberUtils';

export class SupabaseService {
  protected supabase = supabase;

  protected handleError(error: any, operation: string) {
    // Only log project-related errors, suppress external service errors
    if (ErrorHandler.isProjectError(error)) {
      console.error(`Error in ${operation}:`, error);
    }
    throw error;
  }

  protected async safeOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured, returning fallback data');
        return fallback;
      }

      return await operation();
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('⚠️ Network error detected, returning fallback data');
        return fallback;
      }
      
      // For other errors, still throw them
      throw error;
    }
  }
}

export class CashService extends SupabaseService {
  async getCurrentBalance() {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .rpc('get_current_cash_balance');
      
      if (error) throw error;
      
      const result = data && data.length > 0 ? sanitizeSupabaseData(data[0]) : null;
      if (result) {
        logMonetaryValues(result, 'Cash Balance');
      }
      return result;
    }, null);
  }

  async getTransactions() {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} cash transactions`);
      return sanitized;
    }, []);
  }

  async initializeCashBalance(amount: number) {
    return this.safeOperation(async () => {
      const safeAmount = safeNumber(amount, 0);
      if (safeAmount <= 0) {
        throw new Error('Initial amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .rpc('initialize_cash_balance', { initial_amount: safeAmount });
      
      if (error) throw error;
      return data;
    }, null);
  }

  async recalculateBalance() {
    return this.safeOperation(async () => {
      const { error } = await this.supabase
        .rpc('recalculate_cash_balance');
      
      if (error) throw error;
      return true;
    }, false);
  }

  async createTransaction(transaction: any) {
    return this.safeOperation(async () => {
      // Sanitize monetary values before saving
      const sanitizedTransaction = {
        ...transaction,
        amount: safeNumber(transaction.amount, 0)
      };
      
      if (sanitizedTransaction.amount <= 0) {
        throw new Error('Transaction amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .insert([sanitizedTransaction])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    }, null);
  }

  async updateTransaction(id: string, transaction: any) {
    return this.safeOperation(async () => {
      // Sanitize monetary values before updating
      const sanitizedTransaction = {
        ...transaction,
        amount: safeNumber(transaction.amount, 0)
      };
      
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .update(sanitizedTransaction)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    }, []);
  }

  async deleteTransaction(id: string) {
    return this.safeOperation(async () => {
      const { error } = await this.supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }, false);
  }

  async getAll() {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }, []);
  }

  async create(transaction: any) {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .insert([transaction])
        .select();
      
      if (error) throw error;
      return data;
    }, []);
  }

  async update(id: string, transaction: any) {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .update(transaction)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    }, []);
  }

  async delete(id: string) {
    return this.safeOperation(async () => {
      const { error } = await this.supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }, false);
  }
}

export class DebtsService extends SupabaseService {
  async getDebts() {
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} debts`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getDebts');
    }
  }

  async create(debt: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedDebt = sanitizeSupabaseData({
        ...debt,
        totalValue: safeNumber(debt.totalValue, 0),
        paidAmount: safeNumber(debt.paidAmount, 0),
        pendingAmount: safeNumber(debt.pendingAmount, 0)
      });
      
      if (sanitizedDebt.totalValue <= 0) {
        throw new Error('Debt total value must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('debts')
        .insert([sanitizedDebt])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(debt: any) {
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .insert([debt])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, debt: any) {
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .update(debt)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('debts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class ChecksService extends SupabaseService {
  async getChecks() {
    try {
      const { data, error } = await this.supabase
        .from('checks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} checks`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getChecks');
    }
  }

  async create(check: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedCheck = sanitizeSupabaseData({
        ...check,
        value: safeNumber(check.value, 0)
      });
      
      if (sanitizedCheck.value <= 0) {
        throw new Error('Check value must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('checks')
        .insert([sanitizedCheck])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('checks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(check: any) {
    try {
      const { data, error } = await this.supabase
        .from('checks')
        .insert([check])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, check: any) {
    try {
      const { data, error } = await this.supabase
        .from('checks')
        .update(check)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('checks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class BoletosService extends SupabaseService {
  async getBoletos() {
    try {
      const { data, error } = await this.supabase
        .from('boletos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} boletos`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getBoletos');
    }
  }

  async create(boleto: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedBoleto = sanitizeSupabaseData({
        ...boleto,
        value: safeNumber(boleto.value, 0),
        finalAmount: safeNumber(boleto.finalAmount, boleto.value),
        interestAmount: safeNumber(boleto.interestAmount, 0),
        penaltyAmount: safeNumber(boleto.penaltyAmount, 0),
        notaryCosts: safeNumber(boleto.notaryCosts, 0),
        interestPaid: safeNumber(boleto.interestPaid, 0)
      });
      
      if (sanitizedBoleto.value <= 0) {
        throw new Error('Boleto value must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('boletos')
        .insert([sanitizedBoleto])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('boletos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(boleto: any) {
    try {
      const { data, error } = await this.supabase
        .from('boletos')
        .insert([boleto])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, boleto: any) {
    try {
      const { data, error } = await this.supabase
        .from('boletos')
        .update(boleto)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('boletos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class EmployeePaymentsService extends SupabaseService {
  async getPayments() {
    try {
      const { data, error } = await this.supabase
        .from('employee_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} employee payments`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getPayments');
    }
  }

  async create(payment: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedPayment = sanitizeSupabaseData({
        ...payment,
        amount: safeNumber(payment.amount, 0)
      });
      
      if (sanitizedPayment.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('employee_payments')
        .insert([sanitizedPayment])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('employee_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(payment: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_payments')
        .insert([payment])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }
}

export class EmployeeAdvancesService extends SupabaseService {
  async getAdvances() {
    try {
      const { data, error } = await this.supabase
        .from('employee_advances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} employee advances`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getAdvances');
    }
  }

  async create(advance: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedAdvance = sanitizeSupabaseData({
        ...advance,
        amount: safeNumber(advance.amount, 0)
      });
      
      if (sanitizedAdvance.amount <= 0) {
        throw new Error('Advance amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('employee_advances')
        .insert([sanitizedAdvance])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, advance: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_advances')
        .update(advance)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('employee_advances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(advance: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_advances')
        .insert([advance])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }
}

export class EmployeeOvertimesService extends SupabaseService {
  async getOvertimes() {
    try {
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} employee overtimes`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getOvertimes');
    }
  }

  async create(overtime: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedOvertime = sanitizeSupabaseData({
        ...overtime,
        hours: safeNumber(overtime.hours, 0),
        hourlyRate: safeNumber(overtime.hourlyRate, 0),
        totalAmount: safeNumber(overtime.totalAmount, 0)
      });
      
      if (sanitizedOvertime.hours <= 0 || sanitizedOvertime.hourlyRate <= 0) {
        throw new Error('Hours and hourly rate must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .insert([sanitizedOvertime])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, overtime: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .update(overtime)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(overtime: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .insert([overtime])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }
}

export class EmployeeCommissionsService extends SupabaseService {
  async getCommissions() {
    try {
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} employee commissions`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getCommissions');
    }
  }

  async create(commission: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedCommission = sanitizeSupabaseData({
        ...commission,
        saleValue: safeNumber(commission.saleValue, 0),
        commissionRate: safeNumber(commission.commissionRate, 5),
        commissionAmount: safeNumber(commission.commissionAmount, 0)
      });
      
      if (sanitizedCommission.saleValue <= 0 || sanitizedCommission.commissionAmount <= 0) {
        throw new Error('Sale value and commission amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .insert([sanitizedCommission])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, commission: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .update(commission)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(commission: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .insert([commission])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }
}

export class PixFeesService extends SupabaseService {
  async getPixFees() {
    try {
      const { data, error } = await this.supabase
        .from('pix_fees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} PIX fees`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getPixFees');
    }
  }

  async create(fee: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedFee = sanitizeSupabaseData({
        ...fee,
        amount: safeNumber(fee.amount, 0)
      });
      
      if (sanitizedFee.amount <= 0) {
        throw new Error('PIX fee amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('pix_fees')
        .insert([sanitizedFee])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('pix_fees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(fee: any) {
    try {
      const { data, error } = await this.supabase
        .from('pix_fees')
        .insert([fee])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, fee: any) {
    try {
      const { data, error } = await this.supabase
        .from('pix_fees')
        .update(fee)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('pix_fees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class TaxesService extends SupabaseService {
  async getTaxes() {
    try {
      const { data, error } = await this.supabase
        .from('taxes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} taxes`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getTaxes');
    }
  }

  async create(tax: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedTax = sanitizeSupabaseData({
        ...tax,
        amount: safeNumber(tax.amount, 0)
      });
      
      if (sanitizedTax.amount <= 0) {
        throw new Error('Tax amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('taxes')
        .insert([sanitizedTax])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('taxes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(tax: any) {
    try {
      const { data, error } = await this.supabase
        .from('taxes')
        .insert([tax])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, tax: any) {
    try {
      const { data, error } = await this.supabase
        .from('taxes')
        .update(tax)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('taxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class DebugService extends SupabaseService {
  async getSystemInfo() {
    try {
      // Return basic system information for debugging
      return {
        timestamp: new Date().toISOString(),
        supabaseConnected: !!this.supabase,
        environment: 'development'
      };
    } catch (error) {
      this.handleError(error, 'getSystemInfo');
    }
  }

  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { connected: true, data };
    } catch (error) {
      this.handleError(error, 'testConnection');
    }
  }
}

// Image upload utility functions
export async function uploadCheckImage(file: File, checkId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${checkId}-${Date.now()}.${fileExt}`;
    const filePath = `checks/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('check-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  } catch (error) {
    console.error('Error uploading check image:', error);
    throw error;
  }
}

export async function deleteCheckImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('check-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting check image:', error);
    throw error;
  }
}

export async function getCheckImageUrl(filePath: string): Promise<string> {
  try {
    const { data } = await supabase.storage
      .from('check-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting check image URL:', error);
    throw error;
  }
}

export class SalesService extends SupabaseService {
  // Transform camelCase keys to snake_case for Supabase
  private transformSaleForSupabase(sale: any) {
    const transformed: any = {};
    
    // Map camelCase to snake_case
    const keyMapping: { [key: string]: string } = {
      totalValue: 'total_value',
      receivedAmount: 'received_amount',
      pendingAmount: 'pending_amount',
      sellerId: 'seller_id',
      deliveryDate: 'delivery_date',
      paymentMethods: 'payment_methods',
      paymentDescription: 'payment_description',
      paymentObservations: 'payment_observations',
      customCommissionRate: 'custom_commission_rate',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    // Transform keys
    Object.keys(sale).forEach(key => {
      const snakeKey = keyMapping[key] || key;
      transformed[snakeKey] = sale[key];
    });
    
    // Remove empty id field if present
    if (transformed.id === '' || transformed.id === null || transformed.id === undefined) {
      delete transformed.id;
    }
    
    // Sanitize all monetary fields using safe number conversion
    transformed.total_value = safeNumber(transformed.total_value, 0);
    transformed.received_amount = safeNumber(transformed.received_amount, 0);
    transformed.pending_amount = safeNumber(transformed.pending_amount, 0);
    transformed.custom_commission_rate = safeNumber(transformed.custom_commission_rate, 5);
    
    // Validate that total value is greater than zero
    if (transformed.total_value <= 0) {
      throw new Error('Sale total value must be greater than zero');
    }
    
    // Sanitize payment methods
    if (transformed.payment_methods && Array.isArray(transformed.payment_methods)) {
      transformed.payment_methods = transformed.payment_methods.map((method: any) => ({
        ...method,
        amount: safeNumber(method.amount, 0),
        installmentValue: safeNumber(method.installmentValue, 0),
        installments: safeNumber(method.installments, 1),
        installmentInterval: safeNumber(method.installmentInterval, 30)
      }));
    }
    
    logMonetaryValues(transformed, 'Sale Transform');
    
    return transformed;
  }

  async create(sale: any) {
    try {
      console.log('🔄 SalesService.create - Original sale data:', sale);
      
      const transformedSale = this.transformSaleForSupabase(sale);
      console.log('🔄 SalesService.create - Transformed sale data:', transformedSale);
      
      const { data, error } = await this.supabase
        .rpc('create_sale', { payload: transformedSale });
      
      if (error) {
        console.error('❌ SalesService.create - Supabase error:', error);
        throw error;
      }
      
      console.log('✅ SalesService.create - Success:', data);
      return data;
    } catch (error) {
      console.error('❌ SalesService.create - Exception:', error);
      this.handleError(error, 'create');
    }
  }

  async update(id: string, sale: any) {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .update(sale)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  async getSales() {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} sales`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getSales');
    }
  }

  async createSale(sale: any) {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .insert([sale])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'createSale');
    }
  }

  async updateSale(id: string, sale: any) {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .update(sale)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateSale');
    }
  }

  async deleteSale(id: string) {
    try {
      const { error } = await this.supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteSale');
    }
  }
}

export class EmployeeService extends SupabaseService {
  async create(employee: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedEmployee = sanitizeSupabaseData({
        ...employee,
        salary: safeNumber(employee.salary, 0)
      });
      
      if (sanitizedEmployee.salary < 0) {
        throw new Error('Employee salary cannot be negative');
      }
      
      const { data, error } = await this.supabase
        .from('employees')
        .insert([sanitizedEmployee])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, employee: any) {
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  async getEmployees() {
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`👥 Loaded ${sanitized.length} employees`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getEmployees');
    }
  }
}

export class AcertosService extends SupabaseService {
  async getAcertos() {
    try {
      const { data, error } = await this.supabase
        .from('acertos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`💰 Loaded ${sanitized.length} acertos`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getAcertos');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('acertos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(acerto: any) {
    try {
      // Sanitize monetary values before saving
      const sanitizedAcerto = sanitizeSupabaseData({
        ...acerto,
        totalAmount: safeNumber(acerto.totalAmount, 0),
        paidAmount: safeNumber(acerto.paidAmount, 0),
        pendingAmount: safeNumber(acerto.pendingAmount, 0),
        paymentInstallmentValue: safeNumber(acerto.paymentInstallmentValue, 0)
      });
      
      if (sanitizedAcerto.totalAmount <= 0) {
        throw new Error('Acerto total amount must be greater than zero');
      }
      
      const { data, error } = await this.supabase
        .from('acertos')
        .insert([sanitizedAcerto])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, acerto: any) {
    try {
      const { data, error } = await this.supabase
        .from('acertos')
        .update(acerto)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('acertos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

export class AgendaService extends SupabaseService {
  async getEvents() {
    try {
      const { data, error } = await this.supabase
        .from('agenda_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const sanitized = data ? data.map(item => sanitizeSupabaseData(item)) : [];
      console.log(`📅 Loaded ${sanitized.length} agenda events`);
      return sanitized;
    } catch (error) {
      this.handleError(error, 'getEvents');
    }
  }

  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('agenda_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getAll');
    }
  }

  async create(agendaEvent: any) {
    try {
      const { data, error } = await this.supabase
        .from('agenda_events')
        .insert([agendaEvent])
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async update(id: string, agendaEvent: any) {
    try {
      const { data, error } = await this.supabase
        .from('agenda_events')
        .update(agendaEvent)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from('agenda_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

// Export service instances
export const cashService = new CashService();
export const debtsService = new DebtsService();
export const checksService = new ChecksService();
export const boletosService = new BoletosService();
export const employeePaymentsService = new EmployeePaymentsService();
export const employeeAdvancesService = new EmployeeAdvancesService();
export const employeeOvertimesService = new EmployeeOvertimesService();
export const employeeCommissionsService = new EmployeeCommissionsService();
export const pixFeesService = new PixFeesService();
export const taxesService = new TaxesService();
export const debugService = new DebugService();
export const salesService = new SalesService();
export const employeeService = new EmployeeService();
export const acertosService = new AcertosService();
export const agendaService = new AgendaService();

// Função para verificar conexão com Supabase
export async function checkSupabaseConnection(): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('id')
      .limit(1);
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}