import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Employee, 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  EmployeePayment, 
  EmployeeAdvance, 
  EmployeeOvertime, 
  EmployeeCommission,
  CashBalance,
  CashTransaction,
  PixFee,
  User
} from '../types';

interface AppState {
  currentUser: User | null;
  employees: Employee[];
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  cashBalance: CashBalance | null;
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
  isLoading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_CHECKS'; payload: Check[] }
  | { type: 'SET_BOLETOS'; payload: Boleto[] }
  | { type: 'SET_EMPLOYEE_PAYMENTS'; payload: EmployeePayment[] }
  | { type: 'SET_EMPLOYEE_ADVANCES'; payload: EmployeeAdvance[] }
  | { type: 'SET_EMPLOYEE_OVERTIMES'; payload: EmployeeOvertime[] }
  | { type: 'SET_EMPLOYEE_COMMISSIONS'; payload: EmployeeCommission[] }
  | { type: 'SET_CASH_BALANCE'; payload: CashBalance | null }
  | { type: 'SET_CASH_TRANSACTIONS'; payload: CashTransaction[] }
  | { type: 'SET_PIX_FEES'; payload: PixFee[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'UPDATE_SALE'; payload: Sale }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'ADD_DEBT'; payload: Debt }
  | { type: 'UPDATE_DEBT'; payload: Debt }
  | { type: 'DELETE_DEBT'; payload: string }
  | { type: 'ADD_CHECK'; payload: Check }
  | { type: 'UPDATE_CHECK'; payload: Check }
  | { type: 'DELETE_CHECK'; payload: string }
  | { type: 'ADD_BOLETO'; payload: Boleto }
  | { type: 'UPDATE_BOLETO'; payload: Boleto }
  | { type: 'DELETE_BOLETO'; payload: string }
  | { type: 'ADD_PIX_FEE'; payload: PixFee }
  | { type: 'UPDATE_PIX_FEE'; payload: PixFee }
  | { type: 'DELETE_PIX_FEE'; payload: string };

const initialState: AppState = {
  currentUser: null,
  employees: [],
  sales: [],
  debts: [],
  checks: [],
  boletos: [],
  employeePayments: [],
  employeeAdvances: [],
  employeeOvertimes: [],
  employeeCommissions: [],
  cashBalance: null,
  cashTransactions: [],
  pixFees: [],
  isLoading: false,
  error: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  console.log('🔄 Reducer recebeu ação:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      console.log('👤 Definindo usuário no estado:', action.payload);
      const newState = { ...state, currentUser: action.payload };
      console.log('✅ Estado atualizado com usuário:', newState.currentUser);
      return newState;
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'SET_DEBTS':
      return { ...state, debts: action.payload };
    case 'SET_CHECKS':
      return { ...state, checks: action.payload };
    case 'SET_BOLETOS':
      return { ...state, boletos: action.payload };
    case 'SET_EMPLOYEE_PAYMENTS':
      return { ...state, employeePayments: action.payload };
    case 'SET_EMPLOYEE_ADVANCES':
      return { ...state, employeeAdvances: action.payload };
    case 'SET_EMPLOYEE_OVERTIMES':
      return { ...state, employeeOvertimes: action.payload };
    case 'SET_EMPLOYEE_COMMISSIONS':
      return { ...state, employeeCommissions: action.payload };
    case 'SET_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
    case 'SET_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
    case 'SET_PIX_FEES':
      return { ...state, pixFees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.map(emp => 
          emp.id === action.payload.id ? action.payload : emp
        ) 
      };
    case 'DELETE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.filter(emp => emp.id !== action.payload) 
      };
    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };
    case 'UPDATE_SALE':
      return { 
        ...state, 
        sales: state.sales.map(sale => 
          sale.id === action.payload.id ? action.payload : sale
        ) 
      };
    case 'DELETE_SALE':
      return { 
        ...state, 
        sales: state.sales.filter(sale => sale.id !== action.payload) 
      };
    case 'ADD_DEBT':
      return { ...state, debts: [action.payload, ...state.debts] };
    case 'UPDATE_DEBT':
      return { 
        ...state, 
        debts: state.debts.map(debt => 
          debt.id === action.payload.id ? action.payload : debt
        ) 
      };
    case 'DELETE_DEBT':
      return { 
        ...state, 
        debts: state.debts.filter(debt => debt.id !== action.payload) 
      };
    case 'ADD_CHECK':
      return { ...state, checks: [...state.checks, action.payload] };
    case 'UPDATE_CHECK':
      return { 
        ...state, 
        checks: state.checks.map(check => 
          check.id === action.payload.id ? action.payload : check
        ) 
      };
    case 'DELETE_CHECK':
      return { 
        ...state, 
        checks: state.checks.filter(check => check.id !== action.payload) 
      };
    case 'ADD_BOLETO':
      return { ...state, boletos: [...state.boletos, action.payload] };
    case 'UPDATE_BOLETO':
      return { 
        ...state, 
        boletos: state.boletos.map(boleto => 
          boleto.id === action.payload.id ? action.payload : boleto
        ) 
      };
    case 'DELETE_BOLETO':
      return { 
        ...state, 
        boletos: state.boletos.filter(boleto => boleto.id !== action.payload) 
      };
    case 'ADD_PIX_FEE':
      return { ...state, pixFees: [action.payload, ...state.pixFees] };
    case 'UPDATE_PIX_FEE':
      return { 
        ...state, 
        pixFees: state.pixFees.map(fee => 
          fee.id === action.payload.id ? action.payload : fee
        ) 
      };
    case 'DELETE_PIX_FEE':
      return { 
        ...state, 
        pixFees: state.pixFees.filter(fee => fee.id !== action.payload) 
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Utility functions
  isSupabaseConfigured: () => boolean;
  loadAllData: () => Promise<void>;
  
  // Employee functions
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (employee: Employee) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Sale functions
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
  updateSale: (sale: Sale) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
  
  // Debt functions
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<Debt>;
  updateDebt: (debt: Debt) => Promise<Debt>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Check functions
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<Check>;
  updateCheck: (check: Check) => Promise<Check>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Boleto functions
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<Boleto>;
  updateBoleto: (boleto: Boleto) => Promise<Boleto>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // PIX Fee functions
  createPixFee: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => Promise<PixFee>;
  updatePixFee: (pixFee: PixFee) => Promise<PixFee>;
  deletePixFee: (id: string) => Promise<void>;
  
  // Cash functions
  initializeCashBalance: (initialAmount: number) => Promise<CashBalance>;
  updateCashBalance: (balance: CashBalance) => Promise<CashBalance>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<CashTransaction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Utility functions
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key && url !== 'https://your-project-id.supabase.co' && key !== 'your-anon-key-here');
  };

  // Load all data
  const loadAllData = async () => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_ERROR', payload: 'Supabase não está configurado. Configure o arquivo .env com suas credenciais.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('🔄 Carregando dados do Supabase...');
      
      // Load all data in parallel
      const [
        employeesResult,
        salesResult,
        debtsResult,
        checksResult,
        boletosResult,
        employeePaymentsResult,
        employeeAdvancesResult,
        employeeOvertimesResult,
        employeeCommissionsResult,
        cashBalanceResult,
        cashTransactionsResult,
        pixFeesResult
      ] = await Promise.allSettled([
        supabase.from('employees').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('debts').select('*').order('date', { ascending: false }),
        supabase.from('checks').select('*').order('due_date'),
        supabase.from('boletos').select('*').order('due_date'),
        supabase.from('employee_payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('employee_advances').select('*').order('date', { ascending: false }),
        supabase.from('employee_overtimes').select('*').order('date', { ascending: false }),
        supabase.from('employee_commissions').select('*').order('date', { ascending: false }),
        supabase.from('cash_balances').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
        supabase.from('pix_fees').select('*').order('date', { ascending: false })
      ]);

      // Process results
      if (employeesResult.status === 'fulfilled' && !employeesResult.value.error) {
        dispatch({ type: 'SET_EMPLOYEES', payload: employeesResult.value.data || [] });
        console.log('✅ Funcionários carregados:', employeesResult.value.data?.length || 0);
      }

      if (salesResult.status === 'fulfilled' && !salesResult.value.error) {
        dispatch({ type: 'SET_SALES', payload: salesResult.value.data || [] });
        console.log('✅ Vendas carregadas:', salesResult.value.data?.length || 0);
      }

      if (debtsResult.status === 'fulfilled' && !debtsResult.value.error) {
        dispatch({ type: 'SET_DEBTS', payload: debtsResult.value.data || [] });
        console.log('✅ Dívidas carregadas:', debtsResult.value.data?.length || 0);
      }

      if (checksResult.status === 'fulfilled' && !checksResult.value.error) {
        dispatch({ type: 'SET_CHECKS', payload: checksResult.value.data || [] });
        console.log('✅ Cheques carregados:', checksResult.value.data?.length || 0);
      }

      if (boletosResult.status === 'fulfilled' && !boletosResult.value.error) {
        dispatch({ type: 'SET_BOLETOS', payload: boletosResult.value.data || [] });
        console.log('✅ Boletos carregados:', boletosResult.value.data?.length || 0);
      }

      if (employeePaymentsResult.status === 'fulfilled' && !employeePaymentsResult.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_PAYMENTS', payload: employeePaymentsResult.value.data || [] });
        console.log('✅ Pagamentos carregados:', employeePaymentsResult.value.data?.length || 0);
      }

      if (employeeAdvancesResult.status === 'fulfilled' && !employeeAdvancesResult.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_ADVANCES', payload: employeeAdvancesResult.value.data || [] });
        console.log('✅ Adiantamentos carregados:', employeeAdvancesResult.value.data?.length || 0);
      }

      if (employeeOvertimesResult.status === 'fulfilled' && !employeeOvertimesResult.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_OVERTIMES', payload: employeeOvertimesResult.value.data || [] });
        console.log('✅ Horas extras carregadas:', employeeOvertimesResult.value.data?.length || 0);
      }

      if (employeeCommissionsResult.status === 'fulfilled' && !employeeCommissionsResult.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_COMMISSIONS', payload: employeeCommissionsResult.value.data || [] });
        console.log('✅ Comissões carregadas:', employeeCommissionsResult.value.data?.length || 0);
      }

      if (cashBalanceResult.status === 'fulfilled' && !cashBalanceResult.value.error) {
        dispatch({ type: 'SET_CASH_BALANCE', payload: cashBalanceResult.value.data });
        console.log('✅ Saldo do caixa carregado:', cashBalanceResult.value.data?.current_balance || 0);
      }

      if (cashTransactionsResult.status === 'fulfilled' && !cashTransactionsResult.value.error) {
        dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: cashTransactionsResult.value.data || [] });
        console.log('✅ Transações do caixa carregadas:', cashTransactionsResult.value.data?.length || 0);
      }

      if (pixFeesResult.status === 'fulfilled' && !pixFeesResult.value.error) {
        dispatch({ type: 'SET_PIX_FEES', payload: pixFeesResult.value.data || [] });
        console.log('✅ Tarifas PIX carregadas:', pixFeesResult.value.data?.length || 0);
      }

      console.log('✅ Todos os dados carregados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados do banco. Verifique a conexão com o Supabase.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Employee functions
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'ADD_EMPLOYEE', payload: data });
    return data;
  };

  const updateEmployee = async (employee: Employee): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', employee.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: data });
    return data;
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
  };

  // Sale functions
  const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) throw error;

    // Create commission if seller is assigned
    if (saleData.sellerId) {
      const commissionData = {
        employee_id: saleData.sellerId,
        sale_id: data.id,
        sale_value: saleData.totalValue,
        commission_rate: saleData.customCommissionRate || 5,
        commission_amount: (saleData.totalValue * (saleData.customCommissionRate || 5)) / 100,
        date: saleData.date,
        status: 'pendente'
      };

      await supabase.from('employee_commissions').insert([commissionData]);
    }

    // Create checks and boletos automatically
    await createChecksAndBoletosForSale(data);
    
    dispatch({ type: 'ADD_SALE', payload: data });
    return data;
  };

  const updateSale = async (sale: Sale): Promise<Sale> => {
    const { data, error } = await supabase
      .from('sales')
      .update(sale)
      .eq('id', sale.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_SALE', payload: data });
    return data;
  };

  const deleteSale = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_SALE', payload: id });
  };

  // Helper function to create checks and boletos for sales
  const createChecksAndBoletosForSale = async (sale: Sale) => {
    for (const method of sale.paymentMethods) {
      if (method.type === 'cheque') {
        const installments = method.installments || 1;
        
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(method.firstInstallmentDate || sale.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const checkData = {
            sale_id: sale.id,
            client: sale.client,
            value: method.installmentValue || method.amount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            is_own_check: method.isOwnCheck || false,
            used_for: `Venda - ${sale.client}`,
            installment_number: i + 1,
            total_installments: installments
          };
          
          await supabase.from('checks').insert([checkData]);
        }
      }
      
      if (method.type === 'boleto') {
        const installments = method.installments || 1;
        
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(method.firstInstallmentDate || sale.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const boletoData = {
            sale_id: sale.id,
            client: sale.client,
            value: method.installmentValue || method.amount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            installment_number: i + 1,
            total_installments: installments
          };
          
          await supabase.from('boletos').insert([boletoData]);
        }
      }
    }
  };

  // Debt functions
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> => {
    const { data, error } = await supabase
      .from('debts')
      .insert([debtData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'ADD_DEBT', payload: data });
    return data;
  };

  const updateDebt = async (debt: Debt): Promise<Debt> => {
    const { data, error } = await supabase
      .from('debts')
      .update(debt)
      .eq('id', debt.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_DEBT', payload: data });
    return data;
  };

  const deleteDebt = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_DEBT', payload: id });
  };

  // Check functions
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>): Promise<Check> => {
    const { data, error } = await supabase
      .from('checks')
      .insert([checkData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'ADD_CHECK', payload: data });
    return data;
  };

  const updateCheck = async (check: Check): Promise<Check> => {
    const { data, error } = await supabase
      .from('checks')
      .update(check)
      .eq('id', check.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_CHECK', payload: data });
    return data;
  };

  const deleteCheck = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('checks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_CHECK', payload: id });
  };

  // Boleto functions
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto> => {
    const { data, error } = await supabase
      .from('boletos')
      .insert([boletoData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'ADD_BOLETO', payload: data });
    return data;
  };

  const updateBoleto = async (boleto: Boleto): Promise<Boleto> => {
    const { data, error } = await supabase
      .from('boletos')
      .update(boleto)
      .eq('id', boleto.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_BOLETO', payload: data });
    return data;
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_BOLETO', payload: id });
  };

  // PIX Fee functions
  const createPixFee = async (pixFeeData: Omit<PixFee, 'id' | 'createdAt'>): Promise<PixFee> => {
    const { data, error } = await supabase
      .from('pix_fees')
      .insert([pixFeeData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'ADD_PIX_FEE', payload: data });
    return data;
  };

  const updatePixFee = async (pixFee: PixFee): Promise<PixFee> => {
    const { data, error } = await supabase
      .from('pix_fees')
      .update(pixFee)
      .eq('id', pixFee.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'UPDATE_PIX_FEE', payload: data });
    return data;
  };

  const deletePixFee = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('pix_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    dispatch({ type: 'DELETE_PIX_FEE', payload: id });
  };

  // Cash functions
  const initializeCashBalance = async (initialAmount: number): Promise<CashBalance> => {
    const balanceData = {
      current_balance: initialAmount,
      initial_balance: initialAmount,
      initial_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cash_balances')
      .insert([balanceData])
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'SET_CASH_BALANCE', payload: data });
    return data;
  };

  const updateCashBalance = async (balance: CashBalance): Promise<CashBalance> => {
    const { data, error } = await supabase
      .from('cash_balances')
      .update(balance)
      .eq('id', balance.id)
      .select()
      .single();

    if (error) throw error;
    
    dispatch({ type: 'SET_CASH_BALANCE', payload: data });
    return data;
  };

  const createCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'createdAt'>): Promise<CashTransaction> => {
    const { data, error } = await supabase
      .from('cash_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    
    // Update cash balance
    if (state.cashBalance) {
      const newBalance = transactionData.type === 'entrada' 
        ? state.cashBalance.currentBalance + transactionData.amount
        : state.cashBalance.currentBalance - transactionData.amount;
      
      await updateCashBalance({
        ...state.cashBalance,
        currentBalance: newBalance,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return data;
  };

  // Load data when user is set
  useEffect(() => {
    if (state.currentUser) {
      loadAllData();
    }
  }, [state.currentUser]);

  const value: AppContextType = {
    state,
    dispatch,
    isSupabaseConfigured,
    loadAllData,
    createEmployee,
    updateEmployee,
    deleteEmployee,
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
    createPixFee,
    updatePixFee,
    deletePixFee,
    initializeCashBalance,
    updateCashBalance,
    createCashTransaction
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