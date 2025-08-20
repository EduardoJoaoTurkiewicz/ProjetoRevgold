import { createClient } from '@supabase/supabase-js';
import { Sale, Debt, Check, Boleto, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Installment, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sistema robusto de verificação de configuração
export const isSupabaseConfigured = () => {
  const isConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project-id.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseUrl.includes('supabase.co') &&
    supabaseAnonKey.length > 50
  );
  
  if (!isConfigured) {
    console.warn('⚠️ SUPABASE NÃO CONFIGURADO - Configure o arquivo .env com suas credenciais reais do Supabase');
  } else {
    console.log('✅ Supabase configurado corretamente');
  }
  
  return isConfigured;
};

// Criar cliente Supabase com configuração robusta
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Sistema de autenticação automática
export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.warn('❌ Supabase não configurado - dados não serão salvos');
    return false;
  }

  try {
    // Verificar se já está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ Usuário já autenticado:', session.user.email);
      return true;
    }

    // Tentar fazer login automático com usuário padrão
    console.log('🔄 Fazendo login automático...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@revgold.com',
      password: 'revgold123'
    });

    if (error) {
      console.error('❌ Erro no login automático:', error.message);
      
      // Se o usuário não existe, tentar criar
      if (error.message.includes('Invalid login credentials')) {
        console.log('🔄 Tentando criar usuário padrão...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'admin@revgold.com',
          password: 'revgold123'
        });

        if (signUpError) {
          console.error('❌ Erro ao criar usuário:', signUpError.message);
          return false;
        }

        console.log('✅ Usuário criado e autenticado:', signUpData.user?.email);
        return true;
      }
      
      return false;
    }

    console.log('✅ Login automático realizado:', data.user.email);
    return true;
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return false;
  }
};

// Wrapper para operações do banco com retry e autenticação
const withAuth = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure o arquivo .env com suas credenciais.');
  }

  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar. Verifique suas credenciais do Supabase.');
  }

  try {
    return await operation();
  } catch (error: any) {
    // Retry uma vez em caso de erro de rede
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      console.log('🔄 Tentando novamente após erro de rede...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await operation();
    }
    throw error;
  }
};

// Database operations for Sales
export const salesService = {
  async getAll(): Promise<Sale[]> {
    return withAuth(async () => {
      console.log('🔄 Buscando todas as vendas...');
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar vendas:', error);
        throw new Error(`Erro ao buscar vendas: ${error.message}`);
      }
      
      const sales = (data || []).map(item => ({
        id: item.id,
        date: item.date,
        deliveryDate: item.delivery_date,
        client: item.client,
        sellerId: item.seller_id,
        customCommissionRate: item.custom_commission_rate || 5,
        products: item.products || 'Produtos vendidos',
        observations: item.observations || '',
        totalValue: Number(item.total_value) || 0,
        paymentMethods: item.payment_methods || [],
        receivedAmount: Number(item.received_amount) || 0,
        pendingAmount: Number(item.pending_amount) || 0,
        status: item.status || 'pendente',
        paymentDescription: item.payment_description || '',
        paymentObservations: item.payment_observations || '',
        createdAt: item.created_at
      }));
      
      console.log('✅ Vendas carregadas:', sales.length);
      return sales;
    });
  },

  async create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    return withAuth(async () => {
      console.log('🔄 Criando nova venda:', sale);
      const { data, error } = await supabase
        .from('sales')
        .insert([{
          date: sale.date,
          delivery_date: sale.deliveryDate,
          client: sale.client,
          seller_id: sale.sellerId,
          custom_commission_rate: sale.customCommissionRate || 5,
          products: sale.products || 'Produtos vendidos',
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

      if (error) {
        console.error('❌ Erro ao criar venda:', error);
        throw new Error(`Erro ao criar venda: ${error.message}`);
      }
      
      const newSale = {
        id: data.id,
        date: data.date,
        deliveryDate: data.delivery_date,
        client: data.client,
        sellerId: data.seller_id,
        customCommissionRate: data.custom_commission_rate || 5,
        products: data.products || 'Produtos vendidos',
        observations: data.observations || '',
        totalValue: Number(data.total_value),
        paymentMethods: data.payment_methods,
        receivedAmount: Number(data.received_amount),
        pendingAmount: Number(data.pending_amount),
        status: data.status,
        paymentDescription: data.payment_description || '',
        paymentObservations: data.payment_observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Venda criada com sucesso:', newSale.id);
      return newSale;
    });
  },

  async update(sale: Sale): Promise<Sale> {
    return withAuth(async () => {
      console.log('🔄 Atualizando venda:', sale.id);
      const { data, error } = await supabase
        .from('sales')
        .update({
          date: sale.date,
          delivery_date: sale.deliveryDate,
          client: sale.client,
          seller_id: sale.sellerId,
          custom_commission_rate: sale.customCommissionRate || 5,
          products: sale.products || 'Produtos vendidos',
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

      if (error) {
        console.error('❌ Erro ao atualizar venda:', error);
        throw new Error(`Erro ao atualizar venda: ${error.message}`);
      }
      
      const updatedSale = {
        id: data.id,
        date: data.date,
        deliveryDate: data.delivery_date,
        client: data.client,
        sellerId: data.seller_id,
        customCommissionRate: data.custom_commission_rate || 5,
        products: data.products || 'Produtos vendidos',
        observations: data.observations || '',
        totalValue: Number(data.total_value),
        paymentMethods: data.payment_methods,
        receivedAmount: Number(data.received_amount),
        pendingAmount: Number(data.pending_amount),
        status: data.status,
        paymentDescription: data.payment_description || '',
        paymentObservations: data.payment_observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Venda atualizada com sucesso:', updatedSale.id);
      return updatedSale;
    });
  },

  async delete(id: string): Promise<void> {
    return withAuth(async () => {
      console.log('🔄 Excluindo venda:', id);
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir venda:', error);
        throw new Error(`Erro ao excluir venda: ${error.message}`);
      }
      
      console.log('✅ Venda excluída com sucesso:', id);
    });
  }
};

// Database operations for Debts
export const debtsService = {
  async getAll(): Promise<Debt[]> {
    return withAuth(async () => {
      console.log('🔄 Buscando todas as dívidas...');
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar dívidas:', error);
        throw new Error(`Erro ao buscar dívidas: ${error.message}`);
      }
      
      const debts = (data || []).map(item => ({
        id: item.id,
        date: item.date,
        description: item.description || '',
        company: item.company || '',
        totalValue: Number(item.total_value) || 0,
        paymentMethods: item.payment_methods || [],
        isPaid: item.is_paid || false,
        paidAmount: Number(item.paid_amount) || 0,
        pendingAmount: Number(item.pending_amount) || 0,
        checksUsed: item.checks_used || [],
        paymentDescription: item.payment_description || '',
        debtPaymentDescription: item.debt_payment_description || '',
        createdAt: item.created_at
      }));
      
      console.log('✅ Dívidas carregadas:', debts.length);
      return debts;
    });
  },

  async create(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> {
    return withAuth(async () => {
      console.log('🔄 Criando nova dívida:', debt);
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

      if (error) {
        console.error('❌ Erro ao criar dívida:', error);
        throw new Error(`Erro ao criar dívida: ${error.message}`);
      }
      
      const newDebt = {
        id: data.id,
        date: data.date,
        description: data.description || '',
        company: data.company || '',
        totalValue: Number(data.total_value),
        paymentMethods: data.payment_methods,
        isPaid: data.is_paid,
        paidAmount: Number(data.paid_amount),
        pendingAmount: Number(data.pending_amount),
        checksUsed: data.checks_used,
        paymentDescription: data.payment_description || '',
        debtPaymentDescription: data.debt_payment_description || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Dívida criada com sucesso:', newDebt.id);
      return newDebt;
    });
  },

  async update(debt: Debt): Promise<Debt> {
    return withAuth(async () => {
      console.log('🔄 Atualizando dívida:', debt.id);
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

      if (error) {
        console.error('❌ Erro ao atualizar dívida:', error);
        throw new Error(`Erro ao atualizar dívida: ${error.message}`);
      }
      
      const updatedDebt = {
        id: data.id,
        date: data.date,
        description: data.description || '',
        company: data.company || '',
        totalValue: Number(data.total_value),
        paymentMethods: data.payment_methods,
        isPaid: data.is_paid,
        paidAmount: Number(data.paid_amount),
        pendingAmount: Number(data.pending_amount),
        checksUsed: data.checks_used,
        paymentDescription: data.payment_description || '',
        debtPaymentDescription: data.debt_payment_description || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Dívida atualizada com sucesso:', updatedDebt.id);
      return updatedDebt;
    });
  },

  async delete(id: string): Promise<void> {
    return withAuth(async () => {
      console.log('🔄 Excluindo dívida:', id);
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir dívida:', error);
        throw new Error(`Erro ao excluir dívida: ${error.message}`);
      }
      
      console.log('✅ Dívida excluída com sucesso:', id);
    });
  }
};

// Database operations for Employees
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    return withAuth(async () => {
      console.log('🔄 Buscando todos os funcionários...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
        throw new Error(`Erro ao buscar funcionários: ${error.message}`);
      }
      
      const employees = (data || []).map(item => ({
        id: item.id,
        name: item.name || '',
        position: item.position || '',
        isSeller: item.is_seller || false,
        salary: Number(item.salary) || 0,
        paymentDay: item.payment_day || 5,
        nextPaymentDate: item.next_payment_date,
        isActive: item.is_active ?? true,
        hireDate: item.hire_date,
        observations: item.observations || '',
        createdAt: item.created_at
      }));
      
      console.log('✅ Funcionários carregados:', employees.length);
      return employees;
    });
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
    return withAuth(async () => {
      console.log('🔄 Criando novo funcionário:', employee);
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

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw new Error(`Erro ao criar funcionário: ${error.message}`);
      }
      
      const newEmployee = {
        id: data.id,
        name: data.name,
        position: data.position,
        isSeller: data.is_seller,
        salary: Number(data.salary),
        paymentDay: data.payment_day,
        nextPaymentDate: data.next_payment_date,
        isActive: data.is_active,
        hireDate: data.hire_date,
        observations: data.observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Funcionário criado com sucesso:', newEmployee.id);
      return newEmployee;
    });
  },

  async update(employee: Employee): Promise<Employee> {
    return withAuth(async () => {
      console.log('🔄 Atualizando funcionário:', employee.id);
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

      if (error) {
        console.error('❌ Erro ao atualizar funcionário:', error);
        throw new Error(`Erro ao atualizar funcionário: ${error.message}`);
      }
      
      const updatedEmployee = {
        id: data.id,
        name: data.name,
        position: data.position,
        isSeller: data.is_seller,
        salary: Number(data.salary),
        paymentDay: data.payment_day,
        nextPaymentDate: data.next_payment_date,
        isActive: data.is_active,
        hireDate: data.hire_date,
        observations: data.observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Funcionário atualizado com sucesso:', updatedEmployee.id);
      return updatedEmployee;
    });
  },

  async delete(id: string): Promise<void> {
    return withAuth(async () => {
      console.log('🔄 Excluindo funcionário:', id);
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir funcionário:', error);
        throw new Error(`Erro ao excluir funcionário: ${error.message}`);
      }
      
      console.log('✅ Funcionário excluído com sucesso:', id);
    });
  }
};

// Database operations for Checks
export const checksService = {
  async getAll(): Promise<Check[]> {
    return withAuth(async () => {
      console.log('🔄 Buscando todos os cheques...');
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar cheques:', error);
        throw new Error(`Erro ao buscar cheques: ${error.message}`);
      }
      
      const checks = (data || []).map(item => ({
        id: item.id,
        saleId: item.sale_id,
        debtId: item.debt_id,
        client: item.client || '',
        value: Number(item.value) || 0,
        dueDate: item.due_date,
        status: item.status || 'pendente',
        isOwnCheck: item.is_own_check || false,
        observations: item.observations || '',
        usedFor: item.used_for || '',
        installmentNumber: item.installment_number,
        totalInstallments: item.total_installments,
        frontImage: item.front_image || '',
        backImage: item.back_image || '',
        selectedAvailableChecks: item.selected_available_checks || [],
        usedInDebt: item.used_in_debt,
        discountDate: item.discount_date,
        createdAt: item.created_at
      }));
      
      console.log('✅ Cheques carregados:', checks.length);
      return checks;
    });
  },

  async create(check: Omit<Check, 'id' | 'createdAt'>): Promise<Check> {
    return withAuth(async () => {
      console.log('🔄 Criando novo cheque:', check);
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

      if (error) {
        console.error('❌ Erro ao criar cheque:', error);
        throw new Error(`Erro ao criar cheque: ${error.message}`);
      }
      
      const newCheck = {
        id: data.id,
        saleId: data.sale_id,
        debtId: data.debt_id,
        client: data.client,
        value: Number(data.value),
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
      
      console.log('✅ Cheque criado com sucesso:', newCheck.id);
      return newCheck;
    });
  },

  async update(check: Check): Promise<Check> {
    return withAuth(async () => {
      console.log('🔄 Atualizando cheque:', check.id);
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

      if (error) {
        console.error('❌ Erro ao atualizar cheque:', error);
        throw new Error(`Erro ao atualizar cheque: ${error.message}`);
      }
      
      const updatedCheck = {
        id: data.id,
        saleId: data.sale_id,
        debtId: data.debt_id,
        client: data.client,
        value: Number(data.value),
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
      
      console.log('✅ Cheque atualizado com sucesso:', updatedCheck.id);
      return updatedCheck;
    });
  },

  async delete(id: string): Promise<void> {
    return withAuth(async () => {
      console.log('🔄 Excluindo cheque:', id);
      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir cheque:', error);
        throw new Error(`Erro ao excluir cheque: ${error.message}`);
      }
      
      console.log('✅ Cheque excluído com sucesso:', id);
    });
  }
};

// Database operations for Boletos
export const boletosService = {
  async getAll(): Promise<Boleto[]> {
    return withAuth(async () => {
      console.log('🔄 Buscando todos os boletos...');
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar boletos:', error);
        throw new Error(`Erro ao buscar boletos: ${error.message}`);
      }
      
      const boletos = (data || []).map(item => ({
        id: item.id,
        saleId: item.sale_id,
        client: item.client || '',
        value: Number(item.value) || 0,
        dueDate: item.due_date,
        status: item.status || 'pendente',
        installmentNumber: item.installment_number || 1,
        totalInstallments: item.total_installments || 1,
        boletoFile: item.boleto_file || '',
        observations: item.observations || '',
        createdAt: item.created_at
      }));
      
      console.log('✅ Boletos carregados:', boletos.length);
      return boletos;
    });
  },

  async create(boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto> {
    return withAuth(async () => {
      console.log('🔄 Criando novo boleto:', boleto);
      const { data, error } = await supabase
        .from('boletos')
        .insert([{
          sale_id: boleto.saleId,
          client: boleto.client,
          value: boleto.value,
          due_date: boleto.dueDate,
          status: boleto.status,
          installment_number: boleto.installmentNumber,
          total_installments: boleto.totalInstallments,
          boleto_file: boleto.boletoFile || '',
          observations: boleto.observations || ''
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar boleto:', error);
        throw new Error(`Erro ao criar boleto: ${error.message}`);
      }
      
      const newBoleto = {
        id: data.id,
        saleId: data.sale_id,
        client: data.client,
        value: Number(data.value),
        dueDate: data.due_date,
        status: data.status,
        installmentNumber: data.installment_number,
        totalInstallments: data.total_installments,
        boletoFile: data.boleto_file || '',
        observations: data.observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Boleto criado com sucesso:', newBoleto.id);
      return newBoleto;
    });
  },

  async update(boleto: Boleto): Promise<Boleto> {
    return withAuth(async () => {
      console.log('🔄 Atualizando boleto:', boleto.id);
      const { data, error } = await supabase
        .from('boletos')
        .update({
          sale_id: boleto.saleId,
          client: boleto.client,
          value: boleto.value,
          due_date: boleto.dueDate,
          status: boleto.status,
          installment_number: boleto.installmentNumber,
          total_installments: boleto.totalInstallments,
          boleto_file: boleto.boletoFile || '',
          observations: boleto.observations || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', boleto.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar boleto:', error);
        throw new Error(`Erro ao atualizar boleto: ${error.message}`);
      }
      
      const updatedBoleto = {
        id: data.id,
        saleId: data.sale_id,
        client: data.client,
        value: Number(data.value),
        dueDate: data.due_date,
        status: data.status,
        installmentNumber: data.installment_number,
        totalInstallments: data.total_installments,
        boletoFile: data.boleto_file || '',
        observations: data.observations || '',
        createdAt: data.created_at
      };
      
      console.log('✅ Boleto atualizado com sucesso:', updatedBoleto.id);
      return updatedBoleto;
    });
  },

  async delete(id: string): Promise<void> {
    return withAuth(async () => {
      console.log('🔄 Excluindo boleto:', id);
      const { error } = await supabase
        .from('boletos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir boleto:', error);
        throw new Error(`Erro ao excluir boleto: ${error.message}`);
      }
      
      console.log('✅ Boleto excluído com sucesso:', id);
    });
  }
};

// Upload de imagem para o bucket de cheques
export const uploadCheckImage = async (file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente para usar upload de imagens.');
  }

  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para fazer upload.');
  }

  try {
    // Validar arquivo
    if (!file || file.size === 0) {
      throw new Error('Arquivo inválido ou vazio.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem.');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('O arquivo deve ter no máximo 10MB.');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${checkId}_${imageType}_${timestamp}.${fileExt}`;
    const filePath = `checks/${fileName}`;

    console.log('Iniciando upload:', { fileName, filePath, fileSize: file.size, fileType: file.type });

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Erro no upload do Supabase:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('Upload realizado mas caminho do arquivo não foi retornado.');
    }

    console.log('Upload realizado com sucesso:', data);

    // Obter URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    console.log('URL pública gerada:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Erro completo no upload:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido durante o upload da imagem.');
    }
  }
};

// Deletar imagem do bucket
export const deleteCheckImage = async (imagePath: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado.');
  }

  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para deletar imagem.');
  }

  try {
    if (!imagePath) {
      throw new Error('Caminho da imagem não fornecido.');
    }

    // Extrair o caminho relativo da URL completa
    let relativePath = imagePath;
    
    if (imagePath.includes('/storage/v1/object/public/check-images/')) {
      relativePath = imagePath.split('/storage/v1/object/public/check-images/')[1];
    } else if (imagePath.startsWith('checks/')) {
      relativePath = imagePath;
    } else if (imagePath.includes('checks/')) {
      relativePath = imagePath.substring(imagePath.indexOf('checks/'));
    }

    console.log('Deletando imagem:', { originalPath: imagePath, relativePath });

    const { error } = await supabase.storage
      .from('check-images')
      .remove([relativePath]);

    if (error) {
      console.error('Erro ao deletar no Supabase:', error);
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }

    console.log('Imagem deletada com sucesso:', relativePath);

  } catch (error) {
    console.error('Erro completo na deleção:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao deletar a imagem.');
    }
  }
};

// Função para obter URL pública de uma imagem
export const getCheckImageUrl = (imagePath: string): string => {
  if (!imagePath) {
    console.warn('Caminho da imagem vazio');
    return '';
  }
  
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado, retornando string vazia para imagem');
    return '';
  }
  
  try {
    // Se já é uma URL completa e válida, retorna como está
    if (imagePath.startsWith('http') && imagePath.includes('supabase')) {
      return imagePath;
    }
    
    // Se é apenas o caminho relativo, constrói a URL pública
    let relativePath = imagePath;
    
    // Garantir que o caminho está no formato correto
    if (!relativePath.startsWith('checks/')) {
      relativePath = `checks/${relativePath}`;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(relativePath);
      
    if (!publicUrl) {
      console.warn('Não foi possível gerar URL pública para:', imagePath);
      return '';
    }
    
    return publicUrl;
    
  } catch (error) {
    console.error('Erro ao gerar URL da imagem:', error);
    return '';
  }
};

// Função para testar conexão com Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    console.log('🔄 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
};