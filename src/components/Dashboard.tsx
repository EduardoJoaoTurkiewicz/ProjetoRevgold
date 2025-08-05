import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Sale, Debt, Check, Installment, Product, Employee, EmployeePayment, Boleto } from '../types';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
}

interface AppState {
  user: User | null;
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  installments: Installment[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  notifications: Notification[];
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
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> };

const initialState: AppState = {
  user: null,
  sales: [],
  debts: [],
  checks: [],
  boletos: [],
  installments: [],
  employees: [],
  employeePayments: [],
  notifications: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ADD_SALE':
      const newSaleState = { ...state, sales: [...state.sales, action.payload] };
      // Add notification for new sale
      const saleNotification: Notification = {
        id: Date.now().toString(),
        message: `Nova venda registrada para ${action.payload.client}`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      };
      return { 
        ...newSaleState, 
        notifications: [...newSaleState.notifications, saleNotification] 
      };
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
        sales: state.sales.filter(sale => sale.id !== action.payload),
        installments: state.installments.filter(installment => installment.saleId !== action.payload)
      };
    case 'ADD_DEBT':
      const newDebtState = { ...state, debts: [...state.debts, action.payload] };
      // Add notification for new debt
      const debtNotification: Notification = {
        id: Date.now().toString(),
        message: `Nova dívida registrada: ${action.payload.company}`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false
      };
      return { 
        ...newDebtState, 
        notifications: [...newDebtState.notifications, debtNotification] 
      };
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
        debts: state.debts.filter(debt => debt.id !== action.payload),
        installments: state.installments.filter(installment => installment.debtId !== action.payload)
      };
    case 'ADD_CHECK':
      const newCheckState = { ...state, checks: [...state.checks, action.payload] };
      // Add notification for new check
      const checkNotification: Notification = {
        id: Date.now().toString(),
        message: `Novo cheque adicionado: ${action.payload.client}`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      };
      return { 
        ...newCheckState, 
        notifications: [...newCheckState.notifications, checkNotification] 
      };
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
      const newBoletoState = { ...state, boletos: [...state.boletos, action.payload] };
      // Add notification for new boleto
      const boletoNotification: Notification = {
        id: Date.now().toString(),
        message: `Novo boleto gerado: ${action.payload.client}`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      };
      return { 
        ...newBoletoState, 
        notifications: [...newBoletoState.notifications, boletoNotification] 
      };
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
    case 'ADD_INSTALLMENT':
      return { ...state, installments: [...state.installments, action.payload] };
    case 'UPDATE_INSTALLMENT':
      return { 
        ...state, 
        installments: state.installments.map(installment => 
          installment.id === action.payload.id ? action.payload : installment
        ) 
      };
    case 'ADD_EMPLOYEE':
      const newEmployeeState = { ...state, employees: [...state.employees, action.payload] };
      // Add notification for new employee
      const employeeNotification: Notification = {
        id: Date.now().toString(),
        message: `Novo funcionário cadastrado: ${action.payload.name}`,
        type: 'success',
        timestamp: new Date().toISOString(),
      }
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
        employees: state.employees.filter(employee => employee.id !== action.payload),
        employeePayments: state.employeePayments.filter(payment => payment.employeeId !== action.payload)
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
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('revgold-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: data });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('revgold-data', JSON.stringify({
        sales: state.sales,
        debts: state.debts,
        checks: state.checks,
        boletos: state.boletos,
        installments: state.installments,
        employees: state.employees,
        employeePayments: state.employeePayments
      }));
    }
  }, [state.sales, state.debts, state.checks, state.boletos, state.installments, state.employees, state.employeePayments, state.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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