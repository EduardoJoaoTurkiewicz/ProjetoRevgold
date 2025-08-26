import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Sale, Debt, Check, Boleto, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, CashBalance, CashTransaction, PixFee } from '../types';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';

// Estado da aplicação
interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  cashBalance: CashBalance | null;
  cashTransactions: CashTransaction[];
  pixFees: PixFee[];
}

// Ações do contexto
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'UPDATE_SALE'; payload: Sale }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'ADD_DEBT'; payload: Debt }
  | { type: 'UPDATE_DEBT'; payload: Debt }
  | { type: 'DELETE_DEBT'; payload: string }
  | { type: 'SET_CHECKS'; payload: Check[] }
  | { type: 'ADD_CHECK'; payload: Check }
  | { type: 'UPDATE_CHECK'; payload: Check }
  | { type: 'DELETE_CHECK'; payload: string }
  | { type: 'SET_BOLETOS'; payload: Boleto[] }
  | { type: 'ADD_BOLETO'; payload: Boleto }
  | { type: 'UPDATE_BOLETO'; payload: Boleto }
  | { type: 'DELETE_BOLETO'; payload: string }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'SET_EMPLOYEE_PAYMENTS'; payload: EmployeePayment[] }
  | { type: 'SET_EMPLOYEE_ADVANCES'; payload: EmployeeAdvance[] }
  | { type: 'SET_EMPLOYEE_OVERTIMES'; payload: EmployeeOvertime[] }
  | { type: 'SET_EMPLOYEE_COMMISSIONS'; payload: EmployeeCommission[] }
  | { type: 'ADD_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'ADD_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'UPDATE_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'ADD_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'UPDATE_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'ADD_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'UPDATE_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'SET_CASH_BALANCE'; payload: CashBalance }
  | { type: 'SET_CASH_TRANSACTIONS'; payload: CashTransaction[] }
  | { type: 'ADD_CASH_TRANSACTION'; payload: CashTransaction }
  | { type: 'SET_PIX_FEES'; payload: PixFee[] }
  | { type: 'ADD_PIX_FEE'; payload: PixFee }
  | { type: 'UPDATE_PIX_FEE'; payload: PixFee }
  | { type: 'DELETE_PIX_FEE'; payload: string };

// Estado inicial
const initialState: AppState = {
  currentUser: null,
  isLoading: false,
  error: null,
  sales: [],
  debts: [],
  checks: [],
  boletos: [],
  employees: [],
  employeePayments: [],
  employeeAdvances: [],
  employeeOvertimes: [],
  employeeCommissions: [],
  cashBalance: null,
  cashTransactions: [],
  pixFees: []
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
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
    case 'SET_DEBTS':
      return { ...state, debts: action.payload };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
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
    case 'SET_CHECKS':
      return { ...state, checks: action.payload };
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
    case 'SET_BOLETOS':
      return { ...state, boletos: action.payload };
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
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.map(employee => 
          employee.id === action.payload.id ? action.payload : employee
        ) 
      };
    case 'DELETE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.filter(employee => employee.id !== action.payload) 
      };
    case 'SET_EMPLOYEE_PAYMENTS':
      return { ...state, employeePayments: action.payload };
    case 'SET_EMPLOYEE_ADVANCES':
      return { ...state, employeeAdvances: action.payload };
    case 'SET_EMPLOYEE_OVERTIMES':
      return { ...state, employeeOvertimes: action.payload };
    case 'SET_EMPLOYEE_COMMISSIONS':
      return { ...state, employeeCommissions: action.payload };
    case 'ADD_EMPLOYEE_COMMISSION':
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
    case 'ADD_EMPLOYEE_ADVANCE':
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
    case 'UPDATE_EMPLOYEE_ADVANCE':
      return { 
        ...state, 
        employeeAdvances: state.employeeAdvances.map(advance => 
          advance.id === action.payload.id ? action.payload : advance
        ) 
      };
    case 'ADD_EMPLOYEE_OVERTIME':
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
    case 'UPDATE_EMPLOYEE_OVERTIME':
      return { 
        ...state, 
        employeeOvertimes: state.employeeOvertimes.map(overtime => 
          overtime.id === action.payload.id ? action.payload : overtime
        ) 
      };
    case 'ADD_EMPLOYEE_PAYMENT':
      return { ...state, employeePayments: [...state.employeePayments, action.payload] };
    case 'UPDATE_EMPLOYEE_COMMISSION':
      return { 
        ...state, 
        employeeCommissions: state.employeeCommissions.map(commission => 
          commission.id === action.payload.id ? action.payload : commission
        ) 
      };
    case 'SET_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
    case 'SET_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
    case 'ADD_CASH_TRANSACTION':
      return { ...state, cashTransactions: [...state.cashTransactions, action.payload] };
    case 'SET_PIX_FEES':
      return { ...state, pixFees: action.payload };
    case 'ADD_PIX_FEE':
      return { ...state, pixFees: [...state.pixFees, action.payload] };
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

// Tipo do contexto
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loadAllData: () => Promise<void>;
  isSupabaseConfigured: () => boolean;
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<Debt>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<Check>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<Boleto>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  initializeCashBalance: (initialAmount: number) => Promise<void>;
  updateCashBalance: (balance: CashBalance) => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<CashTransaction>;
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => Promise<EmployeeAdvance>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => Promise<EmployeeOvertime>;
  updateEmployeeOvertime: (overtime: EmployeeOvertime) => Promise<void>;
  createEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt'>) => Promise<EmployeePayment>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  createPixFee: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => Promise<PixFee>;
  updatePixFee: (pixFee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<CashTransaction>;
}

// Criar contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  console.log('🔄 AppProvider renderizado, estado atual:', {
    currentUser: state.currentUser,
    isLoading: state.isLoading,
    error: state.error,
    salesCount: state.sales.length,
    debtsCount: state.debts.length,
    employeesCount: state.employees.length
  });

  // Função para definir usuário
  const setCurrentUser = (user: User | null) => {
    console.log('👤 setCurrentUser chamado com:', user);
    dispatch({ type: 'SET_USER', payload: user });
  };

  // Verificar se Supabase está configurado
  const checkSupabaseConfig = () => {
    return isSupabaseConfigured();
  };

  // Carregar todos os dados
  const loadAllData = async () => {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, usando dados locais');
      dispatch({ type: 'SET_ERROR', payload: null }); // Não mostrar erro se não configurado
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('📊 Carregando dados do Supabase...');

      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('🔐 Usuário não autenticado, fazendo login automático...');
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: 'admin@revgold.com',
          password: 'revgold123'
        });
        
        if (authError) {
          console.warn('⚠️ Erro na autenticação automática:', authError.message);
          // Continuar mesmo sem autenticação para permitir operações básicas
        }
      }

      // Carregar dados em paralelo
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
        cashBalanceData,
        cashTransactionsData,
        pixFeesData
      ] = await Promise.allSettled([
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('debts').select('*').order('date', { ascending: false }),
        supabase.from('checks').select('*').order('due_date', { ascending: false }),
        supabase.from('boletos').select('*').order('due_date', { ascending: false }),
        supabase.from('employees').select('*').order('name'),
        supabase.from('employee_payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('employee_advances').select('*').order('date', { ascending: false }),
        supabase.from('employee_overtimes').select('*').order('date', { ascending: false }),
        supabase.from('employee_commissions').select('*').order('date', { ascending: false }),
        supabase.from('cash_balances').select('*').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
        supabase.from('pix_fees').select('*').order('date', { ascending: false })
      ]);

      // Processar resultados
      if (salesData.status === 'fulfilled' && !salesData.value.error) {
        dispatch({ type: 'SET_SALES', payload: salesData.value.data || [] });
      }
      
      if (debtsData.status === 'fulfilled' && !debtsData.value.error) {
        dispatch({ type: 'SET_DEBTS', payload: debtsData.value.data || [] });
      }
      
      if (checksData.status === 'fulfilled' && !checksData.value.error) {
        dispatch({ type: 'SET_CHECKS', payload: checksData.value.data || [] });
      }
      
      if (boletosData.status === 'fulfilled' && !boletosData.value.error) {
        dispatch({ type: 'SET_BOLETOS', payload: boletosData.value.data || [] });
      }
      
      if (employeesData.status === 'fulfilled' && !employeesData.value.error) {
        dispatch({ type: 'SET_EMPLOYEES', payload: employeesData.value.data || [] });
      }
      
      if (employeePaymentsData.status === 'fulfilled' && !employeePaymentsData.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_PAYMENTS', payload: employeePaymentsData.value.data || [] });
      }
      
      if (employeeAdvancesData.status === 'fulfilled' && !employeeAdvancesData.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_ADVANCES', payload: employeeAdvancesData.value.data || [] });
      }
      
      if (employeeOvertimesData.status === 'fulfilled' && !employeeOvertimesData.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_OVERTIMES', payload: employeeOvertimesData.value.data || [] });
      }
      
      if (employeeCommissionsData.status === 'fulfilled' && !employeeCommissionsData.value.error) {
        dispatch({ type: 'SET_EMPLOYEE_COMMISSIONS', payload: employeeCommissionsData.value.data || [] });
      }
      
      if (cashBalanceData.status === 'fulfilled' && !cashBalanceData.value.error) {
        dispatch({ type: 'SET_CASH_BALANCE', payload: cashBalanceData.value.data });
      }
      
      if (cashTransactionsData.status === 'fulfilled' && !cashTransactionsData.value.error) {
        dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: cashTransactionsData.value.data || [] });
      }
      
      if (pixFeesData.status === 'fulfilled' && !pixFeesData.value.error) {
        dispatch({ type: 'SET_PIX_FEES', payload: pixFeesData.value.data || [] });
      }

      console.log('✅ Dados carregados com sucesso');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar dados: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Funções CRUD para Sales
  const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
    if (!isSupabaseConfigured()) {
      const newSale: Sale = {
        ...saleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_SALE', payload: newSale });
      
      // Criar comissão se há vendedor
      if (saleData.sellerId) {
        const commission: EmployeeCommission = {
          id: Date.now().toString() + '_comm',
          employeeId: saleData.sellerId,
          saleId: newSale.id,
          saleValue: saleData.totalValue,
          commissionRate: saleData.customCommissionRate || 5,
          commissionAmount: (saleData.totalValue * (saleData.customCommissionRate || 5)) / 100,
          date: saleData.date,
          status: 'pendente',
          createdAt: new Date().toISOString()
        };
        dispatch({ type: 'ADD_EMPLOYEE_COMMISSION', payload: commission });
      }
      
      return newSale;
    }

    // Verificar autenticação antes de fazer operações
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('🔐 Fazendo login automático para operação...');
      await supabase.auth.signInWithPassword({
        email: 'admin@revgold.com',
        password: 'revgold123'
      });
    }

    const { data, error } = await supabase.from('sales').insert([saleData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_SALE', payload: data });
    
    // Criar comissão se há vendedor
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
      
      const { data: commissionResult } = await supabase
        .from('employee_commissions')
        .insert([commissionData])
        .select()
        .single();
        
      if (commissionResult) {
        dispatch({ type: 'ADD_EMPLOYEE_COMMISSION', payload: commissionResult });
      }
    }
    
    return data;
  };

  const updateSale = async (sale: Sale): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_SALE', payload: sale });
      return;
    }

    const { error } = await supabase.from('sales').update(sale).eq('id', sale.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_SALE', payload: sale });
  };

  const deleteSale = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_SALE', payload: id });
      return;
    }

    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_SALE', payload: id });
  };

  // Funções CRUD para Debts
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> => {
    if (!isSupabaseConfigured()) {
      const newDebt: Debt = {
        ...debtData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_DEBT', payload: newDebt });
      return newDebt;
    }

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInWithPassword({
        email: 'admin@revgold.com',
        password: 'revgold123'
      });
    }

    const { data, error } = await supabase.from('debts').insert([debtData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_DEBT', payload: data });
    return data;
  };

  const updateDebt = async (debt: Debt): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_DEBT', payload: debt });
      return;
    }

    const { error } = await supabase.from('debts').update(debt).eq('id', debt.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_DEBT', payload: debt });
  };

  const deleteDebt = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_DEBT', payload: id });
      return;
    }

    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_DEBT', payload: id });
  };

  // Funções CRUD para Checks
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>): Promise<Check> => {
    if (!isSupabaseConfigured()) {
      const newCheck: Check = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_CHECK', payload: newCheck });
      return newCheck;
    }

    const { data, error } = await supabase.from('checks').insert([checkData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_CHECK', payload: data });
    return data;
  };

  const updateCheck = async (check: Check): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_CHECK', payload: check });
      return;
    }

    const { error } = await supabase.from('checks').update(check).eq('id', check.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_CHECK', payload: check });
  };

  const deleteCheck = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_CHECK', payload: id });
      return;
    }

    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_CHECK', payload: id });
  };

  // Funções CRUD para Boletos
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto> => {
    if (!isSupabaseConfigured()) {
      const newBoleto: Boleto = {
        ...boletoData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_BOLETO', payload: newBoleto });
      return newBoleto;
    }

    const { data, error } = await supabase.from('boletos').insert([boletoData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_BOLETO', payload: data });
    return data;
  };

  const updateBoleto = async (boleto: Boleto): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_BOLETO', payload: boleto });
      return;
    }

    const { error } = await supabase.from('boletos').update(boleto).eq('id', boleto.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_BOLETO', payload: boleto });
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_BOLETO', payload: id });
      return;
    }

    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_BOLETO', payload: id });
  };

  // Funções CRUD para Employees
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    if (!isSupabaseConfigured()) {
      const newEmployee: Employee = {
        ...employeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
      return newEmployee;
    }

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInWithPassword({
        email: 'admin@revgold.com',
        password: 'revgold123'
      });
    }

    const { data, error } = await supabase.from('employees').insert([employeeData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_EMPLOYEE', payload: data });
    return data;
  };

  const updateEmployee = async (employee: Employee): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee });
      return;
    }

    const { error } = await supabase.from('employees').update(employee).eq('id', employee.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: employee });
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
      return;
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
  };

  // Funções para Cash Management
  const initializeCashBalance = async (initialAmount: number): Promise<void> => {
    const balanceData = {
      current_balance: initialAmount,
      initial_balance: initialAmount,
      initial_date: new Date().toISOString().split('T')[0],
      last_updated: new Date().toISOString()
    };

    if (!isSupabaseConfigured()) {
      const newBalance: CashBalance = {
        ...balanceData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'SET_CASH_BALANCE', payload: newBalance });
      return;
    }

    const { data, error } = await supabase.from('cash_balances').insert([balanceData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'SET_CASH_BALANCE', payload: data });
  };

  const updateCashBalance = async (balance: CashBalance): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_CASH_BALANCE', payload: balance });
      return;
    }

    const { error } = await supabase.from('cash_balances').update(balance).eq('id', balance.id);
    if (error) throw error;
    
    dispatch({ type: 'SET_CASH_BALANCE', payload: balance });
  };

  const createCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'createdAt'>): Promise<CashTransaction> => {
    if (!isSupabaseConfigured()) {
      const newTransaction: CashTransaction = {
        ...transactionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_CASH_TRANSACTION', payload: newTransaction });
      return newTransaction;
    }

    const { data, error } = await supabase.from('cash_transactions').insert([transactionData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_CASH_TRANSACTION', payload: data });
    return data;
  };

  // Funções CRUD para PIX Fees
  const createPixFee = async (pixFeeData: Omit<PixFee, 'id' | 'createdAt'>): Promise<PixFee> => {
    if (!isSupabaseConfigured()) {
      const newPixFee: PixFee = {
        ...pixFeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_PIX_FEE', payload: newPixFee });
      return newPixFee;
    }

    const { data, error } = await supabase.from('pix_fees').insert([pixFeeData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_PIX_FEE', payload: data });
    return data;
  };

  const updatePixFee = async (pixFee: PixFee): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_PIX_FEE', payload: pixFee });
      return;
    }

    const { error } = await supabase.from('pix_fees').update(pixFee).eq('id', pixFee.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_PIX_FEE', payload: pixFee });
  };

  const deletePixFee = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'DELETE_PIX_FEE', payload: id });
      return;
    }

    const { error } = await supabase.from('pix_fees').delete().eq('id', id);
    if (error) throw error;
    
    dispatch({ type: 'DELETE_PIX_FEE', payload: id });
  };

  // Employee Advance functions
  const createEmployeeAdvance = async (advanceData: Omit<EmployeeAdvance, 'id' | 'createdAt'>): Promise<EmployeeAdvance> => {
    if (!isSupabaseConfigured()) {
      const newAdvance: EmployeeAdvance = {
        ...advanceData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EMPLOYEE_ADVANCE', payload: newAdvance });
      return newAdvance;
    }

    const { data, error } = await supabase.from('employee_advances').insert([advanceData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_EMPLOYEE_ADVANCE', payload: data });
    return data;
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_EMPLOYEE_ADVANCE', payload: advance });
      return;
    }

    const { error } = await supabase.from('employee_advances').update(advance).eq('id', advance.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_EMPLOYEE_ADVANCE', payload: advance });
  };

  // Employee Overtime functions
  const createEmployeeOvertime = async (overtimeData: Omit<EmployeeOvertime, 'id' | 'createdAt'>): Promise<EmployeeOvertime> => {
    if (!isSupabaseConfigured()) {
      const newOvertime: EmployeeOvertime = {
        ...overtimeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EMPLOYEE_OVERTIME', payload: newOvertime });
      return newOvertime;
    }

    const { data, error } = await supabase.from('employee_overtimes').insert([overtimeData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_EMPLOYEE_OVERTIME', payload: data });
    return data;
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_EMPLOYEE_OVERTIME', payload: overtime });
      return;
    }

    const { error } = await supabase.from('employee_overtimes').update(overtime).eq('id', overtime.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_EMPLOYEE_OVERTIME', payload: overtime });
  };

  // Employee Payment functions
  const createEmployeePayment = async (paymentData: Omit<EmployeePayment, 'id' | 'createdAt'>): Promise<EmployeePayment> => {
    if (!isSupabaseConfigured()) {
      const newPayment: EmployeePayment = {
        ...paymentData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EMPLOYEE_PAYMENT', payload: newPayment });
      return newPayment;
    }

    const { data, error } = await supabase.from('employee_payments').insert([paymentData]).select().single();
    if (error) throw error;
    
    dispatch({ type: 'ADD_EMPLOYEE_PAYMENT', payload: data });
    return data;
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission): Promise<void> => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'UPDATE_EMPLOYEE_COMMISSION', payload: commission });
      return;
    }

    const { error } = await supabase.from('employee_commissions').update(commission).eq('id', commission.id);
    if (error) throw error;
    
    dispatch({ type: 'UPDATE_EMPLOYEE_COMMISSION', payload: commission });
  };

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('🚀 AppProvider useEffect executado');
    // Sempre tentar carregar dados, mesmo se Supabase não estiver configurado
    loadAllData();
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    currentUser: state.currentUser,
    setCurrentUser,
    loadAllData,
    isSupabaseConfigured: checkSupabaseConfig,
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
    initializeCashBalance,
    updateCashBalance,
    createCashTransaction,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    createEmployeePayment,
    updateEmployeeCommission,
    createPixFee,
    updatePixFee,
    deletePixFee,
    updateDebt,
    createCashTransaction
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook para usar o contexto
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}