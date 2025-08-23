import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Sale, Debt, Check, Installment, Product, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Boleto, CashFlow, CashBalance, ThirdPartyCheck, CashTransaction } from '../types';
import { supabase, salesService, debtsService, employeesService, checksService, boletosService, isSupabaseConfigured, ensureAuthenticated, testSupabaseConnection } from '../lib/supabase';
import { AutomationService } from '../lib/automationService';

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
  cashFlow: CashFlow[];
  cashBalance: CashBalance | null;
  thirdPartyChecks: ThirdPartyCheck[];
  cashTransactions: CashTransaction[];
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
  | { type: 'SET_CASH_FLOW'; payload: CashFlow[] }
  | { type: 'ADD_CASH_FLOW'; payload: CashFlow }
  | { type: 'SET_CASH_BALANCE'; payload: CashBalance }
  | { type: 'UPDATE_CASH_BALANCE'; payload: CashBalance }
  | { type: 'SET_THIRD_PARTY_CHECKS'; payload: ThirdPartyCheck[] }
  | { type: 'ADD_THIRD_PARTY_CHECK'; payload: ThirdPartyCheck }
  | { type: 'SET_CASH_TRANSACTIONS'; payload: CashTransaction[] }
  | { type: 'ADD_CASH_TRANSACTION'; payload: CashTransaction }
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
  | { type: 'SET_EMPLOYEE_PAYMENTS'; payload: EmployeePayment[] }
  | { type: 'SET_EMPLOYEE_ADVANCES'; payload: EmployeeAdvance[] }
  | { type: 'SET_EMPLOYEE_OVERTIMES'; payload: EmployeeOvertime[] }
  | { type: 'SET_EMPLOYEE_COMMISSIONS'; payload: EmployeeCommission[] }
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
  cashFlow: [],
  cashBalance: null,
  thirdPartyChecks: [],
  cashTransactions: [],
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
      
    case 'SET_EMPLOYEE_PAYMENTS':
      return { ...state, employeePayments: action.payload };
      
    case 'SET_EMPLOYEE_ADVANCES':
      return { ...state, employeeAdvances: action.payload };
      
    case 'SET_EMPLOYEE_OVERTIMES':
      return { ...state, employeeOvertimes: action.payload };
      
    case 'SET_EMPLOYEE_COMMISSIONS':
      return { ...state, employeeCommissions: action.payload };
      
    case 'SET_CASH_FLOW':
      return { ...state, cashFlow: action.payload };
      
    case 'ADD_CASH_FLOW':
      return { ...state, cashFlow: [...state.cashFlow, action.payload] };
      
    case 'SET_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
      
    case 'UPDATE_CASH_BALANCE':
      return { ...state, cashBalance: action.payload };
      
    case 'SET_THIRD_PARTY_CHECKS':
      return { ...state, thirdPartyChecks: action.payload };
      
    case 'ADD_THIRD_PARTY_CHECK':
      return { ...state, thirdPartyChecks: [...state.thirdPartyChecks, action.payload] };
      
    case 'SET_CASH_TRANSACTIONS':
      return { ...state, cashTransactions: action.payload };
      
    case 'ADD_CASH_TRANSACTION':
      return { ...state, cashTransactions: [...state.cashTransactions, action.payload] };
      
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
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<void>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<void>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  initializeCashBalance: (initialBalance: number) => Promise<void>;
  updateCashBalance: (amount: number, type: 'entrada' | 'saida', description: string, category: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar comissões de funcionários
  const loadEmployeeCommissions = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar comissões:', error);
        return;
      }
      
      const commissions = (data || []).map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        saleId: item.sale_id,
        saleValue: Number(item.sale_value) || 0,
        commissionRate: Number(item.commission_rate) || 5,
        commissionAmount: Number(item.commission_amount) || 0,
        date: item.date,
        status: item.status || 'pendente',
        createdAt: item.created_at
      }));
      
      dispatch({ type: 'SET_EMPLOYEE_COMMISSIONS', payload: commissions });
      console.log('✅ Comissões carregadas:', commissions.length);
    } catch (error) {
      console.error('❌ Erro ao carregar comissões:', error);
    }
  };

  // Carregar pagamentos de funcionários
  const loadEmployeePayments = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        return;
      }
      
      const payments = (data || []).map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        amount: Number(item.amount) || 0,
        paymentDate: item.payment_date,
        isPaid: item.is_paid || false,
        receipt: item.receipt || '',
        observations: item.observations || '',
        createdAt: item.created_at
      }));
      
      dispatch({ type: 'SET_EMPLOYEE_PAYMENTS', payload: payments });
      console.log('✅ Pagamentos carregados:', payments.length);
    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos:', error);
    }
  };

  // Carregar adiantamentos de funcionários
  const loadEmployeeAdvances = async () => {
    if (!isSupabaseConfigured()) return;
    
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar adiantamentos:', error);
        return;
      }
      
      const advances = (data || []).map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        amount: Number(item.amount) || 0,
        date: item.date,
        description: item.description || '',
        paymentMethod: item.payment_method || 'dinheiro',
        status: item.status || 'pendente',
        createdAt: item.created_at
      }));
      
      dispatch({ type: 'SET_EMPLOYEE_ADVANCES', payload: advances });
      console.log('✅ Adiantamentos carregados:', advances.length);
    } catch (error) {
      console.error('❌ Erro ao carregar adiantamentos:', error);
    }
  };

  // Carregar horas extras de funcionários
  const loadEmployeeOvertimes = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar horas extras:', error);
        return;
      }
      
      const overtimes = (data || []).map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        hours: Number(item.hours) || 0,
        hourlyRate: Number(item.hourly_rate) || 0,
        totalAmount: Number(item.total_amount) || 0,
        date: item.date,
        description: item.description || '',
        status: item.status || 'pendente',
        createdAt: item.created_at
      }));
      
      dispatch({ type: 'SET_EMPLOYEE_OVERTIMES', payload: overtimes });
      console.log('✅ Horas extras carregadas:', overtimes.length);
    } catch (error) {
      console.error('❌ Erro ao carregar horas extras:', error);
    }
  };
  // Load all data from Supabase
  const loadAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    // Verificar configuração do Supabase
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_ERROR', payload: 'Supabase não está configurado. Configure o arquivo .env com suas credenciais reais.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Testar conexão
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
      dispatch({ type: 'SET_ERROR', payload: 'Não foi possível conectar ao Supabase. Verifique suas credenciais e conexão com a internet.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Garantir autenticação
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      dispatch({ type: 'SET_ERROR', payload: 'Não foi possível autenticar. Verifique suas credenciais do Supabase.' });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    try {
      console.log('🔄 Carregando dados do Supabase...');
      
      const [sales, debts, employees, checks, boletos] = await Promise.allSettled([
        salesService.getAll(),
        debtsService.getAll(),
        employeesService.getAll(),
        checksService.getAll(),
        boletosService.getAll()
      ]);
      
      // Processar resultados de forma segura
      if (sales.status === 'fulfilled') {
        dispatch({ type: 'SET_SALES', payload: sales.value });
      } else {
        console.error('❌ Erro ao carregar vendas:', sales.reason);
      }
      
      if (debts.status === 'fulfilled') {
        dispatch({ type: 'SET_DEBTS', payload: debts.value });
      } else {
        console.error('❌ Erro ao carregar dívidas:', debts.reason);
      }
      
      if (employees.status === 'fulfilled') {
        dispatch({ type: 'SET_EMPLOYEES', payload: employees.value });
      } else {
        console.error('❌ Erro ao carregar funcionários:', employees.reason);
      }
      
      if (checks.status === 'fulfilled') {
        dispatch({ type: 'SET_CHECKS', payload: checks.value });
      } else {
        console.error('❌ Erro ao carregar cheques:', checks.reason);
      }
      
      if (boletos.status === 'fulfilled') {
        dispatch({ type: 'SET_BOLETOS', payload: boletos.value });
      } else {
        console.error('❌ Erro ao carregar boletos:', boletos.reason);
      }
      
      // Carregar dados adicionais
      await Promise.allSettled([
        loadEmployeeCommissions(),
        loadEmployeePayments(),
        loadEmployeeAdvances(),
        loadEmployeeOvertimes()
      ]);
      
      console.log('✅ Dados carregados do Supabase:', {
        sales: sales.status === 'fulfilled' ? sales.value.length : 0,
        debts: debts.status === 'fulfilled' ? debts.value.length : 0,
        employees: employees.status === 'fulfilled' ? employees.value.length : 0,
        checks: checks.status === 'fulfilled' ? checks.value.length : 0,
        boletos: boletos.status === 'fulfilled' ? boletos.value.length : 0
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar dados: ${errorMessage}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sales operations
  const createSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const sale = await salesService.create(saleData);
      dispatch({ type: 'ADD_SALE', payload: sale });
      
      // Criar comissão automaticamente se vendedor foi selecionado
      if (sale.sellerId) {
        const seller = state.employees.find(e => e.id === sale.sellerId);
        if (seller && seller.isSeller) {
          try {
            const commissionRate = saleData.customCommissionRate || 5;
            const commissionAmount = (sale.totalValue * commissionRate) / 100;
            
            const commissionData = {
              employee_id: sale.sellerId,
              sale_id: sale.id,
              sale_value: sale.totalValue,
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              date: sale.date,
              status: 'pendente'
            };
            
            const { data: commissionResult, error: commissionError } = await supabase
              .from('employee_commissions')
              .insert([commissionData])
              .select()
              .single();
            
            if (commissionError) {
              console.error('❌ Erro ao criar comissão:', commissionError);
            } else {
              const newCommission = {
                id: commissionResult.id,
                employeeId: commissionResult.employee_id,
                saleId: commissionResult.sale_id,
                saleValue: Number(commissionResult.sale_value),
                commissionRate: Number(commissionResult.commission_rate),
                commissionAmount: Number(commissionResult.commission_amount),
                date: commissionResult.date,
                status: commissionResult.status,
                createdAt: commissionResult.created_at
              };
              
              dispatch({ type: 'ADD_EMPLOYEE_COMMISSION', payload: newCommission });
              console.log('✅ Comissão criada automaticamente:', newCommission.id);
            }
          } catch (error) {
            console.error('❌ Erro ao processar comissão:', error);
          }
        }
      }
      
      // Criar cheques automaticamente se houver pagamento em cheque
      const hasCheckPayment = sale.paymentMethods.some(method => method.type === 'cheque');
      if (hasCheckPayment) {
        await AutomationService.createChecksForSale(sale);
        // Recarregar cheques
        const checks = await checksService.getAll();
        dispatch({ type: 'SET_CHECKS', payload: checks });
      }
      
      // Criar boletos automaticamente se houver pagamento em boleto
      const hasBoletoPayment = sale.paymentMethods.some(method => method.type === 'boleto');
      if (hasBoletoPayment) {
        await AutomationService.createBoletosForSale(sale);
        // Recarregar boletos
        const boletos = await boletosService.getAll();
        dispatch({ type: 'SET_BOLETOS', payload: boletos });
      }
      
      // Create commission if seller is assigned
      if (sale.sellerId) {
        const seller = state.employees.find(e => e.id === sale.sellerId);
        if (seller && seller.isSeller) {
          // Comissão já foi criada acima
          console.log('✅ Comissão processada para vendedor:', seller.name);
        }
      }
      
      console.log('✅ Venda criada no Supabase:', sale.id);
    } catch (error) {
      console.error('❌ Erro ao criar venda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar venda. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSale = async (sale: Sale) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedSale = await salesService.update(sale);
      dispatch({ type: 'UPDATE_SALE', payload: updatedSale });
      
      // Atualizar cheques e boletos automaticamente
      const hasCheckPayment = sale.paymentMethods.some(method => method.type === 'cheque');
      if (hasCheckPayment) {
        await AutomationService.updateChecksForSale(sale, state.checks);
        const checks = await checksService.getAll();
        dispatch({ type: 'SET_CHECKS', payload: checks });
      }
      
      const hasBoletoPayment = sale.paymentMethods.some(method => method.type === 'boleto');
      if (hasBoletoPayment) {
        await AutomationService.updateBoletosForSale(sale, state.boletos);
        const boletos = await boletosService.getAll();
        dispatch({ type: 'SET_BOLETOS', payload: boletos });
      }
      
      console.log('✅ Venda atualizada no Supabase:', sale.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar venda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar venda. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteSale = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await salesService.delete(id);
      dispatch({ type: 'DELETE_SALE', payload: id });
      console.log('✅ Venda excluída do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir venda:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir venda. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Debts operations
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const debt = await debtsService.create(debtData);
      dispatch({ type: 'ADD_DEBT', payload: debt });
      console.log('✅ Dívida criada no Supabase:', debt.id);
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar dívida. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateDebt = async (debt: Debt) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedDebt = await debtsService.update(debt);
      dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
      console.log('✅ Dívida atualizada no Supabase:', debt.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar dívida. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await debtsService.delete(id);
      dispatch({ type: 'DELETE_DEBT', payload: id });
      console.log('✅ Dívida excluída do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir dívida:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir dívida. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Employees operations
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const employee = await employeesService.create(employeeData);
      dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
      console.log('✅ Funcionário criado no Supabase:', employee.id);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar funcionário. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateEmployee = async (employee: Employee) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedEmployee = await employeesService.update(employee);
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });
      console.log('✅ Funcionário atualizado no Supabase:', employee.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar funcionário. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await employeesService.delete(id);
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
      console.log('✅ Funcionário excluído do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir funcionário:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir funcionário. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Checks operations
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const check = await checksService.create(checkData);
      dispatch({ type: 'ADD_CHECK', payload: check });
      console.log('✅ Cheque criado no Supabase:', check.id);
    } catch (error) {
      console.error('❌ Erro ao criar cheque:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar cheque. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCheck = async (check: Check) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCheck = await checksService.update(check);
      dispatch({ type: 'UPDATE_CHECK', payload: updatedCheck });
      console.log('✅ Cheque atualizado no Supabase:', check.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar cheque:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar cheque. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteCheck = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await checksService.delete(id);
      dispatch({ type: 'DELETE_CHECK', payload: id });
      console.log('✅ Cheque excluído do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir cheque:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir cheque. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Boletos operations
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const boleto = await boletosService.create(boletoData);
      dispatch({ type: 'ADD_BOLETO', payload: boleto });
      console.log('✅ Boleto criado no Supabase:', boleto.id);
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar boleto. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateBoleto = async (boleto: Boleto) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedBoleto = await boletosService.update(boleto);
      dispatch({ type: 'UPDATE_BOLETO', payload: updatedBoleto });
      console.log('✅ Boleto atualizado no Supabase:', boleto.id);
    } catch (error) {
      console.error('❌ Erro ao atualizar boleto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar boleto. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteBoleto = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await boletosService.delete(id);
      dispatch({ type: 'DELETE_BOLETO', payload: id });
      console.log('✅ Boleto excluído do Supabase:', id);
    } catch (error) {
      console.error('❌ Erro ao excluir boleto:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir boleto. Tente novamente.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Cash operations
  const initializeCashBalance = async (initialBalance: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (!isSupabaseConfigured()) {
        // Para desenvolvimento sem Supabase, usar estado local
        const cashBalance = {
          id: 'main-cash-balance',
          currentBalance: initialBalance,
          lastUpdated: new Date().toISOString(),
          initialBalance: initialBalance,
          initialDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        dispatch({ type: 'SET_CASH_BALANCE', payload: cashBalance });
        console.log('✅ Saldo inicial do caixa definido (modo local):', initialBalance);
        return;
      }
      
      const cashBalance = {
        id: 'main-cash-balance',
        currentBalance: initialBalance,
        lastUpdated: new Date().toISOString(),
        initialBalance: initialBalance,
        initialDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // TODO: Save to database
      dispatch({ type: 'SET_CASH_BALANCE', payload: cashBalance });
      
      console.log('✅ Saldo inicial do caixa definido:', initialBalance);
    } catch (error) {
      console.error('❌ Erro ao inicializar saldo do caixa:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCashBalance = async (amount: number, type: 'entrada' | 'saida', description: string, category: string) => {
    try {
      const currentBalance = state.cashBalance?.currentBalance || 0;
      const newBalance = type === 'entrada' ? currentBalance + amount : currentBalance - amount;
      
      const updatedCashBalance = {
        ...state.cashBalance!,
        currentBalance: newBalance,
        lastUpdated: new Date().toISOString()
      };
      
      const transaction: CashTransaction = {
        id: `transaction-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type,
        amount,
        description,
        category: category as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dispatch({ type: 'UPDATE_CASH_BALANCE', payload: updatedCashBalance });
      dispatch({ type: 'ADD_CASH_TRANSACTION', payload: transaction });
      
      console.log('✅ Saldo do caixa atualizado:', newBalance);
    } catch (error) {
      console.error('❌ Erro ao atualizar saldo do caixa:', error);
      throw error;
    }
  };

  // Load data on mount and set up real-time subscriptions
  useEffect(() => {
    console.log('🔄 Inicializando AppContext...');
    
    // Inicializar saldo de caixa padrão se não existir
    if (!state.cashBalance && !state.isLoading) {
      const defaultCashBalance = {
        id: 'main-cash-balance',
        currentBalance: 0,
        lastUpdated: new Date().toISOString(),
        initialBalance: 0,
        initialDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'SET_CASH_BALANCE', payload: defaultCashBalance });
    }
    
    // Carregar dados apenas se Supabase estiver configurado
    if (isSupabaseConfigured()) {
      console.log('✅ Supabase configurado, carregando dados...');
      loadAllData();
    } else {
      console.warn('⚠️ Supabase não configurado, usando modo offline');
      dispatch({ type: 'SET_ERROR', payload: 'Configure o Supabase no arquivo .env para usar o sistema.' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Set up real-time subscriptions apenas se configurado
    let salesSubscription: any;
    let debtsSubscription: any;
    let employeesSubscription: any;
    let checksSubscription: any;
    let boletosSubscription: any;

    if (isSupabaseConfigured()) {
      salesSubscription = supabase
        .channel('sales-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela sales, recarregando...');
          console.log('Payload:', payload);
          salesService.getAll().then(sales => dispatch({ type: 'SET_SALES', payload: sales })).catch(console.error);
        })
        .subscribe();

      debtsSubscription = supabase
        .channel('debts-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela debts, recarregando...');
          console.log('Payload:', payload);
          debtsService.getAll().then(debts => dispatch({ type: 'SET_DEBTS', payload: debts })).catch(console.error);
        })
        .subscribe();

      employeesSubscription = supabase
        .channel('employees-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela employees, recarregando...');
          console.log('Payload:', payload);
          employeesService.getAll().then(employees => dispatch({ type: 'SET_EMPLOYEES', payload: employees })).catch(console.error);
        })
        .subscribe();

      checksSubscription = supabase
        .channel('checks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checks' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela checks, recarregando...');
          console.log('Payload:', payload);
          checksService.getAll().then(checks => dispatch({ type: 'SET_CHECKS', payload: checks })).catch(console.error);
        })
        .subscribe();

      boletosSubscription = supabase
        .channel('boletos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'boletos' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela boletos, recarregando...');
          console.log('Payload:', payload);
          boletosService.getAll().then(boletos => dispatch({ type: 'SET_BOLETOS', payload: boletos })).catch(console.error);
        })
        .subscribe();
      
      // Subscription para comissões
      const commissionsSubscription = supabase
        .channel('commissions-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_commissions' }, (payload) => {
          console.log('🔄 Mudança detectada na tabela employee_commissions, recarregando...');
          console.log('Payload:', payload);
          loadEmployeeCommissions();
        })
        .subscribe();
    }

    // Cleanup subscriptions on unmount
    return () => {
      if (salesSubscription) salesSubscription.unsubscribe();
      if (debtsSubscription) debtsSubscription.unsubscribe();
      if (employeesSubscription) employeesSubscription.unsubscribe();
      if (checksSubscription) checksSubscription.unsubscribe();
      if (boletosSubscription) boletosSubscription.unsubscribe();
    };
  }, []); // Executar apenas uma vez na inicialização

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
      deleteEmployee,
      createCheck,
      updateCheck,
      deleteCheck,
      createBoleto,
      updateBoleto,
      deleteBoleto,
      initializeCashBalance,
      updateCashBalance
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