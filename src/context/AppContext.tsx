import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AutomationService } from '../lib/automationService';
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
  CashBalance,
  CashTransaction,
  PixFee,
  Tax,
  AgendaEvent
} from '../types';

interface AppContextType {
  // Data
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  cashBalance: CashBalance | null;
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
  
  // State
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAllData: () => Promise<void>;
  
  // Sales
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (id: string, sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Debts
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Checks
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<void>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Boletos
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<void>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // Employees
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Employee related
  createEmployeePayment: (payment: EmployeePayment) => Promise<void>;
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployeeOvertime: (overtime: EmployeeOvertime) => Promise<void>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  
  // Cash
  initializeCashBalance: (initialAmount: number) => Promise<void>;
  updateCashBalance: (balance: CashBalance) => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<void>;
  
  // PIX Fees
  createPixFee: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => Promise<void>;
  updatePixFee: (pixFee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  // Taxes
  createTax: (tax: Omit<Tax, 'id' | 'createdAt'>) => Promise<void>;
  updateTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // Agenda
  createAgendaEvent: (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateAgendaEvent: (event: AgendaEvent) => Promise<void>;
  deleteAgendaEvent: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database row to app format
  const transformFromDatabase = (row: any) => {
    if (!row) return row;
    
    const transformed = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = value;
    }
    
    return transformed;
  };

  // Transform app format to database
  const transformToDatabase = (obj: any) => {
    if (!obj) return obj;
    
    const transformed = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      transformed[snakeKey] = value;
    }
    
    return transformed;
  };

  const loadAllData = async () => {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, usando dados mock');
      setLoading(false);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔄 Carregando todos os dados...');

      // Load all data in parallel
      const [
        salesData,
        debtsData,
        checksData,
        boletosData,
        employeesData,
        employeePaymentsData,
        employeeAdvancesData,
        employeeOvertimesData,
        employeeCommissionsData,
        cashBalanceData,
        cashTransactionsData,
        pixFeesData,
        taxesData,
        agendaEventsData
      ] = await Promise.all([
        supabase.from('sales').select(`
          id,
          date,
          delivery_date,
          client,
          seller_id,
          products,
          observations,
          total_value,
          payment_methods(type,amount,installments,installment_value,installment_interval,start_date,first_installment_date,is_own_check,is_third_party_check,third_party_details),
          received_amount,
          pending_amount,
          status,
          payment_description,
          payment_observations,
          custom_commission_rate,
          created_at,
          updated_at
        `).order('date', { ascending: false }),
        supabase.from('debts').select(`
          id,
          date,
          description,
          company,
          total_value,
          payment_methods,
          is_paid,
          paid_amount,
          pending_amount,
          checks_used,
          payment_description,
          debt_payment_description,
          created_at,
          updated_at
        `).order('date', { ascending: false }),
        supabase.from('checks').select('*').order('due_date', { ascending: false }),
        supabase.from('boletos').select('*').order('due_date', { ascending: false }),
        supabase.from('employees').select('*').order('name'),
        supabase.from('employee_payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('employee_advances').select('*').order('date', { ascending: false }),
        supabase.from('employee_overtimes').select('*').order('date', { ascending: false }),
        supabase.from('employee_commissions').select('*').order('date', { ascending: false }),
        supabase.from('cash_balances').select('*').limit(1).single(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
        supabase.from('pix_fees').select('*').order('date', { ascending: false }),
        supabase.from('taxes').select('*').order('date', { ascending: false }),
        supabase.from('agenda_events').select('*').order('date', { ascending: false })
      ]);

      // Check for errors
      const errors = [
        salesData.error,
        debtsData.error,
        checksData.error,
        boletosData.error,
        employeesData.error,
        employeePaymentsData.error,
        employeeAdvancesData.error,
        employeeOvertimesData.error,
        employeeCommissionsData.error,
        pixFeesData.error,
        taxesData.error,
        agendaEventsData.error
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(`Erros ao carregar dados: ${errors.map(e => e.message).join(', ')}`);
      }

      // Transform and set data
      setSales((salesData.data || []).map(transformFromDatabase));
      setDebts((debtsData.data || []).map(transformFromDatabase));
      setChecks((checksData.data || []).map(transformFromDatabase));
      setBoletos((boletosData.data || []).map(transformFromDatabase));
      setEmployees((employeesData.data || []).map(transformFromDatabase));
      setEmployeePayments((employeePaymentsData.data || []).map(transformFromDatabase));
      setEmployeeAdvances((employeeAdvancesData.data || []).map(transformFromDatabase));
      setEmployeeOvertimes((employeeOvertimesData.data || []).map(transformFromDatabase));
      setEmployeeCommissions((employeeCommissionsData.data || []).map(transformFromDatabase));
      setCashBalance(cashBalanceData.data ? transformFromDatabase(cashBalanceData.data) : null);
      setCashTransactions((cashTransactionsData.data || []).map(transformFromDatabase));
      setPixFees((pixFeesData.data || []).map(transformFromDatabase));
      setTaxes((taxesData.data || []).map(transformFromDatabase));
      setAgendaEvents((agendaEventsData.data || []).map(transformFromDatabase));

      console.log('✅ Todos os dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Sales functions
  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newSale = {
        ...saleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setSales(prev => [newSale, ...prev]);
      return;
    }

    const dbData = transformToDatabase(saleData);
    const { data, error } = await supabase.from('sales').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newSale = transformFromDatabase(data);
    setSales(prev => [newSale, ...prev]);
    
    // Create checks and boletos automatically
    await AutomationService.createChecksForSale(newSale);
    await AutomationService.createBoletosForSale(newSale);
    
    // Reload data to get the new checks and boletos
    await loadAllData();
  };

  const updateSale = async (id: string, saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.map(sale => 
        sale.id === id ? { ...saleData, id, createdAt: sale.createdAt } : sale
      ));
      return;
    }

    const dbData = transformToDatabase(saleData);
    const { error } = await supabase.from('sales').update(dbData).eq('id', id);
    
    if (error) throw error;
    
    setSales(prev => prev.map(sale => 
      sale.id === id ? { ...saleData, id, createdAt: sale.createdAt } : sale
    ));
    
    // Update related checks and boletos
    await AutomationService.updateChecksForSale({ ...saleData, id, createdAt: '' }, checks);
    await AutomationService.updateBoletosForSale({ ...saleData, id, createdAt: '' }, boletos);
    
    // Reload data
    await loadAllData();
  };

  const deleteSale = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.filter(sale => sale.id !== id));
      return;
    }

    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    
    setSales(prev => prev.filter(sale => sale.id !== id));
    await loadAllData();
  };

  // Debt functions
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newDebt = {
        ...debtData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setDebts(prev => [newDebt, ...prev]);
      return;
    }

    const dbData = transformToDatabase(debtData);
    const { data, error } = await supabase.from('debts').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newDebt = transformFromDatabase(data);
    setDebts(prev => [newDebt, ...prev]);
  };

  const updateDebt = async (debt: Debt) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
      return;
    }

    const dbData = transformToDatabase(debt);
    const { error } = await supabase.from('debts').update(dbData).eq('id', debt.id);
    
    if (error) throw error;
    
    setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
  };

  const deleteDebt = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.filter(debt => debt.id !== id));
      return;
    }

    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
    
    setDebts(prev => prev.filter(debt => debt.id !== id));
  };

  // Check functions
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newCheck = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setChecks(prev => [newCheck, ...prev]);
      return;
    }

    const dbData = transformToDatabase(checkData);
    const { data, error } = await supabase.from('checks').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newCheck = transformFromDatabase(data);
    setChecks(prev => [newCheck, ...prev]);
  };

  const updateCheck = async (check: Check) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.map(c => c.id === check.id ? check : c));
      return;
    }

    const dbData = transformToDatabase(check);
    const { error } = await supabase.from('checks').update(dbData).eq('id', check.id);
    
    if (error) throw error;
    
    setChecks(prev => prev.map(c => c.id === check.id ? check : c));
  };

  const deleteCheck = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.filter(check => check.id !== id));
      return;
    }

    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) throw error;
    
    setChecks(prev => prev.filter(check => check.id !== id));
  };

  // Boleto functions
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newBoleto = {
        ...boletoData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setBoletos(prev => [newBoleto, ...prev]);
      return;
    }

    const dbData = transformToDatabase(boletoData);
    const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newBoleto = transformFromDatabase(data);
    setBoletos(prev => [newBoleto, ...prev]);
  };

  const updateBoleto = async (boleto: Boleto) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
      return;
    }

    const dbData = transformToDatabase(boleto);
    const { error } = await supabase.from('boletos').update(dbData).eq('id', boleto.id);
    
    if (error) throw error;
    
    setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
  };

  const deleteBoleto = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.filter(boleto => boleto.id !== id));
      return;
    }

    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw error;
    
    setBoletos(prev => prev.filter(boleto => boleto.id !== id));
  };

  // Employee functions
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEmployee = {
        ...employeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployees(prev => [newEmployee, ...prev]);
      return;
    }

    const dbData = transformToDatabase(employeeData);
    const { data, error } = await supabase.from('employees').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newEmployee = transformFromDatabase(data);
    setEmployees(prev => [newEmployee, ...prev]);
  };

  const updateEmployee = async (employee: Employee) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      return;
    }

    const dbData = transformToDatabase(employee);
    const { error } = await supabase.from('employees').update(dbData).eq('id', employee.id);
    
    if (error) throw error;
    
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
  };

  const deleteEmployee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      return;
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  };

  // Employee payment functions
  const createEmployeePayment = async (payment: EmployeePayment) => {
    if (!isSupabaseConfigured()) {
      const newPayment = {
        ...payment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployeePayments(prev => [newPayment, ...prev]);
      return;
    }

    const dbData = transformToDatabase(payment);
    const { data, error } = await supabase.from('employee_payments').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newPayment = transformFromDatabase(data);
    setEmployeePayments(prev => [newPayment, ...prev]);
    
    // Reload cash data to reflect the automatic transaction
    await loadCashData();
  };

  const createEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newAdvance = {
        ...advance,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployeeAdvances(prev => [newAdvance, ...prev]);
      return;
    }

    const dbData = transformToDatabase(advance);
    const { data, error } = await supabase.from('employee_advances').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newAdvance = transformFromDatabase(data);
    setEmployeeAdvances(prev => [newAdvance, ...prev]);
    
    // Reload cash data to reflect the automatic transaction
    await loadCashData();
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance) => {
    if (!isSupabaseConfigured()) {
      setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
      return;
    }

    const dbData = transformToDatabase(advance);
    const { error } = await supabase.from('employee_advances').update(dbData).eq('id', advance.id);
    
    if (error) throw error;
    
    setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
  };

  const createEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newOvertime = {
        ...overtime,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployeeOvertimes(prev => [newOvertime, ...prev]);
      return;
    }

    const dbData = transformToDatabase(overtime);
    const { data, error } = await supabase.from('employee_overtimes').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newOvertime = transformFromDatabase(data);
    setEmployeeOvertimes(prev => [newOvertime, ...prev]);
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime) => {
    if (!isSupabaseConfigured()) {
      setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
      return;
    }

    const dbData = transformToDatabase(overtime);
    const { error } = await supabase.from('employee_overtimes').update(dbData).eq('id', overtime.id);
    
    if (error) throw error;
    
    setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission) => {
    if (!isSupabaseConfigured()) {
      setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
      return;
    }

    const dbData = transformToDatabase(commission);
    const { error } = await supabase.from('employee_commissions').update(dbData).eq('id', commission.id);
    
    if (error) throw error;
    
    setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
  };

  // Cash functions
  const loadCashData = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [balanceData, transactionsData] = await Promise.all([
        supabase.from('cash_balances').select('*').limit(1).single(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false })
      ]);

      setCashBalance(balanceData.data ? transformFromDatabase(balanceData.data) : null);
      setCashTransactions((transactionsData.data || []).map(transformFromDatabase));
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
    }
  };

  const initializeCashBalance = async (initialAmount: number) => {
    if (!isSupabaseConfigured()) {
      const newBalance = {
        id: Date.now().toString(),
        currentBalance: initialAmount,
        initialBalance: initialAmount,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setCashBalance(newBalance);
      return;
    }

    const balanceData = {
      current_balance: initialAmount,
      initial_balance: initialAmount,
      initial_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase.from('cash_balances').insert([balanceData]).select().single();
    
    if (error) throw error;
    
    setCashBalance(transformFromDatabase(data));
  };

  const updateCashBalance = async (balance: CashBalance) => {
    if (!isSupabaseConfigured()) {
      setCashBalance(balance);
      return;
    }

    const dbData = transformToDatabase(balance);
    const { error } = await supabase.from('cash_balances').update(dbData).eq('id', balance.id);
    
    if (error) throw error;
    
    setCashBalance(balance);
  };

  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTransaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setCashTransactions(prev => [newTransaction, ...prev]);
      return;
    }

    const dbData = transformToDatabase(transaction);
    const { data, error } = await supabase.from('cash_transactions').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newTransaction = transformFromDatabase(data);
    setCashTransactions(prev => [newTransaction, ...prev]);
    
    // Reload cash balance to reflect the change
    await loadCashData();
  };

  // PIX Fee functions
  const createPixFee = async (pixFeeData: Omit<PixFee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newPixFee = {
        ...pixFeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setPixFees(prev => [newPixFee, ...prev]);
      return;
    }

    const dbData = transformToDatabase(pixFeeData);
    const { data, error } = await supabase.from('pix_fees').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newPixFee = transformFromDatabase(data);
    setPixFees(prev => [newPixFee, ...prev]);
    
    // Reload cash data to reflect the automatic transaction
    await loadCashData();
  };

  const updatePixFee = async (pixFee: PixFee) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.map(p => p.id === pixFee.id ? pixFee : p));
      return;
    }

    const dbData = transformToDatabase(pixFee);
    const { error } = await supabase.from('pix_fees').update(dbData).eq('id', pixFee.id);
    
    if (error) throw error;
    
    setPixFees(prev => prev.map(p => p.id === pixFee.id ? pixFee : p));
  };

  const deletePixFee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.filter(pixFee => pixFee.id !== id));
      return;
    }

    const { error } = await supabase.from('pix_fees').delete().eq('id', id);
    if (error) throw error;
    
    setPixFees(prev => prev.filter(pixFee => pixFee.id !== id));
  };

  // Tax functions
  const createTax = async (taxData: Omit<Tax, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTax = {
        ...taxData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTaxes(prev => [newTax, ...prev]);
      return;
    }

    const dbData = transformToDatabase(taxData);
    const { data, error } = await supabase.from('taxes').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newTax = transformFromDatabase(data);
    setTaxes(prev => [newTax, ...prev]);
    
    // Reload cash data to reflect the automatic transaction
    await loadCashData();
  };

  const updateTax = async (tax: Tax) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
      return;
    }

    const dbData = transformToDatabase(tax);
    const { error } = await supabase.from('taxes').update(dbData).eq('id', tax.id);
    
    if (error) throw error;
    
    setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
  };

  const deleteTax = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.filter(tax => tax.id !== id));
      return;
    }

    const { error } = await supabase.from('taxes').delete().eq('id', id);
    if (error) throw error;
    
    setTaxes(prev => prev.filter(tax => tax.id !== id));
  };

  // Agenda functions
  const createAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setAgendaEvents(prev => [newEvent, ...prev]);
      return;
    }

    const dbData = transformToDatabase(eventData);
    const { data, error } = await supabase.from('agenda_events').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newEvent = transformFromDatabase(data);
    setAgendaEvents(prev => [newEvent, ...prev]);
  };

  const updateAgendaEvent = async (event: AgendaEvent) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.map(e => e.id === event.id ? event : e));
      return;
    }

    const dbData = transformToDatabase(event);
    const { error } = await supabase.from('agenda_events').update(dbData).eq('id', event.id);
    
    if (error) throw error;
    
    setAgendaEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const deleteAgendaEvent = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.filter(event => event.id !== id));
      return;
    }

    const { error } = await supabase.from('agenda_events').delete().eq('id', id);
    if (error) throw error;
    
    setAgendaEvents(prev => prev.filter(event => event.id !== id));
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const value: AppContextType = {
    // Data
    sales,
    debts,
    checks,
    boletos,
    employees,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    cashBalance,
    cashTransactions,
    pixFees,
    taxes,
    agendaEvents,
    
    // State
    loading,
    isLoading,
    error,
    
    // Actions
    loadAllData,
    
    // Sales
    addSale,
    updateSale,
    deleteSale,
    
    // Debts
    createDebt,
    updateDebt,
    deleteDebt,
    
    // Checks
    createCheck,
    updateCheck,
    deleteCheck,
    
    // Boletos
    createBoleto,
    updateBoleto,
    deleteBoleto,
    
    // Employees
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Employee related
    createEmployeePayment,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    updateEmployeeCommission,
    
    // Cash
    initializeCashBalance,
    updateCashBalance,
    createCashTransaction,
    
    // PIX Fees
    createPixFee,
    updatePixFee,
    deletePixFee,
    
    // Taxes
    createTax,
    updateTax,
    deleteTax,
    
    // Agenda
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useApp = () => useAppContext();