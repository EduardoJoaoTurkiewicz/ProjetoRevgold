import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { sanitizeSupabaseData, logMonetaryValues, safeNumber } from '../utils/numberUtils';
import {
  salesService,
  employeeService,
  cashService,
  debtsService,
  checksService,
  boletosService,
  employeePaymentsService,
  employeeAdvancesService,
  employeeOvertimesService,
  employeeCommissionsService,
  pixFeesService,
  taxesService,
  agendaService,
  acertosService
} from '../lib/supabaseServices';
import { connectionManager } from '../lib/connectionManager';
import { syncManager } from '../lib/syncManager';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Sale,
  Employee,
  CashBalance,
  CashTransaction,
  Debt,
  Check,
  Boleto,
  EmployeePayment,
  EmployeeAdvance,
  EmployeeOvertime,
  EmployeeCommission,
  PixFee,
  Tax,
  AgendaEvent,
  Acerto
} from '../types/index';

interface AppContextType {
  // Estado
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  
  // Dados
  sales: Sale[];
  employees: Employee[];
  cashBalance: CashBalance | null;
  cashTransactions: CashTransaction[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  pixFees: PixFee[];
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
  acertos: Acerto[];
  
  // Métodos de autenticação
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Métodos de dados
  loadAllData: () => Promise<void>;
  setError: (error: string | null) => void;
  
  // Métodos de vendas
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<string>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Métodos de funcionários
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<string>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Métodos de caixa
  initializeCashBalance: (amount: number) => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<string>;
  updateCashTransaction: (transaction: CashTransaction) => Promise<void>;
  deleteCashTransaction: (id: string) => Promise<void>;
  
  // Métodos de dívidas
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<string>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Métodos de cheques
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<string>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Métodos de boletos
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<string>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // Métodos de funcionários
  createEmployeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt'>) => Promise<string>;
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => Promise<string>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => Promise<string>;
  updateEmployeeOvertime: (overtime: EmployeeOvertime) => Promise<void>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  
  // Métodos de tarifas PIX
  createPixFee: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => Promise<string>;
  updatePixFee: (pixFee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  // Métodos de impostos
  createTax: (tax: Omit<Tax, 'id' | 'createdAt'>) => Promise<string>;
  updateTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // Métodos de agenda
  createAgendaEvent: (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => Promise<string>;
  updateAgendaEvent: (event: AgendaEvent) => Promise<void>;
  deleteAgendaEvent: (id: string) => Promise<void>;
  
  // Métodos de acertos
  createAcerto: (acerto: Omit<Acerto, 'id' | 'createdAt'>) => Promise<string>;
  updateAcerto: (acerto: Acerto) => Promise<void>;
  deleteAcerto: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Estado básico
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  
  // Estado dos dados
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [acertos, setAcertos] = useState<Acerto[]>([]);

  // Inicialização
  useEffect(() => {
    console.log('🚀 Inicializando AppContext...');
    
    // Simular usuário autenticado para desenvolvimento
    setUser({ id: 'dev-user', email: 'dev@revgold.com' } as User);
    
    // Inicializar conexão automática
    const initializeSystem = async () => {
      try {
        // Carregar dados iniciais
        await loadAllData();
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setError('Erro na inicialização do sistema');
      } finally {
        setLoading(false);
      }
    };
    
    initializeSystem();
    
    // Escutar mudanças de conexão
    const unsubscribeConnection = connectionManager.addListener((status) => {
      setIsOnline(status.isOnline && status.isSupabaseReachable);
      
      // Recarregar dados silenciosamente quando conexão for restabelecida
      if (status.isOnline && status.isSupabaseReachable && !isLoading) {
        loadAllData().catch(error => {
          console.error('❌ Erro ao recarregar dados após reconexão:', error);
        });
      }
    });

    return () => {
      unsubscribeConnection();
    };
  }, []);

  // Função para limpar todos os dados
  const clearAllData = () => {
    setSales([]);
    setEmployees([]);
    setCashBalance(null);
    setCashTransactions([]);
    setDebts([]);
    setChecks([]);
    setBoletos([]);
    setEmployeePayments([]);
    setEmployeeAdvances([]);
    setEmployeeOvertimes([]);
    setEmployeeCommissions([]);
    setPixFees([]);
    setTaxes([]);
    setAgendaEvents([]);
    setAcertos([]);
    setError(null);
  };

  // Função para carregar todos os dados
  const loadAllData = async () => {
    console.log('🔄 Carregando todos os dados...');
    setIsLoading(true);
    setError(null);
    
    // Verificar se o Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - funcionando em modo offline');
      setIsLoading(false);
      return;
    }
    
    try {
      // Carregar todos os dados em paralelo
      const [
        salesData,
        employeeData,
        cashBalanceData,
        cashTransactionsData,
        debtsData,
        checksData,
        boletosData,
        employeePaymentsData,
        employeeAdvancesData,
        employeeOvertimesData,
        employeeCommissionsData,
        pixFeesData,
        taxesData,
        agendaEventsData,
        acertosData
      ] = await Promise.all([
        salesService.getSales(),
        employeeService.getEmployees(),
        cashService.getCurrentBalance(),
        cashService.getTransactions(),
        debtsService.getDebts(),
        checksService.getChecks(),
        boletosService.getBoletos(),
        employeePaymentsService.getPayments(),
        employeeAdvancesService.getAdvances(),
        employeeOvertimesService.getOvertimes(),
        employeeCommissionsService.getCommissions(),
        pixFeesService.getPixFees(),
        taxesService.getTaxes(),
        agendaService.getEvents(),
        acertosService.getAcertos()
      ]);

      // Sanitize all loaded data to ensure no NaN values
      const sanitizedSalesData = (salesData || []).map(sale => {
        const sanitized = sanitizeSupabaseData(sale);
        logMonetaryValues(sanitized, `Sale ${sanitized.id}`);
        return sanitized;
      });
      
      const sanitizedCashBalance = cashBalanceData ? sanitizeSupabaseData(cashBalanceData) : null;
      if (sanitizedCashBalance) {
        logMonetaryValues(sanitizedCashBalance, 'Cash Balance');
      }
      
      const sanitizedCashTransactions = (cashTransactionsData || []).map(transaction => {
        const sanitized = sanitizeSupabaseData(transaction);
        logMonetaryValues(sanitized, `Transaction ${sanitized.id}`);
        return sanitized;
      });
      // Atualizar estado com dados carregados
      setSales(sanitizedSalesData);
      setEmployees(employeeData || []);
      setCashBalance(sanitizedCashBalance);
      setCashTransactions(sanitizedCashTransactions);
      setDebts(debtsData || []);
      setChecks(checksData || []);
      setBoletos(boletosData || []);
      setEmployeePayments(employeePaymentsData || []);
      setEmployeeAdvances(employeeAdvancesData || []);
      setEmployeeOvertimes(employeeOvertimesData || []);
      setEmployeeCommissions(employeeCommissionsData || []);
      setPixFees(pixFeesData || []);
      setTaxes(taxesData || []);
      setAgendaEvents(agendaEventsData || []);
      setAcertos(acertosData || []);

      console.log('✅ Todos os dados carregados com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      
      // Verificar se é erro de configuração do Supabase
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.log('⚠️ Erro de conexão - funcionando em modo offline');
        setError('Sistema funcionando em modo offline. Configure o Supabase para sincronização online.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Métodos de autenticação (simplificados para desenvolvimento)
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Login simulado para desenvolvimento');
    setUser({ id: 'dev-user', email } as User);
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Registro simulado para desenvolvimento');
    setUser({ id: 'dev-user', email } as User);
  };

  const signOut = async () => {
    console.log('🚪 Logout');
    setUser(null);
    clearAllData();
  };

  // Métodos de vendas
  const createSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<string> => {
    try {
      console.log('🔄 AppContext.createSale - Input sale data:', sale);
      
      // Sanitize monetary values before processing
      const sanitizedSale = {
        ...sale,
        totalValue: safeNumber(sale.totalValue, 0),
        receivedAmount: safeNumber(sale.receivedAmount, 0),
        pendingAmount: safeNumber(sale.pendingAmount, 0),
        customCommissionRate: safeNumber(sale.customCommissionRate, 5),
        paymentMethods: (sale.paymentMethods || []).map(method => ({
          ...method,
          amount: safeNumber(method.amount, 0),
          installmentValue: safeNumber(method.installmentValue, 0),
          installments: safeNumber(method.installments, 1),
          installmentInterval: safeNumber(method.installmentInterval, 30)
        }))
      };
      
      logMonetaryValues(sanitizedSale, 'Create Sale - AppContext');
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      
      console.log('🔄 AppContext.createSale - Calling salesService.create...');
      const saleId = await salesService.create(sanitizedSale);
      console.log('✅ AppContext.createSale - Sale created with ID:', saleId);
      
      await loadAllData(); // Recarregar dados após criação
      return saleId;
    } catch (error) {
      console.error('❌ Erro ao criar venda:', error);
      throw error;
    }
  };

  const updateSale = async (id: string, sale: Partial<Sale>): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await salesService.update(id, sale);
      await loadAllData(); // Recarregar dados após atualização
    } catch (error) {
      console.error('❌ Erro ao atualizar venda:', error);
      throw error;
    }
  };

  const deleteSale = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await salesService.delete(id);
      await loadAllData(); // Recarregar dados após exclusão
    } catch (error) {
      console.error('❌ Erro ao excluir venda:', error);
      throw error;
    }
  };

  // Métodos de funcionários
  const createEmployee = async (employee: Omit<Employee, 'id' | 'createdAt'>): Promise<string> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      const employeeId = await employeeService.create(employee);
      await loadAllData();
      return employeeId;
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      throw error;
    }
  };

  const updateEmployee = async (employee: Employee): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await employeeService.update(employee.id, employee);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await employeeService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir funcionário:', error);
      throw error;
    }
  };

  // Métodos de caixa
  const initializeCashBalance = async (amount: number): Promise<void> => {
    try {
      const safeAmount = safeNumber(amount, 0);
      logMonetaryValues({ amount: safeAmount }, 'Initialize Cash Balance - AppContext');
      
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await cashService.initializeCashBalance(safeAmount);
      await loadAllData();
    } catch (error) {
      // Reload data after initialization
      await loadAllData();
      console.error('❌ Erro ao inicializar caixa:', error);
      throw error;
    }
  };

  const recalculateCashBalance = async (): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado. Configure o arquivo .env para usar esta funcionalidade.');
      }
      await cashService.recalculateBalance();
      // Reload data after recalculation
      await loadAllData();
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao recalcular saldo:', error);
      throw error;
    }
  };

  const createCashTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedTransaction = {
        ...transaction,
        amount: safeNumber(transaction.amount, 0)
      };
      
      logMonetaryValues(sanitizedTransaction, 'Create Cash Transaction - AppContext');
      const transactionId = await cashService.createTransaction(sanitizedTransaction);
      // Reload data after creating transaction
      await loadAllData();
      await loadAllData();
      return transactionId;
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      throw error;
    }
  };

  const updateCashTransaction = async (transaction: CashTransaction): Promise<void> => {
    try {
      await cashService.updateTransaction(transaction.id!, transaction);
      // Reload data after updating transaction
      await loadAllData();
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      throw error;
    }
  };

  const deleteCashTransaction = async (id: string): Promise<void> => {
    try {
      await cashService.deleteTransaction(id);
      // Reload data after deleting transaction
      await loadAllData();
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      throw error;
    }
  };

  // Métodos de dívidas
  const createDebt = async (debt: Omit<Debt, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedDebt = {
        ...debt,
        totalValue: safeNumber(debt.totalValue, 0),
        paidAmount: safeNumber(debt.paidAmount, 0),
        pendingAmount: safeNumber(debt.pendingAmount, 0),
        paymentMethods: (debt.paymentMethods || []).map(method => ({
          ...method,
          amount: safeNumber(method.amount, 0),
          installmentValue: safeNumber(method.installmentValue, 0)
        }))
      };
      
      logMonetaryValues(sanitizedDebt, 'Create Debt - AppContext');
      const debtId = await debtsService.create(sanitizedDebt);
      await loadAllData();
      return debtId;
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      throw error;
    }
  };

  const updateDebt = async (debt: Debt): Promise<void> => {
    try {
      await debtsService.update(debt.id, debt);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string): Promise<void> => {
    try {
      await debtsService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir dívida:', error);
      throw error;
    }
  };

  // Métodos de cheques
  const createCheck = async (check: Omit<Check, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedCheck = {
        ...check,
        value: safeNumber(check.value, 0),
        installmentNumber: safeNumber(check.installmentNumber, 1),
        totalInstallments: safeNumber(check.totalInstallments, 1)
      };
      
      logMonetaryValues(sanitizedCheck, 'Create Check - AppContext');
      const checkId = await checksService.create(sanitizedCheck);
      await loadAllData();
      return checkId;
    } catch (error) {
      console.error('❌ Erro ao criar cheque:', error);
      throw error;
    }
  };

  const updateCheck = async (check: Check): Promise<void> => {
    try {
      await checksService.update(check.id, check);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar cheque:', error);
      throw error;
    }
  };

  const deleteCheck = async (id: string): Promise<void> => {
    try {
      await checksService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir cheque:', error);
      throw error;
    }
  };

  // Métodos de boletos
  const createBoleto = async (boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedBoleto = {
        ...boleto,
        value: safeNumber(boleto.value, 0),
        installmentNumber: safeNumber(boleto.installmentNumber, 1),
        totalInstallments: safeNumber(boleto.totalInstallments, 1),
        interestAmount: safeNumber(boleto.interestAmount, 0),
        penaltyAmount: safeNumber(boleto.penaltyAmount, 0),
        notaryCosts: safeNumber(boleto.notaryCosts, 0),
        finalAmount: safeNumber(boleto.finalAmount, safeNumber(boleto.value, 0)),
        interestPaid: safeNumber(boleto.interestPaid, 0)
      };
      
      logMonetaryValues(sanitizedBoleto, 'Create Boleto - AppContext');
      const boletoId = await boletosService.create(sanitizedBoleto);
      await loadAllData();
      return boletoId;
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error);
      throw error;
    }
  };

  const updateBoleto = async (boleto: Boleto): Promise<void> => {
    try {
      await boletosService.update(boleto.id, boleto);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar boleto:', error);
      throw error;
    }
  };

  const deleteBoleto = async (id: string): Promise<void> => {
    try {
      await boletosService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir boleto:', error);
      throw error;
    }
  };

  // Métodos de funcionários
  const createEmployeePayment = async (payment: Omit<EmployeePayment, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedPayment = {
        ...payment,
        amount: safeNumber(payment.amount, 0)
      };
      
      logMonetaryValues(sanitizedPayment, 'Create Employee Payment - AppContext');
      const paymentId = await employeePaymentsService.create(sanitizedPayment);
      await loadAllData();
      return paymentId;
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      throw error;
    }
  };

  const createEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedAdvance = {
        ...advance,
        amount: safeNumber(advance.amount, 0)
      };
      
      logMonetaryValues(sanitizedAdvance, 'Create Employee Advance - AppContext');
      const advanceId = await employeeAdvancesService.create(sanitizedAdvance);
      await loadAllData();
      return advanceId;
    } catch (error) {
      console.error('❌ Erro ao criar adiantamento:', error);
      throw error;
    }
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance): Promise<void> => {
    try {
      await employeeAdvancesService.update(advance.id!, advance);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar adiantamento:', error);
      throw error;
    }
  };

  const createEmployeeOvertime = async (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedOvertime = {
        ...overtime,
        hours: safeNumber(overtime.hours, 0),
        hourlyRate: safeNumber(overtime.hourlyRate, 0),
        totalAmount: safeNumber(overtime.totalAmount, 0)
      };
      
      logMonetaryValues(sanitizedOvertime, 'Create Employee Overtime - AppContext');
      const overtimeId = await employeeOvertimesService.create(sanitizedOvertime);
      await loadAllData();
      return overtimeId;
    } catch (error) {
      console.error('❌ Erro ao criar hora extra:', error);
      throw error;
    }
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime): Promise<void> => {
    try {
      await employeeOvertimesService.update(overtime.id!, overtime);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar hora extra:', error);
      throw error;
    }
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission): Promise<void> => {
    try {
      await employeeCommissionsService.update(commission.id!, commission);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar comissão:', error);
      throw error;
    }
  };

  // Métodos de tarifas PIX
  const createPixFee = async (pixFee: Omit<PixFee, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedPixFee = {
        ...pixFee,
        amount: safeNumber(pixFee.amount, 0)
      };
      
      logMonetaryValues(sanitizedPixFee, 'Create PIX Fee - AppContext');
      const pixFeeId = await pixFeesService.create(sanitizedPixFee);
      await loadAllData();
      return pixFeeId;
    } catch (error) {
      console.error('❌ Erro ao criar tarifa PIX:', error);
      throw error;
    }
  };

  const updatePixFee = async (pixFee: PixFee): Promise<void> => {
    try {
      await pixFeesService.update(pixFee.id!, pixFee);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar tarifa PIX:', error);
      throw error;
    }
  };

  const deletePixFee = async (id: string): Promise<void> => {
    try {
      await pixFeesService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir tarifa PIX:', error);
      throw error;
    }
  };

  // Métodos de impostos
  const createTax = async (tax: Omit<Tax, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedTax = {
        ...tax,
        amount: safeNumber(tax.amount, 0)
      };
      
      logMonetaryValues(sanitizedTax, 'Create Tax - AppContext');
      const taxId = await taxesService.create(sanitizedTax);
      await loadAllData();
      return taxId;
    } catch (error) {
      console.error('❌ Erro ao criar imposto:', error);
      throw error;
    }
  };

  const updateTax = async (tax: Tax): Promise<void> => {
    try {
      await taxesService.update(tax.id!, tax);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar imposto:', error);
      throw error;
    }
  };

  const deleteTax = async (id: string): Promise<void> => {
    try {
      await taxesService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir imposto:', error);
      throw error;
    }
  };

  // Métodos de agenda
  const createAgendaEvent = async (event: Omit<AgendaEvent, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const eventId = await agendaService.create(event);
      await loadAllData();
      return eventId;
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
  };

  const updateAgendaEvent = async (event: AgendaEvent): Promise<void> => {
    try {
      await agendaService.update(event.id!, event);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  };

  const deleteAgendaEvent = async (id: string): Promise<void> => {
    try {
      await agendaService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir evento:', error);
      throw error;
    }
  };

  // Métodos de acertos
  const createAcerto = async (acerto: Omit<Acerto, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const sanitizedAcerto = {
        ...acerto,
        totalAmount: safeNumber(acerto.totalAmount, 0),
        paidAmount: safeNumber(acerto.paidAmount, 0),
        pendingAmount: safeNumber(acerto.pendingAmount, 0),
        paymentInstallments: safeNumber(acerto.paymentInstallments, 1),
        paymentInstallmentValue: safeNumber(acerto.paymentInstallmentValue, 0),
        paymentInterval: safeNumber(acerto.paymentInterval, 30)
      };
      
      logMonetaryValues(sanitizedAcerto, 'Create Acerto - AppContext');
      const acertoId = await acertosService.create(sanitizedAcerto);
      await loadAllData();
      return acertoId;
    } catch (error) {
      console.error('❌ Erro ao criar acerto:', error);
      throw error;
    }
  };

  const updateAcerto = async (acerto: Acerto): Promise<void> => {
    try {
      await acertosService.update(acerto.id!, acerto);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar acerto:', error);
      throw error;
    }
  };

  const deleteAcerto = async (id: string): Promise<void> => {
    try {
      await acertosService.delete(id);
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir acerto:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    // Estado
    user,
    loading,
    isLoading,
    isOnline,
    error,
    
    // Dados
    sales,
    employees,
    cashBalance,
    cashTransactions,
    debts,
    checks,
    boletos,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    pixFees,
    taxes,
    agendaEvents,
    acertos,
    
    // Métodos de autenticação
    signIn,
    signUp,
    signOut,
    
    // Métodos de dados
    loadAllData,
    setError,
    
    // Métodos de vendas
    createSale,
    updateSale,
    deleteSale,
    
    // Métodos de funcionários
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Métodos de caixa
    initializeCashBalance,
    recalculateCashBalance,
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    
    // Métodos de dívidas
    createDebt,
    updateDebt,
    deleteDebt,
    
    // Métodos de cheques
    createCheck,
    updateCheck,
    deleteCheck,
    
    // Métodos de boletos
    createBoleto,
    updateBoleto,
    deleteBoleto,
    
    // Métodos de funcionários
    createEmployeePayment,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    updateEmployeeCommission,
    
    // Métodos de tarifas PIX
    createPixFee,
    updatePixFee,
    deletePixFee,
    
    // Métodos de impostos
    createTax,
    updateTax,
    deleteTax,
    
    // Métodos de agenda
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    
    // Métodos de acertos
    createAcerto,
    updateAcerto,
    deleteAcerto
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
}