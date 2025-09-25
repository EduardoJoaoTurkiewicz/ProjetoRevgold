// Service to handle installment creation and management
import { supabaseServices } from './supabaseServices';
import { formatDateForInput, addDays } from '../utils/dateUtils';
import { safeNumber } from '../utils/numberUtils';

export class InstallmentService {
  // Create checks for sale payment method
  static async createChecksForSale(saleId: string, client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'cheque') return;
    
    const installments = safeNumber(paymentMethod.installments, 1);
    const installmentValue = safeNumber(paymentMethod.installmentValue, paymentMethod.amount);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || formatDateForInput(new Date());
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);
      
      const checkData = {
        saleId,
        client,
        value: installmentValue,
        dueDate,
        status: 'pendente',
        isOwnCheck: paymentMethod.isOwnCheck || false,
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Cheque ${i}/${installments} - Venda para ${client}`
      };
      
      await supabaseServices.checks.create(checkData);
    }
  }

  // Create boletos for sale payment method
  static async createBoletosForSale(saleId: string, client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'boleto') return;
    
    const installments = safeNumber(paymentMethod.installments, 1);
    const installmentValue = safeNumber(paymentMethod.installmentValue, paymentMethod.amount);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || formatDateForInput(new Date());
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);
      
      const boletoData = {
        saleId,
        client,
        value: installmentValue,
        dueDate,
        status: 'pendente',
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Boleto ${i}/${installments} - Venda para ${client}`
      };
      
      await supabaseServices.boletos.create(boletoData);
    }
  }

  // Create acerto for sale payment method
  static async createAcertoForSale(client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'acerto') return;
    
    const amount = safeNumber(paymentMethod.amount, 0);
    if (amount <= 0) return;
    
    // Check if acerto already exists for this client
    const existingAcertos = await supabaseServices.acertos.getAcertos();
    const existingAcerto = existingAcertos.find(a => 
      a.clientName === client && a.type === 'cliente'
    );
    
    if (existingAcerto) {
      // Update existing acerto
      const updatedAcerto = {
        ...existingAcerto,
        totalAmount: existingAcerto.totalAmount + amount,
        pendingAmount: existingAcerto.pendingAmount + amount,
        status: 'pendente' as const
      };
      
      await supabaseServices.acertos.update(existingAcerto.id!, updatedAcerto);
    } else {
      // Create new acerto
      const acertoData = {
        clientName: client,
        type: 'cliente' as const,
        totalAmount: amount,
        paidAmount: 0,
        pendingAmount: amount,
        status: 'pendente' as const,
        observations: `Acerto criado automaticamente para vendas de ${client}`
      };
      
      await supabaseServices.acertos.create(acertoData);
    }
  }

  // Create checks for debt payment method
  static async createChecksForDebt(debtId: string, company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'cheque') return;
    
    const installments = safeNumber(paymentMethod.installments, 1);
    const installmentValue = safeNumber(paymentMethod.installmentValue, paymentMethod.amount);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || formatDateForInput(new Date());
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);
      
      const checkData = {
        debtId,
        client: company,
        value: installmentValue,
        dueDate,
        status: 'pendente',
        isOwnCheck: true,
        isCompanyPayable: true,
        companyName: company,
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Cheque próprio ${i}/${installments} - Pagamento para ${company}`
      };
      
      await supabaseServices.checks.create(checkData);
    }
  }

  // Create boletos for debt payment method
  static async createBoletosForDebt(debtId: string, company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'boleto') return;
    
    const installments = safeNumber(paymentMethod.installments, 1);
    const installmentValue = safeNumber(paymentMethod.installmentValue, paymentMethod.amount);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || formatDateForInput(new Date());
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);
      
      const boletoData = {
        debtId,
        client: company,
        value: installmentValue,
        dueDate,
        status: 'pendente',
        installmentNumber: i,
        totalInstallments: installments,
        isCompanyPayable: true,
        companyName: company,
        observations: `Boleto ${i}/${installments} - Pagamento para ${company}`
      };
      
      await supabaseServices.boletos.create(boletoData);
    }
  }

  // Create acerto for debt payment method
  static async createAcertoForDebt(company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'acerto') return;
    
    const amount = safeNumber(paymentMethod.amount, 0);
    if (amount <= 0) return;
    
    // Check if acerto already exists for this company
    const existingAcertos = await supabaseServices.acertos.getAcertos();
    const existingAcerto = existingAcertos.find(a => 
      a.companyName === company && a.type === 'empresa'
    );
    
    if (existingAcerto) {
      // Update existing acerto
      const updatedAcerto = {
        ...existingAcerto,
        totalAmount: existingAcerto.totalAmount + amount,
        pendingAmount: existingAcerto.pendingAmount + amount,
        status: 'pendente' as const
      };
      
      await supabaseServices.acertos.update(existingAcerto.id!, updatedAcerto);
    } else {
      // Create new acerto
      const acertoData = {
        clientName: company,
        companyName: company,
        type: 'empresa' as const,
        totalAmount: amount,
        paidAmount: 0,
        pendingAmount: amount,
        status: 'pendente' as const,
        observations: `Acerto criado automaticamente para dívidas de ${company}`
      };
      
      await supabaseServices.acertos.create(acertoData);
    }
  }

  // Process all installments for a sale
  static async processInstallmentsForSale(saleId: string, client: string, paymentMethods: any[]): Promise<void> {
    for (const method of paymentMethods) {
      if (method.installments && method.installments > 1) {
        switch (method.type) {
          case 'cheque':
            await this.createChecksForSale(saleId, client, method);
            break;
          case 'boleto':
            await this.createBoletosForSale(saleId, client, method);
            break;
        }
      }
      
      if (method.type === 'acerto') {
        await this.createAcertoForSale(client, method);
      }
    }
  }

  // Process all installments for a debt
  static async processInstallmentsForDebt(debtId: string, company: string, paymentMethods: any[]): Promise<void> {
    for (const method of paymentMethods) {
      if (method.installments && method.installments > 1) {
        switch (method.type) {
          case 'cheque':
            await this.createChecksForDebt(debtId, company, method);
            break;
          case 'boleto':
            await this.createBoletosForDebt(debtId, company, method);
            break;
        }
      }
      
      if (method.type === 'acerto') {
        await this.createAcertoForDebt(company, method);
      }
    }
  }
}