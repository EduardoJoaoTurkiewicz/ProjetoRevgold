import { supabase } from './supabase';

export class SupabaseService {
  protected supabase = supabase;

  protected handleError(error: any, operation: string) {
    console.error(`Error in ${operation}:`, error);
    throw error;
  }
}

export class SalesService extends SupabaseService {
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

// Export service instances
export const salesService = new SalesService();
export const employeeService = new EmployeeService();