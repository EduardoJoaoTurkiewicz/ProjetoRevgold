import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee, Sale, Debt, Check, Boleto, CashTransaction } from '../types';

interface AppContextType {
  // User state
  currentUser: string | null;
  setCurrentUser: (user: string | null) => void;
  
  // Data state
  employees: Employee[];
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  cashTransactions: CashTransaction[];
  
  // Loading states
  loading: boolean;
  
  // Data fetching functions
  fetchEmployees: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  fetchChecks: () => Promise<void>;
  fetchBoletos: () => Promise<void>;
  fetchCashTransactions: () => Promise<void>;
  
  // Refresh function
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          seller:employees(name)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
    }
  };

  const fetchChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('checks')
        .select(`
          *,
          third_party_check_details(*)
        `)
        .order('due_date');
      
      if (error) throw error;
      setChecks(data || []);
    } catch (error) {
      console.error('Error fetching checks:', error);
    }
  };

  const fetchBoletos = async () => {
    try {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('due_date');
      
      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      console.error('Error fetching boletos:', error);
    }
  };

  const fetchCashTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setCashTransactions(data || []);
    } catch (error) {
      console.error('Error fetching cash transactions:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchSales(),
        fetchDebts(),
        fetchChecks(),
        fetchBoletos(),
        fetchCashTransactions()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    employees,
    sales,
    debts,
    checks,
    boletos,
    cashTransactions,
    loading,
    fetchEmployees,
    fetchSales,
    fetchDebts,
    fetchChecks,
    fetchBoletos,
    fetchCashTransactions,
    refreshData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}