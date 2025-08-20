import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Sale, Debt, Check, Installment, Product, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Boleto } from '../types';
import { salesService, debtsService, employeesService, checksService, boletosService } from '../lib/supabase';

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
  | { type: 'ADD_INSTALLMENT'; payload: Installment }
  | { type: 'UPDATE_INSTALLMENT'; payload: Installment }
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

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
      
    case 'ADD_INSTALLMENT':
      return { ...state, installments: [...state.installments, action.payload] };
      
    case 'UPDATE_INSTALLMENT':
      return { 
        ...state, 
        installments: state.installments.map(installment => 
          installment.id === action.payload.id ? action.payload : installment
        ) 
      };
      
    case 'ADD_EMPLOYEE_PAYMENT':
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
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
      
    case 'UPDATE_EMPLOYEE_ADVANCE':
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
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
      
    case 'UPDATE_EMPLOYEE_OVERTIME':
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
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
      
    case 'UPDATE_EMPLOYEE_COMMISSION':
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
  loadAllData: () => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load all data from Supabase
  const loadAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      console.log('🔄 Carregando dados do Supabase...');
      
      const [sales, debts, employees, checks, boletos] = await Promise.all([
        salesService.getAll(),
        debtsService.getAll(),
        employeesService.getAll(),
        checksService.getAll(),
        boletosService.getAll()
      ]);
      
      dispatch({ type: 'SET_SALES', payload: sales });
      dispatch({ type: 'SET_DEBTS', payload: debts });
      dispatch({ type: 'SET_EMPLOYEES', payload: employees });
      dispatch({ type: 'SET_CHECKS', payload: checks });
      dispatch({ type: 'SET_BOLETOS', payload: boletos });
      
      console.log('✅ Dados carregados do Supabase:', {
        sales: sales.length,
        debts: debts.length,
        employees: employees.length,
        checks: checks.length,
        boletos: boletos.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados do banco. Verifique sua conexão.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sales operations
  const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    try {
      const sale = await salesService.create(saleData);
      dispatch({ type: 'ADD_SALE', payload: sale });
      console.log('✅ Venda criada no Supabase:', sale.id);
    } catch (error) {
      console.error('❌ Erro ao criar venda:', error);
      throw error;
    }
  };

  const updateSale = async (sale: Sale) => {
    try {
      const updatedSale = await salesService.update(sale);
      dispatch({ type: 'UPDATE_SALE', payload: updatedSale });
      console.log('✅ Venda atualizada no Supabase:', sale.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar venda:', error);
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await salesService.delete(id);
      dispatch({ type: 'DELETE_SALE', payload: id });
      console.log('✅ Venda excluída do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir venda:', error);
      throw error;
    }
  };

  // Debts operations
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      const debt = await debtsService.create(debtData);
      dispatch({ type: 'ADD_DEBT', payload: debt });
      console.log('✅ Dívida criada no Supabase:', debt.id);
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      throw error;
    }
  };

  const updateDebt = async (debt: Debt) => {
    try {
      const updatedDebt = await debtsService.update(debt);
      dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
      console.log('✅ Dívida atualizada no Supabase:', debt.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await debtsService.delete(id);
      dispatch({ type: 'DELETE_DEBT', payload: id });
      console.log('✅ Dívida excluída do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir dívida:', error);
      throw error;
    }
  };

  // Employees operations
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    try {
      const employee = await employeesService.create(employeeData);
      dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
      console.log('✅ Funcionário criado no Supabase:', employee.id);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      throw error;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    try {
      const updatedEmployee = await employeesService.update(employee);
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
      console.log('✅ Funcionário atualizado no Supabase:', employee.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await employeesService.delete(id);
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
      console.log('✅ Funcionário excluído do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir funcionário:', error);
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch,
      loadAllData,
      createSale,
      updateSale,
      deleteSale,
      createDebt,
      updateDebt,
      deleteDebt,
      createEmployee,
      updateEmployee,
      deleteEmployee
    }}>
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