import { supabase, isSupabaseConfigured, testSupabaseConnection } from './supabase';
import { saveOffline, addToSyncQueue } from './offlineStorage';
import { ErrorHandler } from './errorHandler';
import type { 
  Sale, 
  Employee, 
  Debt, 
  Check, 
  Boleto, 
  CashTransaction, 
  CashBalance,
  AgendaEvent, 
  Tax, 
  PixFee
} from '../types';

// ========================================
// VALIDAÇÃO E SANITIZAÇÃO
// ========================================

export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized = JSON.parse(JSON.stringify(payload));
  
  // Lista de campos UUID que podem estar vazios
  const uuidFields = [
    'id', 'sellerId', 'seller_id', 'customerId', 'customer_id',
    'saleId', 'sale_id', 'debtId', 'debt_id', 'checkId', 'check_id',
    'boletoId', 'boleto_id', 'employeeId', 'employee_id',
    'relatedId', 'related_id', 'parentId', 'parent_id'
  ];
  
  uuidFields.forEach(field => {
    if (sanitized.hasOwnProperty(field)) {
      const value = sanitized[field];
      if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
        sanitized[field] = null;
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          sanitized[field] = null;
        } else if (trimmed.startsWith('offline-') || trimmed.startsWith('temp-')) {
          sanitized[field] = null;
        } else if (!isValidUUID(trimmed)) {
          console.warn(`⚠️ UUID inválido para ${field}:`, trimmed, '- convertendo para null');
          sanitized[field] = null;
        } else {
          sanitized[field] = trimmed;
        }
      }
    }
  });
  
  // Sanitizar payment methods
  if (sanitized.paymentMethods && Array.isArray(sanitized.paymentMethods)) {
    sanitized.paymentMethods = sanitized.paymentMethods.map((method: any) => {
      const cleanedMethod = { ...method };
      uuidFields.forEach(field => {
        if (cleanedMethod.hasOwnProperty(field)) {
          const value = cleanedMethod[field];
          if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
            cleanedMethod[field] = null;
          } else if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
              cleanedMethod[field] = null;
            } else if (!isValidUUID(trimmed)) {
              cleanedMethod[field] = null;
            } else {
              cleanedMethod[field] = trimmed;
            }
          }
        }
      });
      return cleanedMethod;
    });
  }
  
  return sanitized;
}

export function transformToSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item));
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = transformToSnakeCase(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        typeof item === 'object' ? transformToSnakeCase(item) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

// ========================================
// VERIFICAÇÃO DE CONEXÃO
// ========================================

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('📱 Supabase não configurado - modo offline ativo');
      return false;
    }

    const { success } = await testSupabaseConnection();
    return success;
  } catch (error) {
    console.warn('⚠️ Falha na verificação de conexão:', error);
    return false;
  }
}

// ========================================
// CLASSE BASE PARA SERVIÇOS
// ========================================

class BaseService<T> {
  constructor(private tableName: string) {}

  async create(data: Partial<T>): Promise<string> {
    console.log(`🔄 Criando ${this.tableName}:`, data);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Salvando ${this.tableName} offline...`);
      const offlineId = await saveOffline(this.tableName, data);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(data);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erro ao criar ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} criado com sucesso:`, result.id);
      return result.id;
    } catch (error) {
      console.error(`❌ Falha ao criar ${this.tableName}, salvando offline...`);
      ErrorHandler.logProjectError(error, `Create ${this.tableName}`);
      
      const offlineId = await saveOffline(this.tableName, data);
      return offlineId;
    }
  }

  async getAll(): Promise<T[]> {
    console.log(`🔄 Carregando ${this.tableName}...`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 ${this.tableName} indisponível offline`);
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`❌ Erro ao carregar ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} carregado: ${data.length} registros`);
      return data as T[];
    } catch (error) {
      console.error(`❌ Falha ao carregar ${this.tableName}:`, error);
      ErrorHandler.logProjectError(error, `Load ${this.tableName}`);
      return [];
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    console.log(`🔄 Atualizando ${this.tableName} ${id}:`, data);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Enfileirando atualização de ${this.tableName} para sincronização...`);
      await addToSyncQueue({
        type: 'update',
        table: this.tableName,
        data: { id, ...data },
        maxRetries: 3
      });
      return { id, ...data } as T;
    }
    
    try {
      const sanitizedData = sanitizePayload(data);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erro ao atualizar ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} atualizado com sucesso`);
      return result as T;
    } catch (error) {
      console.error(`❌ Falha ao atualizar ${this.tableName}, enfileirando...`);
      ErrorHandler.logProjectError(error, `Update ${this.tableName}`);
      
      await addToSyncQueue({
        type: 'update',
        table: this.tableName,
        data: { id, ...data },
        maxRetries: 3
      });
      
      return { id, ...data } as T;
    }
  }

  async delete(id: string): Promise<void> {
    console.log(`🔄 Excluindo ${this.tableName} ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log(`📱 Enfileirando exclusão de ${this.tableName} para sincronização...`);
      await addToSyncQueue({
        type: 'delete',
        table: this.tableName,
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Erro ao excluir ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`✅ ${this.tableName} excluído com sucesso`);
    } catch (error) {
      console.error(`❌ Falha ao excluir ${this.tableName}, enfileirando...`);
      ErrorHandler.logProjectError(error, `Delete ${this.tableName}`);
      
      await addToSyncQueue({
        type: 'delete',
        table: this.tableName,
        data: { id },
        maxRetries: 3
      });
    }
  }
}

// ========================================
// SERVIÇO DE VENDAS COM RPC
// ========================================

// Função para criar acerto automaticamente quando venda tem pagamento "acerto"
async function createAcertoFromSale(saleData: any): Promise<void> {
  const hasAcertoPayment = saleData.paymentMethods?.some((method: any) => method.type === 'acerto');
  
  if (!hasAcertoPayment) return;
  
  try {
    // Verificar se já existe acerto para este cliente
    const { data: existingAcertos, error: searchError } = await supabase
      .from('acertos')
      .select('*')
      .eq('client_name', saleData.client);
    
    if (searchError) {
      console.error('❌ Erro ao buscar acertos existentes:', searchError);
      return;
    }
    
    const acertoAmount = saleData.paymentMethods
      .filter((method: any) => method.type === 'acerto')
      .reduce((sum: number, method: any) => sum + method.amount, 0);
    
    if (existingAcertos && existingAcertos.length > 0) {
      // Atualizar acerto existente
      const existingAcerto = existingAcertos[0];
      const newTotalAmount = existingAcerto.total_amount + acertoAmount;
      const newPendingAmount = newTotalAmount - existingAcerto.paid_amount;
      
      const { error: updateError } = await supabase
        .from('acertos')
        .update({
          total_amount: newTotalAmount,
          pending_amount: newPendingAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAcerto.id);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar acerto:', updateError);
      } else {
        console.log('✅ Acerto atualizado para cliente:', saleData.client);
      }
    } else {
      // Criar novo acerto
      const { error: createError } = await supabase
        .from('acertos')
        .insert([{
          client_name: saleData.client,
          total_amount: acertoAmount,
          paid_amount: 0,
          pending_amount: acertoAmount,
          status: 'pendente'
        }]);
      
      if (createError) {
        console.error('❌ Erro ao criar acerto:', createError);
      } else {
        console.log('✅ Novo acerto criado para cliente:', saleData.client);
      }
    }
  } catch (error) {
    console.error('❌ Erro no processamento de acerto:', error);
  }
}

export const salesService = {
  async create(saleData: Partial<Sale>): Promise<string> {
    console.log('🔄 Criando venda via RPC:', saleData);
    
    // Validação básica
    if (!saleData.client || (typeof saleData.client === 'string' && !saleData.client.trim())) {
      throw new Error('Cliente é obrigatório e não pode estar vazio');
    }
    
    if (!saleData.totalValue || saleData.totalValue <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }
    
    if (!saleData.paymentMethods || !Array.isArray(saleData.paymentMethods) || saleData.paymentMethods.length === 0) {
      throw new Error('Pelo menos um método de pagamento é obrigatório');
    }
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Salvando venda offline...');
      const offlineId = await saveOffline('sales', saleData);
      return offlineId;
    }
    
    try {
      // Sanitizar dados antes de enviar
      const sanitizedData = sanitizePayload(saleData);
      const payload = transformToSnakeCase(sanitizedData);
      
      console.log('📦 Payload sanitizado:', payload);
      
      // Usar RPC para criar venda
      const { data: saleId, error } = await supabase
        .rpc('create_sale', { payload });
      
      if (error) {
        console.error('❌ Erro no RPC create_sale:', error);
        throw error;
      }
      
      console.log('✅ Venda criada via RPC:', saleId);
      return saleId;
    } catch (error) {
      console.error('❌ Falha no RPC, salvando offline...');
      ErrorHandler.logProjectError(error, 'Create Sale RPC');
      
      const offlineId = await saveOffline('sales', saleData);
      return offlineId;
    }
  },

  async getAll(): Promise<Sale[]> {
    console.log('🔄 Carregando vendas...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Vendas indisponíveis offline');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao carregar vendas:', error);
        throw error;
      }
      
      console.log(`✅ Vendas carregadas: ${data.length} registros`);
      return data as Sale[];
    } catch (error) {
      console.error('❌ Falha ao carregar vendas:', error);
      ErrorHandler.logProjectError(error, 'Load Sales');
      return [];
    }
  },

  async update(id: string, saleData: Partial<Sale>): Promise<Sale> {
    console.log(`🔄 Atualizando venda ${id}:`, saleData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Enfileirando atualização de venda...');
      await addToSyncQueue({
        type: 'update',
        table: 'sales',
        data: { id, ...saleData },
        maxRetries: 3
      });
      return { id, ...saleData } as Sale;
    }
    
    try {
      const sanitizedData = sanitizePayload(saleData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('sales')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao atualizar venda:', error);
        throw error;
      }
      
      console.log('✅ Venda atualizada com sucesso');
      return result as Sale;
    } catch (error) {
      console.error('❌ Falha ao atualizar venda, enfileirando...');
      ErrorHandler.logProjectError(error, 'Update Sale');
      
      await addToSyncQueue({
        type: 'update',
        table: 'sales',
        data: { id, ...saleData },
        maxRetries: 3
      });
      
      return { id, ...saleData } as Sale;
    }
  },

  async delete(id: string): Promise<void> {
    console.log(`🔄 Excluindo venda ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Enfileirando exclusão de venda...');
      await addToSyncQueue({
        type: 'delete',
        table: 'sales',
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao excluir venda:', error);
        throw error;
      }
      
      console.log('✅ Venda excluída com sucesso');
    } catch (error) {
      console.error('❌ Falha ao excluir venda, enfileirando...');
      ErrorHandler.logProjectError(error, 'Delete Sale');
      
      await addToSyncQueue({
        type: 'delete',
        table: 'sales',
        data: { id },
        maxRetries: 3
      });
    }
  }
};

// ========================================
// SERVIÇO DE CAIXA
// ========================================

export const cashService = {
  async getCurrentBalance(): Promise<CashBalance | null> {
    console.log('🔄 Carregando saldo do caixa...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Saldo do caixa indisponível offline');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_current_cash_balance');
      
      if (error) {
        console.error('❌ Erro ao carregar saldo:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ Nenhum saldo encontrado - caixa não inicializado');
        return null;
      }
      
      console.log('✅ Saldo carregado:', data[0]);
      return data[0] as CashBalance;
    } catch (error) {
      console.error('❌ Falha ao carregar saldo:', error);
      ErrorHandler.logProjectError(error, 'Load Cash Balance');
      return null;
    }
  },

  async getTransactions(): Promise<CashTransaction[]> {
    console.log('🔄 Carregando transações do caixa...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Transações indisponíveis offline');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao carregar transações:', error);
        throw error;
      }
      
      console.log(`✅ Transações carregadas: ${data.length} registros`);
      return data as CashTransaction[];
    } catch (error) {
      console.error('❌ Falha ao carregar transações:', error);
      ErrorHandler.logProjectError(error, 'Load Cash Transactions');
      return [];
    }
  },

  async initializeCashBalance(initialAmount: number): Promise<void> {
    console.log('🔄 Inicializando caixa:', { initialAmount });
    
    if (!initialAmount || initialAmount <= 0) {
      throw new Error('Valor inicial deve ser maior que zero');
    }
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      throw new Error('Conexão com servidor necessária para inicializar o caixa');
    }
    
    try {
      const { data, error } = await supabase
        .rpc('initialize_cash_balance', { initial_amount: initialAmount });
      
      if (error) {
        console.error('❌ Erro ao inicializar caixa:', error);
        throw error;
      }
      
      console.log('✅ Caixa inicializado com sucesso:', data);
    } catch (error) {
      console.error('❌ Falha ao inicializar caixa:', error);
      ErrorHandler.logProjectError(error, 'Initialize Cash Balance');
      throw error;
    }
  },

  async recalculateBalance(): Promise<CashBalance> {
    console.log('🔄 Recalculando saldo do caixa...');
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      throw new Error('Conexão com servidor necessária para recalcular o saldo');
    }
    
    try {
      const { error } = await supabase.rpc('recalculate_cash_balance');
      
      if (error) {
        console.error('❌ Erro ao recalcular saldo:', error);
        throw error;
      }
      
      // Buscar saldo atualizado
      const updatedBalance = await this.getCurrentBalance();
      console.log('✅ Saldo recalculado com sucesso');
      return updatedBalance!;
    } catch (error) {
      console.error('❌ Falha ao recalcular saldo:', error);
      ErrorHandler.logProjectError(error, 'Recalculate Cash Balance');
      throw error;
    }
  },

  async createTransaction(transactionData: Partial<CashTransaction>): Promise<string> {
    console.log('🔄 Criando transação de caixa:', transactionData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Salvando transação offline...');
      const offlineId = await saveOffline('cash_transactions', transactionData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('cash_transactions')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar transação:', error);
        throw error;
      }
      
      console.log('✅ Transação criada com sucesso:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Falha ao criar transação, salvando offline...');
      ErrorHandler.logProjectError(error, 'Create Cash Transaction');
      
      const offlineId = await saveOffline('cash_transactions', transactionData);
      return offlineId;
    }
  },

  async updateTransaction(id: string, transactionData: Partial<CashTransaction>): Promise<CashTransaction> {
    console.log(`🔄 Atualizando transação ${id}:`, transactionData);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Enfileirando atualização de transação...');
      await addToSyncQueue({
        type: 'update',
        table: 'cash_transactions',
        data: { id, ...transactionData },
        maxRetries: 3
      });
      return { id, ...transactionData } as CashTransaction;
    }
    
    try {
      const sanitizedData = sanitizePayload(transactionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('cash_transactions')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao atualizar transação:', error);
        throw error;
      }
      
      console.log('✅ Transação atualizada com sucesso');
      return result as CashTransaction;
    } catch (error) {
      console.error('❌ Falha ao atualizar transação, enfileirando...');
      ErrorHandler.logProjectError(error, 'Update Cash Transaction');
      
      await addToSyncQueue({
        type: 'update',
        table: 'cash_transactions',
        data: { id, ...transactionData },
        maxRetries: 3
      });
      
      return { id, ...transactionData } as CashTransaction;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    console.log(`🔄 Excluindo transação ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      console.log('📱 Enfileirando exclusão de transação...');
      await addToSyncQueue({
        type: 'delete',
        table: 'cash_transactions',
        data: { id },
        maxRetries: 3
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao excluir transação:', error);
        throw error;
      }
      
      console.log('✅ Transação excluída com sucesso');
    } catch (error) {
      console.error('❌ Falha ao excluir transação, enfileirando...');
      ErrorHandler.logProjectError(error, 'Delete Cash Transaction');
      
      await addToSyncQueue({
        type: 'delete',
        table: 'cash_transactions',
        data: { id },
        maxRetries: 3
      });
    }
  }
};

// ========================================
// INSTÂNCIAS DOS SERVIÇOS
// ========================================

export const employeesService = new BaseService<Employee>('employees');
export const debtsService = new BaseService<Debt>('debts');
export const checksService = new BaseService<Check>('checks');
export const boletosService = new BaseService<Boleto>('boletos');
export const agendaService = new BaseService<AgendaEvent>('agenda_events');
export const taxesService = new BaseService<Tax>('taxes');
export const pixFeesService = new BaseService<PixFee>('pix_fees');
export const acertosService = new BaseService<any>('acertos');

// ========================================
// SERVIÇOS DE FUNCIONÁRIOS
// ========================================

export const employeePaymentsService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Payments');
      return [];
    }
  },

  async create(paymentData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_payments', paymentData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(paymentData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_payments')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Payment');
      const offlineId = await saveOffline('employee_payments', paymentData);
      return offlineId;
    }
  }
};

export const employeeAdvancesService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Advances');
      return [];
    }
  },

  async create(advanceData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_advances', advanceData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_advances')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Advance');
      const offlineId = await saveOffline('employee_advances', advanceData);
      return offlineId;
    }
  },

  async update(id: string, advanceData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_advances',
        data: { id, ...advanceData },
        maxRetries: 3
      });
      return { id, ...advanceData };
    }
    
    try {
      const sanitizedData = sanitizePayload(advanceData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_advances')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Advance');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_advances',
        data: { id, ...advanceData },
        maxRetries: 3
      });
      return { id, ...advanceData };
    }
  }
};

export const employeeOvertimesService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Overtimes');
      return [];
    }
  },

  async create(overtimeData: any): Promise<string> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      const offlineId = await saveOffline('employee_overtimes', overtimeData);
      return offlineId;
    }
    
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_overtimes')
        .insert([snakeCaseData])
        .select()
        .single();
      
      if (error) throw error;
      return result.id;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Create Employee Overtime');
      const offlineId = await saveOffline('employee_overtimes', overtimeData);
      return offlineId;
    }
  },

  async update(id: string, overtimeData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_overtimes',
        data: { id, ...overtimeData },
        maxRetries: 3
      });
      return { id, ...overtimeData };
    }
    
    try {
      const sanitizedData = sanitizePayload(overtimeData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_overtimes')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Overtime');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_overtimes',
        data: { id, ...overtimeData },
        maxRetries: 3
      });
      return { id, ...overtimeData };
    }
  }
};

export const employeeCommissionsService = {
  async getAll(): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Employee Commissions');
      return [];
    }
  },

  async update(id: string, commissionData: any): Promise<any> {
    const isConnected = await checkSupabaseConnection();
    
    if (!isConnected) {
      await addToSyncQueue({
        type: 'update',
        table: 'employee_commissions',
        data: { id, ...commissionData },
        maxRetries: 3
      });
      return { id, ...commissionData };
    }
    
    try {
      const sanitizedData = sanitizePayload(commissionData);
      const snakeCaseData = transformToSnakeCase(sanitizedData);
      
      const { data: result, error } = await supabase
        .from('employee_commissions')
        .update(snakeCaseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Update Employee Commission');
      await addToSyncQueue({
        type: 'update',
        table: 'employee_commissions',
        data: { id, ...commissionData },
        maxRetries: 3
      });
      return { id, ...commissionData };
    }
  }
};

// ========================================
// SERVIÇO DE DEBUG
// ========================================

export const debugService = {
  async getRecentSaleErrors(limit: number = 50): Promise<any[]> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return [];
    
    try {
      const { data, error } = await supabase
        .rpc('get_recent_sale_errors', { limit_count: limit });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Load Sale Errors');
      return [];
    }
  },

  async cleanupOldErrors(daysOld: number = 7): Promise<number> {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) return 0;
    
    try {
      const { data, error } = await supabase
        .rpc('cleanup_old_sale_errors', { days_old: daysOld });
      
      if (error) throw error;
      return data || 0;
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Cleanup Sale Errors');
      return 0;
    }
  }
};

// ========================================
// SERVIÇOS DE UPLOAD DE IMAGENS
// ========================================

export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    throw new Error('Conexão com servidor necessária para upload de imagens');
  }
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${checkId}-${imageType}.${fileExt}`;
    const filePath = `checks/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    return data.path;
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Upload Check Image');
    throw error;
  }
}

export async function deleteCheckImage(imagePath: string): Promise<void> {
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    throw new Error('Conexão com servidor necessária para deletar imagens');
  }
  
  try {
    const { error } = await supabase.storage
      .from('check-images')
      .remove([imagePath]);
    
    if (error) throw error;
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Delete Check Image');
    throw error;
  }
}

export function getCheckImageUrl(imagePath: string): string {
  if (!isSupabaseConfigured()) {
    return '';
  }
  
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}