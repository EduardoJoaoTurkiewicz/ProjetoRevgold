import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  salesService,
  employeesService,
  cashService,
  debtsService,
  checksService,
  boletosService,
  employeePaymentsService,
  employeeAdvancesService,
  employeeOvertimesService,
  employeeCommissionsService,
  pixFeesService,
  taxesService,
  agendaService
} from '../lib/supabaseServices';
import {
  Sale,
  Employee,
  CashBalance,
  Debt,
  Check,
  Boleto,
  EmployeePayment,
  EmployeeAdvance,
  EmployeeOvertime,
  EmployeeCommission,
  PixFee,
  Tax,
  AgendaEvent
} from '../types/index';

interface AppContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  sales: Sale[];
  employees: Employee[];
  cashBalance: CashBalance | null;
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  pixFees: PixFee[];
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadAllData: () => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  
  // Data state variables
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load data if user is authenticated
      if (session?.user) {
        loadAllData();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load data when user signs in
      if (session?.user) {
        loadAllData();
      } else {
        // Clear data when user signs out
        clearAllData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearAllData = () => {
    setSales([]);
    setEmployees([]);
    setCashBalance(null);
    setDebts([]);
    setChecks([]);
    setBoletos([]);
    setEmployeePayments([]);
    setEmployeeAdvances([]);
    setEmployeeOvertimes([]);
    setEmployeeCommissions([]);
    setPixFees([]);
    setTaxes([]);
    setAgendaEvents([]);
    setError(null);
  };

  const loadAllData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading all data...');
      
      // Load all data in parallel
      const [
        salesData,
        employeesData,
        cashBalanceData,
        debtsData,
        checksData,
        boletosData,
        employeePaymentsData,
        employeeAdvancesData,
        employeeOvertimesData,
        employeeCommissionsData,
        pixFeesData,
        taxesData,
        agendaEventsData
      ] = await Promise.all([
        salesService.getAll(),
        employeesService.getAll(),
        cashService.getCurrentBalance(),
        debtsService.getAll(),
        checksService.getAll(),
        boletosService.getAll(),
        employeePaymentsService.getAll(),
        employeeAdvancesService.getAll(),
        employeeOvertimesService.getAll(),
        employeeCommissionsService.getAll(),
        pixFeesService.getAll(),
        taxesService.getAll(),
        agendaService.getAll()
      ]);

      // Update state with fetched data
      setSales(salesData || []);
      setEmployees(employeesData || []);
      setCashBalance(cashBalanceData);
      setDebts(debtsData || []);
      setChecks(checksData || []);
      setBoletos(boletosData || []);
      setEmployeePayments(employeePaymentsData || []);
      setEmployeeAdvances(employeeAdvancesData || []);
      setEmployeeOvertimes(employeeOvertimesData || []);
      setEmployeeCommissions(employeeCommissionsData || []);
      setPixFees(pixFeesData || []);
      setTaxes(taxesData || []);
      setAgendaEvents(agendaEventsData || []);

      console.log('✅ All data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateCashBalance = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Recalculating cash balance...');
      const updatedBalance = await cashService.recalculateBalance();
      setCashBalance(updatedBalance);
      console.log('✅ Cash balance recalculated');
    } catch (err) {
      console.error('❌ Error recalculating cash balance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao recalcular saldo';
      setError(errorMessage);
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

  const value: AppContextType = {
    user,
    loading,
    isLoading,
    isOnline,
    error,
    sales,
    employees,
    cashBalance,
    debts,
    checks,
    boletos,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    pixFees,
    taxes,
    agendaEvents,
    signIn,
    signUp,
    signOut,
    loadAllData,
    recalculateCashBalance,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}