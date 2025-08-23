import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, PixFee } from '../types';

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
  overdueAction?: 'pago_com_juros' | 'pago_com_multa' | 'pago_integral' | 'protestado' | 'negativado' | 'acordo_realizado' | 'cancelado' | 'perda_total';
  interestAmount?: number;
  penaltyAmount?: number;
  notaryCosts?: number;
  finalAmount?: number;
  overdueNotes?: string;
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

interface PixFee {
  id: string;
  date: string;
  amount: number;
  description: string;
  bank: string;
  transactionType: 'pix_out' | 'pix_in' | 'ted' | 'doc' | 'other';
  relatedTransactionId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AppState {
  user: User | null;
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
  pixFees: [],
  isLoading: false,
  error: null,
};

type AppAction = 
  | { type: 'SET_USER'; payload: User }
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
  | { type: 'DELETE_CASH_TRANSACTION'; payload: string }
  | { type: 'ADD_PIX_FEE'; payload: PixFee }
  | { type: 'UPDATE_PIX_FEE'; payload: PixFee }
  | { type: 'DELETE_PIX_FEE'; payload: string };

const initialState: AppState = {
  user: null,
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
  pixFees: [],
  isLoading: false,
  error: null,
}



function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
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
    case 'SET_PIX_FEES':
      return { ...state, pixFees: action.payload };
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
    case 'ADD_PIX_FEE':
      return { ...state, pixFees: [...state.pixFees, action.payload] };
    case 'UPDATE_PIX_FEE':
      return {
        ...state,
        pixFees: state.pixFees.map(pixFee =>
          pixFee.id === action.payload.id ? action.payload : pixFee
        ),
      };
    case 'DELETE_PIX_FEE':
      return {
        ...state,
        pixFees: state.pixFees.filter(pixFee => pixFee.id !== action.payload),
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
        pixFeesResult,
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
        overdueAction: boleto.overdue_action,
        interestAmount: boleto.interest_amount ? parseFloat(boleto.interest_amount) : 0,
        penaltyAmount: boleto.penalty_amount ? parseFloat(boleto.penalty_amount) : 0,
        notaryCosts: boleto.notary_costs ? parseFloat(boleto.notary_costs) : 0,
        finalAmount: boleto.final_amount ? parseFloat(boleto.final_amount) : parseFloat(boleto.value),
        overdueNotes: boleto.overdue_notes,
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
      };

      const finalCashBalance = cashBalance && cashBalance.id ? cashBalance : null;

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

      // Load PIX fees separately with error handling
      let pixFees = [];
      try {
        const pixFeesResult = await supabase.from('pix_fees').select('*').order('date', { ascending: false });
        if (pixFeesResult.error) {
          console.warn('PIX fees table not found, skipping:', pixFeesResult.error.message);
        } else {
          pixFees = pixFeesResult.data.map(pixFee => ({
            id: pixFee.id,
            date: pixFee.date,
            amount: parseFloat(pixFee.amount),
            description: pixFee.description,
            bank: pixFee.bank,
            transactionType: pixFee.transaction_type,
            relatedTransactionId: pixFee.related_transaction_id,
            createdAt: pixFee.created_at,
            updatedAt: pixFee.updated_at,
          }));
        }
      } catch (pixError) {
        console.warn('Error loading PIX fees:', pixError);
      }

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
      dispatch({ type: 'SET_CASH_BALANCE', payload: finalCashBalance });
      dispatch({ type: 'SET_CASH_TRANSACTIONS', payload: cashTransactions });
      dispatch({ type: 'SET_PIX_FEES', payload: pixFees });

    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar dados: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // CRUD operations for employees
  const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        name: employee.name,
        position: employee.position,
        is_seller: employee.isSeller,
        salary: employee.salary,
        payment_day: employee.paymentDay,
        next_payment_date: employee.nextPaymentDate,
        is_active: employee.isActive,
        hire_date: employee.hireDate,
        observations: employee.observations || ''
      }])
      .select()
      .single();

    if (error) throw error;

    const newEmployee = {
      id: data.id,
      name: data.name,
      position: data.position,
      isSeller: data.is_seller,
      salary: parseFloat(data.salary),
      paymentDay: data.payment_day,
      nextPaymentDate: data.next_payment_date,
      isActive: data.is_active,
      hireDate: data.hire_date,
      observations: data.observations || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
    return newEmployee;
  };

  const updateEmployee = async (employee: Employee): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .update({
        name: employee.name,
        position: employee.position,
        is_seller: employee.isSeller,
        salary: employee.salary,
        payment_day: employee.paymentDay,
        next_payment_date: employee.nextPaymentDate,
        is_active: employee.isActive,
        hire_date: employee.hireDate,
        observations: employee.observations || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)
      .select()
      .single();

    if (error) throw error;

    const updatedEmployee = {
      id: data.id,
      name: data.name,
      position: data.position,
      isSeller: data.is_seller,
      salary: parseFloat(data.salary),
      paymentDay: data.payment_day,
      nextPaymentDate: data.next_payment_date,
      isActive: data.is_active,
      hireDate: data.hire_date,
      observations: data.observations || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
    return updatedEmployee;
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
  };

  // CRUD operations for sales
  const createSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
    const { data, error } = await supabase
      .from('sales')
      .insert([{
        date: sale.date,
        delivery_date: sale.deliveryDate,
        client: sale.client,
        seller_id: sale.sellerId,
        custom_commission_rate: sale.customCommissionRate || 5,
        products: sale.products,
        observations: sale.observations || '',
        total_value: sale.totalValue,
        payment_methods: sale.paymentMethods,
        received_amount: sale.receivedAmount,
        pending_amount: sale.pendingAmount,
        status: sale.status,
        payment_description: sale.paymentDescription || '',
        payment_observations: sale.paymentObservations || ''
      }])
      .select()
      .single();

    if (error) throw error;

    const newSale = {
      id: data.id,
      date: data.date,
      deliveryDate: data.delivery_date,
      client: data.client,
      sellerId: data.seller_id,
      products: data.products,
      observations: data.observations || '',
      totalValue: parseFloat(data.total_value),
      paymentMethods: data.payment_methods,
      receivedAmount: parseFloat(data.received_amount),
      pendingAmount: parseFloat(data.pending_amount),
      status: data.status,
      paymentDescription: data.payment_description || '',
      paymentObservations: data.payment_observations || '',
      customCommissionRate: parseFloat(data.custom_commission_rate),
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_SALE', payload: newSale });
    return newSale;
  };

  const updateSale = async (sale: Sale): Promise<Sale> => {
    const { data, error } = await supabase
      .from('sales')
      .update({
        date: sale.date,
        delivery_date: sale.deliveryDate,
        client: sale.client,
        seller_id: sale.sellerId,
        custom_commission_rate: sale.customCommissionRate || 5,
        products: sale.products,
        observations: sale.observations || '',
        total_value: sale.totalValue,
        payment_methods: sale.paymentMethods,
        received_amount: sale.receivedAmount,
        pending_amount: sale.pendingAmount,
        status: sale.status,
        payment_description: sale.paymentDescription || '',
        payment_observations: sale.paymentObservations || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', sale.id)
      .select()
      .single();

    if (error) throw error;

    const updatedSale = {
      id: data.id,
      date: data.date,
      deliveryDate: data.delivery_date,
      client: data.client,
      sellerId: data.seller_id,
      products: data.products,
      observations: data.observations || '',
      totalValue: parseFloat(data.total_value),
      paymentMethods: data.payment_methods,
      receivedAmount: parseFloat(data.received_amount),
      pendingAmount: parseFloat(data.pending_amount),
      status: data.status,
      paymentDescription: data.payment_description || '',
      paymentObservations: data.payment_observations || '',
      customCommissionRate: parseFloat(data.custom_commission_rate),
      createdAt: data.created_at
    };

    dispatch({ type: 'UPDATE_SALE', payload: updatedSale });
    return updatedSale;
  };

  const deleteSale = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_SALE', payload: id });
  };

  // CRUD operations for debts
  const createDebt = async (debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> => {
    const { data, error } = await supabase
      .from('debts')
      .insert([{
        date: debt.date,
        description: debt.description || '',
        company: debt.company || '',
        total_value: debt.totalValue,
        payment_methods: debt.paymentMethods,
        is_paid: debt.isPaid,
        paid_amount: debt.paidAmount,
        pending_amount: debt.pendingAmount,
        checks_used: debt.checksUsed,
        payment_description: debt.paymentDescription || '',
        debt_payment_description: debt.debtPaymentDescription || ''
      }])
      .select()
      .single();

    if (error) throw error;

    const newDebt = {
      id: data.id,
      date: data.date,
      description: data.description || '',
      company: data.company || '',
      totalValue: parseFloat(data.total_value),
      paymentMethods: data.payment_methods,
      isPaid: data.is_paid,
      paidAmount: parseFloat(data.paid_amount),
      pendingAmount: parseFloat(data.pending_amount),
      checksUsed: data.checks_used,
      paymentDescription: data.payment_description || '',
      debtPaymentDescription: data.debt_payment_description || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_DEBT', payload: newDebt });
    return newDebt;
  };

  const updateDebt = async (debt: Debt): Promise<Debt> => {
    const { data, error } = await supabase
      .from('debts')
      .update({
        date: debt.date,
        description: debt.description || '',
        company: debt.company || '',
        total_value: debt.totalValue,
        payment_methods: debt.paymentMethods,
        is_paid: debt.isPaid,
        paid_amount: debt.paidAmount,
        pending_amount: debt.pendingAmount,
        checks_used: debt.checksUsed,
        payment_description: debt.paymentDescription || '',
        debt_payment_description: debt.debtPaymentDescription || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', debt.id)
      .select()
      .single();

    if (error) throw error;

    const updatedDebt = {
      id: data.id,
      date: data.date,
      description: data.description || '',
      company: data.company || '',
      totalValue: parseFloat(data.total_value),
      paymentMethods: data.payment_methods,
      isPaid: data.is_paid,
      paidAmount: parseFloat(data.paid_amount),
      pendingAmount: parseFloat(data.pending_amount),
      checksUsed: data.checks_used,
      paymentDescription: data.payment_description || '',
      debtPaymentDescription: data.debt_payment_description || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
    return updatedDebt;
  };

  const deleteDebt = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_DEBT', payload: id });
  };

  // CRUD operations for checks
  const createCheck = async (check: Omit<Check, 'id' | 'createdAt'>): Promise<Check> => {
    const { data, error } = await supabase
      .from('checks')
      .insert([{
        sale_id: check.saleId,
        debt_id: check.debtId,
        client: check.client,
        value: check.value,
        due_date: check.dueDate,
        status: check.status,
        is_own_check: check.isOwnCheck,
        observations: check.observations || '',
        used_for: check.usedFor || '',
        installment_number: check.installmentNumber,
        total_installments: check.totalInstallments,
        front_image: check.frontImage || '',
        back_image: check.backImage || '',
        selected_available_checks: check.selectedAvailableChecks,
        used_in_debt: check.usedInDebt,
        discount_date: check.discountDate
      }])
      .select()
      .single();

    if (error) throw error;

    const newCheck = {
      id: data.id,
      saleId: data.sale_id,
      debtId: data.debt_id,
      client: data.client,
      value: parseFloat(data.value),
      dueDate: data.due_date,
      status: data.status,
      isOwnCheck: data.is_own_check,
      observations: data.observations || '',
      usedFor: data.used_for || '',
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      frontImage: data.front_image || '',
      backImage: data.back_image || '',
      selectedAvailableChecks: data.selected_available_checks,
      usedInDebt: data.used_in_debt,
      discountDate: data.discount_date,
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_CHECK', payload: newCheck });
    return newCheck;
  };

  const updateCheck = async (check: Check): Promise<Check> => {
    const { data, error } = await supabase
      .from('checks')
      .update({
        sale_id: check.saleId,
        debt_id: check.debtId,
        client: check.client,
        value: check.value,
        due_date: check.dueDate,
        status: check.status,
        is_own_check: check.isOwnCheck,
        observations: check.observations || '',
        used_for: check.usedFor || '',
        installment_number: check.installmentNumber,
        total_installments: check.totalInstallments,
        front_image: check.frontImage || '',
        back_image: check.backImage || '',
        selected_available_checks: check.selectedAvailableChecks,
        used_in_debt: check.usedInDebt,
        discount_date: check.discountDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', check.id)
      .select()
      .single();

    if (error) throw error;

    const updatedCheck = {
      id: data.id,
      saleId: data.sale_id,
      debtId: data.debt_id,
      client: data.client,
      value: parseFloat(data.value),
      dueDate: data.due_date,
      status: data.status,
      isOwnCheck: data.is_own_check,
      observations: data.observations || '',
      usedFor: data.used_for || '',
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      frontImage: data.front_image || '',
      backImage: data.back_image || '',
      selectedAvailableChecks: data.selected_available_checks,
      usedInDebt: data.used_in_debt,
      discountDate: data.discount_date,
      createdAt: data.created_at
    };

    dispatch({ type: 'UPDATE_CHECK', payload: updatedCheck });
    return updatedCheck;
  };

  const deleteCheck = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('checks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_CHECK', payload: id });
  };

  // CRUD operations for boletos
  const createBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto> => {
    const { data, error } = await supabase
      .from('boletos')
      .insert([{
        sale_id: boleto.saleId || null,
        client: boleto.client,
        value: boleto.value,
        due_date: boleto.dueDate,
        status: boleto.status,
        installment_number: boleto.installmentNumber,
        total_installments: boleto.totalInstallments,
        boleto_file: boleto.boletoFile || '',
        observations: boleto.observations || '',
        overdue_action: boleto.overdueAction || null,
        interest_amount: boleto.interestAmount || 0,
        penalty_amount: boleto.penaltyAmount || 0,
        notary_costs: boleto.notaryCosts || 0,
        final_amount: boleto.finalAmount || boleto.value,
        overdue_notes: boleto.overdueNotes || ''
      }])
      .select()
      .single();

    if (error) throw error;

    const newBoleto = {
      id: data.id,
      saleId: data.sale_id,
      client: data.client,
      value: parseFloat(data.value),
      dueDate: data.due_date,
      status: data.status,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      boletoFile: data.boleto_file || '',
      observations: data.observations || '',
      overdueAction: data.overdue_action,
      interestAmount: data.interest_amount ? parseFloat(data.interest_amount) : 0,
      penaltyAmount: data.penalty_amount ? parseFloat(data.penalty_amount) : 0,
      notaryCosts: data.notary_costs ? parseFloat(data.notary_costs) : 0,
      finalAmount: data.final_amount ? parseFloat(data.final_amount) : parseFloat(data.value),
      overdueNotes: data.overdue_notes || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_BOLETO', payload: newBoleto });
    return newBoleto;
  };

  const updateBoleto = async (boleto: Boleto): Promise<Boleto> => {
    const { data, error } = await supabase
      .from('boletos')
      .update({
        sale_id: boleto.saleId || null,
        client: boleto.client,
        value: boleto.value,
        due_date: boleto.dueDate,
        status: boleto.status,
        installment_number: boleto.installmentNumber,
        total_installments: boleto.totalInstallments,
        boleto_file: boleto.boletoFile || '',
        observations: boleto.observations || '',
        overdue_action: boleto.overdueAction || null,
        interest_amount: boleto.interestAmount || 0,
        penalty_amount: boleto.penaltyAmount || 0,
        notary_costs: boleto.notaryCosts || 0,
        final_amount: boleto.finalAmount || boleto.value,
        overdue_notes: boleto.overdueNotes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', boleto.id)
      .select()
      .single();

    if (error) throw error;

    const updatedBoleto = {
      id: data.id,
      saleId: data.sale_id,
      client: data.client,
      value: parseFloat(data.value),
      dueDate: data.due_date,
      status: data.status,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      boletoFile: data.boleto_file || '',
      observations: data.observations || '',
      overdueAction: data.overdue_action,
      interestAmount: data.interest_amount ? parseFloat(data.interest_amount) : 0,
      penaltyAmount: data.penalty_amount ? parseFloat(data.penalty_amount) : 0,
      notaryCosts: data.notary_costs ? parseFloat(data.notary_costs) : 0,
      finalAmount: data.final_amount ? parseFloat(data.final_amount) : parseFloat(data.value),
      overdueNotes: data.overdue_notes || '',
      createdAt: data.created_at
    };

    dispatch({ type: 'UPDATE_BOLETO', payload: updatedBoleto });
    return updatedBoleto;
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_BOLETO', payload: id });
  };

  // Cash management
  const initializeCashBalance = async (initialAmount: number): Promise<void> => {
    const { data, error } = await supabase
      .from('cash_balances')
      .insert([{
        current_balance: initialAmount,
        initial_balance: initialAmount,
        initial_date: new Date().toISOString().split('T')[0],
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    const newBalance = {
      id: data.id,
      currentBalance: parseFloat(data.current_balance),
      initialBalance: parseFloat(data.initial_balance),
      initialDate: data.initial_date,
      lastUpdated: data.last_updated,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    dispatch({ type: 'UPDATE_CASH_BALANCE', payload: newBalance });
  };

  const updateCashBalance = async (balance: CashBalance): Promise<void> => {
    const { data, error } = await supabase
      .from('cash_balances')
      .update({
        current_balance: balance.currentBalance,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', balance.id)
      .select()
      .single();

    if (error) throw error;

    const updatedBalance = {
      id: data.id,
      currentBalance: parseFloat(data.current_balance),
      initialBalance: parseFloat(data.initial_balance),
      initialDate: data.initial_date,
      lastUpdated: data.last_updated,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    dispatch({ type: 'UPDATE_CASH_BALANCE', payload: updatedBalance });
  };

  // CRUD operations for PIX fees
  const createPixFee = async (pixFee: Omit<PixFee, 'id' | 'createdAt'>): Promise<PixFee> => {
    const { data, error } = await supabase
      .from('pix_fees')
      .insert([{
        date: pixFee.date,
        amount: pixFee.amount,
        description: pixFee.description,
        bank: pixFee.bank,
        transaction_type: pixFee.transactionType,
        related_transaction_id: pixFee.relatedTransactionId
      }])
      .select()
      .single();

    if (error) throw error;

    const newPixFee = {
      id: data.id,
      date: data.date,
      amount: parseFloat(data.amount),
      description: data.description,
      bank: data.bank,
      transactionType: data.transaction_type,
      relatedTransactionId: data.related_transaction_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    dispatch({ type: 'ADD_PIX_FEE', payload: newPixFee });
    
    // Criar transação de caixa para a tarifa PIX (saída)
    await createCashTransaction({
      date: pixFee.date,
      type: 'saida',
      amount: pixFee.amount,
      description: `Tarifa PIX - ${pixFee.bank}: ${pixFee.description}`,
      category: 'outro',
      relatedId: newPixFee.id,
      paymentMethod: 'pix'
    });
    
    return newPixFee;
  };

  const updatePixFee = async (pixFee: PixFee): Promise<PixFee> => {
    const { data, error } = await supabase
      .from('pix_fees')
      .update({
        date: pixFee.date,
        amount: pixFee.amount,
        description: pixFee.description,
        bank: pixFee.bank,
        transaction_type: pixFee.transactionType,
        related_transaction_id: pixFee.relatedTransactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', pixFee.id)
      .select()
      .single();

    if (error) throw error;

    const updatedPixFee = {
      id: data.id,
      date: data.date,
      amount: parseFloat(data.amount),
      description: data.description,
      bank: data.bank,
      transactionType: data.transaction_type,
      relatedTransactionId: data.related_transaction_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    dispatch({ type: 'UPDATE_PIX_FEE', payload: updatedPixFee });
    return updatedPixFee;
  };

  const deletePixFee = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('pix_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    dispatch({ type: 'DELETE_PIX_FEE', payload: id });
  };

  // Criar transação de caixa
  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt'>): Promise<void> => {
    const { data, error } = await supabase
      .from('cash_transactions')
      .insert([{
        date: transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        related_id: transaction.relatedId,
        payment_method: transaction.paymentMethod
      }])
      .select()
      .single();

    if (error) throw error;

    const newTransaction = {
      id: data.id,
      date: data.date,
      type: data.type,
      amount: parseFloat(data.amount),
      description: data.description,
      category: data.category,
      relatedId: data.related_id,
      paymentMethod: data.payment_method,
      createdAt: data.created_at
    };

    dispatch({ type: 'ADD_CASH_TRANSACTION', payload: newTransaction });
    
    // Atualizar saldo do caixa
    if (state.cashBalance) {
      const newBalance = transaction.type === 'entrada' 
        ? state.cashBalance.currentBalance + transaction.amount
        : state.cashBalance.currentBalance - transaction.amount;
      
      await updateCashBalance({
        ...state.cashBalance,
        currentBalance: newBalance,
        lastUpdated: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const value = {
    state,
    dispatch,
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
    createCashTransaction,
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
  PixFee,
  AppState,
};