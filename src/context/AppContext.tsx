import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
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
  
  // Utility functions
  loadAllData: () => Promise<void>;
  isSupabaseConfigured: () => boolean;
  
  // Data fetching functions
  fetchEmployees: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  fetchChecks: () => Promise<void>;
  fetchBoletos: () => Promise<void>;
  fetchEmployeePayments: () => Promise<void>;
  fetchEmployeeAdvances: () => Promise<void>;
  fetchEmployeeCommissions: () => Promise<void>;
  fetchEmployeeOvertimes: () => Promise<void>;
  fetchCashTransactions: () => Promise<void>;
  fetchPixFees: () => Promise<void>;
  fetchCashBalance: () => Promise<void>;
  
  // CRUD operations
  addEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  addSale: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  addDebt: (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  addCheck: (check: Omit<Check, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCheck: (id: string, check: Partial<Check>) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  addBoleto: (boleto: Omit<Boleto, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBoleto: (id: string, boleto: Partial<Boleto>) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  addEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployeePayment: (id: string, payment: Partial<EmployeePayment>) => Promise<void>;
  deleteEmployeePayment: (id: string) => Promise<void>;
  
  addEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployeeAdvance: (id: string, advance: Partial<EmployeeAdvance>) => Promise<void>;
  deleteEmployeeAdvance: (id: string) => Promise<void>;
  
  addEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployeeCommission: (id: string, commission: Partial<EmployeeCommission>) => Promise<void>;
  deleteEmployeeCommission: (id: string) => Promise<void>;
  
  addEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployeeOvertime: (id: string, overtime: Partial<EmployeeOvertime>) => Promise<void>;
  deleteEmployeeOvertime: (id: string) => Promise<void>;
  
  addCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCashTransaction: (id: string, transaction: Partial<CashTransaction>) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  addPixFee: (fee: Omit<PixFee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePixFee: (id: string, fee: Partial<PixFee>) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  initializeCashBalance: (amount: number) => Promise<void>;
  updateCashBalance: (balance: CashBalance) => Promise<void>;
  
  // Legacy aliases for backward compatibility
  createEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createDebt: (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createCheck: (check: Omit<Check, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createBoleto: (boleto: Omit<Boleto, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createPixFee: (fee: Omit<PixFee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
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
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Erro ao carregar funcionários');
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Erro ao carregar vendas');
    }
  };

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      setError('Erro ao carregar dívidas');
    }
  };

  const fetchChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .order('due_date');
      
      if (error) throw error;
      setChecks(data || []);
    } catch (error) {
      console.error('Error fetching checks:', error);
      setError('Erro ao carregar cheques');
    }
  };

  const fetchBoletos = async () => {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('due_date');
      
      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      console.error('Error fetching boletos:', error);
      setError('Erro ao carregar boletos');
    }
  };

  const fetchEmployeePayments = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      setEmployeePayments(data || []);
    } catch (error) {
      console.error('Error fetching employee payments:', error);
      setError('Erro ao carregar pagamentos de funcionários');
    }
  };

  const fetchEmployeeAdvances = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeAdvances(data || []);
    } catch (error) {
      console.error('Error fetching employee advances:', error);
      setError('Erro ao carregar adiantamentos');
    }
  };

  const fetchEmployeeCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeCommissions(data || []);
    } catch (error) {
      console.error('Error fetching employee commissions:', error);
      setError('Erro ao carregar comissões');
    }
  };

  const fetchEmployeeOvertimes = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setEmployeeOvertimes(data || []);
    } catch (error) {
      console.error('Error fetching employee overtimes:', error);
      setError('Erro ao carregar horas extras');
    }
  };

  const fetchCashTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setCashTransactions(data || []);
    } catch (error) {
      console.error('Error fetching cash transactions:', error);
      setError('Erro ao carregar transações de caixa');
    }
  };

  const fetchPixFees = async () => {
    try {
      const { data, error } = await supabase
        .from('pix_fees')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setPixFees(data || []);
    } catch (error) {
      console.error('Error fetching pix fees:', error);
      setError('Erro ao carregar taxas PIX');
    }
  };

  const fetchCashBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_balance')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCashBalance(data || { currentBalance: 0, lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Error fetching cash balance:', error);
      setCashBalance({ currentBalance: 0, lastUpdated: new Date().toISOString() });
    }
  };

  const initializeCashBalance = async (amount: number) => {
    try {
      const { error } = await supabase
        .from('cash_balance')
        .insert([{ currentBalance: amount }]);
      
      if (error) throw error;
      await fetchCashBalance();
    } catch (error) {
      console.error('Error initializing cash balance:', error);
      throw error;
    }
  };

  const updateCashBalance = async (balance: CashBalance) => {
    try {
      const { error } = await supabase
        .from('cash_balance')
        .upsert([balance]);
      
      if (error) throw error;
      await fetchCashBalance();
    } catch (error) {
      console.error('Error updating cash balance:', error);
      throw error;
    }
  };

  // CRUD operations for employees
  const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
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
  const addSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('sales')
        .insert([sale]);
      
      if (error) throw error;
      await fetchSales();
    } catch (error) {
      console.error('Error adding sale:', error);
      throw error;
    }
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
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
  const addDebt = async (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateDebt = async (id: string, debt: Partial<Debt>) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update(debt)
        .eq('id', id);
      
      if (error) throw error;
      await fetchDebts();
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
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
  const addCheck = async (check: Omit<Check, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateCheck = async (id: string, check: Partial<Check>) => {
    try {
      const { error } = await supabase
        .from('checks')
        .update(check)
        .eq('id', id);
      
      if (error) throw error;
      await fetchChecks();
    } catch (error) {
      console.error('Error updating check:', error);
      throw error;
    }
  };

  const deleteCheck = async (id: string) => {
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
  const addBoleto = async (boleto: Omit<Boleto, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateBoleto = async (id: string, boleto: Partial<Boleto>) => {
    try {
      const { error } = await supabase
        .from('boletos')
        .update(boleto)
        .eq('id', id);
      
      if (error) throw error;
      await fetchBoletos();
    } catch (error) {
      console.error('Error updating boleto:', error);
      throw error;
    }
  };

  const deleteBoleto = async (id: string) => {
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
  const addEmployeePayment = async (payment: Omit<EmployeePayment, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateEmployeePayment = async (id: string, payment: Partial<EmployeePayment>) => {
    try {
      const { error } = await supabase
        .from('employee_payments')
        .update(payment)
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeePayments();
    } catch (error) {
      console.error('Error updating employee payment:', error);
      throw error;
    }
  };

  const deleteEmployeePayment = async (id: string) => {
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
  const addEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateEmployeeAdvance = async (id: string, advance: Partial<EmployeeAdvance>) => {
    try {
      const { error } = await supabase
        .from('employee_advances')
        .update(advance)
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeAdvances();
    } catch (error) {
      console.error('Error updating employee advance:', error);
      throw error;
    }
  };

  const deleteEmployeeAdvance = async (id: string) => {
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
  const addEmployeeCommission = async (commission: Omit<EmployeeCommission, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateEmployeeCommission = async (id: string, commission: Partial<EmployeeCommission>) => {
    try {
      const { error } = await supabase
        .from('employee_commissions')
        .update(commission)
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeCommissions();
    } catch (error) {
      console.error('Error updating employee commission:', error);
      throw error;
    }
  };

  const deleteEmployeeCommission = async (id: string) => {
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
  const addEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateEmployeeOvertime = async (id: string, overtime: Partial<EmployeeOvertime>) => {
    try {
      const { error } = await supabase
        .from('employee_overtimes')
        .update(overtime)
        .eq('id', id);
      
      if (error) throw error;
      await fetchEmployeeOvertimes();
    } catch (error) {
      console.error('Error updating employee overtime:', error);
      throw error;
    }
  };

  const deleteEmployeeOvertime = async (id: string) => {
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
  const addCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updateCashTransaction = async (id: string, transaction: Partial<CashTransaction>) => {
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .update(transaction)
        .eq('id', id);
      
      if (error) throw error;
      await fetchCashTransactions();
    } catch (error) {
      console.error('Error updating cash transaction:', error);
      throw error;
    }
  };

  const deleteCashTransaction = async (id: string) => {
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
  const addPixFee = async (fee: Omit<PixFee, 'id' | 'created_at' | 'updated_at'>) => {
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

  const updatePixFee = async (id: string, fee: Partial<PixFee>) => {
    try {
      const { error } = await supabase
        .from('pix_fees')
        .update(fee)
        .eq('id', id);
      
      if (error) throw error;
      await fetchPixFees();
    } catch (error) {
      console.error('Error updating pix fee:', error);
      throw error;
    }
  };

  const deletePixFee = async (id: string) => {
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
    
    // Utility functions
    loadAllData,
    isSupabaseConfigured: checkSupabaseConfigured,
    
    // Data fetching functions
    fetchEmployees,
    fetchSales,
    fetchDebts,
    fetchChecks,
    fetchBoletos,
    fetchEmployeePayments,
    fetchEmployeeAdvances,
    fetchEmployeeCommissions,
    fetchEmployeeOvertimes,
    fetchCashTransactions,
    fetchPixFees,
    fetchCashBalance,
    
    // CRUD operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addSale,
    updateSale,
    deleteSale,
    addDebt,
    updateDebt,
    deleteDebt,
    addCheck,
    updateCheck,
    deleteCheck,
    addBoleto,
    updateBoleto,
    deleteBoleto,
    addEmployeePayment,
    updateEmployeePayment,
    deleteEmployeePayment,
    addEmployeeAdvance,
    updateEmployeeAdvance,
    deleteEmployeeAdvance,
    addEmployeeCommission,
    updateEmployeeCommission,
    deleteEmployeeCommission,
    addEmployeeOvertime,
    updateEmployeeOvertime,
    deleteEmployeeOvertime,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    addPixFee,
    updatePixFee,
    deletePixFee,
    initializeCashBalance,
    updateCashBalance,
    
    // Legacy aliases for backward compatibility
    createEmployee: addEmployee,
    createSale: addSale,
    createDebt: addDebt,
    createCheck: addCheck,
    createBoleto: addBoleto,
    createEmployeePayment: addEmployeePayment,
    createEmployeeAdvance: addEmployeeAdvance,
    createEmployeeCommission: addEmployeeCommission,
    createEmployeeOvertime: addEmployeeOvertime,
    createCashTransaction: addCashTransaction,
    createPixFee: addPixFee,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};