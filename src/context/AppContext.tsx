import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
  PixFee 
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
  cashBalance: number;
  loading: boolean;
  
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
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
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
        cashBalanceData
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
        cashService.getBalance()
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sales methods
  const createSale = async (saleData: Partial<Sale>): Promise<string> => {
    const id = await salesService.create(saleData);
    await loadData();
    return id;
  };

  const updateSale = async (id: string, saleData: Partial<Sale>): Promise<Sale> => {
    const updatedSale = await salesService.update(id, saleData);
    await loadData();
    return updatedSale;
  };

  const deleteSale = async (id: string): Promise<void> => {
    await salesService.delete(id);
    await loadData();
  };

  // Employee methods
  const createEmployee = async (employeeData: Partial<Employee>): Promise<string> => {
    const id = await employeesService.create(employeeData);
    await loadData();
    return id;
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    const updatedEmployee = await employeesService.update(id, employeeData);
    await loadData();
    return updatedEmployee;
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    await employeesService.delete(id);
    await loadData();
  };

  // Debt methods
  const createDebt = async (debtData: Partial<Debt>): Promise<string> => {
    const id = await debtsService.create(debtData);
    await loadData();
    return id;
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>): Promise<Debt> => {
    const updatedDebt = await debtsService.update(id, debtData);
    await loadData();
    return updatedDebt;
  };

  const deleteDebt = async (id: string): Promise<void> => {
    await debtsService.delete(id);
    await loadData();
  };

  // Check methods
  const createCheck = async (checkData: Partial<Check>): Promise<string> => {
    const id = await checksService.create(checkData);
    await loadData();
    return id;
  };

  const updateCheck = async (id: string, checkData: Partial<Check>): Promise<Check> => {
    const updatedCheck = await checksService.update(id, checkData);
    await loadData();
    return updatedCheck;
  };

  const deleteCheck = async (id: string): Promise<void> => {
    await checksService.delete(id);
    await loadData();
  };

  // Boleto methods
  const createBoleto = async (boletoData: Partial<Boleto>): Promise<string> => {
    const id = await boletosService.create(boletoData);
    await loadData();
    return id;
  };

  const updateBoleto = async (id: string, boletoData: Partial<Boleto>): Promise<Boleto> => {
    const updatedBoleto = await boletosService.update(id, boletoData);
    await loadData();
    return updatedBoleto;
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    await boletosService.delete(id);
    await loadData();
  };

  // Cash methods
  const createCashTransaction = async (transactionData: Partial<CashTransaction>): Promise<string> => {
    const id = await cashService.createTransaction(transactionData);
    await loadData();
    return id;
  };

  const updateCashTransaction = async (id: string, transactionData: Partial<CashTransaction>): Promise<CashTransaction> => {
    const updatedTransaction = await cashService.updateTransaction(id, transactionData);
    await loadData();
    return updatedTransaction;
  };

  const deleteCashTransaction = async (id: string): Promise<void> => {
    await cashService.deleteTransaction(id);
    await loadData();
  };

  // Agenda methods
  const createAgendaEvent = async (eventData: Partial<AgendaEvent>): Promise<string> => {
    const id = await agendaService.create(eventData);
    await loadData();
    return id;
  };

  const updateAgendaEvent = async (id: string, eventData: Partial<AgendaEvent>): Promise<AgendaEvent> => {
    const updatedEvent = await agendaService.update(id, eventData);
    await loadData();
    return updatedEvent;
  };

  const deleteAgendaEvent = async (id: string): Promise<void> => {
    await agendaService.delete(id);
    await loadData();
  };

  // Tax methods
  const createTax = async (taxData: Partial<Tax>): Promise<string> => {
    const id = await taxesService.create(taxData);
    await loadData();
    return id;
  };

  const updateTax = async (id: string, taxData: Partial<Tax>): Promise<Tax> => {
    const updatedTax = await taxesService.update(id, taxData);
    await loadData();
    return updatedTax;
  };

  const deleteTax = async (id: string): Promise<void> => {
    await taxesService.delete(id);
    await loadData();
  };

  // PIX Fee methods
  const createPixFee = async (pixFeeData: Partial<PixFee>): Promise<string> => {
    const id = await pixFeesService.create(pixFeeData);
    await loadData();
    return id;
  };

  const updatePixFee = async (id: string, pixFeeData: Partial<PixFee>): Promise<PixFee> => {
    const updatedPixFee = await pixFeesService.update(id, pixFeeData);
    await loadData();
    return updatedPixFee;
  };

  const deletePixFee = async (id: string): Promise<void> => {
    await pixFeesService.delete(id);
    await loadData();
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
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
    refreshData
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