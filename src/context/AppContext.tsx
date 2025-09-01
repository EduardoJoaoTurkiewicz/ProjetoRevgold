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
  
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  createEmployeePayment: (payment: EmployeePayment) => Promise<void>;
  updateEmployeePayment: (payment: EmployeePayment) => Promise<void>;
  deleteEmployeePayment: (id: string) => Promise<void>;
  
  createEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  deleteEmployeeAdvance: (id: string) => Promise<void>;
  
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteEmployeeOvertime: (id: string) => Promise<void>;
  
  createEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  deleteEmployeeCommission: (id: string) => Promise<void>;
  
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCashTransaction: (transaction: CashTransaction) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  createPixFee: (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePixFee: (fee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  createTax: (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // Utility functions
  initializeCashBalance: (initialAmount: number) => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
  updateCashBalance: (amount: number, type: 'entrada' | 'saida', description: string, category: string, relatedId?: string) => Promise<void>;
  setError: (error: string | null) => void;
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
    const newSale = await salesService.create(sale);
    setSales(prev => [newSale, ...prev]);
    await loadAllData();
  };

  const updateSale = async (id: string, saleData: Partial<Sale>) => {
    await salesService.update(id, saleData);
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...saleData } : s));
    await loadAllData();
  };

  const deleteSale = async (id: string) => {
    await salesService.delete(id);
    setSales(prev => prev.filter(s => s.id !== id));
    await loadAllData();
  };

  // Debts CRUD operations
  const createDebt = async (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDebt = await debtsService.create(debt);
    setDebts(prev => [newDebt, ...prev]);
    await loadAllData();
  };

  const updateDebt = async (debt: Debt) => {
    await debtsService.update(debt.id, debt);
    setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
    await loadAllData();
  };

  const deleteDebt = async (id: string) => {
    await debtsService.delete(id);
    setDebts(prev => prev.filter(d => d.id !== id));
    await loadAllData();
  };

  // Checks CRUD operations
  const createCheck = async (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCheck = await checksService.create(check);
    setChecks(prev => [newCheck, ...prev]);
    await loadAllData();
  };

  const updateCheck = async (check: Check) => {
    await checksService.update(check.id, check);
    setChecks(prev => prev.map(c => c.id === check.id ? check : c));
    await loadAllData();
  };

  const deleteCheck = async (id: string) => {
    await checksService.delete(id);
    setChecks(prev => prev.filter(c => c.id !== id));
    await loadAllData();
  };

  // Boletos CRUD operations
  const createBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBoleto = await boletosService.create(boleto);
    setBoletos(prev => [newBoleto, ...prev]);
    await loadAllData();
  };

  const updateBoleto = async (boleto: Boleto) => {
    await boletosService.update(boleto.id, boleto);
    setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
    await loadAllData();
  };

  const deleteBoleto = async (id: string) => {
    await boletosService.delete(id);
    setBoletos(prev => prev.filter(b => b.id !== id));
    await loadAllData();
  };

  // Employees CRUD operations
  const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee = await employeesService.create(employee);
    setEmployees(prev => [newEmployee, ...prev]);
    await loadAllData();
  };

  const updateEmployee = async (employee: Employee) => {
    await employeesService.update(employee.id, employee);
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    await loadAllData();
  };

  const deleteEmployee = async (id: string) => {
    await employeesService.delete(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    await loadAllData();
  };

  // Employee Payments CRUD operations
  const createEmployeePayment = async (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPayment = await employeePaymentsService.create(payment);
    setEmployeePayments(prev => [newPayment, ...prev]);
    await loadAllData();
  };

  const updateEmployeePayment = async (payment: EmployeePayment) => {
    await employeePaymentsService.update(payment.id!, payment);
    setEmployeePayments(prev => prev.map(p => p.id === payment.id ? payment : p));
    await loadAllData();
  };

  const deleteEmployeePayment = async (id: string) => {
    await employeePaymentsService.delete(id);
    setEmployeePayments(prev => prev.filter(p => p.id !== id));
    await loadAllData();
  };

  // Employee Advances CRUD operations
  const createEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAdvance = await employeeAdvancesService.create(advance);
    setEmployeeAdvances(prev => [newAdvance, ...prev]);
    await loadAllData();
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance) => {
    await employeeAdvancesService.update(advance.id!, advance);
    setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
    await loadAllData();
  };

  const deleteEmployeeAdvance = async (id: string) => {
    await employeeAdvancesService.delete(id);
    setEmployeeAdvances(prev => prev.filter(a => a.id !== id));
    await loadAllData();
  };

  // Employee Overtimes CRUD operations
  const createEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOvertime = await employeeOvertimesService.create(overtime);
    setEmployeeOvertimes(prev => [newOvertime, ...prev]);
    await loadAllData();
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime) => {
    await employeeOvertimesService.update(overtime.id!, overtime);
    setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
    await loadAllData();
  };

  const deleteEmployeeOvertime = async (id: string) => {
    await employeeOvertimesService.delete(id);
    setEmployeeOvertimes(prev => prev.filter(o => o.id !== id));
    await loadAllData();
  };

  // Employee Commissions CRUD operations
  const createEmployeeCommission = async (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCommission = await employeeCommissionsService.create(commission);
    setEmployeeCommissions(prev => [newCommission, ...prev]);
    await loadAllData();
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission) => {
    await employeeCommissionsService.update(commission.id!, commission);
    setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
    await loadAllData();
  };

  const deleteEmployeeCommission = async (id: string) => {
    await employeeCommissionsService.delete(id);
    setEmployeeCommissions(prev => prev.filter(c => c.id !== id));
    await loadAllData();
  };

  // Cash Transactions CRUD operations
  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction = await cashTransactionsService.create(transaction);
    setCashTransactions(prev => [newTransaction, ...prev]);
    await loadAllData();
  };

  const updateCashTransaction = async (transaction: CashTransaction) => {
    await cashTransactionsService.update(transaction.id!, transaction);
    setCashTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    await loadAllData();
  };

  const deleteCashTransaction = async (id: string) => {
    await cashTransactionsService.delete(id);
    setCashTransactions(prev => prev.filter(t => t.id !== id));
    await loadAllData();
  };

  // PIX Fees CRUD operations
  const createPixFee = async (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFee = await pixFeesService.create(fee);
    setPixFees(prev => [newFee, ...prev]);
    await loadAllData();
  };

  const updatePixFee = async (fee: PixFee) => {
    await pixFeesService.update(fee.id!, fee);
    setPixFees(prev => prev.map(f => f.id === fee.id ? fee : f));
    await loadAllData();
  };

  const deletePixFee = async (id: string) => {
    await pixFeesService.delete(id);
    setPixFees(prev => prev.filter(f => f.id !== id));
    await loadAllData();
  };

  // Taxes CRUD operations
  const createTax = async (tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTax = await taxesService.create(tax);
    setTaxes(prev => [newTax, ...prev]);
    await loadAllData();
  };

  const updateTax = async (tax: Tax) => {
    await taxesService.update(tax.id!, tax);
    setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
    await loadAllData();
  };

  const deleteTax = async (id: string) => {
    await taxesService.delete(id);
    setTaxes(prev => prev.filter(t => t.id !== id));
    await loadAllData();
  };

  // Utility functions
  const initializeCashBalance = async (initialAmount: number) => {
    try {
      const newBalance = await cashBalancesService.create({
        currentBalance: initialAmount,
        initialBalance: initialAmount,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      });
      setCashBalance(newBalance);
      await loadAllData();
    } catch (error) {
      console.error('Erro ao inicializar caixa:', error);
      throw error;
    }
  };

  const recalculateCashBalance = async () => {
    try {
      // Recalcular saldo baseado em todas as transações
      const balance = await cashBalancesService.get();
      if (balance) {
        const transactions = await cashTransactionsService.getAll();
        const totalEntradas = transactions
          .filter(t => t.type === 'entrada')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalSaidas = transactions
          .filter(t => t.type === 'saida')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const newBalance = balance.initialBalance + totalEntradas - totalSaidas;
        
        await cashBalancesService.update(balance.id!, {
          currentBalance: newBalance,
          lastUpdated: new Date().toISOString()
        });
      }
      await loadAllData();
    } catch (err) {
      console.error('Error recalculating cash balance:', err);
      throw err;
    }
  };

  const updateCashBalance = async (amount: number, type: 'entrada' | 'saida', description: string, category: string, relatedId?: string) => {
    try {
      // Create cash transaction
      const newTransaction = await cashTransactionsService.create({
        date: new Date().toISOString().split('T')[0],
        type,
        amount,
        description,
        category,
        relatedId,
        paymentMethod: type === 'entrada' ? 'recebimento' : 'pagamento'
      });
      
      setCashTransactions(prev => [newTransaction, ...prev]);
      
      // Update cash balance manually
      if (cashBalance) {
        const newBalance = type === 'entrada' 
          ? cashBalance.currentBalance + amount
          : cashBalance.currentBalance - amount;
        
        await cashBalancesService.update(cashBalance.id!, {
          currentBalance: newBalance,
          lastUpdated: new Date().toISOString()
        });
        
        setCashBalance(prev => prev ? { ...prev, currentBalance: newBalance, lastUpdated: new Date().toISOString() } : null);
      }
      
      await loadAllData();
    } catch (err) {
      console.error('Error updating cash balance:', err);
      throw err;
    }
  };

  // Add setError function to context
  const setErrorState = (error: string | null) => {
    setError(error);
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
    updateCashBalance,
    setError: setErrorState,
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