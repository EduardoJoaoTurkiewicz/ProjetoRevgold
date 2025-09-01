import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  salesService,
  debtsService,
  checksService,
  boletosService,
  employeesService,
  employeePaymentsService,
  employeeAdvancesService,
  employeeOvertimesService,
  employeeCommissionsService,
  cashTransactionsService,
  pixFeesService,
  cashBalancesService,
  taxesService
} from '../lib/supabaseServices';
import { removeDuplicates } from '../utils/removeDuplicates';
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

interface AppContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  
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
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
  cashBalance: CashBalance | null;
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
  
  // Auth functions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Data management functions
  refreshData: () => Promise<void>;
  loadAllData: () => Promise<void>;
  
  // CRUD operations
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  createCheck: (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCheck: (id: string, check: Partial<Check>) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoleto: (id: string, boleto: Partial<Boleto>) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  createEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeePayment: (id: string, payment: Partial<EmployeePayment>) => Promise<void>;
  deleteEmployeePayment: (id: string) => Promise<void>;
  
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeAdvance: (id: string, advance: Partial<EmployeeAdvance>) => Promise<void>;
  deleteEmployeeAdvance: (id: string) => Promise<void>;
  
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeOvertime: (id: string, overtime: Partial<EmployeeOvertime>) => Promise<void>;
  deleteEmployeeOvertime: (id: string) => Promise<void>;
  
  createEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeCommission: (id: string, commission: Partial<EmployeeCommission>) => Promise<void>;
  deleteEmployeeCommission: (id: string) => Promise<void>;
  
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCashTransaction: (id: string, transaction: Partial<CashTransaction>) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  createPixFee: (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePixFee: (id: string, fee: Partial<PixFee>) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  createTax: (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTax: (id: string, tax: Partial<Tax>) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // Utility functions
  initializeCashBalance: () => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
  cleanupDuplicates: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
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
        cashTransactionsData,
        pixFeesData,
        cashBalanceData,
        taxesData
      ] = await Promise.all([
        salesService.getAll(),
        debtsService.getAll(),
        checksService.getAll(),
        boletosService.getAll(),
        employeesService.getAll(),
        employeePaymentsService.getAll(),
        employeeAdvancesService.getAll(),
        employeeOvertimesService.getAll(),
        employeeCommissionsService.getAll(),
        cashTransactionsService.getAll(),
        pixFeesService.getAll(),
        cashBalancesService.get(),
        taxesService.getAll()
      ]);

      setSales(salesData);
      setDebts(debtsData);
      setChecks(checksData);
      setBoletos(boletosData);
      setEmployees(employeesData);
      setEmployeePayments(employeePaymentsData);
      setEmployeeAdvances(employeeAdvancesData);
      setEmployeeOvertimes(employeeOvertimesData);
      setEmployeeCommissions(employeeCommissionsData);
      setCashTransactions(cashTransactionsData);
      setPixFees(pixFeesData);
      setCashBalance(cashBalanceData);
      setTaxes(taxesData);
      setAgendaEvents([]); // Initialize as empty array for now
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshData = async () => {
    await loadAllData();
  };

  // Sales CRUD operations
  const createSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    await salesService.create(sale);
    await loadAllData();
  };

  const updateSale = async (sale: Sale) => {
    await salesService.update(sale.id, sale);
    await loadAllData();
  };

  const deleteSale = async (id: string) => {
    await salesService.delete(id);
    await loadAllData();
  };

  // Debts CRUD operations
  const createDebt = async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    await debtsService.create(debt);
    await loadAllData();
  };

  const updateDebt = async (id: string, debt: Partial<Debt>) => {
    await debtsService.update(id, debt);
    await loadAllData();
  };

  const deleteDebt = async (id: string) => {
    await debtsService.delete(id);
    await loadAllData();
  };

  // Checks CRUD operations
  const createCheck = async (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => {
    await checksService.create(check);
    await loadAllData();
  };

  const updateCheck = async (id: string, check: Partial<Check>) => {
    await checksService.update(id, check);
    await loadAllData();
  };

  const deleteCheck = async (id: string) => {
    await checksService.delete(id);
    await loadAllData();
  };

  // Boletos CRUD operations
  const createBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
    await boletosService.create(boleto);
    await loadAllData();
  };

  const updateBoleto = async (id: string, boleto: Partial<Boleto>) => {
    await boletosService.update(id, boleto);
    await loadAllData();
  };

  const deleteBoleto = async (id: string) => {
    await boletosService.delete(id);
    await loadAllData();
  };

  // Employees CRUD operations
  const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    await employeesService.create(employee);
    await loadAllData();
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    await employeesService.update(id, employee);
    await loadAllData();
  };

  const deleteEmployee = async (id: string) => {
    await employeesService.delete(id);
    await loadAllData();
  };

  // Employee Payments CRUD operations
  const createEmployeePayment = async (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    await employeePaymentsService.create(payment);
    await loadAllData();
  };

  const updateEmployeePayment = async (id: string, payment: Partial<EmployeePayment>) => {
    await employeePaymentsService.update(id, payment);
    await loadAllData();
  };

  const deleteEmployeePayment = async (id: string) => {
    await employeePaymentsService.delete(id);
    await loadAllData();
  };

  // Employee Advances CRUD operations
  const createEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => {
    await employeeAdvancesService.create(advance);
    await loadAllData();
  };

  const updateEmployeeAdvance = async (id: string, advance: Partial<EmployeeAdvance>) => {
    await employeeAdvancesService.update(id, advance);
    await loadAllData();
  };

  const deleteEmployeeAdvance = async (id: string) => {
    await employeeAdvancesService.delete(id);
    await loadAllData();
  };

  // Employee Overtimes CRUD operations
  const createEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => {
    await employeeOvertimesService.create(overtime);
    await loadAllData();
  };

  const updateEmployeeOvertime = async (id: string, overtime: Partial<EmployeeOvertime>) => {
    await employeeOvertimesService.update(id, overtime);
    await loadAllData();
  };

  const deleteEmployeeOvertime = async (id: string) => {
    await employeeOvertimesService.delete(id);
    await loadAllData();
  };

  // Employee Commissions CRUD operations
  const createEmployeeCommission = async (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
    await employeeCommissionsService.create(commission);
    await loadAllData();
  };

  const updateEmployeeCommission = async (id: string, commission: Partial<EmployeeCommission>) => {
    await employeeCommissionsService.update(id, commission);
    await loadAllData();
  };

  const deleteEmployeeCommission = async (id: string) => {
    await employeeCommissionsService.delete(id);
    await loadAllData();
  };

  // Cash Transactions CRUD operations
  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await cashTransactionsService.create(transaction);
    await loadAllData();
  };

  const updateCashTransaction = async (id: string, transaction: Partial<CashTransaction>) => {
    await cashTransactionsService.update(id, transaction);
    await loadAllData();
  };

  const deleteCashTransaction = async (id: string) => {
    await cashTransactionsService.delete(id);
    await loadAllData();
  };

  // PIX Fees CRUD operations
  const createPixFee = async (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => {
    await pixFeesService.create(fee);
    await loadAllData();
  };

  const updatePixFee = async (id: string, fee: Partial<PixFee>) => {
    await pixFeesService.update(id, fee);
    await loadAllData();
  };

  const deletePixFee = async (id: string) => {
    await pixFeesService.delete(id);
    await loadAllData();
  };

  // Taxes CRUD operations
  const createTax = async (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => {
    await taxesService.create(tax);
    await loadAllData();
  };

  const updateTax = async (id: string, tax: Partial<Tax>) => {
    await taxesService.update(id, tax);
    await loadAllData();
  };

  const deleteTax = async (id: string) => {
    await taxesService.delete(id);
    await loadAllData();
  };

  // Utility functions
  const initializeCashBalance = async () => {
    if (!cashBalance) {
      const newBalance = await cashBalancesService.create({
        currentBalance: 0,
        lastUpdated: new Date().toISOString()
      });
      setCashBalance(newBalance);
    }
  };

  const recalculateCashBalance = async () => {
    try {
      const { error } = await supabase.rpc('recalculate_cash_balance');
      if (error) throw error;
      await loadAllData();
    } catch (err) {
      console.error('Error recalculating cash balance:', err);
      throw err;
    }
  };

  const cleanupDuplicates = async () => {
    try {
      await removeDuplicates();
      await loadAllData();
    } catch (err) {
      console.error('Error cleaning up duplicates:', err);
      throw err;
    }
  };

  const value: AppContextType = {
    user,
    loading,
    isLoading,
    error,
    
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
    cashTransactions,
    pixFees,
    cashBalance,
    taxes,
    agendaEvents,
    
    // Auth functions
    signIn,
    signUp,
    signOut,
    
    // Data management
    refreshData,
    loadAllData,
    
    // CRUD operations
    createSale,
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
    
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    createEmployeePayment,
    updateEmployeePayment,
    deleteEmployeePayment,
    
    createEmployeeAdvance,
    updateEmployeeAdvance,
    deleteEmployeeAdvance,
    
    createEmployeeOvertime,
    updateEmployeeOvertime,
    deleteEmployeeOvertime,
    
    createEmployeeCommission,
    updateEmployeeCommission,
    deleteEmployeeCommission,
    
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    
    createPixFee,
    updatePixFee,
    deletePixFee,
    
    createTax,
    updateTax,
    deleteTax,
    
    // Utility functions
    initializeCashBalance,
    recalculateCashBalance,
    cleanupDuplicates,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}