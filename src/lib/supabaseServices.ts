import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
import { ErrorHandler } from './errorHandler';

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
      return data && data.length > 0 ? data[0] : null;
    }, null);
  }

  async getTransactions() {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }, []);
  }

  async initializeCashBalance(amount: number) {
    return this.safeOperation(async () => {
      const { data, error } = await this.supabase
        .rpc('initialize_cash_balance', { initial_amount: amount });
      
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
      const { data, error } = await this.supabase
        .from('cash_transactions')
        .insert([transaction])
        .select();
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    }, null);
  }

  async updateTransaction(id: string, transaction: any) {
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
      return data;
    } catch (error) {
      this.handleError(error, 'getDebts');
    }
  }

  async create(debt: any) {
    try {
      const { data, error } = await this.supabase
        .from('debts')
        .insert([debt])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getChecks');
    }
  }

  async create(check: any) {
    try {
      const { data, error } = await this.supabase
        .from('checks')
        .insert([check])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getBoletos');
    }
  }

  async create(boleto: any) {
    try {
      const { data, error } = await this.supabase
        .from('boletos')
        .insert([boleto])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getPayments');
    }
  }

  async create(payment: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_payments')
        .insert([payment])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getAdvances');
    }
  }

  async create(advance: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_advances')
        .insert([advance])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getOvertimes');
    }
  }

  async create(overtime: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_overtimes')
        .insert([overtime])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getCommissions');
    }
  }

  async create(commission: any) {
    try {
      const { data, error } = await this.supabase
        .from('employee_commissions')
        .insert([commission])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getPixFees');
    }
  }

  async create(fee: any) {
    try {
      const { data, error } = await this.supabase
        .from('pix_fees')
        .insert([fee])
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
      return data;
    } catch (error) {
      this.handleError(error, 'getTaxes');
    }
  }

  async create(tax: any) {
    try {
      const { data, error } = await this.supabase
        .from('taxes')
        .insert([tax])
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
    
    // Ensure required numeric fields are properly typed
    if (transformed.total_value !== undefined) {
      transformed.total_value = Number(transformed.total_value);
    }
    if (transformed.received_amount !== undefined) {
      transformed.received_amount = Number(transformed.received_amount);
    }
    if (transformed.pending_amount !== undefined) {
      transformed.pending_amount = Number(transformed.pending_amount);
    }
    if (transformed.custom_commission_rate !== undefined) {
      transformed.custom_commission_rate = Number(transformed.custom_commission_rate);
    }
    
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
      return data;
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
      const { data, error } = await this.supabase
        .from('employees')
        .insert([employee])
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
      return data;
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
      return data;
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
      const { data, error } = await this.supabase
        .from('acertos')
        .insert([acerto])
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
      return data;
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