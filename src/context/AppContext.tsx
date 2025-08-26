import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { AutomationService } from '../lib/automationService';
import type { 
  Employee, 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  EmployeePayment, 
  EmployeeAdvance, 
  EmployeeCommission, 
  EmployeeOvertime,
  CashTransaction,
  PixFee,
  CashBalance
} from '../types';

interface AppContextType {
  // Data state
  employees: Employee[];
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeCommissions: EmployeeCommission[];
  employeeOvertimes: EmployeeOvertime[];
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
  cashBalance: CashBalance | null;
  error: string | null;
  
  // Loading states
  loading: boolean;
  isLoading: boolean;
  
  // Utility functions
  loadAllData: () => Promise<void>;
  isSupabaseConfigured: () => boolean;
  
  // CRUD operations - Unified naming
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  createCheck: (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  createEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeePayment: (payment: EmployeePayment) => Promise<void>;
  deleteEmployeePayment: (id: string) => Promise<void>;
  
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  deleteEmployeeAdvance: (id: string) => Promise<void>;
  
  createEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  deleteEmployeeCommission: (id: string) => Promise<void>;
  
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeOvertime: (overtime: EmployeeOvertime) => Promise<void>;
  deleteEmployeeOvertime: (id: string) => Promise<void>;
  
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCashTransaction: (transaction: CashTransaction) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  createPixFee: (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePixFee: (fee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  initializeCashBalance: (amount: number) => Promise<void>;
  updateCashBalance: (balance: CashBalance) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Utility functions
  const checkSupabaseConfigured = () => isSupabaseConfigured();

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchSales(),
        fetchDebts(),
        fetchChecks(),
        fetchBoletos(),
        fetchEmployeePayments(),
        fetchEmployeeAdvances(),
        fetchEmployeeCommissions(),
        fetchEmployeeOvertimes(),
        fetchCashTransactions(),
        fetchPixFees(),
        fetchCashBalance()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions
  const fetchEmployees = async () => {
    if (!isSupabaseConfigured()) {
      setEmployees([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para employees');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para employees');
      setEmployees([]);
    }
  };

  const fetchSales = async () => {
    if (!isSupabaseConfigured()) {
      setSales([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para sales');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para sales');
      setSales([]);
    }
  };

  const fetchDebts = async () => {
    if (!isSupabaseConfigured()) {
      setDebts([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para debts');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para debts');
      setDebts([]);
    }
  };

  const fetchChecks = async () => {
    if (!isSupabaseConfigured()) {
      setChecks([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para checks');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .order('due_date');
      
      if (error) throw error;
      setChecks(data || []);
    } catch (error) {
      console.error('Error fetching checks:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para checks');
      setChecks([]);
    }
  };

  const fetchBoletos = async () => {
    if (!isSupabaseConfigured()) {
      setBoletos([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para boletos');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('due_date');
      
      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      console.error('Error fetching boletos:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para boletos');
      setBoletos([]);
    }
  };

  const fetchEmployeePayments = async () => {
    if (!isSupabaseConfigured()) {
      setEmployeePayments([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para employee payments');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      setEmployeePayments(data || []);
    } catch (error) {
      console.error('Error fetching employee payments:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para employee payments');
      setEmployeePayments([]);
    }
  };

  const fetchEmployeeAdvances = async () => {
    if (!isSupabaseConfigured()) {
      setEmployeeAdvances([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para employee advances');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeAdvances(data || []);
    } catch (error) {
      console.error('Error fetching employee advances:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para employee advances');
      setEmployeeAdvances([]);
    }
  };

  const fetchEmployeeCommissions = async () => {
    if (!isSupabaseConfigured()) {
      setEmployeeCommissions([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para employee commissions');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeCommissions(data || []);
    } catch (error) {
      console.error('Error fetching employee commissions:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para employee commissions');
      setEmployeeCommissions([]);
    }
  };

  const fetchEmployeeOvertimes = async () => {
    if (!isSupabaseConfigured()) {
      setEmployeeOvertimes([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para employee overtimes');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeOvertimes(data || []);
    } catch (error) {
      console.error('Error fetching employee overtimes:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para employee overtimes');
      setEmployeeOvertimes([]);
    }
  };

  const fetchCashTransactions = async () => {
    if (!isSupabaseConfigured()) {
      setCashTransactions([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para cash transactions');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setCashTransactions(data || []);
    } catch (error) {
      console.error('Error fetching cash transactions:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para cash transactions');
      setCashTransactions([]);
    }
  };

  const fetchPixFees = async () => {
    if (!isSupabaseConfigured()) {
      setPixFees([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para pix fees');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('pix_fees')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setPixFees(data || []);
    } catch (error) {
      console.error('Error fetching pix fees:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para pix fees');
      setPixFees([]);
    }
  };

  const fetchCashBalance = async () => {
    if (!isSupabaseConfigured()) {
      setCashBalance({ 
        currentBalance: 0, 
        initialBalance: 0,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString() 
      });
      console.log('⚠️ Supabase não configurado - usando dados locais para cash balance');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('cash_balances')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCashBalance(data || { 
        currentBalance: 0, 
        initialBalance: 0,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error fetching cash balance:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para cash balance');
      setCashBalance({ 
        currentBalance: 0, 
        initialBalance: 0,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString() 
      });
    }
  };

  const initializeCashBalance = async (amount: number) => {
    if (!isSupabaseConfigured()) {
      setCashBalance({
        currentBalance: amount,
        initialBalance: amount,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_balances')
        .insert([{ 
          current_balance: amount,
          initial_balance: amount,
          initial_date: new Date().toISOString().split('T')[0]
        }]);
      
      if (error) throw error;
      await fetchCashBalance();
    } catch (error) {
      console.error('Error initializing cash balance:', error);
      throw error;
    }
  };

  const updateCashBalance = async (balance: CashBalance) => {
    if (!isSupabaseConfigured()) {
      setCashBalance(balance);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_balances')
        .upsert([balance]);
      
      if (error) throw error;
      await fetchCashBalance();
    } catch (error) {
      console.error('Error updating cash balance:', error);
      throw error;
    }
  };

  // CRUD operations for employees
  const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEmployee: Employee = {
        ...employee,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEmployees(prev => [...prev, newEmployee]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employees')
        .insert([employee]);
      
      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.map(emp => 
        emp.id === employee.id ? { ...employee, updatedAt: new Date().toISOString() } : emp
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', employee.id);
      
      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  // CRUD operations for sales
  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newSale: Sale = {
        ...sale,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSales(prev => [...prev, newSale]);
      
      // Create commission for seller if applicable
      if (newSale.sellerId) {
        const seller = employees.find(e => e.id === newSale.sellerId);
        if (seller && seller.isSeller) {
          const commission: EmployeeCommission = {
            id: `commission-${Date.now()}`,
            employeeId: newSale.sellerId,
            saleId: newSale.id,
            saleValue: newSale.totalValue,
            commissionRate: newSale.customCommissionRate || 5,
            commissionAmount: (newSale.totalValue * (newSale.customCommissionRate || 5)) / 100,
            date: newSale.date,
            status: 'pendente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setEmployeeCommissions(prev => [...prev, commission]);
        }
      }
      
      // Create checks and boletos automatically for payment methods
      try {
        await AutomationService.createChecksForSale(newSale);
        await AutomationService.createBoletosForSale(newSale);
      } catch (error) {
        console.error('Error creating automated checks/boletos:', error);
      }
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create commission for seller if applicable
      if (data.seller_id) {
        const seller = employees.find(e => e.id === data.seller_id);
        if (seller && seller.isSeller) {
          const commission = {
            employee_id: data.seller_id,
            sale_id: data.id,
            sale_value: data.total_value,
            commission_rate: data.custom_commission_rate || 5,
            commission_amount: (data.total_value * (data.custom_commission_rate || 5)) / 100,
            date: data.date,
            status: 'pendente'
          };
          
          await supabase.from('employee_commissions').insert([commission]);
        }
      }
      
      await fetchSales();
      await fetchEmployeeCommissions();
      
      // Create checks and boletos automatically for payment methods
      try {
        await AutomationService.createChecksForSale(data);
        await AutomationService.createBoletosForSale(data);
        await fetchChecks();
        await fetchBoletos();
      } catch (error) {
        console.error('Error creating automated checks/boletos:', error);
      }
    } catch (error) {
      console.error('Error adding sale:', error);
      throw error;
    }
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.map(s => 
        s.id === id ? { ...s, ...sale, updatedAt: new Date().toISOString() } : s
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sales')
        .update(sale)
        .eq('id', id);
      
      if (error) throw error;
      await fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.filter(s => s.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  };

  // CRUD operations for debts
  const createDebt = async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newDebt: Debt = {
        ...debt,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDebts(prev => [...prev, newDebt]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('debts')
        .insert([debt]);
      
      if (error) throw error;
      await fetchDebts();
    } catch (error) {
      console.error('Error adding debt:', error);
      throw error;
    }
  };

  const updateDebt = async (debt: Debt) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.map(d => 
        d.id === debt.id ? { ...debt, updatedAt: new Date().toISOString() } : d
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('debts')
        .update(debt)
        .eq('id', debt.id);
      
      if (error) throw error;
      await fetchDebts();
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.filter(d => d.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  };

  // CRUD operations for checks
  const createCheck = async (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newCheck: Check = {
        ...check,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setChecks(prev => [...prev, newCheck]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('checks')
        .insert([check]);
      
      if (error) throw error;
      await fetchChecks();
    } catch (error) {
      console.error('Error adding check:', error);
      throw error;
    }
  };

  const updateCheck = async (check: Check) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.map(c => 
        c.id === check.id ? { ...check, updatedAt: new Date().toISOString() } : c
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('checks')
        .update(check)
        .eq('id', check.id);
      
      if (error) throw error;
      await fetchChecks();
    } catch (error) {
      console.error('Error updating check:', error);
      throw error;
    }
  };

  const deleteCheck = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.filter(c => c.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchChecks();
    } catch (error) {
      console.error('Error deleting check:', error);
      throw error;
    }
  };

  // CRUD operations for boletos
  const createBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newBoleto: Boleto = {
        ...boleto,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setBoletos(prev => [...prev, newBoleto]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('boletos')
        .insert([boleto]);
      
      if (error) throw error;
      await fetchBoletos();
    } catch (error) {
      console.error('Error adding boleto:', error);
      throw error;
    }
  };

  const updateBoleto = async (boleto: Boleto) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.map(b => 
        b.id === boleto.id ? { ...boleto, updatedAt: new Date().toISOString() } : b
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('boletos')
        .update(boleto)
        .eq('id', boleto.id);
      
      if (error) throw error;
      await fetchBoletos();
    } catch (error) {
      console.error('Error updating boleto:', error);
      throw error;
    }
  };

  const deleteBoleto = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.filter(b => b.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('boletos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchBoletos();
    } catch (error) {
      console.error('Error deleting boleto:', error);
      throw error;
    }
  };

  // CRUD operations for employee payments
  const createEmployeePayment = async (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newPayment: EmployeePayment = {
        ...payment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEmployeePayments(prev => [...prev, newPayment]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_payments')
        .insert([payment]);
      
      if (error) throw error;
      await fetchEmployeePayments();
    } catch (error) {
      console.error('Error adding employee payment:', error);
      throw error;
    }
  };

  const updateEmployeePayment = async (payment: EmployeePayment) => {
    if (!isSupabaseConfigured()) {
      setEmployeePayments(prev => prev.map(p => 
        p.id === payment.id ? { ...payment, updatedAt: new Date().toISOString() } : p
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_payments')
        .update(payment)
        .eq('id', payment.id);
      
      if (error) throw error;
      await fetchEmployeePayments();
    } catch (error) {
      console.error('Error updating employee payment:', error);
      throw error;
    }
  };

  const deleteEmployeePayment = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployeePayments(prev => prev.filter(p => p.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeePayments();
    } catch (error) {
      console.error('Error deleting employee payment:', error);
      throw error;
    }
  };

  // CRUD operations for employee advances
  const createEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newAdvance: EmployeeAdvance = {
        ...advance,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEmployeeAdvances(prev => [...prev, newAdvance]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_advances')
        .insert([advance]);
      
      if (error) throw error;
      await fetchEmployeeAdvances();
    } catch (error) {
      console.error('Error adding employee advance:', error);
      throw error;
    }
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance) => {
    if (!isSupabaseConfigured()) {
      setEmployeeAdvances(prev => prev.map(a => 
        a.id === advance.id ? { ...advance, updatedAt: new Date().toISOString() } : a
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_advances')
        .update(advance)
        .eq('id', advance.id);
      
      if (error) throw error;
      await fetchEmployeeAdvances();
    } catch (error) {
      console.error('Error updating employee advance:', error);
      throw error;
    }
  };

  const deleteEmployeeAdvance = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployeeAdvances(prev => prev.filter(a => a.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_advances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeAdvances();
    } catch (error) {
      console.error('Error deleting employee advance:', error);
      throw error;
    }
  };

  // CRUD operations for employee commissions
  const createEmployeeCommission = async (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newCommission: EmployeeCommission = {
        ...commission,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEmployeeCommissions(prev => [...prev, newCommission]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .insert([commission]);
      
      if (error) throw error;
      await fetchEmployeeCommissions();
    } catch (error) {
      console.error('Error adding employee commission:', error);
      throw error;
    }
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission) => {
    if (!isSupabaseConfigured()) {
      setEmployeeCommissions(prev => prev.map(c => 
        c.id === commission.id ? { ...commission, updatedAt: new Date().toISOString() } : c
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .update(commission)
        .eq('id', commission.id);
      
      if (error) throw error;
      await fetchEmployeeCommissions();
    } catch (error) {
      console.error('Error updating employee commission:', error);
      throw error;
    }
  };

  const deleteEmployeeCommission = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployeeCommissions(prev => prev.filter(c => c.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeCommissions();
    } catch (error) {
      console.error('Error deleting employee commission:', error);
      throw error;
    }
  };

  // CRUD operations for employee overtimes
  const createEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newOvertime: EmployeeOvertime = {
        ...overtime,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEmployeeOvertimes(prev => [...prev, newOvertime]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_overtimes')
        .insert([overtime]);
      
      if (error) throw error;
      await fetchEmployeeOvertimes();
    } catch (error) {
      console.error('Error adding employee overtime:', error);
      throw error;
    }
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime) => {
    if (!isSupabaseConfigured()) {
      setEmployeeOvertimes(prev => prev.map(o => 
        o.id === overtime.id ? { ...overtime, updatedAt: new Date().toISOString() } : o
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_overtimes')
        .update(overtime)
        .eq('id', overtime.id);
      
      if (error) throw error;
      await fetchEmployeeOvertimes();
    } catch (error) {
      console.error('Error updating employee overtime:', error);
      throw error;
    }
  };

  const deleteEmployeeOvertime = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployeeOvertimes(prev => prev.filter(o => o.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('employee_overtimes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeOvertimes();
    } catch (error) {
      console.error('Error deleting employee overtime:', error);
      throw error;
    }
  };

  // CRUD operations for cash transactions
  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTransaction: CashTransaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCashTransactions(prev => [...prev, newTransaction]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert([transaction]);
      
      if (error) throw error;
      await fetchCashTransactions();
    } catch (error) {
      console.error('Error adding cash transaction:', error);
      throw error;
    }
  };

  const updateCashTransaction = async (transaction: CashTransaction) => {
    if (!isSupabaseConfigured()) {
      setCashTransactions(prev => prev.map(t => 
        t.id === transaction.id ? { ...transaction, updatedAt: new Date().toISOString() } : t
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .update(transaction)
        .eq('id', transaction.id);
      
      if (error) throw error;
      await fetchCashTransactions();
    } catch (error) {
      console.error('Error updating cash transaction:', error);
      throw error;
    }
  };

  const deleteCashTransaction = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setCashTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCashTransactions();
    } catch (error) {
      console.error('Error deleting cash transaction:', error);
      throw error;
    }
  };

  // CRUD operations for pix fees
  const createPixFee = async (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newFee: PixFee = {
        ...fee,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPixFees(prev => [...prev, newFee]);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('pix_fees')
        .insert([fee]);
      
      if (error) throw error;
      await fetchPixFees();
    } catch (error) {
      console.error('Error adding pix fee:', error);
      throw error;
    }
  };

  const updatePixFee = async (fee: PixFee) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.map(f => 
        f.id === fee.id ? { ...fee, updatedAt: new Date().toISOString() } : f
      ));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('pix_fees')
        .update(fee)
        .eq('id', fee.id);
      
      if (error) throw error;
      await fetchPixFees();
    } catch (error) {
      console.error('Error updating pix fee:', error);
      throw error;
    }
  };

  const deletePixFee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.filter(f => f.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('pix_fees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchPixFees();
    } catch (error) {
      console.error('Error deleting pix fee:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const value: AppContextType = {
    // Data state
    employees,
    sales,
    debts,
    checks,
    boletos,
    employeePayments,
    employeeAdvances,
    employeeCommissions,
    employeeOvertimes,
    cashTransactions,
    pixFees,
    cashBalance,
    error,
    loading,
    isLoading: loading,
    
    // Utility functions
    loadAllData,
    isSupabaseConfigured: checkSupabaseConfigured,
    
    // CRUD operations
    createEmployee,
    updateEmployee,
    deleteEmployee,
    addSale,
    updateSale,
    deleteSale,
    createDebt,
    updateDebt,
    deleteDebt,
    createCheck,
    updateCheck,
    deleteCheck,
    createBoleto,
    updateBoleto,
    deleteBoleto,
    createEmployeePayment,
    updateEmployeePayment,
    deleteEmployeePayment,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    deleteEmployeeAdvance,
    createEmployeeCommission,
    updateEmployeeCommission,
    deleteEmployeeCommission,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    deleteEmployeeOvertime,
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    createPixFee,
    updatePixFee,
    deletePixFee,
    initializeCashBalance,
    updateCashBalance
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};