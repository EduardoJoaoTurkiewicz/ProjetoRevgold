import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface Employee {
  id: string;
  name: string;
  position: string;
  isSeller: boolean;
  salary: number;
  paymentDay: number;
  nextPaymentDate?: string;
  isActive: boolean;
  hireDate: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Sale {
  id: string;
  date: string;
  deliveryDate?: string;
  client: string;
  sellerId?: string;
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  observations?: string;
  totalValue: number;
  paymentMethods: Array<{
    type: string;
    amount: number;
  }>;
  receivedAmount: number;
  pendingAmount: number;
  status: 'pago' | 'pendente' | 'parcial';
  paymentDescription?: string;
  paymentObservations?: string;
  customCommissionRate: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Debt {
  id: string;
  date: string;
  description: string;
  company: string;
  totalValue: number;
  paymentMethods: Array<{
    type: string;
    amount: number;
  }>;
  isPaid: boolean;
  paidAmount: number;
  pendingAmount: number;
  checksUsed: string[];
  paymentDescription?: string;
  debtPaymentDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Check {
  id: string;
  saleId?: string;
  debtId?: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'devolvido' | 'reapresentado';
  isOwnCheck: boolean;
  observations?: string;
  usedFor?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  frontImage?: string;
  backImage?: string;
  selectedAvailableChecks?: string[];
  usedInDebt?: string;
  discountDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Boleto {
  id: string;
  saleId?: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago';
  installmentNumber: number;
  totalInstallments: number;
  boletoFile?: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeCommission {
  id: string;
  employeeId: string;
  saleId: string;
  saleValue: number;
  commissionRate: number;
  commissionAmount: number;
  date: string;
  status: 'pendente' | 'pago';
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeePayment {
  id: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  isPaid: boolean;
  receipt?: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeAdvance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha';
  status: 'pendente' | 'descontado';
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeOvertime {
  id: string;
  employeeId: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  date: string;
  description: string;
  status: 'pendente' | 'pago';
  createdAt?: string;
  updatedAt?: string;
}

interface CashBalance {
  id: string;
  currentBalance: number;
  initialBalance: number;
  initialDate: string;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CashTransaction {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro';
  relatedId?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AppState {
  employees: Employee[];
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employeeCommissions: EmployeeCommission[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  cashBalance: CashBalance | null;
  cashTransactions: CashTransaction[];
  isLoading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_CHECKS'; payload: Check[] }
  | { type: 'SET_BOLETOS'; payload: Boleto[] }
  | { type: 'SET_EMPLOYEE_COMMISSIONS'; payload: EmployeeCommission[] }
  | { type: 'SET_EMPLOYEE_PAYMENTS'; payload: EmployeePayment[] }
  | { type: 'SET_EMPLOYEE_ADVANCES'; payload: EmployeeAdvance[] }
  | { type: 'SET_EMPLOYEE_OVERTIMES'; payload: EmployeeOvertime[] }
  | { type: 'SET_CASH_BALANCE'; payload: CashBalance | null }
  | { type: 'SET_CASH_TRANSACTIONS'; payload: CashTransaction[] }
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
  | { type: 'ADD_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'UPDATE_EMPLOYEE_COMMISSION'; payload: EmployeeCommission }
  | { type: 'DELETE_EMPLOYEE_COMMISSION'; payload: string }
  | { type: 'ADD_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'UPDATE_EMPLOYEE_PAYMENT'; payload: EmployeePayment }
  | { type: 'DELETE_EMPLOYEE_PAYMENT'; payload: string }
  | { type: 'ADD_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'UPDATE_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'DELETE_EMPLOYEE_ADVANCE'; payload: string }
  | { type: 'ADD_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'UPDATE_EMPLOYEE_OVERTIME'; payload: EmployeeOvertime }
  | { type: 'DELETE_EMPLOYEE_OVERTIME'; payload: string }
  | { type: 'UPDATE_CASH_BALANCE'; payload: CashBalance }
  | { type: 'ADD_CASH_TRANSACTION'; payload: CashTransaction }
  | { type: 'UPDATE_CASH_TRANSACTION'; payload: CashTransaction }
  | { type: 'DELETE_CASH_TRANSACTION'; payload: string };

const initialState: AppState = {
  employees: [],
  sales: [],
  debts: [],
  checks: [],
  boletos: [],
  employeeCommissions: [],
  employeePayments: [],
  employeeAdvances: [],
  employeeOvertimes: [],
  cashBalance: null,
  cashTransactions: [],
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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
    case 'SET_EMPLOYEE_COMMISSIONS':
      return { ...state, employeeCommissions: action.payload };
    case 'SET_EMPLOYEE_PAYMENTS':
      return { ...state, employeePayments: action.payload };
    case 'SET_EMPLOYEE_ADVANCES':
      return { ...state, employeeAdvances: action.payload };
    case 'SET_EMPLOYEE_OVERTIMES':
      return { ...state, employeeOvertimes: action.payload };
    case 'SET_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
    case 'SET_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp =>
          emp.id === action.payload.id ? action.payload : emp
        ),
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload),
      };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'UPDATE_SALE':
      return {
        ...state,
        sales: state.sales.map(sale =>
          sale.id === action.payload.id ? action.payload : sale
        ),
      };
    case 'DELETE_SALE':
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
      };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] };
    case 'UPDATE_DEBT':
      return {
        ...state,
        debts: state.debts.map(debt =>
          debt.id === action.payload.id ? action.payload : debt
        ),
      };
    case 'DELETE_DEBT':
      return {
        ...state,
        debts: state.debts.filter(debt => debt.id !== action.payload),
      };
    case 'ADD_CHECK':
      return { ...state, checks: [...state.checks, action.payload] };
    case 'UPDATE_CHECK':
      return {
        ...state,
        checks: state.checks.map(check =>
          check.id === action.payload.id ? action.payload : check
        ),
      };
    case 'DELETE_CHECK':
      return {
        ...state,
        checks: state.checks.filter(check => check.id !== action.payload),
      };
    case 'ADD_BOLETO':
      return { ...state, boletos: [...state.boletos, action.payload] };
    case 'UPDATE_BOLETO':
      return {
        ...state,
        boletos: state.boletos.map(boleto =>
          boleto.id === action.payload.id ? action.payload : boleto
        ),
      };
    case 'DELETE_BOLETO':
      return {
        ...state,
        boletos: state.boletos.filter(boleto => boleto.id !== action.payload),
      };
    case 'ADD_EMPLOYEE_COMMISSION':
      return { ...state, employeeCommissions: [...state.employeeCommissions, action.payload] };
    case 'UPDATE_EMPLOYEE_COMMISSION':
      return {
        ...state,
        employeeCommissions: state.employeeCommissions.map(comm =>
          comm.id === action.payload.id ? action.payload : comm
        ),
      };
    case 'DELETE_EMPLOYEE_COMMISSION':
      return {
        ...state,
        employeeCommissions: state.employeeCommissions.filter(comm => comm.id !== action.payload),
      };
    case 'ADD_EMPLOYEE_PAYMENT':
      return { ...state, employeePayments: [...state.employeePayments, action.payload] };
    case 'UPDATE_EMPLOYEE_PAYMENT':
      return {
        ...state,
        employeePayments: state.employeePayments.map(payment =>
          payment.id === action.payload.id ? action.payload : payment
        ),
      };
    case 'DELETE_EMPLOYEE_PAYMENT':
      return {
        ...state,
        employeePayments: state.employeePayments.filter(payment => payment.id !== action.payload),
      };
    case 'ADD_EMPLOYEE_ADVANCE':
      return { ...state, employeeAdvances: [...state.employeeAdvances, action.payload] };
    case 'UPDATE_EMPLOYEE_ADVANCE':
      return {
        ...state,
        employeeAdvances: state.employeeAdvances.map(advance =>
          advance.id === action.payload.id ? action.payload : advance
        ),
      };
    case 'DELETE_EMPLOYEE_ADVANCE':
      return {
        ...state,
        employeeAdvances: state.employeeAdvances.filter(advance => advance.id !== action.payload),
      };
    case 'ADD_EMPLOYEE_OVERTIME':
      return { ...state, employeeOvertimes: [...state.employeeOvertimes, action.payload] };
    case 'UPDATE_EMPLOYEE_OVERTIME':
      return {
        ...state,
        employeeOvertimes: state.employeeOvertimes.map(overtime =>
          overtime.id === action.payload.id ? action.payload : overtime
        ),
      };
    case 'DELETE_EMPLOYEE_OVERTIME':
      return {
        ...state,
        employeeOvertimes: state.employeeOvertimes.filter(overtime => overtime.id !== action.payload),
      };
    case 'UPDATE_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
    case 'ADD_CASH_TRANSACTION':
      return { ...state, cashTransactions: [...state.cashTransactions, action.payload] };
    case 'UPDATE_CASH_TRANSACTION':
      return {
        ...state,
        cashTransactions: state.cashTransactions.map(transaction =>
          transaction.id === action.payload.id ? action.payload : transaction
        ),
      };
    case 'DELETE_CASH_TRANSACTION':
      return {
        ...state,
        cashTransactions: state.cashTransactions.filter(transaction => transaction.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadAllData: () => Promise<void>;
  isSupabaseConfigured: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const isSupabaseConfigured = () => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  };

  const loadAllData = async () => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_ERROR', payload: 'Supabase não está configurado. Configure as variáveis de ambiente.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Load all data in parallel
      const [
        employeesResult,
        salesResult,
        debtsResult,
        checksResult,
        boletosResult,
        commissionsResult,
        paymentsResult,
        advancesResult,
        overtimesResult,
        cashBalanceResult,
        cashTransactionsResult,
      ] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('debts').select('*').order('date', { ascending: false }),
        supabase.from('checks').select('*').order('due_date'),
        supabase.from('boletos').select('*').order('due_date'),
        supabase.from('employee_commissions').select('*').order('date', { ascending: false }),
        supabase.from('employee_payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('employee_advances').select('*').order('date', { ascending: false }),
        supabase.from('employee_overtimes').select('*').order('date', { ascending: false }),
        supabase.from('cash_balances').select('*').limit(1).maybeSingle(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (salesResult.error) throw salesResult.error;
      if (debtsResult.error) throw debtsResult.error;
      if (checksResult.error) throw checksResult.error;
      if (boletosResult.error) throw boletosResult.error;
      if (commissionsResult.error) throw commissionsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (advancesResult.error) throw advancesResult.error;
      if (overtimesResult.error) throw overtimesResult.error;
      if (cashTransactionsResult.error) throw cashTransactionsResult.error;

      // Transform data to match frontend types
      const employees = employeesResult.data.map(emp => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        isSeller: emp.is_seller,
        salary: parseFloat(emp.salary),
        paymentDay: emp.payment_day,
        nextPaymentDate: emp.next_payment_date,
        isActive: emp.is_active,
        hireDate: emp.hire_date,
        observations: emp.observations,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
      }));

      const sales = salesResult.data.map(sale => ({
        id: sale.id,
        date: sale.date,
        deliveryDate: sale.delivery_date,
        client: sale.client,
        sellerId: sale.seller_id,
        products: sale.products,
        observations: sale.observations,
        totalValue: parseFloat(sale.total_value),
        paymentMethods: sale.payment_methods,
        receivedAmount: parseFloat(sale.received_amount),
        pendingAmount: parseFloat(sale.pending_amount),
        status: sale.status,
        paymentDescription: sale.payment_description,
        paymentObservations: sale.payment_observations,
        customCommissionRate: parseFloat(sale.custom_commission_rate),
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
      }));

      const debts = debtsResult.data.map(debt => ({
        id: debt.id,
        date: debt.date,
        description: debt.description,
        company: debt.company,
        totalValue: parseFloat(debt.total_value),
        paymentMethods: debt.payment_methods,
        isPaid: debt.is_paid,
        paidAmount: parseFloat(debt.paid_amount),
        pendingAmount: parseFloat(debt.pending_amount),
        checksUsed: debt.checks_used,
        paymentDescription: debt.payment_description,
        debtPaymentDescription: debt.debt_payment_description,
        createdAt: debt.created_at,
        updatedAt: debt.updated_at,
      }));

      const checks = checksResult.data.map(check => ({
        id: check.id,
        saleId: check.sale_id,
        debtId: check.debt_id,
        client: check.client,
        value: parseFloat(check.value),
        dueDate: check.due_date,
        status: check.status,
        isOwnCheck: check.is_own_check,
        observations: check.observations,
        usedFor: check.used_for,
        installmentNumber: check.installment_number,
        totalInstallments: check.total_installments,
        frontImage: check.front_image,
        backImage: check.back_image,
        selectedAvailableChecks: check.selected_available_checks,
        usedInDebt: check.used_in_debt,
        discountDate: check.discount_date,
        createdAt: check.created_at,
        updatedAt: check.updated_at,
      }));

      const boletos = boletosResult.data.map(boleto => ({
        id: boleto.id,
        saleId: boleto.sale_id,
        client: boleto.client,
        value: parseFloat(boleto.value),
        dueDate: boleto.due_date,
        status: boleto.status,
        installmentNumber: boleto.installment_number,
        totalInstallments: boleto.total_installments,
        boletoFile: boleto.boleto_file,
        observations: boleto.observations,
        createdAt: boleto.created_at,
        updatedAt: boleto.updated_at,
      }));

      const employeeCommissions = commissionsResult.data.map(comm => ({
        id: comm.id,
        employeeId: comm.employee_id,
        saleId: comm.sale_id,
        saleValue: parseFloat(comm.sale_value),
        commissionRate: parseFloat(comm.commission_rate),
        commissionAmount: parseFloat(comm.commission_amount),
        date: comm.date,
        status: comm.status,
        createdAt: comm.created_at,
        updatedAt: comm.updated_at,
      }));

      const employeePayments = paymentsResult.data.map(payment => ({
        id: payment.id,
        employeeId: payment.employee_id,
        amount: parseFloat(payment.amount),
        paymentDate: payment.payment_date,
        isPaid: payment.is_paid,
        receipt: payment.receipt,
        observations: payment.observations,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      }));

      const employeeAdvances = advancesResult.data.map(advance => ({
        id: advance.id,
        employeeId: advance.employee_id,
        amount: parseFloat(advance.amount),
        date: advance.date,
        description: advance.description,
        paymentMethod: advance.payment_method,
        status: advance.status,
        createdAt: advance.created_at,
        updatedAt: advance.updated_at,
      }));

      const employeeOvertimes = overtimesResult.data.map(overtime => ({
        id: overtime.id,
        employeeId: overtime.employee_id,
        hours: parseFloat(overtime.hours),
        hourlyRate: parseFloat(overtime.hourly_rate),
        totalAmount: parseFloat(overtime.total_amount),
        date: overtime.date,
        description: overtime.description,
        status: overtime.status,
        createdAt: overtime.created_at,
        updatedAt: overtime.updated_at,
      }));

      const cashBalance = cashBalanceResult.error ? null : {
        id: cashBalanceResult.data?.id,
        currentBalance: parseFloat(cashBalanceResult.data?.current_balance || '0'),
        initialBalance: parseFloat(cashBalanceResult.data?.initial_balance || '0'),
        initialDate: cashBalanceResult.data?.initial_date || '',
        lastUpdated: cashBalanceResult.data?.last_updated || '',
        createdAt: cashBalanceResult.data?.created_at,
        updatedAt: cashBalanceResult.data?.updated_at,
      } : null;

      const cashTransactions = cashTransactionsResult.data.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        category: transaction.category,
        relatedId: transaction.related_id,
        paymentMethod: transaction.payment_method,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      }));

      // Dispatch all data
      dispatch({ type: 'SET_EMPLOYEES', payload: employees });
      dispatch({ type: 'SET_SALES', payload: sales });
      dispatch({ type: 'SET_DEBTS', payload: debts });
      dispatch({ type: 'SET_CHECKS', payload: checks });
      dispatch({ type: 'SET_BOLETOS', payload: boletos });
      dispatch({ type: 'SET_EMPLOYEE_COMMISSIONS', payload: employeeCommissions });
      dispatch({ type: 'SET_EMPLOYEE_PAYMENTS', payload: employeePayments });
      dispatch({ type: 'SET_EMPLOYEE_ADVANCES', payload: employeeAdvances });
      dispatch({ type: 'SET_EMPLOYEE_OVERTIMES', payload: employeeOvertimes });
      dispatch({ type: 'SET_CASH_BALANCE', payload: cashBalance });
      dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: cashTransactions });

    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar dados: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const value = {
    state,
    dispatch,
    loadAllData,
    isSupabaseConfigured,
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

// Export types for use in other components
export type {
  Employee,
  Sale,
  Debt,
  Check,
  Boleto,
  EmployeeCommission,
  EmployeePayment,
  EmployeeAdvance,
  EmployeeOvertime,
  CashBalance,
  CashTransaction,
  AppState,
};