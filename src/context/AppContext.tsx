import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseServices } from '../lib/supabaseServices';
import { connectionManager } from '../lib/connectionManager';
import { syncManager } from '../lib/syncManager';
import { offlineDataManager } from '../lib/offlineDataManager';

interface AppContextType {
  // Loading and error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  user: any;
  setUser: (user: any) => void;

  // Data states
  sales: any[];
  employees: any[];
  debts: any[];
  checks: any[];
  boletos: any[];
  employeeCommissions: any[];
  employeePayments: any[];
  employeeAdvances: any[];
  employeeOvertimes: any[];
  pixFees: any[];
  taxes: any[];
  agendaEvents: any[];
  acertos: any[];
  cashBalance: any;
  cashTransactions: any[];

  // Data loading function
  loadAllData: () => Promise<void>;

  // Cash balance functions
  recalculateCashBalance: () => Promise<void>;

  // CRUD functions for sales
  createSale: (saleData: any) => Promise<any>;
  updateSale: (id: string, saleData: any) => Promise<any>;
  deleteSale: (id: string) => Promise<void>;

  // CRUD functions for employees
  createEmployee: (employeeData: any) => Promise<any>;
  updateEmployee: (id: string, employeeData: any) => Promise<any>;
  deleteEmployee: (id: string) => Promise<void>;

  // CRUD functions for debts
  createDebt: (debtData: any) => Promise<any>;
  updateDebt: (id: string, debtData: any) => Promise<any>;
  deleteDebt: (id: string) => Promise<void>;

  // CRUD functions for checks
  createCheck: (checkData: any) => Promise<any>;
  updateCheck: (id: string, checkData: any) => Promise<any>;
  deleteCheck: (id: string) => Promise<void>;

  // CRUD functions for boletos
  createBoleto: (boletoData: any) => Promise<any>;
  updateBoleto: (id: string, boletoData: any) => Promise<any>;
  deleteBoleto: (id: string) => Promise<void>;

  // Other CRUD functions
  createEmployeePayment: (paymentData: any) => Promise<any>;
  createEmployeeAdvance: (advanceData: any) => Promise<any>;
  createEmployeeOvertime: (overtimeData: any) => Promise<any>;
  createPixFee: (feeData: any) => Promise<any>;
  createTax: (taxData: any) => Promise<any>;
  createAgendaEvent: (eventData: any) => Promise<any>;
  createAcerto: (acertoData: any) => Promise<any>;
  createCashTransaction: (transactionData: any) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);

  // Data states
  const [sales, setSales] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [boletos, setBoletos] = useState<any[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<any[]>([]);
  const [employeePayments, setEmployeePayments] = useState<any[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<any[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<any[]>([]);
  const [pixFees, setPixFees] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<any[]>([]);
  const [acertos, setAcertos] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState<any>(null);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);

  // Load all data function
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're online
      const isOnline = connectionManager.getStatus().isOnline;
      
      if (isOnline) {
        // Load data from Supabase
        const [
          salesData,
          employeesData,
          debtsData,
          checksData,
          boletosData,
          commissionsData,
          paymentsData,
          advancesData,
          overtimesData,
          feesData,
          taxesData,
          eventsData,
          acertosData,
          balanceData,
          transactionsData
        ] = await Promise.all([
          supabaseServices.sales.getSales(),
          supabaseServices.employees.getEmployees(),
          supabaseServices.debts.getDebts(),
          supabaseServices.checks.getChecks(),
          supabaseServices.boletos.getBoletos(),
          supabaseServices.employeeCommissions.getCommissions(),
          supabaseServices.employeePayments.getPayments(),
          supabaseServices.employeeAdvances.getAdvances(),
          supabaseServices.employeeOvertimes.getOvertimes(),
          supabaseServices.pixFees.getPixFees(),
          supabaseServices.taxes.getTaxes(),
          supabaseServices.agendaEvents.getEvents(),
          supabaseServices.acertos.getAcertos(),
          supabaseServices.cashBalance.getCurrentBalance(),
          supabaseServices.cashTransactions.getTransactions()
        ]);

        // Update states
        setSales(salesData || []);
        setEmployees(employeesData || []);
        setDebts(debtsData || []);
        setChecks(checksData || []);
        setBoletos(boletosData || []);
        setEmployeeCommissions(commissionsData || []);
        setEmployeePayments(paymentsData || []);
        setEmployeeAdvances(advancesData || []);
        setEmployeeOvertimes(overtimesData || []);
        setPixFees(feesData || []);
        setTaxes(taxesData || []);
        setAgendaEvents(eventsData || []);
        setAcertos(acertosData || []);
        setCashBalance(balanceData);
        setCashTransactions(transactionsData || []);

        // Store data offline
        await offlineDataManager.storeData('sales', salesData || []);
        await offlineDataManager.storeData('employees', employeesData || []);
        await offlineDataManager.storeData('debts', debtsData || []);
        await offlineDataManager.storeData('checks', checksData || []);
        await offlineDataManager.storeData('boletos', boletosData || []);
        await offlineDataManager.storeData('employeeCommissions', commissionsData || []);
        await offlineDataManager.storeData('employeePayments', paymentsData || []);
        await offlineDataManager.storeData('employeeAdvances', advancesData || []);
        await offlineDataManager.storeData('employeeOvertimes', overtimesData || []);
        await offlineDataManager.storeData('pixFees', feesData || []);
        await offlineDataManager.storeData('taxes', taxesData || []);
        await offlineDataManager.storeData('agendaEvents', eventsData || []);
        await offlineDataManager.storeData('acertos', acertosData || []);
        await offlineDataManager.storeData('cashBalance', balanceData);
        await offlineDataManager.storeData('cashTransactions', transactionsData || []);
      } else {
        // Load data from offline storage
        const offlineData = await Promise.all([
          offlineDataManager.getData('sales'),
          offlineDataManager.getData('employees'),
          offlineDataManager.getData('debts'),
          offlineDataManager.getData('checks'),
          offlineDataManager.getData('boletos'),
          offlineDataManager.getData('employeeCommissions'),
          offlineDataManager.getData('employeePayments'),
          offlineDataManager.getData('employeeAdvances'),
          offlineDataManager.getData('employeeOvertimes'),
          offlineDataManager.getData('pixFees'),
          offlineDataManager.getData('taxes'),
          offlineDataManager.getData('agendaEvents'),
          offlineDataManager.getData('acertos'),
          offlineDataManager.getData('cashBalance'),
          offlineDataManager.getData('cashTransactions')
        ]);

        setSales(offlineData[0] || []);
        setEmployees(offlineData[1] || []);
        setDebts(offlineData[2] || []);
        setChecks(offlineData[3] || []);
        setBoletos(offlineData[4] || []);
        setEmployeeCommissions(offlineData[5] || []);
        setEmployeePayments(offlineData[6] || []);
        setEmployeeAdvances(offlineData[7] || []);
        setEmployeeOvertimes(offlineData[8] || []);
        setPixFees(offlineData[9] || []);
        setTaxes(offlineData[10] || []);
        setAgendaEvents(offlineData[11] || []);
        setAcertos(offlineData[12] || []);
        setCashBalance(offlineData[13]);
        setCashTransactions(offlineData[14] || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Cash balance functions
  const recalculateCashBalance = async () => {
    try {
      const balance = await supabaseServices.cashBalance.recalculateBalance();
      setCashBalance(balance);
      return balance;
    } catch (err) {
      console.error('Error recalculating cash balance:', err);
      throw err;
    }
  };

  // CRUD functions for sales
  const createSale = async (saleData: any) => {
    try {
      const result = await supabaseServices.sales.create(saleData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating sale:', err);
      throw err;
    }
  };

  const updateSale = async (id: string, saleData: any) => {
    try {
      const result = await supabaseServices.sales.update(id, saleData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating sale:', err);
      throw err;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await supabaseServices.sales.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting sale:', err);
      throw err;
    }
  };

  // CRUD functions for employees
  const createEmployee = async (employeeData: any) => {
    try {
      const result = await supabaseServices.employees.create(employeeData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (id: string, employeeData: any) => {
    try {
      const result = await supabaseServices.employees.update(id, employeeData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await supabaseServices.employees.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  // CRUD functions for debts
  const createDebt = async (debtData: any) => {
    try {
      const result = await supabaseServices.debts.create(debtData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating debt:', err);
      throw err;
    }
  };

  const updateDebt = async (id: string, debtData: any) => {
    try {
      const result = await supabaseServices.debts.update(id, debtData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating debt:', err);
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await supabaseServices.debts.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting debt:', err);
      throw err;
    }
  };

  // CRUD functions for checks
  const createCheck = async (checkData: any) => {
    try {
      const result = await supabaseServices.checks.create(checkData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating check:', err);
      throw err;
    }
  };

  const updateCheck = async (id: string, checkData: any) => {
    try {
      const result = await supabaseServices.checks.update(id, checkData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating check:', err);
      throw err;
    }
  };

  const deleteCheck = async (id: string) => {
    try {
      await supabaseServices.checks.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting check:', err);
      throw err;
    }
  };

  // CRUD functions for boletos
  const createBoleto = async (boletoData: any) => {
    try {
      const result = await supabaseServices.boletos.create(boletoData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating boleto:', err);
      throw err;
    }
  };

  const updateBoleto = async (id: string, boletoData: any) => {
    try {
      const result = await supabaseServices.boletos.update(id, boletoData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating boleto:', err);
      throw err;
    }
  };

  const deleteBoleto = async (id: string) => {
    try {
      await supabaseServices.boletos.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting boleto:', err);
      throw err;
    }
  };

  // Other CRUD functions
  const createEmployeePayment = async (paymentData: any) => {
    try {
      const result = await supabaseServices.employeePayments.create(paymentData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating employee payment:', err);
      throw err;
    }
  };

  const createEmployeeAdvance = async (advanceData: any) => {
    try {
      const result = await supabaseServices.employeeAdvances.create(advanceData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating employee advance:', err);
      throw err;
    }
  };

  const createEmployeeOvertime = async (overtimeData: any) => {
    try {
      const result = await supabaseServices.employeeOvertimes.create(overtimeData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating employee overtime:', err);
      throw err;
    }
  };

  const createPixFee = async (feeData: any) => {
    try {
      const result = await supabaseServices.pixFees.create(feeData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating pix fee:', err);
      throw err;
    }
  };

  const createTax = async (taxData: any) => {
    try {
      const result = await supabaseServices.taxes.create(taxData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating tax:', err);
      throw err;
    }
  };

  const createAgendaEvent = async (eventData: any) => {
    try {
      const result = await supabaseServices.agendaEvents.create(eventData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating agenda event:', err);
      throw err;
    }
  };

  const createAcerto = async (acertoData: any) => {
    try {
      const result = await supabaseServices.acertos.create(acertoData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating acerto:', err);
      throw err;
    }
  };

  const createCashTransaction = async (transactionData: any) => {
    try {
      const result = await supabaseServices.cashTransactions.createTransaction(transactionData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating cash transaction:', err);
      throw err;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for connection changes
  useEffect(() => {
    const handleConnectionChange = (status: any) => {
      if (status.isOnline) {
        // When coming back online, sync data
        syncManager.startSync().then(() => {
          loadAllData();
        });
      }
    };

    const unsubscribe = connectionManager.addListener(handleConnectionChange);
    return () => unsubscribe();
  }, []);

  const value: AppContextType = {
    // Loading and error states
    isLoading,
    setIsLoading,
    loading,
    error,
    setError,
    user,
    setUser,

    // Data states
    sales,
    employees,
    debts,
    checks,
    boletos,
    employeeCommissions,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    pixFees,
    taxes,
    agendaEvents,
    acertos,
    cashBalance,
    cashTransactions,

    // Data loading function
    loadAllData,

    // Cash balance functions
    recalculateCashBalance,

    // CRUD functions
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
    createEmployeePayment,
    createEmployeeAdvance,
    createEmployeeOvertime,
    createPixFee,
    createTax,
    createAgendaEvent,
    createAcerto,
    createCashTransaction,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};