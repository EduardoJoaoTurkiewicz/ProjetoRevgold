import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AutomationService } from '../lib/automationService';
import type { 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  Employee,
  EmployeePayment,
  EmployeeAdvance,
  EmployeeOvertime,
  EmployeeCommission,
  CashBalance,
  CashTransaction,
  PixFee,
  Tax,
  AgendaEvent
} from '../types';

interface AppContextType {
  // Data
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
  taxes: Tax[];
  agendaEvents: AgendaEvent[];
  
  // State
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAllData: () => Promise<void>;
  
  // Sales
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  updateSale: (id: string, sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Debts
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Checks
  createCheck: (check: Omit<Check, 'id' | 'createdAt'>) => Promise<void>;
  updateCheck: (check: Check) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  
  // Boletos
  createBoleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => Promise<void>;
  updateBoleto: (boleto: Boleto) => Promise<void>;
  deleteBoleto: (id: string) => Promise<void>;
  
  // Employees
  createEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Employee related
  createEmployeePayment: (payment: EmployeePayment) => Promise<void>;
  createEmployeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployeeAdvance: (advance: EmployeeAdvance) => Promise<void>;
  createEmployeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => Promise<void>;
  updateEmployeeOvertime: (overtime: EmployeeOvertime) => Promise<void>;
  updateEmployeeCommission: (commission: EmployeeCommission) => Promise<void>;
  
  // Cash
  initializeCashBalance: (initialAmount: number) => Promise<void>;
  updateCashBalance: (balance: CashBalance) => Promise<void>;
  recalculateCashBalance: () => Promise<void>;
  createCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => Promise<void>;
  
  // PIX Fees
  createPixFee: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => Promise<void>;
  updatePixFee: (pixFee: PixFee) => Promise<void>;
  deletePixFee: (id: string) => Promise<void>;
  
  // Taxes
  createTax: (tax: Omit<Tax, 'id' | 'createdAt'>) => Promise<void>;
  updateTax: (tax: Tax) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // System utilities
  cleanupDuplicates: () => Promise<void>;
  
  // Agenda
  createAgendaEvent: (event: Omit<AgendaEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateAgendaEvent: (event: AgendaEvent) => Promise<void>;
  deleteAgendaEvent: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvance[]>([]);
  const [employeeOvertimes, setEmployeeOvertimes] = useState<EmployeeOvertime[]>([]);
  const [employeeCommissions, setEmployeeCommissions] = useState<EmployeeCommission[]>([]);
  const [cashBalance, setCashBalance] = useState<CashBalance | null>(null);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [pixFees, setPixFees] = useState<PixFee[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database row to app format
  const transformFromDatabase = (row: any) => {
    if (!row) return row;
    
    const transformed: any = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = value;
    }
    
    return transformed;
  };

  // Transform app format to database
  const transformToDatabase = (obj: any) => {
    if (!obj) return obj;
    
    // Função recursiva para transformar objetos aninhados
    const transformValue = (value: any): any => {
      if (value === null || value === undefined) {
        return value;
      }
      
      if (Array.isArray(value)) {
        return value.map(item => transformValue(item));
      }
      
      if (value && typeof value === 'object' && value.constructor === Object) {
        const transformed: any = {};
        for (const [k, v] of Object.entries(value)) {
          // Converter camelCase para snake_case
          const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          transformed[snakeKey] = transformValue(v);
        }
        return transformed;
      }
      
      return value;
    };

    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Converter camelCase para snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      transformed[snakeKey] = transformValue(value);
    }
    
    return transformed;
  };

  const loadAllData = async () => {
    // Always try to load data, but handle connection failures gracefully
    setError(null);
    console.log('🔄 Carregando todos os dados...');

    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, usando modo offline');
      setError('Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar ao banco de dados.');
      setLoading(false);
      setIsLoading(false);
      return;
    }

    try {
      // Load all data in parallel
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
        pixFeesData,
        taxesData,
        agendaEventsData
      ] = await Promise.all([
        supabase.from('sales').select(`
          id,
          date,
          delivery_date,
          client,
          seller_id,
          products,
          observations,
          total_value,
          payment_methods,
          received_amount,
          pending_amount,
          status,
          payment_description,
          payment_observations,
          custom_commission_rate,
          created_at,
          updated_at
        `).order('date', { ascending: false }),
        supabase.from('debts').select(`
          id,
          date,
          description,
          company,
          total_value,
          payment_methods,
          is_paid,
          paid_amount,
          pending_amount,
          checks_used,
          payment_description,
          debt_payment_description,
          created_at,
          updated_at
        `).order('date', { ascending: false }),
        supabase.from('checks').select('*').order('due_date', { ascending: false }),
        supabase.from('boletos').select('*').order('due_date', { ascending: false }),
        supabase.from('employees').select('*').order('name'),
        supabase.from('employee_payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('employee_advances').select('*').order('date', { ascending: false }),
        supabase.from('employee_overtimes').select('*').order('date', { ascending: false }),
        supabase.from('employee_commissions').select('*').order('date', { ascending: false }),
        supabase.from('cash_balances').select('*').limit(1).single(),
        supabase.from('cash_transactions').select('*').order('date', { ascending: false }),
        supabase.from('pix_fees').select('*').order('date', { ascending: false }),
        supabase.from('taxes').select('*').order('date', { ascending: false }),
        supabase.from('agenda_events').select('*').order('date', { ascending: false })
      ]);

      // Check for connection errors first
      const allResponses = [
        salesData, debtsData, checksData, boletosData, employeesData,
        employeePaymentsData, employeeAdvancesData, employeeOvertimesData,
        employeeCommissionsData, pixFeesData, taxesData, agendaEventsData
      ];

      // Check if any response indicates a connection failure
      const connectionErrors = allResponses.filter(response => 
        response.error && (
          response.error.message?.includes('Failed to fetch') ||
          response.error.message?.includes('fetch') ||
          response.error.code === 'NETWORK_ERROR' ||
          response.error.code === 'PGRST301'
        )
      );

      if (connectionErrors.length > 0) {
        console.warn('⚠️ Erro de conexão com Supabase detectado, entrando em modo offline');
        setError('Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet e as configurações do Supabase. O sistema está funcionando em modo offline.');
        setLoading(false);
        setIsLoading(false);
        return;
      }

      // Check for other errors
      const otherErrors = allResponses.filter(response => response.error).map(response => response.error);
      
      if (otherErrors.length > 0) {
        console.error('❌ Erros ao carregar dados:', otherErrors);
        throw new Error(`Erros ao carregar dados: ${otherErrors.map(e => e.message).join(', ')}`);
      }

      // Transform and set data
      setSales((salesData.data || []).map(transformFromDatabase));
      setDebts((debtsData.data || []).map(transformFromDatabase));
      setChecks((checksData.data || []).map(transformFromDatabase));
      setBoletos((boletosData.data || []).map(transformFromDatabase));
      setEmployees((employeesData.data || []).map(transformFromDatabase));
      setEmployeePayments((employeePaymentsData.data || []).map(transformFromDatabase));
      setEmployeeAdvances((employeeAdvancesData.data || []).map(transformFromDatabase));
      setEmployeeOvertimes((employeeOvertimesData.data || []).map(transformFromDatabase));
      setEmployeeCommissions((employeeCommissionsData.data || []).map(transformFromDatabase));
      setCashBalance(cashBalanceData.data ? transformFromDatabase(cashBalanceData.data) : null);
      setCashTransactions((cashTransactionsData.data || []).map(transformFromDatabase));
      setPixFees((pixFeesData.data || []).map(transformFromDatabase));
      setTaxes((taxesData.data || []).map(transformFromDatabase));
      setAgendaEvents((agendaEventsData.data || []).map(transformFromDatabase));

      console.log('✅ Todos os dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Erro desconhecido ao carregar dados';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão com o banco de dados. Verifique sua conexão com a internet e as configurações do Supabase.';
        } else if (error.message.includes('Invalid API key') || error.message.includes('unauthorized')) {
          errorMessage = 'Credenciais do Supabase inválidas. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Tabelas do banco de dados não encontradas. Execute as migrações do Supabase ou configure o banco de dados.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Sales functions
  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Dados da venda antes da transformação:', saleData);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Validar dados antes de enviar
      if (!saleData.client?.trim()) {
        throw new Error('Nome do cliente é obrigatório');
      }
      
      if (!saleData.totalValue || saleData.totalValue <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }
      
      if (!saleData.paymentMethods || saleData.paymentMethods.length === 0) {
        throw new Error('Pelo menos um método de pagamento é obrigatório');
      }
      
      // Validar estrutura dos métodos de pagamento
      for (const method of saleData.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          throw new Error('Todos os métodos de pagamento devem ter um tipo válido.');
        }
        if (typeof method.amount !== 'number' || method.amount < 0) {
          throw new Error('Todos os métodos de pagamento devem ter um valor válido.');
        }
      }
      
      const dbData = transformToDatabase(saleData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('sales').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Uma venda com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar venda: ${error.message}`);
      }
      
      const newSale = transformFromDatabase(data);
      setSales(prev => [newSale, ...prev]);
      console.log('✅ Venda criada com sucesso:', newSale.id);
      
      // Create checks and boletos automatically
      await AutomationService.createChecksForSale(newSale);
      await AutomationService.createBoletosForSale(newSale);
      
      // Reload data to get the new checks and boletos
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao adicionar venda:', error);
      
      // Set user-friendly error message
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar a venda. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(saleData);
      const { error } = await supabase.from('sales').update(dbData).eq('id', id);
      
      if (error) throw error;
      
      setSales(prev => prev.map(sale => 
        sale.id === id ? { ...saleData, id, createdAt: sale.createdAt } : sale
      ));
      
      // Update related checks and boletos
      await AutomationService.updateChecksForSale({ ...saleData, id, createdAt: '' }, checks);
      await AutomationService.updateBoletosForSale({ ...saleData, id, createdAt: '' }, boletos);
      
      // Reload data
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar venda:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar a venda. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      
      setSales(prev => prev.filter(sale => sale.id !== id));
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao excluir venda:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir a venda. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Debt functions
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Dados da dívida antes da transformação:', debtData);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Validar dados antes de enviar
      if (!debtData.company?.trim()) {
        throw new Error('Nome da empresa é obrigatório');
      }
      
      if (!debtData.description?.trim()) {
        throw new Error('Descrição da dívida é obrigatória');
      }
      
      if (!debtData.totalValue || debtData.totalValue <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }
      
      // Verificar se já existe uma dívida similar
      // Validar estrutura dos métodos de pagamento
      if (debtData.paymentMethods && debtData.paymentMethods.length > 0) {
        for (const method of debtData.paymentMethods) {
          if (!method.type || typeof method.type !== 'string') {
            throw new Error('Todos os métodos de pagamento devem ter um tipo válido.');
          }
          if (typeof method.amount !== 'number' || method.amount < 0) {
            throw new Error('Todos os métodos de pagamento devem ter um valor válido.');
          }
        }
      }
      
      const dbData = transformToDatabase(debtData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('debts').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Uma dívida com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar dívida: ${error.message}`);
      }
      
      const newDebt = transformFromDatabase(data);
      setDebts(prev => [newDebt, ...prev]);
      console.log('✅ Dívida criada com sucesso:', newDebt.id);
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar a dívida. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateDebt = async (debt: Debt) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(debt);
      const { error } = await supabase.from('debts').update(dbData).eq('id', debt.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar dívida: ${error.message}`);
      }
      
      setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
      
      // Reload cash balance to reflect any payment status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar a dívida. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      
      setDebts(prev => prev.filter(debt => debt.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir dívida:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir a dívida. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Check functions
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Dados do cheque antes da transformação:', checkData);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(checkData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('checks').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um cheque com os mesmos dados já existe (cliente, valor, vencimento e parcela). Verifique se não há duplicação.');
        }
        throw new Error(`Erro ao criar cheque: ${error.message}`);
      }
      
      const newCheck = transformFromDatabase(data);
      setChecks(prev => [newCheck, ...prev]);
      console.log('✅ Cheque criado com sucesso:', newCheck.id);
    } catch (error) {
      console.error('❌ Erro ao criar cheque:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o cheque. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateCheck = async (check: Check) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(check);
      const { error } = await supabase.from('checks').update(dbData).eq('id', check.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar cheque: ${error.message}`);
      }
      
      setChecks(prev => prev.map(c => c.id === check.id ? check : c));
      
      // Reload cash balance to reflect any status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar cheque:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o cheque. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteCheck = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('checks').delete().eq('id', id);
      if (error) throw error;
      
      setChecks(prev => prev.filter(check => check.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir cheque:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir o cheque. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Boleto functions
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Dados do boleto antes da transformação:', boletoData);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(boletoData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um boleto com os mesmos dados já existe (cliente, valor, vencimento e parcela). Verifique se não há duplicação.');
        }
        throw new Error(`Erro ao criar boleto: ${error.message}`);
      }
      
      const newBoleto = transformFromDatabase(data);
      setBoletos(prev => [newBoleto, ...prev]);
      console.log('✅ Boleto criado com sucesso:', newBoleto.id);
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o boleto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateBoleto = async (boleto: Boleto) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(boleto);
      const { error } = await supabase.from('boletos').update(dbData).eq('id', boleto.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar boleto: ${error.message}`);
      }
      
      setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
      
      // Reload cash balance to reflect any status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar boleto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o boleto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteBoleto = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('boletos').delete().eq('id', id);
      if (error) throw error;
      
      setBoletos(prev => prev.filter(boleto => boleto.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir boleto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir o boleto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Employee functions
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Dados do funcionário antes da transformação:', employeeData);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Validar dados antes de enviar
      if (!employeeData.name?.trim()) {
        throw new Error('Nome do funcionário é obrigatório');
      }
      
      if (!employeeData.position?.trim()) {
        throw new Error('Cargo do funcionário é obrigatório');
      }
      
      if (!employeeData.salary || employeeData.salary <= 0) {
        throw new Error('Salário deve ser maior que zero');
      }
      
      const dbData = transformToDatabase(employeeData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('employees').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um funcionário com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar funcionário: ${error.message}`);
      }
      
      const newEmployee = transformFromDatabase(data);
      setEmployees(prev => [newEmployee, ...prev]);
      console.log('✅ Funcionário criado com sucesso:', newEmployee.id);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o funcionário. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(employee);
      const { error } = await supabase.from('employees').update(dbData).eq('id', employee.id);
      
      if (error) throw error;
      
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    } catch (error) {
      console.error('❌ Erro ao atualizar funcionário:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o funcionário. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      
      setEmployees(prev => prev.filter(employee => employee.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir funcionário:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir o funcionário. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Employee payment functions
  const createEmployeePayment = async (paymentData: EmployeePayment) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(paymentData);
      const { data, error } = await supabase.from('employee_payments').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar pagamento: ${error.message}`);
      }
      
      const newPayment = transformFromDatabase(data);
      setEmployeePayments(prev => [newPayment, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o pagamento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const createEmployeeAdvance = async (advanceData: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(advanceData);
      const { data, error } = await supabase.from('employee_advances').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar adiantamento: ${error.message}`);
      }
      
      const newAdvance = transformFromDatabase(data);
      setEmployeeAdvances(prev => [newAdvance, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar adiantamento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o adiantamento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(advance);
      const { error } = await supabase.from('employee_advances').update(dbData).eq('id', advance.id);
      
      if (error) throw error;
      
      setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
    } catch (error) {
      console.error('❌ Erro ao atualizar adiantamento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o adiantamento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const createEmployeeOvertime = async (overtimeData: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(overtimeData);
      const { data, error } = await supabase.from('employee_overtimes').insert([dbData]).select().single();
      
      if (error) throw error;
      
      const newOvertime = transformFromDatabase(data);
      setEmployeeOvertimes(prev => [newOvertime, ...prev]);
    } catch (error) {
      console.error('❌ Erro ao criar hora extra:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar as horas extras. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(overtime);
      const { error } = await supabase.from('employee_overtimes').update(dbData).eq('id', overtime.id);
      
      if (error) throw error;
      
      setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
    } catch (error) {
      console.error('❌ Erro ao atualizar hora extra:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar as horas extras. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(commission);
      const { error } = await supabase.from('employee_commissions').update(dbData).eq('id', commission.id);
      
      if (error) throw error;
      
      setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
    } catch (error) {
      console.error('❌ Erro ao atualizar comissão:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar a comissão. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Cash management functions
  const initializeCashBalance = async (initialAmount: number) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível inicializar o caixa sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Verificar se já existe um saldo
      const { data: existingBalance } = await supabase
        .from('cash_balances')
        .select('*')
        .limit(1)
        .single();
      
      if (existingBalance) {
        // Atualizar saldo existente
        const { data, error } = await supabase
          .from('cash_balances')
          .update({
            current_balance: initialAmount,
            initial_balance: initialAmount,
            initial_date: new Date().toISOString().split('T')[0],
            last_updated: new Date().toISOString()
          })
          .eq('id', existingBalance.id)
          .select()
          .single();
        
        if (error) throw error;
        setCashBalance(transformFromDatabase(data));
      } else {
        // Criar novo saldo
        const { data, error } = await supabase.from('cash_balances').insert([{
          current_balance: initialAmount,
          initial_balance: initialAmount,
          initial_date: new Date().toISOString().split('T')[0],
          last_updated: new Date().toISOString()
        }]).select().single();
        
        if (error) throw error;
        setCashBalance(transformFromDatabase(data));
      }
      
      // Recalcular saldo baseado em todas as transações
      await supabase.rpc('recalculate_cash_balance');
      
      // Recarregar dados
      await loadAllData();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar caixa:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível inicializar o caixa. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Função para recalcular saldo do caixa
  const recalculateCashBalance = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível recalcular o saldo sem conexão com o banco de dados.');
      return;
    }
    
    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      await supabase.rpc('recalculate_cash_balance');
      await loadAllData();
      console.log('✅ Saldo do caixa recalculado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recalcular saldo:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível recalcular o saldo. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Função para limpar duplicatas
  const cleanupDuplicates = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível limpar duplicatas sem conexão com o banco de dados.');
      return;
    }
    
    try {
      setError(null);
      console.log('🧹 Iniciando limpeza de duplicatas...');
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Executar limpeza via SQL
      const { error } = await supabase.rpc('check_system_integrity');
      if (error) throw error;
      
      await loadAllData();
      console.log('✅ Limpeza de duplicatas concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível limpar duplicatas. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateCashBalance = async (balance: CashBalance) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(balance);
      const { error } = await supabase.from('cash_balances').update(dbData).eq('id', balance.id);
      
      if (error) throw error;
      
      setCashBalance(balance);
    } catch (error) {
      console.error('❌ Erro ao atualizar saldo:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o saldo. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const createCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(transactionData);
      const { data, error } = await supabase.from('cash_transactions').insert([dbData]).select().single();
      
      if (error) throw error;
      
      const newTransaction = transformFromDatabase(data);
      setCashTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar a transação. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // PIX Fee functions
  const createPixFee = async (pixFeeData: Omit<PixFee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(pixFeeData);
      const { data, error } = await supabase.from('pix_fees').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar tarifa PIX: ${error.message}`);
      }
      
      const newPixFee = transformFromDatabase(data);
      setPixFees(prev => [newPixFee, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar tarifa PIX:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar a tarifa PIX. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updatePixFee = async (pixFee: PixFee) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(pixFee);
      const { error } = await supabase.from('pix_fees').update(dbData).eq('id', pixFee.id);
      
      if (error) throw error;
      
      setPixFees(prev => prev.map(p => p.id === pixFee.id ? pixFee : p));
    } catch (error) {
      console.error('❌ Erro ao atualizar tarifa PIX:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar a tarifa PIX. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deletePixFee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('pix_fees').delete().eq('id', id);
      if (error) throw error;
      
      setPixFees(prev => prev.filter(pixFee => pixFee.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir tarifa PIX:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir a tarifa PIX. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Tax functions
  const createTax = async (taxData: Omit<Tax, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(taxData);
      const { data, error } = await supabase.from('taxes').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar imposto: ${error.message}`);
      }
      
      const newTax = transformFromDatabase(data);
      setTaxes(prev => [newTax, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar imposto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o imposto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateTax = async (tax: Tax) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(tax);
      const { error } = await supabase.from('taxes').update(dbData).eq('id', tax.id);
      
      if (error) throw error;
      
      setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
    } catch (error) {
      console.error('❌ Erro ao atualizar imposto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o imposto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteTax = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('taxes').delete().eq('id', id);
      if (error) throw error;
      
      setTaxes(prev => prev.filter(tax => tax.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir imposto:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir o imposto. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Agenda functions
  const createAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível salvar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(eventData);
      const { data, error } = await supabase.from('agenda_events').insert([dbData]).select().single();
      
      if (error) throw error;
      
      const newEvent = transformFromDatabase(data);
      setAgendaEvents(prev => [newEvent, ...prev]);
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível salvar o evento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const updateAgendaEvent = async (event: AgendaEvent) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível atualizar dados sem conexão com o banco de dados.');
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const dbData = transformToDatabase(event);
      const { error } = await supabase.from('agenda_events').update(dbData).eq('id', event.id);
      
      if (error) throw error;
      
      setAgendaEvents(prev => prev.map(e => e.id === event.id ? event : e));
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível atualizar o evento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  const deleteAgendaEvent = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado. Não é possível excluir dados sem conexão com o banco de dados.');
      const newSale = {
        ...saleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setSales(prev => [newSale, ...prev]);
      return;
    }

    try {
      setError(null);
      
      // Test connection before proceeding
      const { error: testError } = await supabase.from('employees').select('id').limit(1);
      if (testError && (testError.message?.includes('Failed to fetch') || testError.message?.includes('fetch'))) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      const { error } = await supabase.from('agenda_events').delete().eq('id', id);
      if (error) throw error;
      
      setAgendaEvents(prev => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error('❌ Erro ao excluir evento:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão. Não foi possível excluir o evento. Verifique sua conexão com a internet.');
      }
      
      throw error;
    }
  };

  // Load data on mount with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadWithRetry = async () => {
      try {
        await loadAllData();
      } catch (error) {
        retryCount++;
        
        if (retryCount < maxRetries && error instanceof Error && error.message.includes('Failed to fetch')) {
          console.log(`🔄 Tentativa ${retryCount}/${maxRetries} de reconexão em 2 segundos...`);
          setTimeout(() => {
            loadWithRetry();
          }, 2000);
        } else {
          console.error('❌ Falha definitiva ao carregar dados após', retryCount, 'tentativas');
          setError('Não foi possível conectar ao banco de dados após várias tentativas. Verifique sua conexão com a internet e as configurações do Supabase.');
          setLoading(false);
          setIsLoading(false);
        }
      }
    };
    
    loadWithRetry();
  }, []);

      
      // Validar estrutura dos métodos de pagamento
      for (const method of saleData.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          throw new Error('Todos os métodos de pagamento devem ter um tipo válido.');
        }
        if (typeof method.amount !== 'number' || method.amount < 0) {
          throw new Error('Todos os métodos de pagamento devem ter um valor válido.');
        }
      }
      
      const dbData = transformToDatabase(saleData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('sales').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Uma venda com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar venda: ${error.message}`);
      }
      
      const newSale = transformFromDatabase(data);
      setSales(prev => [newSale, ...prev]);
      console.log('✅ Venda criada com sucesso:', newSale.id);
      
      // Create checks and boletos automatically
      await AutomationService.createChecksForSale(newSale);
      await AutomationService.createBoletosForSale(newSale);
      
      // Reload data to get the new checks and boletos
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao adicionar venda:', error);
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.map(sale => 
        sale.id === id ? { ...saleData, id, createdAt: sale.createdAt } : sale
      ));
      return;
    }

    const dbData = transformToDatabase(saleData);
    const { error } = await supabase.from('sales').update(dbData).eq('id', id);
    
    if (error) throw error;
    
    setSales(prev => prev.map(sale => 
      sale.id === id ? { ...saleData, id, createdAt: sale.createdAt } : sale
    ));
    
    // Update related checks and boletos
    await AutomationService.updateChecksForSale({ ...saleData, id, createdAt: '' }, checks);
    await AutomationService.updateBoletosForSale({ ...saleData, id, createdAt: '' }, boletos);
    
    // Reload data
    await loadAllData();
  };

  const deleteSale = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setSales(prev => prev.filter(sale => sale.id !== id));
      return;
    }

    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    
    setSales(prev => prev.filter(sale => sale.id !== id));
    await loadAllData();
  };

  // Debt functions
  const createDebt = async (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newDebt = {
        ...debtData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setDebts(prev => [newDebt, ...prev]);
      return;
    }

    try {
      console.log('🔄 Dados da dívida antes da transformação:', debtData);
      
      // Validar dados antes de enviar
      if (!debtData.company?.trim()) {
        throw new Error('Nome da empresa é obrigatório');
      }
      
      if (!debtData.description?.trim()) {
        throw new Error('Descrição da dívida é obrigatória');
      }
      
      if (!debtData.totalValue || debtData.totalValue <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }
      
      // Verificar se já existe uma dívida similar
      // Validar estrutura dos métodos de pagamento
      if (debtData.paymentMethods && debtData.paymentMethods.length > 0) {
        for (const method of debtData.paymentMethods) {
          if (!method.type || typeof method.type !== 'string') {
            throw new Error('Todos os métodos de pagamento devem ter um tipo válido.');
          }
          if (typeof method.amount !== 'number' || method.amount < 0) {
            throw new Error('Todos os métodos de pagamento devem ter um valor válido.');
          }
        }
      }
      
      const dbData = transformToDatabase(debtData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('debts').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Uma dívida com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar dívida: ${error.message}`);
      }
      
      const newDebt = transformFromDatabase(data);
      setDebts(prev => [newDebt, ...prev]);
      console.log('✅ Dívida criada com sucesso:', newDebt.id);
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      throw error;
    }
  };

  const updateDebt = async (debt: Debt) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
      return;
    }

    try {
      const dbData = transformToDatabase(debt);
      const { error } = await supabase.from('debts').update(dbData).eq('id', debt.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar dívida: ${error.message}`);
      }
      
      setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
      
      // Reload cash balance to reflect any payment status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      throw error;
    }
  };

  const deleteDebt = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setDebts(prev => prev.filter(debt => debt.id !== id));
      return;
    }

    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
    
    setDebts(prev => prev.filter(debt => debt.id !== id));
  };

  // Check functions
  const createCheck = async (checkData: Omit<Check, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newCheck = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setChecks(prev => [newCheck, ...prev]);
      return;
    }

    try {
      console.log('🔄 Dados do cheque antes da transformação:', checkData);
      
      const dbData = transformToDatabase(checkData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('checks').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um cheque com os mesmos dados já existe (cliente, valor, vencimento e parcela). Verifique se não há duplicação.');
        }
        throw new Error(`Erro ao criar cheque: ${error.message}`);
      }
      
      const newCheck = transformFromDatabase(data);
      setChecks(prev => [newCheck, ...prev]);
      console.log('✅ Cheque criado com sucesso:', newCheck.id);
    } catch (error) {
      console.error('❌ Erro ao criar cheque:', error);
      throw error;
    }
  };

  const updateCheck = async (check: Check) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.map(c => c.id === check.id ? check : c));
      return;
    }

    try {
      const dbData = transformToDatabase(check);
      const { error } = await supabase.from('checks').update(dbData).eq('id', check.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar cheque: ${error.message}`);
      }
      
      setChecks(prev => prev.map(c => c.id === check.id ? check : c));
      
      // Reload cash balance to reflect any status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar cheque:', error);
      throw error;
    }
  };

  const deleteCheck = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setChecks(prev => prev.filter(check => check.id !== id));
      return;
    }

    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) throw error;
    
    setChecks(prev => prev.filter(check => check.id !== id));
  };

  // Boleto functions
  const createBoleto = async (boletoData: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newBoleto = {
        ...boletoData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setBoletos(prev => [newBoleto, ...prev]);
      return;
    }

    try {
      console.log('🔄 Dados do boleto antes da transformação:', boletoData);
      
      const dbData = transformToDatabase(boletoData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('boletos').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um boleto com os mesmos dados já existe (cliente, valor, vencimento e parcela). Verifique se não há duplicação.');
        }
        throw new Error(`Erro ao criar boleto: ${error.message}`);
      }
      
      const newBoleto = transformFromDatabase(data);
      setBoletos(prev => [newBoleto, ...prev]);
      console.log('✅ Boleto criado com sucesso:', newBoleto.id);
    } catch (error) {
      console.error('❌ Erro ao criar boleto:', error);
      throw error;
    }
  };

  const updateBoleto = async (boleto: Boleto) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
      return;
    }

    try {
      const dbData = transformToDatabase(boleto);
      const { error } = await supabase.from('boletos').update(dbData).eq('id', boleto.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao atualizar boleto: ${error.message}`);
      }
      
      setBoletos(prev => prev.map(b => b.id === boleto.id ? boleto : b));
      
      // Reload cash balance to reflect any status changes
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao atualizar boleto:', error);
      throw error;
    }
  };

  const deleteBoleto = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setBoletos(prev => prev.filter(boleto => boleto.id !== id));
      return;
    }

    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw error;
    
    setBoletos(prev => prev.filter(boleto => boleto.id !== id));
  };

  // Employee functions
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEmployee = {
        ...employeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployees(prev => [newEmployee, ...prev]);
      return;
    }

    try {
      console.log('🔄 Dados do funcionário antes da transformação:', employeeData);
      
      // Validar dados antes de enviar
      if (!employeeData.name?.trim()) {
        throw new Error('Nome do funcionário é obrigatório');
      }
      
      if (!employeeData.position?.trim()) {
        throw new Error('Cargo do funcionário é obrigatório');
      }
      
      if (!employeeData.salary || employeeData.salary <= 0) {
        throw new Error('Salário deve ser maior que zero');
      }
      
      const dbData = transformToDatabase(employeeData);
      console.log('🔄 Dados transformados para o banco:', dbData);
      
      const { data, error } = await supabase.from('employees').insert([dbData]).select().single();
      
      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        if (error.code === '23505') {
          throw new Error('Um funcionário com os mesmos dados já existe. O sistema previne duplicatas automaticamente.');
        }
        if (error.code === '23514') {
          throw new Error('Dados inválidos. Verifique os valores inseridos.');
        }
        throw new Error(`Erro ao criar funcionário: ${error.message}`);
      }
      
      const newEmployee = transformFromDatabase(data);
      setEmployees(prev => [newEmployee, ...prev]);
      console.log('✅ Funcionário criado com sucesso:', newEmployee.id);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      throw error;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      return;
    }

    const dbData = transformToDatabase(employee);
    const { error } = await supabase.from('employees').update(dbData).eq('id', employee.id);
    
    if (error) throw error;
    
    setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
  };

  const deleteEmployee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      return;
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    
    setEmployees(prev => prev.filter(employee => employee.id !== id));
  };

  // Employee payment functions
  const createEmployeePayment = async (paymentData: EmployeePayment) => {
    if (!isSupabaseConfigured()) {
      setEmployeePayments(prev => [paymentData, ...prev]);
      return;
    }

    try {
      const dbData = transformToDatabase(paymentData);
      const { data, error } = await supabase.from('employee_payments').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar pagamento: ${error.message}`);
      }
      
      const newPayment = transformFromDatabase(data);
      setEmployeePayments(prev => [newPayment, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
      throw error;
    }
  };

  const createEmployeeAdvance = async (advanceData: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newAdvance = {
        ...advanceData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployeeAdvances(prev => [newAdvance, ...prev]);
      return;
    }

    try {
      const dbData = transformToDatabase(advanceData);
      const { data, error } = await supabase.from('employee_advances').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar adiantamento: ${error.message}`);
      }
      
      const newAdvance = transformFromDatabase(data);
      setEmployeeAdvances(prev => [newAdvance, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar adiantamento:', error);
      throw error;
    }
  };

  const updateEmployeeAdvance = async (advance: EmployeeAdvance) => {
    if (!isSupabaseConfigured()) {
      setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
      return;
    }

    const dbData = transformToDatabase(advance);
    const { error } = await supabase.from('employee_advances').update(dbData).eq('id', advance.id);
    
    if (error) throw error;
    
    setEmployeeAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
  };

  const createEmployeeOvertime = async (overtimeData: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newOvertime = {
        ...overtimeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setEmployeeOvertimes(prev => [newOvertime, ...prev]);
      return;
    }

    const dbData = transformToDatabase(overtimeData);
    const { data, error } = await supabase.from('employee_overtimes').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newOvertime = transformFromDatabase(data);
    setEmployeeOvertimes(prev => [newOvertime, ...prev]);
  };

  const updateEmployeeOvertime = async (overtime: EmployeeOvertime) => {
    if (!isSupabaseConfigured()) {
      setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
      return;
    }

    const dbData = transformToDatabase(overtime);
    const { error } = await supabase.from('employee_overtimes').update(dbData).eq('id', overtime.id);
    
    if (error) throw error;
    
    setEmployeeOvertimes(prev => prev.map(o => o.id === overtime.id ? overtime : o));
  };

  const updateEmployeeCommission = async (commission: EmployeeCommission) => {
    if (!isSupabaseConfigured()) {
      setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
      return;
    }

    const dbData = transformToDatabase(commission);
    const { error } = await supabase.from('employee_commissions').update(dbData).eq('id', commission.id);
    
    if (error) throw error;
    
    setEmployeeCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
  };

  // Cash management functions
  const initializeCashBalance = async (initialAmount: number) => {
    if (!isSupabaseConfigured()) {
      const newBalance = {
        id: '1',
        currentBalance: initialAmount,
        initialBalance: initialAmount,
        initialDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setCashBalance(newBalance);
      return;
    }

    try {
      // Verificar se já existe um saldo
      const { data: existingBalance } = await supabase
        .from('cash_balances')
        .select('*')
        .limit(1)
        .single();
      
      if (existingBalance) {
        // Atualizar saldo existente
        const { data, error } = await supabase
          .from('cash_balances')
          .update({
            current_balance: initialAmount,
            initial_balance: initialAmount,
            initial_date: new Date().toISOString().split('T')[0],
            last_updated: new Date().toISOString()
          })
          .eq('id', existingBalance.id)
          .select()
          .single();
        
        if (error) throw error;
        setCashBalance(transformFromDatabase(data));
      } else {
        // Criar novo saldo
        const { data, error } = await supabase.from('cash_balances').insert([{
          current_balance: initialAmount,
          initial_balance: initialAmount,
          initial_date: new Date().toISOString().split('T')[0],
          last_updated: new Date().toISOString()
        }]).select().single();
        
        if (error) throw error;
        setCashBalance(transformFromDatabase(data));
      }
      
      // Recalcular saldo baseado em todas as transações
      await supabase.rpc('recalculate_cash_balance');
      
      // Recarregar dados
      await loadAllData();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar caixa:', error);
      throw error;
    }
  };

  // Função para recalcular saldo do caixa
  const recalculateCashBalance = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      await supabase.rpc('recalculate_cash_balance');
      await loadAllData();
      console.log('✅ Saldo do caixa recalculado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recalcular saldo:', error);
      throw error;
    }
  };

  // Função para limpar duplicatas
  const cleanupDuplicates = async () => {
    if (!isSupabaseConfigured()) return;
    
    try {
      console.log('🧹 Iniciando limpeza de duplicatas...');
      
      // Executar limpeza via SQL
      const { error } = await supabase.rpc('check_system_integrity');
      if (error) throw error;
      
      await loadAllData();
      console.log('✅ Limpeza de duplicatas concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      throw error;
    }
  };

  const updateCashBalance = async (balance: CashBalance) => {
    if (!isSupabaseConfigured()) {
      setCashBalance(balance);
      return;
    }

    const dbData = transformToDatabase(balance);
    const { error } = await supabase.from('cash_balances').update(dbData).eq('id', balance.id);
    
    if (error) throw error;
    
    setCashBalance(balance);
  };

  const createCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTransaction = {
        ...transactionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setCashTransactions(prev => [newTransaction, ...prev]);
      return;
    }

    const dbData = transformToDatabase(transactionData);
    const { data, error } = await supabase.from('cash_transactions').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newTransaction = transformFromDatabase(data);
    setCashTransactions(prev => [newTransaction, ...prev]);
  };

  // PIX Fee functions
  const createPixFee = async (pixFeeData: Omit<PixFee, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newPixFee = {
        ...pixFeeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setPixFees(prev => [newPixFee, ...prev]);
      return;
    }

    try {
      const dbData = transformToDatabase(pixFeeData);
      const { data, error } = await supabase.from('pix_fees').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar tarifa PIX: ${error.message}`);
      }
      
      const newPixFee = transformFromDatabase(data);
      setPixFees(prev => [newPixFee, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar tarifa PIX:', error);
      throw error;
    }
  };

  const updatePixFee = async (pixFee: PixFee) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.map(p => p.id === pixFee.id ? pixFee : p));
      return;
    }

    const dbData = transformToDatabase(pixFee);
    const { error } = await supabase.from('pix_fees').update(dbData).eq('id', pixFee.id);
    
    if (error) throw error;
    
    setPixFees(prev => prev.map(p => p.id === pixFee.id ? pixFee : p));
  };

  const deletePixFee = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setPixFees(prev => prev.filter(pixFee => pixFee.id !== id));
      return;
    }

    const { error } = await supabase.from('pix_fees').delete().eq('id', id);
    if (error) throw error;
    
    setPixFees(prev => prev.filter(pixFee => pixFee.id !== id));
  };

  // Tax functions
  const createTax = async (taxData: Omit<Tax, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newTax = {
        ...taxData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTaxes(prev => [newTax, ...prev]);
      return;
    }

    try {
      const dbData = transformToDatabase(taxData);
      const { data, error } = await supabase.from('taxes').insert([dbData]).select().single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw new Error(`Erro ao criar imposto: ${error.message}`);
      }
      
      const newTax = transformFromDatabase(data);
      setTaxes(prev => [newTax, ...prev]);
      
      // Reload cash balance to reflect the new transaction
      await loadAllData();
    } catch (error) {
      console.error('❌ Erro ao criar imposto:', error);
      throw error;
    }
  };

  const updateTax = async (tax: Tax) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
      return;
    }

    const dbData = transformToDatabase(tax);
    const { error } = await supabase.from('taxes').update(dbData).eq('id', tax.id);
    
    if (error) throw error;
    
    setTaxes(prev => prev.map(t => t.id === tax.id ? tax : t));
  };

  const deleteTax = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setTaxes(prev => prev.filter(tax => tax.id !== id));
      return;
    }

    const { error } = await supabase.from('taxes').delete().eq('id', id);
    if (error) throw error;
    
    setTaxes(prev => prev.filter(tax => tax.id !== id));
  };

  // Agenda functions
  const createAgendaEvent = async (eventData: Omit<AgendaEvent, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newEvent = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setAgendaEvents(prev => [newEvent, ...prev]);
      return;
    }

    const dbData = transformToDatabase(eventData);
    const { data, error } = await supabase.from('agenda_events').insert([dbData]).select().single();
    
    if (error) throw error;
    
    const newEvent = transformFromDatabase(data);
    setAgendaEvents(prev => [newEvent, ...prev]);
  };

  const updateAgendaEvent = async (event: AgendaEvent) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.map(e => e.id === event.id ? event : e));
      return;
    }

    const dbData = transformToDatabase(event);
    const { error } = await supabase.from('agenda_events').update(dbData).eq('id', event.id);
    
    if (error) throw error;
    
    setAgendaEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const deleteAgendaEvent = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setAgendaEvents(prev => prev.filter(event => event.id !== id));
      return;
    }

    const { error } = await supabase.from('agenda_events').delete().eq('id', id);
    if (error) throw error;
    
    setAgendaEvents(prev => prev.filter(event => event.id !== id));
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const value: AppContextType = {
    // Data
    sales,
    debts,
    checks,
    boletos,
    employees,
    employeePayments,
    employeeAdvances,
    employeeOvertimes,
    employeeCommissions,
    cashBalance,
    cashTransactions,
    pixFees,
    taxes,
    agendaEvents,
    
    // State
    loading,
    isLoading,
    error,
    
    // Actions
    loadAllData,
    
    // Sales
    addSale,
    updateSale,
    deleteSale,
    
    // Debts
    createDebt,
    updateDebt,
    deleteDebt,
    
    // Checks
    createCheck,
    updateCheck,
    deleteCheck,
    
    // Boletos
    createBoleto,
    updateBoleto,
    deleteBoleto,
    
    // Employees
    createEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Employee related
    createEmployeePayment,
    createEmployeeAdvance,
    updateEmployeeAdvance,
    createEmployeeOvertime,
    updateEmployeeOvertime,
    updateEmployeeCommission,
    
    // Cash
    initializeCashBalance,
    updateCashBalance,
    recalculateCashBalance,
    createCashTransaction,
    
    // PIX Fees
    createPixFee,
    updatePixFee,
    deletePixFee,
    
    // Taxes
    createTax,
    updateTax,
    deleteTax,
    
    // Agenda
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    
    // System utilities
    cleanupDuplicates,
    
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}