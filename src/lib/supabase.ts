import { createClient } from '@supabase/supabase-js';
import { Sale, Debt, Check, Boleto, Employee, EmployeePayment, EmployeeAdvance, EmployeeOvertime, EmployeeCommission, Installment, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key');
};

// Database operations for Sales
export const salesService = {
  async getAll(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      deliveryDate: data.delivery_date,
      client: data.client,
      sellerId: data.seller_id,
      products: data.products,
      observations: data.observations,
      totalValue: data.total_value,
      paymentMethods: data.payment_methods,
      receivedAmount: data.received_amount,
      pendingAmount: data.pending_amount,
      status: data.status,
      paymentDescription: data.payment_description,
      paymentObservations: data.payment_observations,
      createdAt: data.created_at
    };
  },

  async update(sale: Sale): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update({
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
        payment_observations: sale.paymentObservations,
        updated_at: new Date().toISOString()
      })
      .eq('id', sale.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      deliveryDate: data.delivery_date,
      client: data.client,
      sellerId: data.seller_id,
      products: data.products,
      observations: data.observations,
      totalValue: data.total_value,
      paymentMethods: data.payment_methods,
      receivedAmount: data.received_amount,
      pendingAmount: data.pending_amount,
      status: data.status,
      paymentDescription: data.payment_description,
      paymentObservations: data.payment_observations,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Database operations for Debts
export const debtsService = {
  async getAll(): Promise<Debt[]> {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      date: item.date,
      description: item.description,
      company: item.company,
      totalValue: item.total_value,
      paymentMethods: item.payment_methods,
      isPaid: item.is_paid,
      paidAmount: item.paid_amount,
      pendingAmount: item.pending_amount,
      checksUsed: item.checks_used,
      paymentDescription: item.payment_description,
      debtPaymentDescription: item.debt_payment_description,
      createdAt: item.created_at
    })) || [];
  },

  async create(debt: Omit<Debt, 'id' | 'createdAt'>): Promise<Debt> {
    const { data, error } = await supabase
      .from('debts')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      company: data.company,
      totalValue: data.total_value,
      paymentMethods: data.payment_methods,
      isPaid: data.is_paid,
      paidAmount: data.paid_amount,
      pendingAmount: data.pending_amount,
      checksUsed: data.checks_used,
      paymentDescription: data.payment_description,
      debtPaymentDescription: data.debt_payment_description,
      createdAt: data.created_at
    };
  },

  async update(debt: Debt): Promise<Debt> {
    const { data, error } = await supabase
      .from('debts')
      .update({
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
        debt_payment_description: debt.debtPaymentDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', debt.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      company: data.company,
      totalValue: data.total_value,
      paymentMethods: data.payment_methods,
      isPaid: data.is_paid,
      paidAmount: data.paid_amount,
      pendingAmount: data.pending_amount,
      checksUsed: data.checks_used,
      paymentDescription: data.payment_description,
      debtPaymentDescription: data.debt_payment_description,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Database operations for Employees
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      name: item.name,
      position: item.position,
      isSeller: item.is_seller,
      salary: item.salary,
      paymentDay: item.payment_day,
      nextPaymentDate: item.next_payment_date,
      isActive: item.is_active,
      hireDate: item.hire_date,
      observations: item.observations,
      createdAt: item.created_at
    })) || [];
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
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
        observations: employee.observations
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      position: data.position,
      isSeller: data.is_seller,
      salary: data.salary,
      paymentDay: data.payment_day,
      nextPaymentDate: data.next_payment_date,
      isActive: data.is_active,
      hireDate: data.hire_date,
      observations: data.observations,
      createdAt: data.created_at
    };
  },

  async update(employee: Employee): Promise<Employee> {
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
        observations: employee.observations,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      position: data.position,
      isSeller: data.is_seller,
      salary: data.salary,
      paymentDay: data.payment_day,
      nextPaymentDate: data.next_payment_date,
      isActive: data.is_active,
      hireDate: data.hire_date,
      observations: data.observations,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Database operations for Checks
export const checksService = {
  async getAll(): Promise<Check[]> {
    const { data, error } = await supabase
      .from('checks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      saleId: item.sale_id,
      debtId: item.debt_id,
      client: item.client,
      value: item.value,
      dueDate: item.due_date,
      status: item.status,
      isOwnCheck: item.is_own_check,
      observations: item.observations,
      usedFor: item.used_for,
      installmentNumber: item.installment_number,
      totalInstallments: item.total_installments,
      frontImage: item.front_image,
      backImage: item.back_image,
      selectedAvailableChecks: item.selected_available_checks,
      usedInDebt: item.used_in_debt,
      discountDate: item.discount_date,
      createdAt: item.created_at
    })) || [];
  },

  async create(check: Omit<Check, 'id' | 'createdAt'>): Promise<Check> {
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
        observations: check.observations,
        used_for: check.usedFor,
        installment_number: check.installmentNumber,
        total_installments: check.totalInstallments,
        front_image: check.frontImage,
        back_image: check.backImage,
        selected_available_checks: check.selectedAvailableChecks,
        used_in_debt: check.usedInDebt,
        discount_date: check.discountDate
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      saleId: data.sale_id,
      debtId: data.debt_id,
      client: data.client,
      value: data.value,
      dueDate: data.due_date,
      status: data.status,
      isOwnCheck: data.is_own_check,
      observations: data.observations,
      usedFor: data.used_for,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      frontImage: data.front_image,
      backImage: data.back_image,
      selectedAvailableChecks: data.selected_available_checks,
      usedInDebt: data.used_in_debt,
      discountDate: data.discount_date,
      createdAt: data.created_at
    };
  },

  async update(check: Check): Promise<Check> {
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
        observations: check.observations,
        used_for: check.usedFor,
        installment_number: check.installmentNumber,
        total_installments: check.totalInstallments,
        front_image: check.frontImage,
        back_image: check.backImage,
        selected_available_checks: check.selectedAvailableChecks,
        used_in_debt: check.usedInDebt,
        discount_date: check.discountDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', check.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      saleId: data.sale_id,
      debtId: data.debt_id,
      client: data.client,
      value: data.value,
      dueDate: data.due_date,
      status: data.status,
      isOwnCheck: data.is_own_check,
      observations: data.observations,
      usedFor: data.used_for,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      frontImage: data.front_image,
      backImage: data.back_image,
      selectedAvailableChecks: data.selected_available_checks,
      usedInDebt: data.used_in_debt,
      discountDate: data.discount_date,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('checks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Database operations for Boletos
export const boletosService = {
  async getAll(): Promise<Boleto[]> {
    const { data, error } = await supabase
      .from('boletos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      saleId: item.sale_id,
      client: item.client,
      value: item.value,
      dueDate: item.due_date,
      status: item.status,
      installmentNumber: item.installment_number,
      totalInstallments: item.total_installments,
      boletoFile: item.boleto_file,
      observations: item.observations,
      createdAt: item.created_at
    })) || [];
  },

  async create(boleto: Omit<Boleto, 'id' | 'createdAt'>): Promise<Boleto> {
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
        boleto_file: boleto.boletoFile,
        observations: boleto.observations
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      saleId: data.sale_id,
      client: data.client,
      value: data.value,
      dueDate: data.due_date,
      status: data.status,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      boletoFile: data.boleto_file,
      observations: data.observations,
      createdAt: data.created_at
    };
  },

  async update(boleto: Boleto): Promise<Boleto> {
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
        boleto_file: boleto.boletoFile,
        observations: boleto.observations,
        updated_at: new Date().toISOString()
      })
      .eq('id', boleto.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      saleId: data.sale_id,
      client: data.client,
      value: data.value,
      dueDate: data.due_date,
      status: data.status,
      installmentNumber: data.installment_number,
      totalInstallments: data.total_installments,
      boletoFile: data.boleto_file,
      observations: data.observations,
      createdAt: data.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Upload de imagem para o bucket de cheques
export const uploadCheckImage = async (file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente para usar upload de imagens.');
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
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
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
  
  if (!supabase) {
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