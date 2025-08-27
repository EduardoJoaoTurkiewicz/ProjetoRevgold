import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  employeesService, 
  salesService, 
  debtsService,
  checksService,
  boletosService
} from '../lib/supabaseServices';
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
  CashBalance,
  Tax,
  AgendaEvent
} from '../types';

// Transform functions for database compatibility
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

function transformFromDatabase<T>(row: any): T {
  if (!row) return row;
  
  // Transform snake_case to camelCase
  const transformed = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    transformed[camelKey] = value;
  }
  
  return transformed as T;
}

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
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
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
  
  createTax: (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  createAgendaEvent: (event: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAgendaEvent: (event: AgendaEvent) => Promise<void>;
  deleteAgendaEvent: (id: string) => Promise<void>;
  
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
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Utility functions
  const checkSupabaseConfigured = () => isSupabaseConfigured();

  const loadAllData = async () => {
    if (loading) return; // Evitar múltiplas chamadas simultâneas
    
    setLoading(true);
    setError(null);
    try {
      // Carregar dados em sequência para evitar sobrecarga
      await fetchEmployees();
      await fetchSales();
      await fetchDebts();
      await fetchChecks();
      await fetchBoletos();
      await fetchEmployeePayments();
      await fetchEmployeeAdvances();
      await fetchEmployeeCommissions();
      await fetchEmployeeOvertimes();
      await fetchCashTransactions();
      await fetchPixFees();
      await fetchCashBalance();
      await fetchTaxes();
      await fetchAgendaEvents();
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      const employees = await employeesService.getAll();
      setEmployees(employees);
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
      const sales = await salesService.getAll();
      setSales(sales);
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
      const debts = await debtsService.getAll();
      setDebts(debts);
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
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setChecks((data || []).map(transformFromDatabase<Check>));
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
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setBoletos((data || []).map(transformFromDatabase<Boleto>));
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
      setEmployeePayments((data || []).map(transformFromDatabase<EmployeePayment>));
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
      setEmployeeAdvances((data || []).map(transformFromDatabase<EmployeeAdvance>));
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
      setEmployeeCommissions((data || []).map(transformFromDatabase<EmployeeCommission>));
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
      setEmployeeOvertimes((data || []).map(transformFromDatabase<EmployeeOvertime>));
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
      setCashTransactions((data || []).map(transformFromDatabase<CashTransaction>));
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
      setPixFees((data || []).map(transformFromDatabase<PixFee>));
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
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      const balance = data ? transformFromDatabase<CashBalance>(data) : { 
        currentBalance: 0, 
        initialBalance: 0,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString() 
      };
      
      setCashBalance(balance);
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
      const balanceData = {
        current_balance: amount,
        initial_balance: amount,
        initial_date: new Date().toISOString().split('T')[0]
      };
      
      const { error } = await supabase
        .from('cash_balances')
        .insert([balanceData]);
      
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
      const dbData = transformToDatabase(balance);
      const { error } = await supabase
        .from('cash_balances')
        .upsert([dbData]);
      
      if (error) throw error;
      await fetchCashBalance();
    } catch (error) {
      console.error('Error updating cash balance:', error);
      throw error;
    }
  };

  const fetchTaxes = async () => {
    if (!isSupabaseConfigured()) {
      setTaxes([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para taxes');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('taxes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setTaxes((data || []).map(transformFromDatabase<Tax>));
    } catch (error) {
      console.error('Error fetching taxes:', error);
      console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para taxes');
      setTaxes([]);
    }
  };

  const fetchAgendaEvents = async () => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents([]);
      console.log('⚠️ Supabase não configurado - usando dados locais para agenda events');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setAgendaEvents((data || []).map(transformFromDatabase<AgendaEvent>));
    } catch (error) {
      console.error('Error fetching agenda events:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('⚠️ Erro de conexão com Supabase - verifique as configurações no arquivo .env');
        setError('Erro de conexão: Verifique se o Supabase está configurado corretamente no arquivo .env');
      } else {
        console.log('⚠️ Erro ao conectar com Supabase - usando dados locais para agenda events');
      }
      setAgendaEvents([]);
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
      await employeesService.create(employee);
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
      await employeesService.update(employee.id, employee);
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
      await employeesService.delete(id);
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
      const dbData = transformToDatabase(sale);
      const { data, error } = await supabase
        .from('sales')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      
      const transformedSale = transformFromDatabase<Sale>(data);
      
      // Create commission for seller if applicable
      if (transformedSale.sellerId) {
        const seller = employees.find(e => e.id === transformedSale.sellerId);
        if (seller && seller.isSeller) {
          const commissionData = {
            employee_id: transformedSale.sellerId,
            sale_id: transformedSale.id,
            sale_value: transformedSale.totalValue,
            commission_rate: transformedSale.customCommissionRate || 5,
            commission_amount: (transformedSale.totalValue * (transformedSale.customCommissionRate || 5)) / 100,
            date: transformedSale.date,
            status: 'pendente'
          };
          
          await supabase.from('employee_commissions').insert([commissionData]);
        }
      }
      
      // Create cash transaction for instant payments
      (transformedSale.paymentMethods || []).forEach(async (method) => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          try {
            await createCashTransaction({
              date: transformedSale.date,
              type: 'entrada',
              amount: method.amount,
              description: `Venda - ${transformedSale.client} (${method.type.replace('_', ' ')})`,
              category: 'venda',
              relatedId: transformedSale.id,
              paymentMethod: method.type
            });
          } catch (error) {
            console.error('Erro ao criar transação de caixa para venda:', error);
          }
        }
      });
      
      await fetchSales();
      await fetchEmployeeCommissions();
      
      // Create checks and boletos automatically for payment methods
      try {
        await AutomationService.createChecksForSale(transformedSale);
        await AutomationService.createBoletosForSale(transformedSale);
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
      const dbData = transformToDatabase(sale);
      const { error } = await supabase
        .from('sales')
        .update(dbData)
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
      const dbData = transformToDatabase(debt);
      const { error } = await supabase
        .from('debts')
        .insert([dbData]);
      
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
      
      // Update cash balance for local development
      const oldDebt = debts.find(d => d.id === debt.id);
      if (oldDebt && !oldDebt.isPaid && debt.isPaid && cashBalance) {
        // Calculate cash payment amount
        const cashPaymentAmount = (debt.paymentMethods || []).reduce((sum, method) => {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            return sum + method.amount;
          }
          return sum;
        }, 0);
        
        if (cashPaymentAmount > 0) {
          setCashBalance(prev => prev ? {
            ...prev,
            currentBalance: prev.currentBalance - cashPaymentAmount,
            lastUpdated: new Date().toISOString()
          } : null);
        }
      }
      return;
    }
    
    try {
      // Get old debt state before update
      const oldDebt = debts.find(d => d.id === debt.id);
      
      const dbData = transformToDatabase(debt);
      const { error } = await supabase
        .from('debts')
        .update(dbData)
        .eq('id', debt.id);
      
      if (error) throw error;
      
      // Update cash balance if debt was marked as paid
      if (oldDebt && !oldDebt.isPaid && debt.isPaid) {
        // Create cash transactions for cash payment methods
        for (const method of debt.paymentMethods || []) {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            await createCashTransaction({
              date: debt.date,
              type: 'saida',
              amount: method.amount,
              description: `Pagamento de dívida - ${debt.company} (${method.type.replace('_', ' ')})`,
              category: 'divida',
              relatedId: debt.id,
              paymentMethod: method.type
            });
          }
        }
      }
      
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
      const dbData = transformToDatabase(check);
      const { error } = await supabase
        .from('checks')
        .insert([dbData]);
      
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
      
      // Update cash balance for local development
      const oldCheck = checks.find(c => c.id === check.id);
      if (oldCheck && oldCheck.status !== 'compensado' && check.status === 'compensado') {
        if (cashBalance) {
          if (!check.isOwnCheck) {
            // Check received - add to cash
            setCashBalance(prev => prev ? {
              ...prev,
              currentBalance: prev.currentBalance + check.value,
              lastUpdated: new Date().toISOString()
            } : null);
          } else {
            // Own check paid - subtract from cash
            setCashBalance(prev => prev ? {
              ...prev,
              currentBalance: prev.currentBalance - check.value,
              lastUpdated: new Date().toISOString()
            } : null);
          }
        }
      }
      return;
    }
    
    try {
      // Get old check state before update
      const oldCheck = checks.find(c => c.id === check.id);
      
      const dbData = transformToDatabase(check);
      const { error } = await supabase
        .from('checks')
        .update(dbData)
        .eq('id', check.id);
      
      if (error) throw error;
      
      // Update cash balance if check status changed to compensado
      if (oldCheck && oldCheck.status !== 'compensado' && check.status === 'compensado') {
        if (!check.isOwnCheck) {
          // Check from third party was compensated - add to cash
          await createCashTransaction({
            date: check.dueDate,
            type: 'entrada',
            amount: check.value,
            description: `Cheque compensado - ${check.client}`,
            category: 'cheque',
            relatedId: check.id,
            paymentMethod: 'cheque'
          });
        } else {
          // Own check was paid - subtract from cash
          await createCashTransaction({
            date: check.dueDate,
            type: 'saida',
            amount: check.value,
            description: `Cheque próprio pago - ${check.client}`,
            category: 'cheque',
            relatedId: check.id,
            paymentMethod: 'cheque'
          });
        }
      }
      
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
      const dbData = transformToDatabase(boleto);
      const { error } = await supabase
        .from('boletos')
        .insert([dbData]);
      
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
      
      // Update cash balance for local development
      const oldBoleto = boletos.find(b => b.id === boleto.id);
      if (oldBoleto && oldBoleto.status !== 'compensado' && boleto.status === 'compensado') {
        // Boleto was just marked as paid - add to cash
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        
        if (cashBalance && netReceived > 0) {
          setCashBalance(prev => prev ? {
            ...prev,
            currentBalance: prev.currentBalance + netReceived,
            lastUpdated: new Date().toISOString()
          } : null);
        }
      }
      return;
    }
    
    try {
      // Get old boleto state before update
      const oldBoleto = boletos.find(b => b.id === boleto.id);
      
      const dbData = transformToDatabase(boleto);
      const { error } = await supabase
        .from('boletos')
        .update(dbData)
        .eq('id', boleto.id);
      
      if (error) throw error;
      
      // Update cash balance if boleto status changed to compensado
      if (oldBoleto && oldBoleto.status !== 'compensado' && boleto.status === 'compensado') {
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        
        if (netReceived > 0) {
          await createCashTransaction({
            date: boleto.dueDate,
            type: 'entrada',
            amount: netReceived,
            description: `Boleto pago - ${boleto.client}${boleto.overdueAction ? ` (${boleto.overdueAction})` : ''}`,
            category: 'boleto',
            relatedId: boleto.id,
            paymentMethod: 'boleto'
          });
        }
        
        // Create separate transaction for notary costs if any
        if (notaryCosts > 0) {
          await createCashTransaction({
            date: boleto.dueDate,
            type: 'saida',
            amount: notaryCosts,
            description: `Custos de cartório - Boleto ${boleto.client}`,
            category: 'outro',
            relatedId: boleto.id,
            paymentMethod: 'outros'
          });
        }
      }
      
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
      const dbData = transformToDatabase(payment);
      const { error } = await supabase
        .from('employee_payments')
        .insert([dbData]);
      
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
      const dbData = transformToDatabase(payment);
      const { error } = await supabase
        .from('employee_payments')
        .update(dbData)
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
      const dbData = transformToDatabase(advance);
      const { error } = await supabase
        .from('employee_advances')
        .insert([dbData]);
      
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
      const dbData = transformToDatabase(advance);
      const { error } = await supabase
        .from('employee_advances')
        .update(dbData)
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
      const dbData = transformToDatabase(commission);
      const { error } = await supabase
        .from('employee_commissions')
        .insert([dbData]);
      
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
      const dbData = transformToDatabase(commission);
      const { error } = await supabase
        .from('employee_commissions')
        .update(dbData)
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
      const dbData = transformToDatabase(overtime);
      const { error } = await supabase
        .from('employee_overtimes')
        .insert([dbData]);
      
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
      const dbData = transformToDatabase(overtime);
      const { error } = await supabase
        .from('employee_overtimes')
        .update(dbData)
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
      
      // Atualizar saldo do caixa baseado na transação
      if (cashBalance) {
        const balanceChange = transaction.type === 'entrada' ? transaction.amount : -transaction.amount;
        const newBalance = cashBalance.currentBalance + balanceChange;
        setCashBalance({
          ...cashBalance,
          currentBalance: newBalance,
          lastUpdated: new Date().toISOString()
        });
      }
      return;
    }
    
    try {
      const dbData = transformToDatabase(transaction);
      const { error } = await supabase
        .from('cash_transactions')
        .insert([dbData]);
      
      if (error) throw error;
      
      // Atualizar saldo do caixa baseado na transação
      if (cashBalance) {
        const balanceChange = transaction.type === 'entrada' ? transaction.amount : -transaction.amount;
        const newBalance = cashBalance.currentBalance + balanceChange;
        await updateCashBalance({
          ...cashBalance,
          currentBalance: newBalance,
          lastUpdated: new Date().toISOString()
        });
      }
      
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
      const dbData = transformToDatabase(transaction);
      const { error } = await supabase
        .from('cash_transactions')
        .update(dbData)
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
      const dbData = transformToDatabase(fee);
      const { error } = await supabase
        .from('pix_fees')
        .insert([dbData]);
      
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
      const dbData = transformToDatabase(fee);
      const { error } = await supabase
        .from('pix_fees')
        .update(dbData)
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

  // CRUD operations for taxes
  const createTax = async (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTax: Tax = {
        ...tax,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTaxes(prev => [...prev, newTax]);
      
      // Create cash transaction for tax payment
      try {
        await createCashTransaction({
          date: tax.date,
          type: 'saida',
          amount: tax.amount,
          description: `Pagamento de imposto - ${tax.description}`,
          category: 'outro',
          relatedId: newTax.id,
          paymentMethod: tax.paymentMethod
        });
      } catch (error) {
        console.error('Erro ao criar transação de caixa para imposto:', error);
      }
      return;
    }
    
    try {
      const dbData = transformToDatabase(tax);
      const { data, error } = await supabase
        .from('taxes')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      
      const transformedTax = transformFromDatabase<Tax>(data);
      
      // Create cash transaction for tax payment
      try {
        await createCashTransaction({
          date: tax.date,
          type: 'saida',
          amount: tax.amount,
          description: `Pagamento de imposto - ${tax.description}`,
          category: 'outro',
          relatedId: transformedTax.id!,
          paymentMethod: tax.paymentMethod
        });
      } catch (error) {
        console.error('Erro ao criar transação de caixa para imposto:', error);
      }
      
      await fetchTaxes();
    } catch (error) {
      console.error('Error adding tax:', error);
      throw error;
    }
  };

  const updateTax = async (tax: Tax) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.map(t => 
        t.id === tax.id ? { ...tax, updatedAt: new Date().toISOString() } : t
      ));
      return;
    }
    
    try {
      const dbData = transformToDatabase(tax);
      const { error } = await supabase
        .from('taxes')
        .update(dbData)
        .eq('id', tax.id);
      
      if (error) throw error;
      await fetchTaxes();
    } catch (error) {
      console.error('Error updating tax:', error);
      throw error;
    }
  };

  const deleteTax = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.filter(t => t.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('taxes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchTaxes();
    } catch (error) {
      console.error('Error deleting tax:', error);
      throw error;
    }
  };

  // CRUD operations for agenda events
  const createAgendaEvent = async (event: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEvent: AgendaEvent = {
        ...event,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setAgendaEvents(prev => [...prev, newEvent]);
      return;
    }
    
    try {
      const dbData = transformToDatabase(event);
      const { error } = await supabase
        .from('agenda_events')
        .insert([dbData]);
      
      if (error) throw error;
      await fetchAgendaEvents();
    } catch (error) {
      console.error('Error adding agenda event:', error);
      throw error;
    }
  };

  const updateAgendaEvent = async (event: AgendaEvent) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.map(e => 
        e.id === event.id ? { ...event, updatedAt: new Date().toISOString() } : e
      ));
      return;
    }
    
    try {
      const dbData = transformToDatabase(event);
      const { error } = await supabase
        .from('agenda_events')
        .update(dbData)
        .eq('id', event.id);
      
      if (error) throw error;
      await fetchAgendaEvents();
    } catch (error) {
      console.error('Error updating agenda event:', error);
      throw error;
    }
  };

  const deleteAgendaEvent = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.filter(e => e.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('agenda_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchAgendaEvents();
    } catch (error) {
      console.error('Error deleting agenda event:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    // Adicionar delay para evitar múltiplas chamadas simultâneas
    const timer = setTimeout(() => {
      loadAllData();
    }, 100);
    
    return () => clearTimeout(timer);
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
    taxes,
    agendaEvents,
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
    createTax,
    updateTax,
    deleteTax,
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    initializeCashBalance,
    updateCashBalance
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};