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
    
    const transformed: any = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = value;
    }
    
    return transformed;
  };

  // Transform app format to database
  const transformToDatabase = (obj: any) => {
    if (!obj) return obj;
    
    const transformed: any = {};
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
          payment_methods,
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

    try {
      const dbData = transformToDatabase(boletoData);
      const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
      
      if (error) throw error;
      
      const newBoleto = transformFromDatabase(data);
      setBoletos(prev => [newBoleto, ...prev]);
      console.log('✅ Boleto criado com sucesso:', newBoleto.id);
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error);
      throw error;
    }
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