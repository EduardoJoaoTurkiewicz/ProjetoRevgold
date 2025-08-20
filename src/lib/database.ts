import { supabase, isSupabaseConfigured, ensureAuthenticated } from './supabase';
import { 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  Employee, 
  EmployeePayment, 
  EmployeeAdvance, 
  EmployeeOvertime, 
  EmployeeCommission,
  Installment 
} from '../types';

// Função para converter dados do banco para o formato da aplicação
const convertFromDatabase = {
  sale: (dbSale: any): Sale => ({
    id: dbSale.id.toString(),
    date: dbSale.date,
    deliveryDate: dbSale.delivery_date,
    client: dbSale.client,
    sellerId: dbSale.seller_id,
    customCommissionRate: parseFloat(dbSale.custom_commission_rate || 5),
    products: dbSale.products || 'Produtos vendidos',
    observations: dbSale.observations || '',
    totalValue: parseFloat(dbSale.total_value || 0),
    paymentMethods: dbSale.payment_methods || [],
    receivedAmount: parseFloat(dbSale.received_amount || 0),
    pendingAmount: parseFloat(dbSale.pending_amount || 0),
    status: dbSale.status || 'pendente',
    paymentDescription: dbSale.payment_description || '',
    paymentObservations: dbSale.payment_observations || '',
    createdAt: dbSale.created_at || new Date().toISOString()
  }),

  debt: (dbDebt: any): Debt => ({
    id: dbDebt.id.toString(),
    date: dbDebt.date,
    description: dbDebt.description,
    company: dbDebt.company,
    totalValue: parseFloat(dbDebt.total_value || 0),
    paymentMethods: dbDebt.payment_methods || [],
    isPaid: dbDebt.is_paid || false,
    paidAmount: parseFloat(dbDebt.paid_amount || 0),
    pendingAmount: parseFloat(dbDebt.pending_amount || 0),
    checksUsed: dbDebt.checks_used || [],
    paymentDescription: dbDebt.payment_description || '',
    debtPaymentDescription: dbDebt.debt_payment_description || '',
    createdAt: dbDebt.created_at || new Date().toISOString()
  }),

  check: (dbCheck: any): Check => ({
    id: dbCheck.id.toString(),
    saleId: dbCheck.sale_id,
    debtId: dbCheck.debt_id,
    client: dbCheck.client,
    value: parseFloat(dbCheck.value || 0),
    dueDate: dbCheck.due_date,
    status: dbCheck.status || 'pendente',
    isOwnCheck: dbCheck.is_own_check || false,
    observations: dbCheck.observations || '',
    usedFor: dbCheck.used_for || '',
    installmentNumber: dbCheck.installment_number,
    totalInstallments: dbCheck.total_installments,
    frontImage: dbCheck.front_image || '',
    backImage: dbCheck.back_image || '',
    selectedAvailableChecks: dbCheck.selected_available_checks || [],
    usedInDebt: dbCheck.used_in_debt,
    discountDate: dbCheck.discount_date,
    createdAt: dbCheck.created_at || new Date().toISOString()
  }),

  boleto: (dbBoleto: any): Boleto => ({
    id: dbBoleto.id.toString(),
    saleId: dbBoleto.sale_id,
    client: dbBoleto.client,
    value: parseFloat(dbBoleto.value || 0),
    dueDate: dbBoleto.due_date,
    status: dbBoleto.status || 'pendente',
    installmentNumber: dbBoleto.installment_number || 1,
    totalInstallments: dbBoleto.total_installments || 1,
    boletoFile: dbBoleto.boleto_file || '',
    observations: dbBoleto.observations || '',
    createdAt: dbBoleto.created_at || new Date().toISOString()
  }),

  employee: (dbEmployee: any): Employee => ({
    id: dbEmployee.id.toString(),
    name: dbEmployee.name,
    position: dbEmployee.position,
    isSeller: dbEmployee.is_seller || false,
    salary: parseFloat(dbEmployee.salary || 0),
    paymentDay: dbEmployee.payment_day || 5,
    nextPaymentDate: dbEmployee.next_payment_date,
    isActive: dbEmployee.is_active !== false,
    hireDate: dbEmployee.hire_date,
    observations: dbEmployee.observations || '',
    createdAt: dbEmployee.created_at || new Date().toISOString()
  }),

  employeePayment: (dbPayment: any): EmployeePayment => ({
    id: dbPayment.id.toString(),
    employeeId: dbPayment.employee_id,
    amount: parseFloat(dbPayment.amount || 0),
    paymentDate: dbPayment.payment_date,
    isPaid: dbPayment.is_paid !== false,
    receipt: dbPayment.receipt || '',
    observations: dbPayment.observations || '',
    createdAt: dbPayment.created_at || new Date().toISOString()
  }),

  employeeAdvance: (dbAdvance: any): EmployeeAdvance => ({
    id: dbAdvance.id.toString(),
    employeeId: dbAdvance.employee_id,
    amount: parseFloat(dbAdvance.amount || 0),
    date: dbAdvance.date,
    description: dbAdvance.description || '',
    paymentMethod: dbAdvance.payment_method || 'dinheiro',
    status: dbAdvance.status || 'pendente',
    createdAt: dbAdvance.created_at || new Date().toISOString()
  }),

  employeeOvertime: (dbOvertime: any): EmployeeOvertime => ({
    id: dbOvertime.id.toString(),
    employeeId: dbOvertime.employee_id,
    hours: parseFloat(dbOvertime.hours || 0),
    hourlyRate: parseFloat(dbOvertime.hourly_rate || 0),
    totalAmount: parseFloat(dbOvertime.total_amount || 0),
    date: dbOvertime.date,
    description: dbOvertime.description,
    status: dbOvertime.status || 'pendente',
    createdAt: dbOvertime.created_at || new Date().toISOString()
  }),

  employeeCommission: (dbCommission: any): EmployeeCommission => ({
    id: dbCommission.id.toString(),
    employeeId: dbCommission.employee_id,
    saleId: dbCommission.sale_id,
    saleValue: parseFloat(dbCommission.sale_value || 0),
    commissionRate: parseFloat(dbCommission.commission_rate || 5),
    commissionAmount: parseFloat(dbCommission.commission_amount || 0),
    date: dbCommission.date,
    status: dbCommission.status || 'pendente',
    createdAt: dbCommission.created_at || new Date().toISOString()
  }),

  installment: (dbInstallment: any): Installment => ({
    id: dbInstallment.id.toString(),
    saleId: dbInstallment.sale_id,
    debtId: dbInstallment.debt_id,
    amount: parseFloat(dbInstallment.amount || 0),
    dueDate: dbInstallment.due_date,
    isPaid: dbInstallment.is_paid || false,
    type: dbInstallment.type,
    description: dbInstallment.description
  })
};

// Função para converter dados da aplicação para o formato do banco
const convertToDatabase = {
  sale: (sale: Sale | Omit<Sale, 'id' | 'createdAt'>) => ({
    id: 'id' in sale ? sale.id : undefined,
    date: sale.date,
    delivery_date: sale.deliveryDate || null,
    client: sale.client,
    seller_id: sale.sellerId || null,
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
  }),

  debt: (debt: Debt | Omit<Debt, 'id' | 'createdAt'>) => ({
    id: 'id' in debt ? debt.id : undefined,
    date: debt.date,
    description: debt.description,
    company: debt.company,
    total_value: debt.totalValue,
    payment_methods: debt.paymentMethods,
    is_paid: debt.isPaid,
    paid_amount: debt.paidAmount,
    pending_amount: debt.pendingAmount,
    checks_used: debt.checksUsed || [],
    payment_description: debt.paymentDescription || '',
    debt_payment_description: debt.debtPaymentDescription || ''
  }),

  check: (check: Check | Omit<Check, 'id' | 'createdAt'>) => ({
    id: 'id' in check ? check.id : undefined,
    sale_id: check.saleId || null,
    debt_id: check.debtId || null,
    client: check.client,
    value: check.value,
    due_date: check.dueDate,
    status: check.status,
    is_own_check: check.isOwnCheck,
    observations: check.observations || '',
    used_for: check.usedFor || '',
    installment_number: check.installmentNumber || null,
    total_installments: check.totalInstallments || null,
    front_image: check.frontImage || '',
    back_image: check.backImage || '',
    selected_available_checks: check.selectedAvailableChecks || [],
    used_in_debt: check.usedInDebt || null,
    discount_date: check.discountDate || null
  }),

  boleto: (boleto: Boleto | Omit<Boleto, 'id' | 'createdAt'>) => ({
    id: 'id' in boleto ? boleto.id : undefined,
    sale_id: boleto.saleId || null,
    client: boleto.client,
    value: boleto.value,
    due_date: boleto.dueDate,
    status: boleto.status,
    installment_number: boleto.installmentNumber,
    total_installments: boleto.totalInstallments,
    boleto_file: boleto.boletoFile || '',
    observations: boleto.observations || ''
  }),

  employee: (employee: Employee | Omit<Employee, 'id' | 'createdAt'>) => ({
    id: 'id' in employee ? employee.id : undefined,
    name: employee.name,
    position: employee.position,
    is_seller: employee.isSeller,
    salary: employee.salary,
    payment_day: employee.paymentDay,
    next_payment_date: employee.nextPaymentDate || null,
    is_active: employee.isActive,
    hire_date: employee.hireDate,
    observations: employee.observations || ''
  }),

  employeePayment: (payment: EmployeePayment | Omit<EmployeePayment, 'id' | 'createdAt'>) => ({
    id: 'id' in payment ? payment.id : undefined,
    employee_id: payment.employeeId,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    is_paid: payment.isPaid,
    receipt: payment.receipt || '',
    observations: payment.observations || ''
  }),

  employeeAdvance: (advance: EmployeeAdvance | Omit<EmployeeAdvance, 'id' | 'createdAt'>) => ({
    id: 'id' in advance ? advance.id : undefined,
    employee_id: advance.employeeId,
    amount: advance.amount,
    date: advance.date,
    description: advance.description || '',
    payment_method: advance.paymentMethod,
    status: advance.status
  }),

  employeeOvertime: (overtime: EmployeeOvertime | Omit<EmployeeOvertime, 'id' | 'createdAt'>) => ({
    id: 'id' in overtime ? overtime.id : undefined,
    employee_id: overtime.employeeId,
    hours: overtime.hours,
    hourly_rate: overtime.hourlyRate,
    total_amount: overtime.totalAmount,
    date: overtime.date,
    description: overtime.description,
    status: overtime.status
  }),

  employeeCommission: (commission: EmployeeCommission | Omit<EmployeeCommission, 'id' | 'createdAt'>) => ({
    id: 'id' in commission ? commission.id : undefined,
    employee_id: commission.employeeId,
    sale_id: commission.saleId,
    sale_value: commission.saleValue,
    commission_rate: commission.commissionRate,
    commission_amount: commission.commissionAmount,
    date: commission.date,
    status: commission.status
  }),

  installment: (installment: Installment | Omit<Installment, 'id'>) => ({
    id: 'id' in installment ? installment.id : undefined,
    sale_id: installment.saleId || null,
    debt_id: installment.debtId || null,
    amount: installment.amount,
    due_date: installment.dueDate,
    is_paid: installment.isPaid,
    type: installment.type,
    description: installment.description
  })
};

// Funções de CRUD para cada entidade
export const database = {
  // Sales
  async getSales(): Promise<Sale[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para vendas');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para vendas');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('sales')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar vendas:', error);
        return [];
      }
      
      const sales = data?.map(convertFromDatabase.sale) || [];
      console.log(`✅ ${sales.length} vendas carregadas do Supabase`);
      return sales;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar vendas:', error);
      return [];
    }
  },

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - venda não será salva no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - venda não será salva no banco');
      return null;
    }
    
    try {
      const saleData = convertToDatabase.sale(sale);
      delete saleData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('sales')
        .insert(saleData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar venda:', error);
        throw error;
      }
    
      console.log('✅ Venda criada no Supabase:', data.id);
      return data ? convertFromDatabase.sale(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar venda:', error);
      throw error;
    }
  },

  async updateSale(sale: Sale): Promise<Sale | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - venda não será atualizada no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - venda não será atualizada no banco');
      return null;
    }
    
    try {
      const saleData = convertToDatabase.sale(sale);
      delete saleData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('sales')
        .update(saleData)
        .eq('id', sale.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar venda:', error);
        throw error;
      }
    
      console.log('✅ Venda atualizada no Supabase:', sale.id);
      return data ? convertFromDatabase.sale(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar venda:', error);
      throw error;
    }
  },

  async deleteSale(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - venda não será deletada do banco');
      return false;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - venda não será deletada do banco');
      return false;
    }
    
    try {
      const { error } = await supabase!
        .from('sales')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Erro ao deletar venda:', error);
        throw error;
      }
    
      console.log('✅ Venda deletada do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão ao deletar venda:', error);
      throw error;
    }
  },

  // Debts
  async getDebts(): Promise<Debt[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para dívidas');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para dívidas');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('debts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar dívidas:', error);
        return [];
      }
      
      const debts = data?.map(convertFromDatabase.debt) || [];
      console.log(`✅ ${debts.length} dívidas carregadas do Supabase`);
      return debts;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar dívidas:', error);
      return [];
    }
  },

  async createDebt(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - dívida não será salva no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - dívida não será salva no banco');
      return null;
    }
    
    try {
      const debtData = convertToDatabase.debt(debt);
      delete debtData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('debts')
        .insert(debtData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar dívida:', error);
        throw error;
      }
    
      console.log('✅ Dívida criada no Supabase:', data.id);
      return data ? convertFromDatabase.debt(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar dívida:', error);
      throw error;
    }
  },

  async updateDebt(debt: Debt): Promise<Debt | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - dívida não será atualizada no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - dívida não será atualizada no banco');
      return null;
    }
    
    try {
      const debtData = convertToDatabase.debt(debt);
      delete debtData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('debts')
        .update(debtData)
        .eq('id', debt.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar dívida:', error);
        throw error;
      }
    
      console.log('✅ Dívida atualizada no Supabase:', debt.id);
      return data ? convertFromDatabase.debt(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar dívida:', error);
      throw error;
    }
  },

  async deleteDebt(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - dívida não será deletada do banco');
      return false;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - dívida não será deletada do banco');
      return false;
    }
    
    try {
      const { error } = await supabase!
        .from('debts')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Erro ao deletar dívida:', error);
        throw error;
      }
    
      console.log('✅ Dívida deletada do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão ao deletar dívida:', error);
      throw error;
    }
  },

  // Checks
  async getChecks(): Promise<Check[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para cheques');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para cheques');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('checks')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar cheques:', error);
        return [];
      }
      
      const checks = data?.map(convertFromDatabase.check) || [];
      console.log(`✅ ${checks.length} cheques carregados do Supabase`);
      return checks;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar cheques:', error);
      return [];
    }
  },

  async createCheck(check: Omit<Check, 'id' | 'createdAt'>): Promise<Check | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - cheque não será salvo no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - cheque não será salvo no banco');
      return null;
    }
    
    try {
      const checkData = convertToDatabase.check(check);
      delete checkData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('checks')
        .insert(checkData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar cheque:', error);
        throw error;
      }
    
      console.log('✅ Cheque criado no Supabase:', data.id);
      return data ? convertFromDatabase.check(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar cheque:', error);
      throw error;
    }
  },

  async updateCheck(check: Check): Promise<Check | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - cheque não será atualizado no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - cheque não será atualizado no banco');
      return null;
    }
    
    try {
      const checkData = convertToDatabase.check(check);
      delete checkData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('checks')
        .update(checkData)
        .eq('id', check.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar cheque:', error);
        throw error;
      }
    
      console.log('✅ Cheque atualizado no Supabase:', check.id);
      return data ? convertFromDatabase.check(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar cheque:', error);
      throw error;
    }
  },

  async deleteCheck(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - cheque não será deletado do banco');
      return false;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - cheque não será deletado do banco');
      return false;
    }
    
    try {
      const { error } = await supabase!
        .from('checks')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Erro ao deletar cheque:', error);
        throw error;
      }
    
      console.log('✅ Cheque deletado do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão ao deletar cheque:', error);
      throw error;
    }
  },

  // Boletos
  async getBoletos(): Promise<Boleto[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para boletos');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para boletos');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('boletos')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar boletos:', error);
        return [];
      }
      
      const boletos = data?.map(convertFromDatabase.boleto) || [];
      console.log(`✅ ${boletos.length} boletos carregados do Supabase`);
      return boletos;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar boletos:', error);
      return [];
    }
  },

  async createBoleto(boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - boleto não será salvo no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - boleto não será salvo no banco');
      return null;
    }
    
    try {
      const boletoData = convertToDatabase.boleto(boleto);
      delete boletoData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('boletos')
        .insert(boletoData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar boleto:', error);
        throw error;
      }
    
      console.log('✅ Boleto criado no Supabase:', data.id);
      return data ? convertFromDatabase.boleto(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar boleto:', error);
      throw error;
    }
  },

  async updateBoleto(boleto: Boleto): Promise<Boleto | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - boleto não será atualizado no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - boleto não será atualizado no banco');
      return null;
    }
    
    try {
      const boletoData = convertToDatabase.boleto(boleto);
      delete boletoData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('boletos')
        .update(boletoData)
        .eq('id', boleto.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar boleto:', error);
        throw error;
      }
    
      console.log('✅ Boleto atualizado no Supabase:', boleto.id);
      return data ? convertFromDatabase.boleto(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar boleto:', error);
      throw error;
    }
  },

  async deleteBoleto(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - boleto não será deletado do banco');
      return false;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - boleto não será deletado do banco');
      return false;
    }
    
    try {
      const { error } = await supabase!
        .from('boletos')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Erro ao deletar boleto:', error);
        throw error;
      }
    
      console.log('✅ Boleto deletado do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão ao deletar boleto:', error);
      throw error;
    }
  },

  // Employees
  async getEmployees(): Promise<Employee[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para funcionários');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para funcionários');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
        return [];
      }
      
      const employees = data?.map(convertFromDatabase.employee) || [];
      console.log(`✅ ${employees.length} funcionários carregados do Supabase`);
      return employees;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar funcionários:', error);
      return [];
    }
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - funcionário não será salvo no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - funcionário não será salvo no banco');
      return null;
    }
    
    try {
      const employeeData = convertToDatabase.employee(employee);
      delete employeeData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('employees')
        .insert(employeeData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }
    
      console.log('✅ Funcionário criado no Supabase:', data.id);
      return data ? convertFromDatabase.employee(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar funcionário:', error);
      throw error;
    }
  },

  async updateEmployee(employee: Employee): Promise<Employee | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - funcionário não será atualizado no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - funcionário não será atualizado no banco');
      return null;
    }
    
    try {
      const employeeData = convertToDatabase.employee(employee);
      delete employeeData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('employees')
        .update(employeeData)
        .eq('id', employee.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar funcionário:', error);
        throw error;
      }
    
      console.log('✅ Funcionário atualizado no Supabase:', employee.id);
      return data ? convertFromDatabase.employee(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar funcionário:', error);
      throw error;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - funcionário não será deletado do banco');
      return false;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - funcionário não será deletado do banco');
      return false;
    }
    
    try {
      const { error } = await supabase!
        .from('employees')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Erro ao deletar funcionário:', error);
        throw error;
      }
    
      console.log('✅ Funcionário deletado do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro de conexão ao deletar funcionário:', error);
      throw error;
    }
  },

  // Employee Payments
  async getEmployeePayments(): Promise<EmployeePayment[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para pagamentos');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para pagamentos');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('employee_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        return [];
      }
      
      const payments = data?.map(convertFromDatabase.employeePayment) || [];
      console.log(`✅ ${payments.length} pagamentos carregados do Supabase`);
      return payments;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar pagamentos:', error);
      return [];
    }
  },

  async createEmployeePayment(payment: Omit<EmployeePayment, 'id' | 'createdAt'>): Promise<EmployeePayment | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - pagamento não será salvo no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - pagamento não será salvo no banco');
      return null;
    }
    
    try {
      const paymentData = convertToDatabase.employeePayment(payment);
      delete paymentData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('employee_payments')
        .insert(paymentData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        throw error;
      }
    
      console.log('✅ Pagamento criado no Supabase:', data.id);
      return data ? convertFromDatabase.employeePayment(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar pagamento:', error);
      throw error;
    }
  },

  // Employee Advances
  async getEmployeeAdvances(): Promise<EmployeeAdvance[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para adiantamentos');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para adiantamentos');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('employee_advances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar adiantamentos:', error);
        return [];
      }
      
      const advances = data?.map(convertFromDatabase.employeeAdvance) || [];
      console.log(`✅ ${advances.length} adiantamentos carregados do Supabase`);
      return advances;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar adiantamentos:', error);
      return [];
    }
  },

  async createEmployeeAdvance(advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>): Promise<EmployeeAdvance | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - adiantamento não será salvo no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - adiantamento não será salvo no banco');
      return null;
    }
    
    try {
      const advanceData = convertToDatabase.employeeAdvance(advance);
      delete advanceData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('employee_advances')
        .insert(advanceData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar adiantamento:', error);
        throw error;
      }
    
      console.log('✅ Adiantamento criado no Supabase:', data.id);
      return data ? convertFromDatabase.employeeAdvance(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar adiantamento:', error);
      throw error;
    }
  },

  async updateEmployeeAdvance(advance: EmployeeAdvance): Promise<EmployeeAdvance | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - adiantamento não será atualizado no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - adiantamento não será atualizado no banco');
      return null;
    }
    
    try {
      const advanceData = convertToDatabase.employeeAdvance(advance);
      delete advanceData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('employee_advances')
        .update(advanceData)
        .eq('id', advance.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar adiantamento:', error);
        throw error;
      }
    
      console.log('✅ Adiantamento atualizado no Supabase:', advance.id);
      return data ? convertFromDatabase.employeeAdvance(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar adiantamento:', error);
      throw error;
    }
  },

  // Employee Overtimes
  async getEmployeeOvertimes(): Promise<EmployeeOvertime[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para horas extras');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para horas extras');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('employee_overtimes')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar horas extras:', error);
        return [];
      }
      
      const overtimes = data?.map(convertFromDatabase.employeeOvertime) || [];
      console.log(`✅ ${overtimes.length} horas extras carregadas do Supabase`);
      return overtimes;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar horas extras:', error);
      return [];
    }
  },

  async createEmployeeOvertime(overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>): Promise<EmployeeOvertime | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - horas extras não serão salvas no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - horas extras não serão salvas no banco');
      return null;
    }
    
    try {
      const overtimeData = convertToDatabase.employeeOvertime(overtime);
      delete overtimeData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('employee_overtimes')
        .insert(overtimeData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar horas extras:', error);
        throw error;
      }
    
      console.log('✅ Horas extras criadas no Supabase:', data.id);
      return data ? convertFromDatabase.employeeOvertime(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar horas extras:', error);
      throw error;
    }
  },

  async updateEmployeeOvertime(overtime: EmployeeOvertime): Promise<EmployeeOvertime | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - horas extras não serão atualizadas no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - horas extras não serão atualizadas no banco');
      return null;
    }
    
    try {
      const overtimeData = convertToDatabase.employeeOvertime(overtime);
      delete overtimeData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('employee_overtimes')
        .update(overtimeData)
        .eq('id', overtime.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar horas extras:', error);
        throw error;
      }
    
      console.log('✅ Horas extras atualizadas no Supabase:', overtime.id);
      return data ? convertFromDatabase.employeeOvertime(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar horas extras:', error);
      throw error;
    }
  },

  // Employee Commissions
  async getEmployeeCommissions(): Promise<EmployeeCommission[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para comissões');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para comissões');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('employee_commissions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar comissões:', error);
        return [];
      }
      
      const commissions = data?.map(convertFromDatabase.employeeCommission) || [];
      console.log(`✅ ${commissions.length} comissões carregadas do Supabase`);
      return commissions;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar comissões:', error);
      return [];
    }
  },

  async createEmployeeCommission(commission: Omit<EmployeeCommission, 'id' | 'createdAt'>): Promise<EmployeeCommission | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - comissão não será salva no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - comissão não será salva no banco');
      return null;
    }
    
    try {
      const commissionData = convertToDatabase.employeeCommission(commission);
      delete commissionData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('employee_commissions')
        .insert(commissionData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar comissão:', error);
        throw error;
      }
    
      console.log('✅ Comissão criada no Supabase:', data.id);
      return data ? convertFromDatabase.employeeCommission(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar comissão:', error);
      throw error;
    }
  },

  async updateEmployeeCommission(commission: EmployeeCommission): Promise<EmployeeCommission | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - comissão não será atualizada no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - comissão não será atualizada no banco');
      return null;
    }
    
    try {
      const commissionData = convertToDatabase.employeeCommission(commission);
      delete commissionData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('employee_commissions')
        .update(commissionData)
        .eq('id', commission.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar comissão:', error);
        throw error;
      }
    
      console.log('✅ Comissão atualizada no Supabase:', commission.id);
      return data ? convertFromDatabase.employeeCommission(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar comissão:', error);
      throw error;
    }
  },

  // Installments
  async getInstallments(): Promise<Installment[]> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - retornando array vazio para parcelas');
      return [];
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - retornando array vazio para parcelas');
      return [];
    }
    
    try {
      const { data, error } = await supabase!
        .from('installments')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar parcelas:', error);
        return [];
      }
      
      const installments = data?.map(convertFromDatabase.installment) || [];
      console.log(`✅ ${installments.length} parcelas carregadas do Supabase`);
      return installments;
    } catch (error) {
      console.error('❌ Erro de conexão ao buscar parcelas:', error);
      return [];
    }
  },

  async createInstallment(installment: Omit<Installment, 'id'>): Promise<Installment | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - parcela não será salva no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - parcela não será salva no banco');
      return null;
    }
    
    try {
      const installmentData = convertToDatabase.installment(installment);
      delete installmentData.id; // Let database generate ID
      
      const { data, error } = await supabase!
        .from('installments')
        .insert(installmentData)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao criar parcela:', error);
        throw error;
      }
    
      console.log('✅ Parcela criada no Supabase:', data.id);
      return data ? convertFromDatabase.installment(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao criar parcela:', error);
      throw error;
    }
  },

  async updateInstallment(installment: Installment): Promise<Installment | null> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado - parcela não será atualizada no banco');
      return null;
    }
    
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - parcela não será atualizada no banco');
      return null;
    }
    
    try {
      const installmentData = convertToDatabase.installment(installment);
      delete installmentData.id; // Don't update ID
      
      const { data, error } = await supabase!
        .from('installments')
        .update(installmentData)
        .eq('id', installment.id)
        .select()
        .single();
    
      if (error) {
        console.error('❌ Erro ao atualizar parcela:', error);
        throw error;
      }
    
      console.log('✅ Parcela atualizada no Supabase:', installment.id);
      return data ? convertFromDatabase.installment(data) : null;
    } catch (error) {
      console.error('❌ Erro de conexão ao atualizar parcela:', error);
      throw error;
    }
  },

  // Função para sincronizar todos os dados
  async syncAllData(): Promise<{
    sales: Sale[];
    debts: Debt[];
    checks: Check[];
    boletos: Boleto[];
    employees: Employee[];
    employeePayments: EmployeePayment[];
    employeeAdvances: EmployeeAdvance[];
    employeeOvertimes: EmployeeOvertime[];
    employeeCommissions: EmployeeCommission[];
    installments: Installment[];
  }> {
    if (!isSupabaseConfigured()) {
      return {
        sales: [],
        debts: [],
        checks: [],
        boletos: [],
        employees: [],
        employeePayments: [],
        employeeAdvances: [],
        employeeOvertimes: [],
        employeeCommissions: [],
        installments: []
      };
    }

    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      console.log('⚠️ Modo local ativo - não é possível sincronizar dados');
      return {
        sales: [],
        debts: [],
        checks: [],
        boletos: [],
        employees: [],
        employeePayments: [],
        employeeAdvances: [],
        employeeOvertimes: [],
        employeeCommissions: [],
        installments: []
      };
    }

    try {
      console.log('🔄 Iniciando sincronização completa com Supabase...');
      
      const [
        sales,
        debts,
        checks,
        boletos,
        employees,
        employeePayments,
        employeeAdvances,
        employeeOvertimes,
        employeeCommissions,
        installments
      ] = await Promise.all([
        database.getSales(),
        database.getDebts(),
        database.getChecks(),
        database.getBoletos(),
        database.getEmployees(),
        database.getEmployeePayments(),
        database.getEmployeeAdvances(),
        database.getEmployeeOvertimes(),
        database.getEmployeeCommissions(),
        database.getInstallments()
      ]);

      console.log('✅ Sincronização completa finalizada:', {
        sales: sales.length,
        debts: debts.length,
        checks: checks.length,
        boletos: boletos.length,
        employees: employees.length,
        employeePayments: employeePayments.length,
        employeeAdvances: employeeAdvances.length,
        employeeOvertimes: employeeOvertimes.length,
        employeeCommissions: employeeCommissions.length,
        installments: installments.length
      });
      
      return {
        sales,
        debts,
        checks,
        boletos,
        employees,
        employeePayments,
        employeeAdvances,
        employeeOvertimes,
        employeeCommissions,
        installments
      };
    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      throw error;
    }
  }
};