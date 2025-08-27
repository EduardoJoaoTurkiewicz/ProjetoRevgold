import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  CashBalance
} from '../types';
import { 
  salesService,
  debtsService,
  checksService,
  boletosService,
  employeesService,
  employeeCommissionsService,
  employeePaymentsService,
  employeeAdvancesService,
  employeeOvertimesService,
  cashBalancesService,
  pixFeesService,
  cashTransactionsService
} from '../lib/supabaseServices';

interface AppState {
  currentView: string;
  isLoading: boolean;
  error: string | null;
}

interface AppContextType {
  state: AppState;
  
  // Data arrays
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employees: Employee[];
  employeeCommissions: EmployeeCommission[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
  cashBalance: CashBalance | null;
  
  // State management
  setCurrentView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data operations
  loadAllData: () => Promise<void>;
  
  // Sales operations
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Debt operations
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Check operations
  addCheck: (check: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCheck: (id: string, check: Partial<Check>) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Boleto operations
  addBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoleto: (id: string, boleto: Partial<Boleto>) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // Employee operations
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Commission operations
  addEmployeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeCommission: (id: string, commission: Partial<EmployeeCommission>) => Promise<void>;
  deleteEmployeeCommission: (id: string) => Promise<void>;
  
  // Payment operations
  addEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeePayment: (id: string, payment: Partial<EmployeePayment>) => Promise<void>;
  deleteEmployeePayment: (id: string) => Promise<void>;
  
  // Advance operations
  addEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeAdvance: (id: string, advance: Partial<EmployeeAdvance>) => Promise<void>;
  deleteEmployeeAdvance: (id: string) => Promise<void>;
  
  // Overtime operations
  addEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployeeOvertime: (id: string, overtime: Partial<EmployeeOvertime>) => Promise<void>;
  deleteEmployeeOvertime: (id: string) => Promise<void>;
  
  // Cash operations
  addCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCashTransaction: (id: string, transaction: Partial<CashTransaction>) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  initializeCashBalance: (initialBalance: number) => Promise<void>;
  updateCashBalance: (newBalance: number) => Promise<void>;
  
  // PIX Fee operations
  addPixFee: (fee: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePixFee: (id: string, fee: Partial<PixFee>) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    isLoading: false,
    error: null,
  });

  // Data state
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);

  // State management functions
  const setCurrentView = (view: string) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Load all data function
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        salesData,
        debtsData,
        checksData,
        boletosData,
        employeesData,
        commissionsData,
        paymentsData,
        advancesData,
        overtimesData,
        transactionsData,
        feesData,
        balanceData
      ] = await Promise.all([
        salesService.getAll(),
        debtsService.getAll(),
        checksService.getAll(),
        boletosService.getAll(),
        employeesService.getAll(),
        employeeCommissionsService.getAll(),
        employeePaymentsService.getAll(),
        employeeAdvancesService.getAll(),
        employeeOvertimesService.getAll(),
        cashTransactionsService.getAll(),
        pixFeesService.getAll(),
        cashBalancesService.get()
      ]);

      setSales(salesData);
      setDebts(debtsData);
      setChecks(checksData);
      setBoletos(boletosData);
      setEmployees(employeesData);
      setEmployeeCommissions(commissionsData);
      setEmployeePayments(paymentsData);
      setEmployeeAdvances(advancesData);
      setEmployeeOvertimes(overtimesData);
      setCashTransactions(transactionsData);
      setPixFees(feesData);
      setCashBalance(balanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Sales operations
  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newSale = await salesService.create(saleData);
      setSales(prev => [newSale, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create sale');
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: Partial<Sale>) => {
    try {
      await salesService.update(id, saleData);
      setSales(prev => prev.map(sale => sale.id === id ? { ...sale, ...saleData } : sale));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update sale');
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await salesService.delete(id);
      setSales(prev => prev.filter(sale => sale.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete sale');
      throw error;
    }
  };

  // Debt operations
  const addDebt = async (debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDebt = await debtsService.create(debtData);
      setDebts(prev => [newDebt, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create debt');
      throw error;
    }
  };

  const updateDebt = async (id: string, debtData: Partial<Debt>) => {
    try {
      await debtsService.update(id, debtData);
      setDebts(prev => prev.map(debt => debt.id === id ? { ...debt, ...debtData } : debt));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update debt');
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await debtsService.delete(id);
      setDebts(prev => prev.filter(debt => debt.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete debt');
      throw error;
    }
  };

  // Check operations
  const addCheck = async (checkData: Omit<Check, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCheck = await checksService.create(checkData);
      setChecks(prev => [newCheck, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create check');
      throw error;
    }
  };

  const updateCheck = async (id: string, checkData: Partial<Check>) => {
    try {
      await checksService.update(id, checkData);
      setChecks(prev => prev.map(check => check.id === id ? { ...check, ...checkData } : check));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update check');
      throw error;
    }
  };

  const deleteCheck = async (id: string) => {
    try {
      await checksService.delete(id);
      setChecks(prev => prev.filter(check => check.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete check');
      throw error;
    }
  };

  // Boleto operations
  const addBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBoleto = await boletosService.create(boletoData);
      setBoletos(prev => [newBoleto, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create boleto');
      throw error;
    }
  };

  const updateBoleto = async (id: string, boletoData: Partial<Boleto>) => {
    try {
      await boletosService.update(id, boletoData);
      setBoletos(prev => prev.map(boleto => boleto.id === id ? { ...boleto, ...boletoData } : boleto));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update boleto');
      throw error;
    }
  };

  const deleteBoleto = async (id: string) => {
    try {
      await boletosService.delete(id);
      setBoletos(prev => prev.filter(boleto => boleto.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete boleto');
      throw error;
    }
  };

  // Employee operations
  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEmployee = await employeesService.create(employeeData);
      setEmployees(prev => [newEmployee, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create employee');
      throw error;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      await employeesService.update(id, employeeData);
      setEmployees(prev => prev.map(employee => employee.id === id ? { ...employee, ...employeeData } : employee));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update employee');
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeesService.delete(id);
      setEmployees(prev => prev.filter(employee => employee.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete employee');
      throw error;
    }
  };

  // Commission operations
  const addEmployeeCommission = async (commissionData: Omit<EmployeeCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCommission = await employeeCommissionsService.create(commissionData);
      setEmployeeCommissions(prev => [newCommission, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create commission');
      throw error;
    }
  };

  const updateEmployeeCommission = async (id: string, commissionData: Partial<EmployeeCommission>) => {
    try {
      await employeeCommissionsService.update(id, commissionData);
      setEmployeeCommissions(prev => prev.map(commission => commission.id === id ? { ...commission, ...commissionData } : commission));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update commission');
      throw error;
    }
  };

  const deleteEmployeeCommission = async (id: string) => {
    try {
      await employeeCommissionsService.delete(id);
      setEmployeeCommissions(prev => prev.filter(commission => commission.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete commission');
      throw error;
    }
  };

  // Payment operations
  const addEmployeePayment = async (paymentData: Omit<EmployeePayment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPayment = await employeePaymentsService.create(paymentData);
      setEmployeePayments(prev => [newPayment, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create payment');
      throw error;
    }
  };

  const updateEmployeePayment = async (id: string, paymentData: Partial<EmployeePayment>) => {
    try {
      await employeePaymentsService.update(id, paymentData);
      setEmployeePayments(prev => prev.map(payment => payment.id === id ? { ...payment, ...paymentData } : payment));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update payment');
      throw error;
    }
  };

  const deleteEmployeePayment = async (id: string) => {
    try {
      await employeePaymentsService.delete(id);
      setEmployeePayments(prev => prev.filter(payment => payment.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete payment');
      throw error;
    }
  };

  // Advance operations
  const addEmployeeAdvance = async (advanceData: Omit<EmployeeAdvance, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAdvance = await employeeAdvancesService.create(advanceData);
      setEmployeeAdvances(prev => [newAdvance, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create advance');
      throw error;
    }
  };

  const updateEmployeeAdvance = async (id: string, advanceData: Partial<EmployeeAdvance>) => {
    try {
      await employeeAdvancesService.update(id, advanceData);
      setEmployeeAdvances(prev => prev.map(advance => advance.id === id ? { ...advance, ...advanceData } : advance));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update advance');
      throw error;
    }
  };

  const deleteEmployeeAdvance = async (id: string) => {
    try {
      await employeeAdvancesService.delete(id);
      setEmployeeAdvances(prev => prev.filter(advance => advance.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete advance');
      throw error;
    }
  };

  // Overtime operations
  const addEmployeeOvertime = async (overtimeData: Omit<EmployeeOvertime, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newOvertime = await employeeOvertimesService.create(overtimeData);
      setEmployeeOvertimes(prev => [newOvertime, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create overtime');
      throw error;
    }
  };

  const updateEmployeeOvertime = async (id: string, overtimeData: Partial<EmployeeOvertime>) => {
    try {
      await employeeOvertimesService.update(id, overtimeData);
      setEmployeeOvertimes(prev => prev.map(overtime => overtime.id === id ? { ...overtime, ...overtimeData } : overtime));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update overtime');
      throw error;
    }
  };

  const deleteEmployeeOvertime = async (id: string) => {
    try {
      await employeeOvertimesService.delete(id);
      setEmployeeOvertimes(prev => prev.filter(overtime => overtime.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete overtime');
      throw error;
    }
  };

  // Cash operations
  const addCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTransaction = await cashTransactionsService.create(transactionData);
      setCashTransactions(prev => [newTransaction, ...prev]);
      
      // Update cash balance
      if (cashBalance) {
        const balanceChange = transactionData.type === 'entrada' ? transactionData.amount : -transactionData.amount;
        const newBalance = cashBalance.currentBalance + balanceChange;
        await updateCashBalance(newBalance);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
      throw error;
    }
  };

  const updateCashTransaction = async (id: string, transactionData: Partial<CashTransaction>) => {
    try {
      await cashTransactionsService.update(id, transactionData);
      setCashTransactions(prev => prev.map(transaction => transaction.id === id ? { ...transaction, ...transactionData } : transaction));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update transaction');
      throw error;
    }
  };

  const deleteCashTransaction = async (id: string) => {
    try {
      await cashTransactionsService.delete(id);
      setCashTransactions(prev => prev.filter(transaction => transaction.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete transaction');
      throw error;
    }
  };

  const initializeCashBalance = async (initialBalance: number) => {
    try {
      const balanceData = {
        currentBalance: initialBalance,
        initialBalance: initialBalance,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      };
      const newBalance = await cashBalancesService.create(balanceData);
      setCashBalance(newBalance);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize cash balance');
      throw error;
    }
  };

  const updateCashBalance = async (newBalance: number) => {
    try {
      if (cashBalance) {
        const updatedData = {
          currentBalance: newBalance,
          lastUpdated: new Date().toISOString()
        };
        await cashBalancesService.update(cashBalance.id, updatedData);
        setCashBalance(prev => prev ? { ...prev, ...updatedData } : null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update cash balance');
      throw error;
    }
  };

  // PIX Fee operations
  const addPixFee = async (feeData: Omit<PixFee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newFee = await pixFeesService.create(feeData);
      setPixFees(prev => [newFee, ...prev]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create PIX fee');
      throw error;
    }
  };

  const updatePixFee = async (id: string, feeData: Partial<PixFee>) => {
    try {
      await pixFeesService.update(id, feeData);
      setPixFees(prev => prev.map(fee => fee.id === id ? { ...fee, ...feeData } : fee));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update PIX fee');
      throw error;
    }
  };

  const deletePixFee = async (id: string) => {
    try {
      await pixFeesService.delete(id);
      setPixFees(prev => prev.filter(fee => fee.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete PIX fee');
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const value: AppContextType = {
    state,
    
    // Data arrays
    sales,
    debts,
    checks,
    boletos,
    employees,
    employeeCommissions,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    cashTransactions,
    pixFees,
    cashBalance,
    
    // State management
    setCurrentView,
    setLoading,
    setError,
    
    // Data operations
    loadAllData,
    
    // CRUD operations
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
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addEmployeeCommission,
    updateEmployeeCommission,
    deleteEmployeeCommission,
    addEmployeePayment,
    updateEmployeePayment,
    deleteEmployeePayment,
    addEmployeeAdvance,
    updateEmployeeAdvance,
    deleteEmployeeAdvance,
    addEmployeeOvertime,
    updateEmployeeOvertime,
    deleteEmployeeOvertime,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    initializeCashBalance,
    updateCashBalance,
    addPixFee,
    updatePixFee,
    deletePixFee,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};