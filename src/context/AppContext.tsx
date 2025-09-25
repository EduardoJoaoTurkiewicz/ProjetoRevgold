import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseServices, enhancedSupabaseServices } from '../lib/supabaseServices';
import { enhancedSyncManager } from '../lib/enhancedSyncManager';
import { getOfflineDataEnhanced, mergeOnlineOfflineDataEnhanced } from '../lib/enhancedOfflineStorage';
import { DeduplicationService } from '../lib/deduplicationService';
import { UUIDManager } from '../lib/uuidManager';
import { connectionManager } from '../lib/connectionManager';
import { ErrorHandler } from '../lib/errorHandler';

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
  updateSale: (saleData: any) => Promise<any>;
  deleteSale: (id: string) => Promise<void>;

  // CRUD functions for employees
  createEmployee: (employeeData: any) => Promise<any>;
  updateEmployee: (employeeData: any) => Promise<any>;
  deleteEmployee: (id: string) => Promise<void>;

  // CRUD functions for debts
  createDebt: (debtData: any) => Promise<any>;
  updateDebt: (debtData: any) => Promise<any>;
  deleteDebt: (id: string) => Promise<void>;

  // CRUD functions for checks
  createCheck: (checkData: any) => Promise<any>;
  updateCheck: (checkData: any) => Promise<any>;
  deleteCheck: (id: string) => Promise<void>;

  // CRUD functions for boletos
  createBoleto: (boletoData: any) => Promise<any>;
  updateBoleto: (boletoData: any) => Promise<any>;
  deleteBoleto: (id: string) => Promise<void>;

  // Other CRUD functions
  createEmployeePayment: (paymentData: any) => Promise<any>;
  createEmployeeAdvance: (advanceData: any) => Promise<any>;
  createEmployeeOvertime: (overtimeData: any) => Promise<any>;
  createPixFee: (feeData: any) => Promise<any>;
  updatePixFee: (id: string, feeData: any) => Promise<any>;
  deletePixFee: (id: string) => Promise<void>;
  createTax: (taxData: any) => Promise<any>;
  updateTax: (id: string, taxData: any) => Promise<any>;
  deleteTax: (id: string) => Promise<void>;
  createAgendaEvent: (eventData: any) => Promise<any>;
  updateAgendaEvent: (eventData: any) => Promise<any>;
  deleteAgendaEvent: (id: string) => Promise<void>;
  createAcerto: (acertoData: any) => Promise<any>;
  updateAcerto: (acertoData: any) => Promise<any>;
  deleteAcerto: (id: string) => Promise<void>;
  createCashTransaction: (transactionData: any) => Promise<any>;
  updateCashTransaction: (transactionData: any) => Promise<any>;
  deleteCashTransaction: (id: string) => Promise<void>;
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

  // Track loading state for each data type to prevent multiple loads
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [lastLoadTime, setLastLoadTime] = useState<Record<string, number>>({});

  // Load all data function
  const loadAllData = async () => {
    // Prevent multiple simultaneous loads
    if (loadingStates.loadAllData) {
      console.log('🔄 Data loading already in progress, skipping...');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStates(prev => ({ ...prev, loadAllData: true }));

      // Check if we're online
      const isOnline = connectionManager.getStatus().isOnline;
      
      if (isOnline) {
        // Load data from Supabase with enhanced services
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
          enhancedSupabaseServices.sales.getSales(),
          enhancedSupabaseServices.employees.getEmployees(),
          enhancedSupabaseServices.debts.getDebts(),
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

        // Merge with offline data and remove duplicates
        const offlineSalesData = await getOfflineDataEnhanced('sales');
        const offlineEmployeesData = await getOfflineDataEnhanced('employees');
        const offlineDebtsData = await getOfflineDataEnhanced('debts');
        
        const mergedSales = mergeOnlineOfflineDataEnhanced(
          salesData || [], 
          offlineSalesData.map(d => d.data)
        );
        const mergedEmployees = mergeOnlineOfflineDataEnhanced(
          employeesData || [], 
          offlineEmployeesData.map(d => d.data)
        );
        const mergedDebts = mergeOnlineOfflineDataEnhanced(
          debtsData || [], 
          offlineDebtsData.map(d => d.data)
        );

        // Update states with deduplicated data
        setSales(DeduplicationService.removeDuplicatesById(mergedSales));
        setEmployees(DeduplicationService.removeDuplicatesById(mergedEmployees));
        setDebts(DeduplicationService.removeDuplicatesById(mergedDebts));
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

        console.log('✅ Data loaded and merged successfully');
      } else {
        // Load data from enhanced offline storage
        const [
          offlineSalesData,
          offlineEmployeesData,
          offlineDebtsData
        ] = await Promise.all([
          getOfflineDataEnhanced('sales'),
          getOfflineDataEnhanced('employees'),
          getOfflineDataEnhanced('debts')
        ]);

        // Set offline data with deduplication
        setSales(DeduplicationService.removeDuplicatesById(offlineSalesData.map(d => d.data)));
        setEmployees(DeduplicationService.removeDuplicatesById(offlineEmployeesData.map(d => d.data)));
        setDebts(DeduplicationService.removeDuplicatesById(offlineDebtsData.map(d => d.data)));
        
        console.log('✅ Offline data loaded with deduplication');
      }
      
      // Update last load time
      setLastLoadTime(prev => ({ ...prev, loadAllData: Date.now() }));
    } catch (err) {
      console.error('Error loading data:', err);
      ErrorHandler.logProjectError(err, 'Load All Data');
      setError(ErrorHandler.handleSupabaseError(err));
    } finally {
      setLoading(false);
      setLoadingStates(prev => ({ ...prev, loadAllData: false }));
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
      console.log('🔄 AppContext.createSale - Enhanced creation');
      const result = await enhancedSupabaseServices.sales.create(saleData);
      
      // Refresh only sales data with enhanced deduplication
      await refreshSalesData();
      return result;
    } catch (err) {
      console.error('Error creating sale:', err);
      ErrorHandler.logProjectError(err, 'Create Sale');
      throw err;
    }
  };

  const updateSale = async (id: string, saleData: any) => {
    try {
      const { id, ...updateData } = saleData;
      const result = await enhancedSupabaseServices.sales.update(id, updateData);
      await refreshSalesData();
      return result;
    } catch (err) {
      console.error('Error updating sale:', err);
      ErrorHandler.logProjectError(err, 'Update Sale');
      throw err;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await enhancedSupabaseServices.sales.delete(id);
      await refreshSalesData();
    } catch (err) {
      console.error('Error deleting sale:', err);
      ErrorHandler.logProjectError(err, 'Delete Sale');
      throw err;
    }
  };

  // CRUD functions for employees
  const createEmployee = async (employeeData: any) => {
    try {
      const result = await enhancedSupabaseServices.employees.create(employeeData);
      await refreshEmployeesData();
      return result;
    } catch (err) {
      console.error('Error creating employee:', err);
      ErrorHandler.logProjectError(err, 'Create Employee');
      throw err;
    }
  };

  const updateEmployee = async (employeeData: any) => {
    try {
      const { id, ...updateData } = employeeData;
      const result = await enhancedSupabaseServices.employees.update(id, updateData);
      await refreshEmployeesData();
      return result;
    } catch (err) {
      console.error('Error updating employee:', err);
      ErrorHandler.logProjectError(err, 'Update Employee');
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await enhancedSupabaseServices.employees.delete(id);
      await refreshEmployeesData();
    } catch (err) {
      console.error('Error deleting employee:', err);
      ErrorHandler.logProjectError(err, 'Delete Employee');
      throw err;
    }
  };

  // CRUD functions for debts
  const createDebt = async (debtData: any) => {
    try {
      const result = await enhancedSupabaseServices.debts.create(debtData);
      await refreshDebtsData();
      return result;
    } catch (err) {
      console.error('Error creating debt:', err);
      ErrorHandler.logProjectError(err, 'Create Debt');
      throw err;
    }
  };

  const updateDebt = async (debtData: any) => {
    try {
      const { id, ...updateData } = debtData;
      const result = await enhancedSupabaseServices.debts.update(id, updateData);
      await refreshDebtsData();
      return result;
    } catch (err) {
      console.error('Error updating debt:', err);
      ErrorHandler.logProjectError(err, 'Update Debt');
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await enhancedSupabaseServices.debts.delete(id);
      await refreshDebtsData();
    } catch (err) {
      console.error('Error deleting debt:', err);
      ErrorHandler.logProjectError(err, 'Delete Debt');
      throw err;
    }
  };

  // Enhanced refresh functions for specific data types
  const refreshSalesData = async () => {
    if (loadingStates.sales) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, sales: true }));
      
      if (connectionManager.isConnected()) {
        const onlineSales = await enhancedSupabaseServices.sales.getSales();
        const offlineSales = await getOfflineDataEnhanced('sales');
        const merged = mergeOnlineOfflineDataEnhanced(onlineSales, offlineSales.map(d => d.data));
        setSales(DeduplicationService.removeDuplicatesById(merged));
      } else {
        const offlineSales = await getOfflineDataEnhanced('sales');
        setSales(DeduplicationService.removeDuplicatesById(offlineSales.map(d => d.data)));
      }
      
      setLastLoadTime(prev => ({ ...prev, sales: Date.now() }));
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Refresh Sales Data');
    } finally {
      setLoadingStates(prev => ({ ...prev, sales: false }));
    }
  };

  const refreshEmployeesData = async () => {
    if (loadingStates.employees) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, employees: true }));
      
      if (connectionManager.isConnected()) {
        const onlineEmployees = await enhancedSupabaseServices.employees.getEmployees();
        const offlineEmployees = await getOfflineDataEnhanced('employees');
        const merged = mergeOnlineOfflineDataEnhanced(onlineEmployees, offlineEmployees.map(d => d.data));
        setEmployees(DeduplicationService.removeDuplicatesById(merged));
      } else {
        const offlineEmployees = await getOfflineDataEnhanced('employees');
        setEmployees(DeduplicationService.removeDuplicatesById(offlineEmployees.map(d => d.data)));
      }
      
      setLastLoadTime(prev => ({ ...prev, employees: Date.now() }));
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Refresh Employees Data');
    } finally {
      setLoadingStates(prev => ({ ...prev, employees: false }));
    }
  };

  const refreshDebtsData = async () => {
    if (loadingStates.debts) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, debts: true }));
      
      if (connectionManager.isConnected()) {
        const onlineDebts = await enhancedSupabaseServices.debts.getDebts();
        const offlineDebts = await getOfflineDataEnhanced('debts');
        const merged = mergeOnlineOfflineDataEnhanced(onlineDebts, offlineDebts.map(d => d.data));
        setDebts(DeduplicationService.removeDuplicatesById(merged));
      } else {
        const offlineDebts = await getOfflineDataEnhanced('debts');
        setDebts(DeduplicationService.removeDuplicatesById(offlineDebts.map(d => d.data)));
      }
      
      setLastLoadTime(prev => ({ ...prev, debts: Date.now() }));
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Refresh Debts Data');
    } finally {
      setLoadingStates(prev => ({ ...prev, debts: false }));
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

  const updateCheck = async (checkData: any) => {
    try {
      const { id, ...updateData } = checkData;
      const result = await supabaseServices.checks.update(id, updateData);
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

  const updateBoleto = async (boletoData: any) => {
    try {
      const { id, ...updateData } = boletoData;
      const result = await supabaseServices.boletos.update(id, updateData);
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

  const updatePixFee = async (id: string, feeData: any) => {
    try {
      const result = await supabaseServices.pixFees.update(id, feeData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating pix fee:', err);
      throw err;
    }
  };

  const deletePixFee = async (id: string) => {
    try {
      await supabaseServices.pixFees.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting pix fee:', err);
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

  const updateTax = async (id: string, taxData: any) => {
    try {
      const result = await supabaseServices.taxes.update(id, taxData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating tax:', err);
      throw err;
    }
  };

  const deleteTax = async (id: string) => {
    try {
      await supabaseServices.taxes.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting tax:', err);
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

  const updateAgendaEvent = async (eventData: any) => {
    try {
      const { id, ...updateData } = eventData;
      const result = await supabaseServices.agendaEvents.update(id, updateData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating agenda event:', err);
      throw err;
    }
  };

  const deleteAgendaEvent = async (id: string) => {
    try {
      await supabaseServices.agendaEvents.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting agenda event:', err);
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

  const updateAcerto = async (acertoData: any) => {
    try {
      const { id, ...updateData } = acertoData;
      const result = await supabaseServices.acertos.update(id, updateData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating acerto:', err);
      throw err;
    }
  };

  const deleteAcerto = async (id: string) => {
    try {
      await supabaseServices.acertos.delete(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting acerto:', err);
      throw err;
    }
  };
  const createCashTransaction = async (transactionData: any) => {
    try {
      const result = await supabaseServices.cashTransactions.create(transactionData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error creating cash transaction:', err);
      throw err;
    }
  };

  const updateCashTransaction = async (transactionData: any) => {
    try {
      const { id, ...updateData } = transactionData;
      const result = await supabaseServices.cashTransactions.updateTransaction(id, updateData);
      await loadAllData(); // Refresh all data
      return result;
    } catch (err) {
      console.error('Error updating cash transaction:', err);
      throw err;
    }
  };

  const deleteCashTransaction = async (id: string) => {
    try {
      await supabaseServices.cashTransactions.deleteTransaction(id);
      await loadAllData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting cash transaction:', err);
      throw err;
    }
  };

  // Load data on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (mounted) {
        await loadAllData();
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for connection changes
  useEffect(() => {
    let mounted = true;
    
    const handleConnectionChange = (status: any) => {
      if (status.isOnline && mounted) {
        // When coming back online, sync data with enhanced manager
        enhancedSyncManager.startSync().then(() => {
          if (mounted) {
            // Only reload if it's been more than 5 minutes since last load
            const lastLoad = lastLoadTime.loadAllData || 0;
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            
            if (lastLoad < fiveMinutesAgo) {
              loadAllData();
            }
          }
        });
      }
    };

    const unsubscribe = connectionManager.addListener(handleConnectionChange);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [lastLoadTime]);

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
    updatePixFee,
    deletePixFee,
    createTax,
    updateTax,
    deleteTax,
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    createAcerto,
    updateAcerto,
    deleteAcerto,
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
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