import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured, healthCheck } from '../lib/supabase';
import { ErrorHandler } from '../lib/errorHandler';
import { connectionManager } from '../lib/connectionManager';
import { syncManager } from '../lib/syncManager';
import { getOfflineData } from '../lib/offlineStorage';
import toast from 'react-hot-toast';
import { 
  salesService, 
  employeesService, 
  debtsService, 
  checksService, 
  boletosService, 
  cashService, 
  agendaService, 
  taxesService, 
  pixFeesService 
} from '../lib/supabaseServices';
import type { 
  Sale, 
  Employee, 
  Debt, 
  Check, 
  Boleto, 
  CashTransaction, 
  AgendaEvent, 
  Tax, 
  PixFee,
  CashBalance
} from '../types';

interface AppContextType {
  // Data
  sales: Sale[];
  employees: Employee[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  cashTransactions: CashTransaction[];
  agendaEvents: AgendaEvent[];
  taxes: Tax[];
  pixFees: PixFee[];
  cashBalance: CashBalance | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  loadAllData: () => Promise<void>;
  
  // Employee related data
  employeePayments: any[];
  employeeAdvances: any[];
  employeeOvertimes: any[];
  employeeCommissions: any[];
  
  // Cash methods
  initializeCashBalance: (initialAmount: number) => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
  
  // Employee methods
  createEmployeePayment: (paymentData: any) => Promise<any>;
  updateEmployeeCommission: (commissionData: any) => Promise<any>;
  createEmployeeAdvance: (advanceData: any) => Promise<any>;
  updateEmployeeAdvance: (advanceData: any) => Promise<any>;
  createEmployeeOvertime: (overtimeData: any) => Promise<any>;
  updateEmployeeOvertime: (overtimeData: any) => Promise<any>;
  
  // Sales methods
  createSale: (saleData: Partial<Sale>) => Promise<string>;
  updateSale: (id: string, saleData: Partial<Sale>) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
  
  // Employee methods
  createEmployee: (employeeData: Partial<Employee>) => Promise<string>;
  updateEmployee: (id: string, employeeData: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Debt methods
  createDebt: (debtData: Partial<Debt>) => Promise<string>;
  updateDebt: (id: string, debtData: Partial<Debt>) => Promise<Debt>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Check methods
  createCheck: (checkData: Partial<Check>) => Promise<string>;
  updateCheck: (id: string, checkData: Partial<Check>) => Promise<Check>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Boleto methods
  createBoleto: (boletoData: Partial<Boleto>) => Promise<string>;
  updateBoleto: (id: string, boletoData: Partial<Boleto>) => Promise<Boleto>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // Cash methods
  createCashTransaction: (transactionData: Partial<CashTransaction>) => Promise<string>;
  updateCashTransaction: (id: string, transactionData: Partial<CashTransaction>) => Promise<CashTransaction>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  // Agenda methods
  createAgendaEvent: (eventData: Partial<AgendaEvent>) => Promise<string>;
  updateAgendaEvent: (id: string, eventData: Partial<AgendaEvent>) => Promise<AgendaEvent>;
  deleteAgendaEvent: (id: string) => Promise<void>;
  
  // Tax methods
  createTax: (taxData: Partial<Tax>) => Promise<string>;
  updateTax: (id: string, taxData: Partial<Tax>) => Promise<Tax>;
  deleteTax: (id: string) => Promise<void>;
  
  // PIX Fee methods
  createPixFee: (pixFeeData: Partial<PixFee>) => Promise<string>;
  updatePixFee: (id: string, pixFeeData: Partial<PixFee>) => Promise<PixFee>;
  deletePixFee: (id: string) => Promise<void>;
  
  // Utility methods
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Employee related data
  const [employeePayments, setEmployeePayments] = useState<any[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<any[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<any[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<any[]>([]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check Supabase configuration first
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured, loading offline data only');
        await loadOfflineDataOnly();
        return;
      }
      
      // Test connection
      const healthStatus = await healthCheck();
      if (!healthStatus.connected) {
        console.warn('⚠️ Supabase not reachable, loading offline data only');
        await loadOfflineDataOnly();
        return;
      }
      
      const [
        salesData,
        employeesData,
        debtsData,
        checksData,
        boletosData,
        cashTransactionsData,
        agendaEventsData,
        taxesData,
        pixFeesData,
        cashBalanceData,
        employeePaymentsData,
        employeeAdvancesData,
        employeeOvertimesData,
        employeeCommissionsData
      ] = await Promise.all([
        salesService.getAll(),
        employeesService.getAll(),
        debtsService.getAll(),
        checksService.getAll(),
        boletosService.getAll(),
        cashService.getTransactions(),
        agendaService.getAll(),
        taxesService.getAll(),
        pixFeesService.getAll(),
        cashService.getBalance(),
        employeePaymentsService?.getAll() || Promise.resolve([]),
        employeeAdvancesService?.getAll() || Promise.resolve([]),
        employeeOvertimesService?.getAll() || Promise.resolve([]),
        employeeCommissionsService?.getAll() || Promise.resolve([])
      ]);

      setSales(salesData);
      setEmployees(employeesData);
      setDebts(debtsData);
      setChecks(checksData);
      setBoletos(boletosData);
      setCashTransactions(cashTransactionsData);
      setAgendaEvents(agendaEventsData);
      setTaxes(taxesData);
      setPixFees(pixFeesData);
      setCashBalance(cashBalanceData);
      setEmployeePayments(employeePaymentsData);
      setEmployeeAdvances(employeeAdvancesData);
      setEmployeeOvertimes(employeeOvertimesData);
      setEmployeeCommissions(employeeCommissionsData);
      
      console.log('✅ All data loaded successfully');
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load All Data');
      
      // Try to load offline data as fallback
      console.warn('⚠️ Failed to load from Supabase, trying offline data...');
      try {
        await loadOfflineDataOnly();
        toast.error('❌ Sem conexão com servidor. Mostrando dados offline.');
      } catch (offlineError) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados';
        setError(ErrorHandler.handleSupabaseError(error));
      }
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Load offline data only
  const loadOfflineDataOnly = async () => {
    try {
      console.log('📱 Loading offline data...');
      
      const offlineData = await getOfflineData();
      
      // Group offline data by table
      const salesData = offlineData.filter(d => d.table === 'sales').map(d => d.data);
      const employeesData = offlineData.filter(d => d.table === 'employees').map(d => d.data);
      const debtsData = offlineData.filter(d => d.table === 'debts').map(d => d.data);
      const checksData = offlineData.filter(d => d.table === 'checks').map(d => d.data);
      const boletosData = offlineData.filter(d => d.table === 'boletos').map(d => d.data);
      
      // Set offline data
      setSales(salesData);
      setEmployees(employeesData);
      setDebts(debtsData);
      setChecks(checksData);
      setBoletos(boletosData);
      
      // Set empty arrays for data that doesn't have offline support yet
      setCashTransactions([]);
      setAgendaEvents([]);
      setTaxes([]);
      setPixFees([]);
      setCashBalance(null);
      setEmployeePayments([]);
      setEmployeeAdvances([]);
      setEmployeeOvertimes([]);
      setEmployeeCommissions([]);
      
      console.log('📱 Offline data loaded:', {
        sales: salesData.length,
        employees: employeesData.length,
        debts: debtsData.length,
        checks: checksData.length,
        boletos: boletosData.length
      });
      
    } catch (error) {
      console.error('Error loading offline data:', error);
      throw error;
    }
  };
  useEffect(() => {
    loadAllData();
    
    // Setup connection monitoring and auto-sync
    const unsubscribe = connectionManager.addListener((status) => {
      if (status.isOnline && status.isSupabaseReachable) {
        console.log('🌐 Connection restored, starting auto-sync...');
        syncManager.startSync().then(() => {
          // Reload data after successful sync
          loadAllData();
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Cash methods
  const initializeCashBalance = async (initialAmount: number): Promise<void> => {
    try {
      await cashService.initializeBalance(initialAmount);
      await loadAllData();
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Initialize Cash Balance');
      throw error;
    }
  };
  
  const recalculateCashBalance = async (): Promise<void> => {
    try {
      await cashService.recalculateBalance();
      await loadAllData();
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Recalculate Cash Balance');
      throw error;
    }
  };
  
  // Employee methods
  const createEmployeePayment = async (paymentData: any): Promise<any> => {
    try {
      const result = await employeePaymentsService.create(paymentData);
      await loadAllData();
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Payment');
      throw error;
    }
  };
  
  const updateEmployeeCommission = async (commissionData: any): Promise<any> => {
    try {
      await employeeCommissionsService.update(commissionData.id, commissionData);
      await loadAllData();
      return commissionData;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Commission');
      throw error;
    }
  };
  
  const createEmployeeAdvance = async (advanceData: any): Promise<any> => {
    try {
      const result = await employeeAdvancesService.create(advanceData);
      await loadAllData();
      return result;
    } catch (error) {
      console.error('Error creating employee advance:', error);
      throw error;
    }
  };
  
  const updateEmployeeAdvance = async (advanceData: any): Promise<any> => {
    try {
      await employeeAdvancesService.update(advanceData.id, advanceData);
      await loadAllData();
      return advanceData;
    } catch (error) {
      console.error('Error updating employee advance:', error);
      throw error;
    }
  };
  
  const createEmployeeOvertime = async (overtimeData: any): Promise<any> => {
    try {
      const result = await employeeOvertimesService.create(overtimeData);
      await loadAllData();
      return result;
    } catch (error) {
      console.error('Error creating employee overtime:', error);
      throw error;
    }
  };
  
  const updateEmployeeOvertime = async (overtimeData: any): Promise<any> => {
    try {
      await employeeOvertimesService.update(overtimeData.id, overtimeData);
      await loadAllData();
      return overtimeData;
    } catch (error) {
      console.error('Error updating employee overtime:', error);
      throw error;
    }
  };

  // Sales methods
  const createSale = async (saleData: Partial<Sale>): Promise<string> => {
    const id = await salesService.create(saleData);
    await loadAllData();
    return id;
  };

  const updateSale = async (id: string, saleData: Partial<Sale>): Promise<Sale> => {
    const updatedSale = await salesService.update(id, saleData);
    await loadAllData();
    return updatedSale;
  };

  const deleteSale = async (id: string): Promise<void> => {
    await salesService.delete(id);
    await loadAllData();
  };

  // Employee methods
  const createEmployee = async (employeeData: Partial<Employee>): Promise<string> => {
    const id = await employeesService.create(employeeData);
    await loadAllData();
    return id;
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    const updatedEmployee = await employeesService.update(id, employeeData);
    await loadAllData();
    return updatedEmployee;
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    await employeesService.delete(id);
    await loadAllData();
  };

  // Debt methods
  const createDebt = async (debtData: Partial<Debt>): Promise<string> => {
    const id = await debtsService.create(debtData);
    await loadAllData();
    return id;
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>): Promise<Debt> => {
    const updatedDebt = await debtsService.update(id, debtData);
    await loadAllData();
    return updatedDebt;
  };

  const deleteDebt = async (id: string): Promise<void> => {
    await debtsService.delete(id);
    await loadAllData();
  };

  // Check methods
  const createCheck = async (checkData: Partial<Check>): Promise<string> => {
    const id = await checksService.create(checkData);
    await loadAllData();
    return id;
  };

  const updateCheck = async (id: string, checkData: Partial<Check>): Promise<Check> => {
    const updatedCheck = await checksService.update(id, checkData);
    await loadAllData();
    return updatedCheck;
  };

  const deleteCheck = async (id: string): Promise<void> => {
    await checksService.delete(id);
    await loadAllData();
  };

  // Boleto methods
  const createBoleto = async (boletoData: Partial<Boleto>): Promise<string> => {
    const id = await boletosService.create(boletoData);
    await loadAllData();
    return id;
  };

  const updateBoleto = async (id: string, boletoData: Partial<Boleto>): Promise<Boleto> => {
    const updatedBoleto = await boletosService.update(id, boletoData);
    await loadAllData();
    return updatedBoleto;
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    await boletosService.delete(id);
    await loadAllData();
  };

  // Cash methods
  const createCashTransaction = async (transactionData: Partial<CashTransaction>): Promise<string> => {
    const id = await cashService.createTransaction(transactionData);
    await loadAllData();
    return id;
  };

  const updateCashTransaction = async (id: string, transactionData: Partial<CashTransaction>): Promise<CashTransaction> => {
    const updatedTransaction = await cashService.updateTransaction(id, transactionData);
    await loadAllData();
    return updatedTransaction;
  };

  const deleteCashTransaction = async (id: string): Promise<void> => {
    await cashService.deleteTransaction(id);
    await loadAllData();
  };

  // Agenda methods
  const createAgendaEvent = async (eventData: Partial<AgendaEvent>): Promise<string> => {
    const id = await agendaService.create(eventData);
    await loadAllData();
    return id;
  };

  const updateAgendaEvent = async (id: string, eventData: Partial<AgendaEvent>): Promise<AgendaEvent> => {
    const updatedEvent = await agendaService.update(id, eventData);
    await loadAllData();
    return updatedEvent;
  };

  const deleteAgendaEvent = async (id: string): Promise<void> => {
    await agendaService.delete(id);
    await loadAllData();
  };

  // Tax methods
  const createTax = async (taxData: Partial<Tax>): Promise<string> => {
    const id = await taxesService.create(taxData);
    await loadAllData();
    return id;
  };

  const updateTax = async (id: string, taxData: Partial<Tax>): Promise<Tax> => {
    const updatedTax = await taxesService.update(id, taxData);
    await loadAllData();
    return updatedTax;
  };

  const deleteTax = async (id: string): Promise<void> => {
    await taxesService.delete(id);
    await loadAllData();
  };

  // PIX Fee methods
  const createPixFee = async (pixFeeData: Partial<PixFee>): Promise<string> => {
    const id = await pixFeesService.create(pixFeeData);
    await loadAllData();
    return id;
  };

  const updatePixFee = async (id: string, pixFeeData: Partial<PixFee>): Promise<PixFee> => {
    const updatedPixFee = await pixFeesService.update(id, pixFeeData);
    await loadAllData();
    return updatedPixFee;
  };

  const deletePixFee = async (id: string): Promise<void> => {
    await pixFeesService.delete(id);
    await loadAllData();
  };


  const value: AppContextType = {
    // Data
    sales,
    employees,
    debts,
    checks,
    boletos,
    cashTransactions,
    agendaEvents,
    taxes,
    pixFees,
    cashBalance,
    loading,
    isLoading,
    error,
    setError,
    loadAllData,
    
    // Employee related data
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    
    // Cash methods
    initializeCashBalance,
    recalculateCashBalance,
    
    // Employee methods
    createEmployeePayment,
    updateEmployeeCommission,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    
    // Methods
    createSale,
    updateSale,
    deleteSale,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createDebt,
    updateDebt,
    deleteDebt,
    createCheck,
    updateCheck,
    deleteCheck,
    createBoleto,
    updateBoleto,
    deleteBoleto,
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    createTax,
    updateTax,
    deleteTax,
    createPixFee,
    updatePixFee,
    deletePixFee,
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