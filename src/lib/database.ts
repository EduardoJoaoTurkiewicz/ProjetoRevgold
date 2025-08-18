import { supabase, isSupabaseConfigured } from './supabase';
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
    id: dbSale.id,
    date: dbSale.date,
    deliveryDate: dbSale.delivery_date,
    client: dbSale.client,
    sellerId: dbSale.seller_id,
    products: dbSale.products || [],
    observations: dbSale.observations,
    totalValue: parseFloat(dbSale.total_value || 0),
    paymentMethods: dbSale.payment_methods || [],
    receivedAmount: parseFloat(dbSale.received_amount || 0),
    pendingAmount: parseFloat(dbSale.pending_amount || 0),
    status: dbSale.status,
    paymentDescription: dbSale.payment_description,
    paymentObservations: dbSale.payment_observations,
    createdAt: dbSale.created_at
  }),

  debt: (dbDebt: any): Debt => ({
    id: dbDebt.id,
    date: dbDebt.date,
    description: dbDebt.description,
    company: dbDebt.company,
    totalValue: parseFloat(dbDebt.total_value || 0),
    paymentMethods: dbDebt.payment_methods || [],
    isPaid: dbDebt.is_paid,
    paidAmount: parseFloat(dbDebt.paid_amount || 0),
    pendingAmount: parseFloat(dbDebt.pending_amount || 0),
    checksUsed: dbDebt.checks_used || [],
    paymentDescription: dbDebt.payment_description,
    debtPaymentDescription: dbDebt.debt_payment_description,
    createdAt: dbDebt.created_at
  }),

  check: (dbCheck: any): Check => ({
    id: dbCheck.id,
    saleId: dbCheck.sale_id,
    debtId: dbCheck.debt_id,
    client: dbCheck.client,
    value: parseFloat(dbCheck.value || 0),
    dueDate: dbCheck.due_date,
    status: dbCheck.status,
    isOwnCheck: dbCheck.is_own_check,
    observations: dbCheck.observations,
    usedFor: dbCheck.used_for,
    installmentNumber: dbCheck.installment_number,
    totalInstallments: dbCheck.total_installments,
    frontImage: dbCheck.front_image,
    backImage: dbCheck.back_image,
    selectedAvailableChecks: dbCheck.selected_available_checks || [],
    usedInDebt: dbCheck.used_in_debt,
    discountDate: dbCheck.discount_date,
    createdAt: dbCheck.created_at
  }),

  boleto: (dbBoleto: any): Boleto => ({
    id: dbBoleto.id,
    saleId: dbBoleto.sale_id,
    client: dbBoleto.client,
    value: parseFloat(dbBoleto.value || 0),
    dueDate: dbBoleto.due_date,
    status: dbBoleto.status,
    installmentNumber: dbBoleto.installment_number,
    totalInstallments: dbBoleto.total_installments,
    boletoFile: dbBoleto.boleto_file,
    observations: dbBoleto.observations,
    createdAt: dbBoleto.created_at
  }),

  employee: (dbEmployee: any): Employee => ({
    id: dbEmployee.id,
    name: dbEmployee.name,
    position: dbEmployee.position,
    isSeller: dbEmployee.is_seller,
    salary: parseFloat(dbEmployee.salary || 0),
    paymentDay: dbEmployee.payment_day,
    nextPaymentDate: dbEmployee.next_payment_date,
    isActive: dbEmployee.is_active,
    hireDate: dbEmployee.hire_date,
    observations: dbEmployee.observations,
    createdAt: dbEmployee.created_at
  }),

  employeePayment: (dbPayment: any): EmployeePayment => ({
    id: dbPayment.id,
    employeeId: dbPayment.employee_id,
    amount: parseFloat(dbPayment.amount || 0),
    paymentDate: dbPayment.payment_date,
    isPaid: dbPayment.is_paid,
    receipt: dbPayment.receipt,
    observations: dbPayment.observations,
    createdAt: dbPayment.created_at
  }),

  employeeAdvance: (dbAdvance: any): EmployeeAdvance => ({
    id: dbAdvance.id,
    employeeId: dbAdvance.employee_id,
    amount: parseFloat(dbAdvance.amount || 0),
    date: dbAdvance.date,
    description: dbAdvance.description,
    paymentMethod: dbAdvance.payment_method,
    status: dbAdvance.status,
    createdAt: dbAdvance.created_at
  }),

  employeeOvertime: (dbOvertime: any): EmployeeOvertime => ({
    id: dbOvertime.id,
    employeeId: dbOvertime.employee_id,
    hours: parseFloat(dbOvertime.hours || 0),
    hourlyRate: parseFloat(dbOvertime.hourly_rate || 0),
    totalAmount: parseFloat(dbOvertime.total_amount || 0),
    date: dbOvertime.date,
    description: dbOvertime.description,
    status: dbOvertime.status,
    createdAt: dbOvertime.created_at
  }),

  employeeCommission: (dbCommission: any): EmployeeCommission => ({
    id: dbCommission.id,
    employeeId: dbCommission.employee_id,
    saleId: dbCommission.sale_id,
    saleValue: parseFloat(dbCommission.sale_value || 0),
    commissionRate: parseFloat(dbCommission.commission_rate || 5),
    commissionAmount: parseFloat(dbCommission.commission_amount || 0),
    date: dbCommission.date,
    status: dbCommission.status,
    createdAt: dbCommission.created_at
  }),

  installment: (dbInstallment: any): Installment => ({
    id: dbInstallment.id,
    saleId: dbInstallment.sale_id,
    debtId: dbInstallment.debt_id,
    amount: parseFloat(dbInstallment.amount || 0),
    dueDate: dbInstallment.due_date,
    isPaid: dbInstallment.is_paid,
    type: dbInstallment.type,
    description: dbInstallment.description
  })
};

// Função para converter dados da aplicação para o formato do banco
const convertToDatabase = {
  sale: (sale: Omit<Sale, 'id' | 'createdAt'>) => ({
    date: sale.date,
    delivery_date: sale.deliveryDate,
    client: sale.client,
    seller_id: sale.sellerId,
    products: sale.products,
    observations: sale.observations,
    total_value: sale.totalValue,
    payment_methods: sale.paymentMethods,
    received_amount: sale.receivedAmount,
    pending_amount: sale.pendingAmount,
    status: sale.status,
    payment_description: sale.paymentDescription,
    payment_observations: sale.paymentObservations
  }),

  debt: (debt: Omit<Debt, 'id' | 'createdAt'>) => ({
    date: debt.date,
    description: debt.description,
    company: debt.company,
    total_value: debt.totalValue,
    payment_methods: debt.paymentMethods,
    is_paid: debt.isPaid,
    paid_amount: debt.paidAmount,
    pending_amount: debt.pendingAmount,
    checks_used: debt.checksUsed,
    payment_description: debt.paymentDescription,
    debt_payment_description: debt.debtPaymentDescription
  }),

  check: (check: Omit<Check, 'id' | 'createdAt'>) => ({
    sale_id: check.saleId,
    debt_id: check.debtId,
    client: check.client,
    value: check.value,
    due_date: check.dueDate,
    status: check.status,
    is_own_check: check.isOwnCheck,
    observations: check.observations,
    used_for: check.usedFor,
    installment_number: check.installmentNumber,
    total_installments: check.totalInstallments,
    front_image: check.frontImage,
    back_image: check.backImage,
    selected_available_checks: check.selectedAvailableChecks,
    used_in_debt: check.usedInDebt,
    discount_date: check.discountDate
  }),

  boleto: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => ({
    sale_id: boleto.saleId,
    client: boleto.client,
    value: boleto.value,
    due_date: boleto.dueDate,
    status: boleto.status,
    installment_number: boleto.installmentNumber,
    total_installments: boleto.totalInstallments,
    boleto_file: boleto.boletoFile,
    observations: boleto.observations
  }),

  employee: (employee: Omit<Employee, 'id' | 'createdAt'>) => ({
    name: employee.name,
    position: employee.position,
    is_seller: employee.isSeller,
    salary: employee.salary,
    payment_day: employee.paymentDay,
    next_payment_date: employee.nextPaymentDate,
    is_active: employee.isActive,
    hire_date: employee.hireDate,
    observations: employee.observations
  }),

  employeePayment: (payment: Omit<EmployeePayment, 'id' | 'createdAt'>) => ({
    employee_id: payment.employeeId,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    is_paid: payment.isPaid,
    receipt: payment.receipt,
    observations: payment.observations
  }),

  employeeAdvance: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => ({
    employee_id: advance.employeeId,
    amount: advance.amount,
    date: advance.date,
    description: advance.description,
    payment_method: advance.paymentMethod,
    status: advance.status
  }),

  employeeOvertime: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => ({
    employee_id: overtime.employeeId,
    hours: overtime.hours,
    hourly_rate: overtime.hourlyRate,
    total_amount: overtime.totalAmount,
    date: overtime.date,
    description: overtime.description,
    status: overtime.status
  }),

  employeeCommission: (commission: Omit<EmployeeCommission, 'id' | 'createdAt'>) => ({
    employee_id: commission.employeeId,
    sale_id: commission.saleId,
    sale_value: commission.saleValue,
    commission_rate: commission.commissionRate,
    commission_amount: commission.commissionAmount,
    date: commission.date,
    status: commission.status
  }),

  installment: (installment: Omit<Installment, 'id'>) => ({
    sale_id: installment.saleId,
    debt_id: installment.debtId,
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
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.sale) || [];
  },

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('sales')
      .insert(convertToDatabase.sale(sale))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar venda:', error);
      return null;
    }
    
    return data ? convertFromDatabase.sale(data) : null;
  },

  async updateSale(sale: Sale): Promise<Sale | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('sales')
      .update(convertToDatabase.sale(sale))
      .eq('id', sale.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar venda:', error);
      return null;
    }
    
    return data ? convertFromDatabase.sale(data) : null;
  },

  async deleteSale(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const { error } = await supabase!
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar venda:', error);
      return false;
    }
    
    return true;
  },

  // Debts
  async getDebts(): Promise<Debt[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('debts')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar dívidas:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.debt) || [];
  },

  async createDebt(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('debts')
      .insert(convertToDatabase.debt(debt))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar dívida:', error);
      return null;
    }
    
    return data ? convertFromDatabase.debt(data) : null;
  },

  async updateDebt(debt: Debt): Promise<Debt | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('debts')
      .update(convertToDatabase.debt(debt))
      .eq('id', debt.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar dívida:', error);
      return null;
    }
    
    return data ? convertFromDatabase.debt(data) : null;
  },

  async deleteDebt(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const { error } = await supabase!
      .from('debts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar dívida:', error);
      return false;
    }
    
    return true;
  },

  // Checks
  async getChecks(): Promise<Check[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('checks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar cheques:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.check) || [];
  },

  async createCheck(check: Omit<Check, 'id' | 'createdAt'>): Promise<Check | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('checks')
      .insert(convertToDatabase.check(check))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cheque:', error);
      return null;
    }
    
    return data ? convertFromDatabase.check(data) : null;
  },

  async updateCheck(check: Check): Promise<Check | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('checks')
      .update(convertToDatabase.check(check))
      .eq('id', check.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cheque:', error);
      return null;
    }
    
    return data ? convertFromDatabase.check(data) : null;
  },

  async deleteCheck(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const { error } = await supabase!
      .from('checks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar cheque:', error);
      return false;
    }
    
    return true;
  },

  // Boletos
  async getBoletos(): Promise<Boleto[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('boletos')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar boletos:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.boleto) || [];
  },

  async createBoleto(boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('boletos')
      .insert(convertToDatabase.boleto(boleto))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar boleto:', error);
      return null;
    }
    
    return data ? convertFromDatabase.boleto(data) : null;
  },

  async updateBoleto(boleto: Boleto): Promise<Boleto | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('boletos')
      .update(convertToDatabase.boleto(boleto))
      .eq('id', boleto.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar boleto:', error);
      return null;
    }
    
    return data ? convertFromDatabase.boleto(data) : null;
  },

  async deleteBoleto(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const { error } = await supabase!
      .from('boletos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar boleto:', error);
      return false;
    }
    
    return true;
  },

  // Employees
  async getEmployees(): Promise<Employee[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.employee) || [];
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employees')
      .insert(convertToDatabase.employee(employee))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar funcionário:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employee(data) : null;
  },

  async updateEmployee(employee: Employee): Promise<Employee | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employees')
      .update(convertToDatabase.employee(employee))
      .eq('id', employee.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employee(data) : null;
  },

  async deleteEmployee(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    
    const { error } = await supabase!
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar funcionário:', error);
      return false;
    }
    
    return true;
  },

  // Employee Payments
  async getEmployeePayments(): Promise<EmployeePayment[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('employee_payments')
      .select('*')
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.employeePayment) || [];
  },

  async createEmployeePayment(payment: Omit<EmployeePayment, 'id' | 'createdAt'>): Promise<EmployeePayment | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_payments')
      .insert(convertToDatabase.employeePayment(payment))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar pagamento:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeePayment(data) : null;
  },

  // Employee Advances
  async getEmployeeAdvances(): Promise<EmployeeAdvance[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('employee_advances')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar adiantamentos:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.employeeAdvance) || [];
  },

  async createEmployeeAdvance(advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>): Promise<EmployeeAdvance | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_advances')
      .insert(convertToDatabase.employeeAdvance(advance))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar adiantamento:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeAdvance(data) : null;
  },

  async updateEmployeeAdvance(advance: EmployeeAdvance): Promise<EmployeeAdvance | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_advances')
      .update(convertToDatabase.employeeAdvance(advance))
      .eq('id', advance.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar adiantamento:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeAdvance(data) : null;
  },

  // Employee Overtimes
  async getEmployeeOvertimes(): Promise<EmployeeOvertime[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('employee_overtimes')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar horas extras:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.employeeOvertime) || [];
  },

  async createEmployeeOvertime(overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>): Promise<EmployeeOvertime | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_overtimes')
      .insert(convertToDatabase.employeeOvertime(overtime))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar horas extras:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeOvertime(data) : null;
  },

  async updateEmployeeOvertime(overtime: EmployeeOvertime): Promise<EmployeeOvertime | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_overtimes')
      .update(convertToDatabase.employeeOvertime(overtime))
      .eq('id', overtime.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar horas extras:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeOvertime(data) : null;
  },

  // Employee Commissions
  async getEmployeeCommissions(): Promise<EmployeeCommission[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('employee_commissions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar comissões:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.employeeCommission) || [];
  },

  async createEmployeeCommission(commission: Omit<EmployeeCommission, 'id' | 'createdAt'>): Promise<EmployeeCommission | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_commissions')
      .insert(convertToDatabase.employeeCommission(commission))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar comissão:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeCommission(data) : null;
  },

  async updateEmployeeCommission(commission: EmployeeCommission): Promise<EmployeeCommission | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('employee_commissions')
      .update(convertToDatabase.employeeCommission(commission))
      .eq('id', commission.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar comissão:', error);
      return null;
    }
    
    return data ? convertFromDatabase.employeeCommission(data) : null;
  },

  // Installments
  async getInstallments(): Promise<Installment[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase!
      .from('installments')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar parcelas:', error);
      return [];
    }
    
    return data?.map(convertFromDatabase.installment) || [];
  },

  async createInstallment(installment: Omit<Installment, 'id'>): Promise<Installment | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('installments')
      .insert(convertToDatabase.installment(installment))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar parcela:', error);
      return null;
    }
    
    return data ? convertFromDatabase.installment(data) : null;
  },

  async updateInstallment(installment: Installment): Promise<Installment | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase!
      .from('installments')
      .update(convertToDatabase.installment(installment))
      .eq('id', installment.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar parcela:', error);
      return null;
    }
    
    return data ? convertFromDatabase.installment(data) : null;
  }
};