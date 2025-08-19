import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Sale, Debt, Check, Installment, Product, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Boleto } from '../types';
import { database } from '../lib/database';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AppState {
  user: User | null;
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  installments: Installment[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
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
  | { type: 'ADD_INSTALLMENT'; payload: Installment }
  | { type: 'UPDATE_INSTALLMENT'; payload: Installment }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'UPDATE_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'DELETE_EMPLOYEE_PAYMENT'; payload: string }
  | { type: 'ADD_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'UPDATE_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'DELETE_EMPLOYEE_ADVANCE'; payload: string }
  | { type: 'ADD_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'UPDATE_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'DELETE_EMPLOYEE_OVERTIME'; payload: string }
  | { type: 'ADD_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'UPDATE_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'DELETE_EMPLOYEE_COMMISSION'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SYNC_ADD_SALE'; payload: Sale }
  | { type: 'SYNC_UPDATE_SALE'; payload: Sale }
  | { type: 'SYNC_DELETE_SALE'; payload: string }
  | { type: 'SYNC_ADD_DEBT'; payload: Debt }
  | { type: 'SYNC_UPDATE_DEBT'; payload: Debt }
  | { type: 'SYNC_DELETE_DEBT'; payload: string }
  | { type: 'SYNC_ADD_CHECK'; payload: Check }
  | { type: 'SYNC_UPDATE_CHECK'; payload: Check }
  | { type: 'SYNC_DELETE_CHECK'; payload: string }
  | { type: 'SYNC_ADD_BOLETO'; payload: Boleto }
  | { type: 'SYNC_UPDATE_BOLETO'; payload: Boleto }
  | { type: 'SYNC_DELETE_BOLETO'; payload: string }
  | { type: 'SYNC_ADD_EMPLOYEE'; payload: Employee }
  | { type: 'SYNC_UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'SYNC_DELETE_EMPLOYEE'; payload: string }
  | { type: 'SYNC_ADD_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'SYNC_ADD_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'SYNC_UPDATE_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'SYNC_ADD_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'SYNC_UPDATE_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'SYNC_ADD_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'SYNC_UPDATE_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'SYNC_ADD_INSTALLMENT'; payload: Installment }
  | { type: 'SYNC_UPDATE_INSTALLMENT'; payload: Installment };

const initialState: AppState = {
  user: null,
  sales: [],
  debts: [],
  checks: [],
  boletos: [],
  installments: [],
  employees: [],
  employeePayments: [],
  employeeAdvances: [],
  employeeOvertimes: [],
  employeeCommissions: [],
  isLoading: false,
  error: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
      
    // Regular actions that trigger database sync
    case 'ADD_SALE':
      // Don't sync during loading
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createSale(action.payload).catch(console.error);
      }
      return { ...state, sales: [...state.sales, action.payload] };
    case 'UPDATE_SALE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateSale(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        sales: state.sales.map(sale => 
          sale.id === action.payload.id ? action.payload : sale
        ) 
      };
    case 'DELETE_SALE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.deleteSale(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        sales: state.sales.filter(sale => sale.id !== action.payload),
        installments: state.installments.filter(installment => installment.saleId !== action.payload),
        employeeCommissions: state.employeeCommissions.filter(commission => commission.saleId !== action.payload)
      };
    case 'ADD_DEBT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createDebt(action.payload).catch(console.error);
      }
      return { ...state, debts: [...state.debts, action.payload] };
    case 'UPDATE_DEBT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateDebt(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        debts: state.debts.map(debt => 
          debt.id === action.payload.id ? action.payload : debt
        ) 
      };
    case 'DELETE_DEBT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.deleteDebt(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        debts: state.debts.filter(debt => debt.id !== action.payload),
        installments: state.installments.filter(installment => installment.debtId !== action.payload)
      };
    case 'ADD_CHECK':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createCheck(action.payload).catch(console.error);
      }
      return { ...state, checks: [...state.checks, action.payload] };
    case 'UPDATE_CHECK':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateCheck(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        checks: state.checks.map(check => 
          check.id === action.payload.id ? action.payload : check
        ) 
      };
    case 'DELETE_CHECK':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.deleteCheck(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        checks: state.checks.filter(check => check.id !== action.payload)
      };
    case 'ADD_BOLETO':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createBoleto(action.payload).catch(console.error);
      }
      return { ...state, boletos: [...state.boletos, action.payload] };
    case 'UPDATE_BOLETO':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateBoleto(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        boletos: state.boletos.map(boleto => 
          boleto.id === action.payload.id ? action.payload : boleto
        ) 
      };
    case 'DELETE_BOLETO':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.deleteBoleto(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        boletos: state.boletos.filter(boleto => boleto.id !== action.payload)
      };
    case 'ADD_INSTALLMENT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createInstallment(action.payload).catch(console.error);
      }
      return { ...state, installments: [...state.installments, action.payload] };
    case 'UPDATE_INSTALLMENT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateInstallment(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        installments: state.installments.map(installment => 
          installment.id === action.payload.id ? action.payload : installment
        ) 
      };
    case 'ADD_EMPLOYEE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createEmployee(action.payload).catch(console.error);
      }
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateEmployee(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        employees: state.employees.map(employee => 
          employee.id === action.payload.id ? action.payload : employee
        ) 
      };
    case 'DELETE_EMPLOYEE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.deleteEmployee(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        employees: state.employees.filter(employee => employee.id !== action.payload),
        employeePayments: state.employeePayments.filter(payment => payment.employeeId !== action.payload),
        employeeAdvances: state.employeeAdvances.filter(advance => advance.employeeId !== action.payload),
        employeeOvertimes: state.employeeOvertimes.filter(overtime => overtime.employeeId !== action.payload),
        employeeCommissions: state.employeeCommissions.filter(commission => commission.employeeId !== action.payload)
      };
    case 'ADD_EMPLOYEE_PAYMENT':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createEmployeePayment(action.payload).catch(console.error);
      }
      return { ...state, employeePayments: [...state.employeePayments, action.payload] };
    case 'UPDATE_EMPLOYEE_PAYMENT':
      return { 
        ...state, 
        employeePayments: state.employeePayments.map(payment => 
          payment.id === action.payload.id ? action.payload : payment
        ) 
      };
    case 'DELETE_EMPLOYEE_PAYMENT':
      return { 
        ...state, 
        employeePayments: state.employeePayments.filter(payment => payment.id !== action.payload)
      };
    case 'ADD_EMPLOYEE_ADVANCE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createEmployeeAdvance(action.payload).catch(console.error);
      }
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
    case 'UPDATE_EMPLOYEE_ADVANCE':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateEmployeeAdvance(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        employeeAdvances: state.employeeAdvances.map(advance => 
          advance.id === action.payload.id ? action.payload : advance
        ) 
      };
    case 'DELETE_EMPLOYEE_ADVANCE':
      return { 
        ...state, 
        employeeAdvances: state.employeeAdvances.filter(advance => advance.id !== action.payload)
      };
    case 'ADD_EMPLOYEE_OVERTIME':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createEmployeeOvertime(action.payload).catch(console.error);
      }
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
    case 'UPDATE_EMPLOYEE_OVERTIME':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateEmployeeOvertime(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        employeeOvertimes: state.employeeOvertimes.map(overtime => 
          overtime.id === action.payload.id ? action.payload : overtime
        ) 
      };
    case 'DELETE_EMPLOYEE_OVERTIME':
      return { 
        ...state, 
        employeeOvertimes: state.employeeOvertimes.filter(overtime => overtime.id !== action.payload)
      };
    case 'ADD_EMPLOYEE_COMMISSION':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.createEmployeeCommission(action.payload).catch(console.error);
      }
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
    case 'UPDATE_EMPLOYEE_COMMISSION':
      if (!state.isLoading && isSupabaseConfigured()) {
        database.updateEmployeeCommission(action.payload).catch(console.error);
      }
      return { 
        ...state, 
        employeeCommissions: state.employeeCommissions.map(commission => 
          commission.id === action.payload.id ? action.payload : commission
        ) 
      };
    case 'DELETE_EMPLOYEE_COMMISSION':
      return { 
        ...state, 
        employeeCommissions: state.employeeCommissions.filter(commission => commission.id !== action.payload)
      };
      
    // Sync actions that don't trigger database operations (used during loading)
    case 'SYNC_ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SYNC_UPDATE_SALE':
      return { 
        ...state, 
        sales: state.sales.map(sale => 
          sale.id === action.payload.id ? action.payload : sale
        ) 
      };
    case 'SYNC_DELETE_SALE':
      return { 
        ...state, 
        sales: state.sales.filter(sale => sale.id !== action.payload)
      };
    case 'SYNC_ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
    case 'SYNC_UPDATE_DEBT':
      return { 
        ...state, 
        debts: state.debts.map(debt => 
          debt.id === action.payload.id ? action.payload : debt
        ) 
      };
    case 'SYNC_DELETE_DEBT':
      return { 
        ...state, 
        debts: state.debts.filter(debt => debt.id !== action.payload)
      };
    case 'SYNC_ADD_CHECK':
      return { ...state, checks: [...state.checks, action.payload] };
    case 'SYNC_UPDATE_CHECK':
      return { 
        ...state, 
        checks: state.checks.map(check => 
          check.id === action.payload.id ? action.payload : check
        ) 
      };
    case 'SYNC_DELETE_CHECK':
      return { 
        ...state, 
        checks: state.checks.filter(check => check.id !== action.payload)
      };
    case 'SYNC_ADD_BOLETO':
      return { ...state, boletos: [...state.boletos, action.payload] };
    case 'SYNC_UPDATE_BOLETO':
      return { 
        ...state, 
        boletos: state.boletos.map(boleto => 
          boleto.id === action.payload.id ? action.payload : boleto
        ) 
      };
    case 'SYNC_DELETE_BOLETO':
      return { 
        ...state, 
        boletos: state.boletos.filter(boleto => boleto.id !== action.payload)
      };
    case 'SYNC_ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'SYNC_UPDATE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.map(employee => 
          employee.id === action.payload.id ? action.payload : employee
        ) 
      };
    case 'SYNC_DELETE_EMPLOYEE':
      return { 
        ...state, 
        employees: state.employees.filter(employee => employee.id !== action.payload)
      };
    case 'SYNC_ADD_EMPLOYEE_PAYMENT':
      return { ...state, employeePayments: [...state.employeePayments, action.payload] };
    case 'SYNC_ADD_EMPLOYEE_ADVANCE':
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
    case 'SYNC_UPDATE_EMPLOYEE_ADVANCE':
      return { 
        ...state, 
        employeeAdvances: state.employeeAdvances.map(advance => 
          advance.id === action.payload.id ? action.payload : advance
        ) 
      };
    case 'SYNC_ADD_EMPLOYEE_OVERTIME':
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
    case 'SYNC_UPDATE_EMPLOYEE_OVERTIME':
      return { 
        ...state, 
        employeeOvertimes: state.employeeOvertimes.map(overtime => 
          overtime.id === action.payload.id ? action.payload : overtime
        ) 
      };
    case 'SYNC_ADD_EMPLOYEE_COMMISSION':
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
    case 'SYNC_UPDATE_EMPLOYEE_COMMISSION':
      return { 
        ...state, 
        employeeCommissions: state.employeeCommissions.map(commission => 
          commission.id === action.payload.id ? action.payload : commission
        ) 
      };
    case 'SYNC_ADD_INSTALLMENT':
      return { ...state, installments: [...state.installments, action.payload] };
    case 'SYNC_UPDATE_INSTALLMENT':
      return { 
        ...state, 
        installments: state.installments.map(installment => 
          installment.id === action.payload.id ? action.payload : installment
        ) 
      };
      
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  reloadFromSupabase?: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from database or localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        if (isSupabaseConfigured()) {
          console.log('🔄 Carregando TODOS os dados do Supabase...');
          
          // Usar função de sincronização completa
          const allData = await database.syncAllData();
          
          dispatch({ 
            type: 'LOAD_DATA', 
            payload: allData
          });
          
          console.log('✅ TODOS os dados carregados do Supabase com sucesso');
          
          // Migrate localStorage data to Supabase if it exists
          const localData = localStorage.getItem('revgold-data');
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              console.log('🔄 Migrando TODOS os dados do localStorage para Supabase...');
              
              // Migrate sales
              if (parsedData.sales && parsedData.sales.length > 0) {
                console.log(`Migrando ${parsedData.sales.length} vendas...`);
                for (const sale of parsedData.sales) {
                  await database.createSale(sale);
                }
              }
              
              // Migrate debts
              if (parsedData.debts && parsedData.debts.length > 0) {
                console.log(`Migrando ${parsedData.debts.length} dívidas...`);
                for (const debt of parsedData.debts) {
                  await database.createDebt(debt);
                }
              }
              
              // Migrate checks
              if (parsedData.checks && parsedData.checks.length > 0) {
                console.log(`Migrando ${parsedData.checks.length} cheques...`);
                for (const check of parsedData.checks) {
                  await database.createCheck(check);
                }
              }
              
              // Migrate boletos
              if (parsedData.boletos && parsedData.boletos.length > 0) {
                console.log(`Migrando ${parsedData.boletos.length} boletos...`);
                for (const boleto of parsedData.boletos) {
                  await database.createBoleto(boleto);
                }
              }
              
              // Migrate employees
              if (parsedData.employees && parsedData.employees.length > 0) {
                console.log(`Migrando ${parsedData.employees.length} funcionários...`);
                for (const employee of parsedData.employees) {
                  await database.createEmployee(employee);
                }
              }
              
              // Migrate employee payments
              if (parsedData.employeePayments && parsedData.employeePayments.length > 0) {
                console.log(`Migrando ${parsedData.employeePayments.length} pagamentos...`);
                for (const payment of parsedData.employeePayments) {
                  await database.createEmployeePayment(payment);
                }
              }
              
              // Migrate employee advances
              if (parsedData.employeeAdvances && parsedData.employeeAdvances.length > 0) {
                console.log(`Migrando ${parsedData.employeeAdvances.length} adiantamentos...`);
                for (const advance of parsedData.employeeAdvances) {
                  await database.createEmployeeAdvance(advance);
                }
              }
              
              // Migrate employee overtimes
              if (parsedData.employeeOvertimes && parsedData.employeeOvertimes.length > 0) {
                console.log(`Migrando ${parsedData.employeeOvertimes.length} horas extras...`);
                for (const overtime of parsedData.employeeOvertimes) {
                  await database.createEmployeeOvertime(overtime);
                }
              }
              
              // Migrate employee commissions
              if (parsedData.employeeCommissions && parsedData.employeeCommissions.length > 0) {
                console.log(`Migrando ${parsedData.employeeCommissions.length} comissões...`);
                for (const commission of parsedData.employeeCommissions) {
                  await database.createEmployeeCommission(commission);
                }
              }
              
              // Migrate installments
              if (parsedData.installments && parsedData.installments.length > 0) {
                console.log(`Migrando ${parsedData.installments.length} parcelas...`);
                for (const installment of parsedData.installments) {
                  await database.createInstallment(installment);
                }
              }
              
              // Clear localStorage after successful migration
              localStorage.removeItem('revgold-data');
              console.log('✅ Migração COMPLETA concluída com sucesso - todos os dados foram transferidos para o Supabase');
              
              // Reload data from Supabase
              window.location.reload();
            } catch (migrationError) {
              console.error('❌ Erro na migração completa:', migrationError);
              dispatch({ type: 'SET_ERROR', payload: 'Erro durante a migração dos dados. Alguns dados podem não ter sido transferidos.' });
            }
          }
        } else {
          console.log('⚠️ Supabase não configurado, carregando do localStorage...');
          
          // Fallback to localStorage
          const savedData = localStorage.getItem('revgold-data');
          if (savedData) {
            const data = JSON.parse(savedData);
            dispatch({ type: 'LOAD_DATA', payload: data });
            console.log('📱 Dados carregados do localStorage');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao conectar com o banco de dados. Verifique sua conexão e tente novamente.' });
        
        // Fallback to localStorage on error
        try {
          const savedData = localStorage.getItem('revgold-data');
          if (savedData) {
            const data = JSON.parse(savedData);
            dispatch({ type: 'LOAD_DATA', payload: data });
            console.log('📱 Dados carregados do backup local');
          }
        } catch (localError) {
          console.error('❌ Erro ao carregar backup local:', localError);
          dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados' });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadData();
  }, []);

  // Função para recarregar dados do Supabase
  const reloadFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      console.log('🔄 Recarregando TODOS os dados do Supabase...');
      const allData = await database.syncAllData();
      dispatch({ type: 'LOAD_DATA', payload: allData });
      console.log('✅ Dados recarregados com sucesso do Supabase');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao recarregar dados do banco' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Configurar listener para mudanças em tempo real (opcional)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    console.log('🔄 Configurando listeners de tempo real...');

    // Listener para vendas
    const salesSubscription = supabase!
      .channel('sales-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('🔄 Mudança detectada em vendas:', payload);
          reloadFromSupabase();
        }
      )
      .subscribe();

    // Listener para dívidas
    const debtsSubscription = supabase!
      .channel('debts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'debts' },
        (payload) => {
          console.log('🔄 Mudança detectada em dívidas:', payload);
          reloadFromSupabase();
        }
      )
      .subscribe();

    // Listener para funcionários
    const employeesSubscription = supabase!
      .channel('employees-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('🔄 Mudança detectada em funcionários:', payload);
          reloadFromSupabase();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      console.log('🔄 Removendo listeners de tempo real...');
      salesSubscription.unsubscribe();
      debtsSubscription.unsubscribe();
      employeesSubscription.unsubscribe();
    };
  }, []);

  // Save data to database and localStorage whenever state changes
  useEffect(() => {
    // Skip saving during initial load
    if (state.isLoading) return;
    
    // Always save to localStorage as backup
    const dataToSave = {
      user: state.user,
      sales: state.sales,
      debts: state.debts,
      checks: state.checks,
      boletos: state.boletos,
      installments: state.installments,
      employees: state.employees,
      employeePayments: state.employeePayments,
      employeeAdvances: state.employeeAdvances,
      employeeOvertimes: state.employeeOvertimes,
      employeeCommissions: state.employeeCommissions
    };
    
    if (Object.values(dataToSave).some(arr => Array.isArray(arr) && arr.length > 0) || state.user) {
      localStorage.setItem('revgold-data', JSON.stringify({
        user: state.user,
        sales: state.sales,
        debts: state.debts,
        checks: state.checks,
        boletos: state.boletos,
        installments: state.installments,
        employees: state.employees,
        employeePayments: state.employeePayments,
        employeeAdvances: state.employeeAdvances,
        employeeOvertimes: state.employeeOvertimes,
        employeeCommissions: state.employeeCommissions
      }));
      
      console.log('💾 Dados salvos no localStorage como backup');
      
      // Trigger notification system update
      window.dispatchEvent(new CustomEvent('revgold-data-updated', {
        detail: {
          type: 'data-change',
          timestamp: Date.now()
        }
      }));
    }
  }, [state.sales, state.debts, state.checks, state.boletos, state.employees, state.employeePayments, state.employeeAdvances, state.employeeOvertimes, state.employeeCommissions, state.installments, state.user, state.isLoading]);

  return (
    <AppContext.Provider value={{ state, dispatch, reloadFromSupabase }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}