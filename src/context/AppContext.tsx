import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Sale, Debt, Check, Installment, Product, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Boleto } from '../types';
import { storage, AppData } from '../lib/storage';

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
  lastSync: string;
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
  | { type: 'LOAD_DATA'; payload: AppData }
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
  error: null,
  lastSync: new Date().toISOString()
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      storage.setUser(action.payload);
      return { ...state, user: action.payload };
      
    case 'ADD_SALE':
      storage.addSale(action.payload);
      return { ...state, sales: [...state.sales, action.payload] };
      
    case 'UPDATE_SALE':
      storage.updateSale(action.payload);
      return { 
        ...state, 
        sales: state.sales.map(sale => 
          sale.id === action.payload.id ? action.payload : sale
        ) 
      };
      
    case 'DELETE_SALE':
      storage.deleteSale(action.payload);
      return { 
        ...state, 
        sales: state.sales.filter(sale => sale.id !== action.payload),
        installments: state.installments.filter(installment => installment.saleId !== action.payload),
        employeeCommissions: state.employeeCommissions.filter(commission => commission.saleId !== action.payload),
        checks: state.checks.filter(check => check.saleId !== action.payload),
        boletos: state.boletos.filter(boleto => boleto.saleId !== action.payload)
      };
      
    case 'ADD_DEBT':
      storage.addDebt(action.payload);
      return { ...state, debts: [...state.debts, action.payload] };
      
    case 'UPDATE_DEBT':
      storage.updateDebt(action.payload);
      return { 
        ...state, 
        debts: state.debts.map(debt => 
          debt.id === action.payload.id ? action.payload : debt
        ) 
      };
      
    case 'DELETE_DEBT':
      storage.deleteDebt(action.payload);
      return { 
        ...state, 
        debts: state.debts.filter(debt => debt.id !== action.payload),
        installments: state.installments.filter(installment => installment.debtId !== action.payload),
        checks: state.checks.filter(check => check.debtId !== action.payload)
      };
      
    case 'ADD_CHECK':
      storage.addCheck(action.payload);
      return { ...state, checks: [...state.checks, action.payload] };
      
    case 'UPDATE_CHECK':
      storage.updateCheck(action.payload);
      return { 
        ...state, 
        checks: state.checks.map(check => 
          check.id === action.payload.id ? action.payload : check
        ) 
      };
      
    case 'DELETE_CHECK':
      storage.deleteCheck(action.payload);
      return { 
        ...state, 
        checks: state.checks.filter(check => check.id !== action.payload)
      };
      
    case 'ADD_BOLETO':
      storage.addBoleto(action.payload);
      return { ...state, boletos: [...state.boletos, action.payload] };
      
    case 'UPDATE_BOLETO':
      storage.updateBoleto(action.payload);
      return { 
        ...state, 
        boletos: state.boletos.map(boleto => 
          boleto.id === action.payload.id ? action.payload : boleto
        ) 
      };
      
    case 'DELETE_BOLETO':
      storage.deleteBoleto(action.payload);
      return { 
        ...state, 
        boletos: state.boletos.filter(boleto => boleto.id !== action.payload)
      };
      
    case 'ADD_INSTALLMENT':
      storage.addInstallment(action.payload);
      return { ...state, installments: [...state.installments, action.payload] };
      
    case 'UPDATE_INSTALLMENT':
      storage.updateInstallment(action.payload);
      return { 
        ...state, 
        installments: state.installments.map(installment => 
          installment.id === action.payload.id ? action.payload : installment
        ) 
      };
      
    case 'ADD_EMPLOYEE':
      storage.addEmployee(action.payload);
      return { ...state, employees: [...state.employees, action.payload] };
      
    case 'UPDATE_EMPLOYEE':
      storage.updateEmployee(action.payload);
      return { 
        ...state, 
        employees: state.employees.map(employee => 
          employee.id === action.payload.id ? action.payload : employee
        ) 
      };
      
    case 'DELETE_EMPLOYEE':
      storage.deleteEmployee(action.payload);
      return { 
        ...state, 
        employees: state.employees.filter(employee => employee.id !== action.payload),
        employeePayments: state.employeePayments.filter(payment => payment.employeeId !== action.payload),
        employeeAdvances: state.employeeAdvances.filter(advance => advance.employeeId !== action.payload),
        employeeOvertimes: state.employeeOvertimes.filter(overtime => overtime.employeeId !== action.payload),
        employeeCommissions: state.employeeCommissions.filter(commission => commission.employeeId !== action.payload)
      };
      
    case 'ADD_EMPLOYEE_PAYMENT':
      storage.addEmployeePayment(action.payload);
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
      storage.addEmployeeAdvance(action.payload);
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
      
    case 'UPDATE_EMPLOYEE_ADVANCE':
      storage.updateEmployeeAdvance(action.payload);
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
      storage.addEmployeeOvertime(action.payload);
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
      
    case 'UPDATE_EMPLOYEE_OVERTIME':
      storage.updateEmployeeOvertime(action.payload);
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
      storage.addEmployeeCommission(action.payload);
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
      
    case 'UPDATE_EMPLOYEE_COMMISSION':
      storage.updateEmployeeCommission(action.payload);
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
      
    case 'LOAD_DATA':
      return { 
        ...state, 
        ...action.payload,
        lastSync: action.payload.lastSync || new Date().toISOString()
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
  exportData: () => string;
  importData: (data: string) => boolean;
  restoreBackup: () => boolean;
  getStorageStats: () => any;
  clearAllData: () => void;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar dados na inicialização
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        console.log('🔄 Inicializando sistema de dados...');
        const data = await storage.initialize();
        
        dispatch({ type: 'LOAD_DATA', payload: data });
        
        console.log('✅ Sistema inicializado com sucesso:', {
          sales: data.sales.length,
          debts: data.debts.length,
          checks: data.checks.length,
          boletos: data.boletos.length,
          employees: data.employees.length,
          version: data.version,
          lastSync: data.lastSync
        });
        
      } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados. Usando dados padrão.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadData();
  }, []);

  // Listener para eventos de salvamento
  useEffect(() => {
    const handleDataSaved = (event: CustomEvent) => {
      console.log('💾 Dados salvos automaticamente:', event.detail);
    };

    const handleStorageError = (event: CustomEvent) => {
      console.error('❌ Erro no armazenamento:', event.detail);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao salvar dados. Verifique o espaço disponível.' });
    };

    window.addEventListener('revgold-data-saved', handleDataSaved as EventListener);
    window.addEventListener('revgold-storage-error', handleStorageError as EventListener);

    return () => {
      window.removeEventListener('revgold-data-saved', handleDataSaved as EventListener);
      window.removeEventListener('revgold-storage-error', handleStorageError as EventListener);
    };
  }, []);

  // Funções utilitárias
  const exportData = () => {
    return storage.exportData();
  };

  const importData = (jsonData: string) => {
    const success = storage.importData(jsonData);
    if (success) {
      // Recarregar dados após importação
      const data = storage.getData();
      dispatch({ type: 'LOAD_DATA', payload: data });
    }
    return success;
  };

  const restoreBackup = () => {
    const success = storage.restoreBackup();
    if (success) {
      // Recarregar dados após restauração
      const data = storage.getData();
      dispatch({ type: 'LOAD_DATA', payload: data });
    }
    return success;
  };

  const getStorageStats = () => {
    return storage.getStorageStats();
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados permanentemente. Tem certeza?')) {
      storage.clearAllData();
      dispatch({ type: 'LOAD_DATA', payload: storage.getData() });
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      exportData, 
      importData, 
      restoreBackup, 
      getStorageStats, 
      clearAllData 
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