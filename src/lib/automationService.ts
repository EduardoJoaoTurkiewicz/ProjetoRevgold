import { supabase, isSupabaseConfigured } from './supabase';
import type { Sale, Check, Boleto, SaleBoleto, SaleCheque, DebtBoleto, DebtCheque, Debt } from '../types';
import { saleBoletosService, saleChequesService, debtBoletosService, debtChequesService } from './supabaseServices';

export class AutomationService {
  // Transform database row to app format
  private static transformFromDatabase(row: any) {
    if (!row) return row;
    
    const transformed: any = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = value;
    }
    
    return transformed;
  }

  // Transform app format to database
  private static transformToDatabase(obj: any) {
    if (!obj) return obj;
    
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      transformed[snakeKey] = value;
    }
    
    return transformed;
  }

  static async createChecksForSale(sale: Sale): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando criação automática de cheques');
      return;
    }

    try {
      console.log('🔄 Criando cheques automáticos para venda:', sale.id);
      
      // Find payment methods that are checks
      const checkPayments = sale.paymentMethods.filter(method => method.type === 'cheque');
      
      if (checkPayments.length === 0) {
        console.log('ℹ️ Nenhum pagamento em cheque encontrado');
        return;
      }
      
      for (const checkPayment of checkPayments) {
        const installments = checkPayment.installments || 1;
        let installmentValue = checkPayment.installmentValue || checkPayment.amount;
        const installmentInterval = checkPayment.installmentInterval || 30;
        const startDate = new Date(checkPayment.firstInstallmentDate || sale.date);

        // Create checks for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));

          // Validate installment value
          if (!installmentValue || installmentValue <= 0) {
            console.warn(`⚠️ Valor da parcela inválido para cheque ${i + 1}, usando valor total`);
            installmentValue = checkPayment.amount;
          }

          // Use new sale_cheques table
          const saleChequeData: Omit<SaleCheque, 'id' | 'createdAt' | 'updatedAt'> = {
            saleId: sale.id,
            bank: checkPayment.thirdPartyDetails?.[0]?.bank || 'Banco não informado',
            number: checkPayment.thirdPartyDetails?.[0]?.checkNumber || `CHQ-${Date.now()}-${i + 1}`,
            dueDate: dueDate.toISOString().split('T')[0],
            value: installmentValue,
            usedForDebt: false,
            status: 'pendente',
            observations: `Cheque gerado automaticamente da venda para ${sale.client} - Parcela ${i + 1}/${installments}`
          };

          console.log(`🔄 Criando cheque ${i + 1}/${installments}:`, saleChequeData);

          try {
            await saleChequesService.create(saleChequeData);
            console.log(`✅ Cheque ${i + 1}/${installments} criado para venda ${sale.id}`);
          } catch (error) {
            console.error(`❌ Erro ao criar cheque ${i + 1}/${installments}:`, error);
            // Don't throw error to prevent sale creation failure
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de cheques:', error);
      // Don't throw error to prevent sale creation failure
    }
  }

  static async updateChecksForSale(sale: Sale, existingChecks: Check[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando atualização de cheques');
      return;
    }

    try {
      // Find existing checks for this sale
      const saleChecks = existingChecks.filter(check => check.saleId === sale.id);
      
      // Update existing checks with new sale information
      for (const check of saleChecks) {
        const updatedCheck = {
          ...this.transformToDatabase(check),
          client: sale.client,
          used_for: `Venda - ${sale.client}`
        };

        const { error } = await supabase
          .from('checks')
          .update(updatedCheck)
          .eq('id', check.id);

        if (error) {
          console.error('Erro ao atualizar cheque:', error);
        }
      }
    } catch (error) {
      console.error('Erro na atualização de cheques:', error);
    }
  }

  static async createBoletosForSale(sale: Sale): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando criação automática de boletos');
      return;
    }

    try {
      console.log('🔄 Criando boletos automáticos para venda:', sale.id);
      
      // Find payment methods that are boletos
      const boletoPayments = sale.paymentMethods.filter(method => method.type === 'boleto');
      
      if (boletoPayments.length === 0) {
        console.log('ℹ️ Nenhum pagamento em boleto encontrado');
        return;
      }
      
      for (const boletoPayment of boletoPayments) {
        const installments = boletoPayment.installments || 1;
        let installmentValue = boletoPayment.installmentValue || boletoPayment.amount;
        const installmentInterval = boletoPayment.installmentInterval || 30;
        const startDate = new Date(boletoPayment.firstInstallmentDate || sale.date);

        // Create boletos for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));

          // Validate installment value
          if (!installmentValue || installmentValue <= 0) {
            console.warn(`⚠️ Valor da parcela inválido para boleto ${i + 1}, usando valor total`);
            installmentValue = boletoPayment.amount;
          }
          
          // Use new sale_boletos table
          const saleBoletoData: Omit<SaleBoleto, 'id' | 'createdAt' | 'updatedAt'> = {
            saleId: sale.id,
            number: `${sale.client.substring(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`,
            dueDate: dueDate.toISOString().split('T')[0],
            value: installmentValue,
            status: 'pendente',
            interest: 0,
            observations: `Boleto gerado automaticamente da venda para ${sale.client} - Parcela ${i + 1}/${installments}`
          };

          console.log(`🔄 Criando boleto ${i + 1}/${installments}:`, boletoData);
          
          try {
            await saleBoletosService.create(saleBoletoData);
            console.log(`✅ Boleto ${i + 1}/${installments} criado para venda ${sale.id}`);
          } catch (error) {
            console.error(`❌ Erro ao criar boleto ${i + 1}/${installments}:`, error);
            // Don't throw error to prevent sale creation failure
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de boletos:', error);
      // Don't throw error to prevent sale creation failure
    }
  }

  static async updateBoletosForSale(sale: Sale, existingBoletos: Boleto[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando atualização de boletos');
      return;
    }

    try {
      // Find existing boletos for this sale
      const saleBoletos = existingBoletos.filter(boleto => boleto.saleId === sale.id);
      
      // Update existing boletos with new sale information
      for (const boleto of saleBoletos) {
        const updatedBoleto = {
          ...this.transformToDatabase(boleto),
          client: sale.client
        };

        const { error } = await supabase
          .from('boletos')
          .update(updatedBoleto)
          .eq('id', boleto.id);

        if (error) {
          console.error('Erro ao atualizar boleto:', error);
        }
      }
    } catch (error) {
      console.error('Erro na atualização de boletos:', error);
    }
  }

  // Create boletos for debts
  static async createBoletosForDebt(debt: Debt): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando criação automática de boletos para dívida');
      return;
    }

    try {
      console.log('🔄 Criando boletos automáticos para dívida:', debt.id);
      
      // Find payment methods that are boletos
      const boletoPayments = debt.paymentMethods.filter(method => method.type === 'boleto');
      
      if (boletoPayments.length === 0) {
        console.log('ℹ️ Nenhum pagamento em boleto encontrado para dívida');
        return;
      }
      
      for (const boletoPayment of boletoPayments) {
        const installments = boletoPayment.installments || 1;
        let installmentValue = boletoPayment.installmentValue || boletoPayment.amount;
        const installmentInterval = boletoPayment.installmentInterval || 30;
        const startDate = new Date(boletoPayment.firstInstallmentDate || debt.date);

        // Create boletos for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));

          // Validate installment value
          if (!installmentValue || installmentValue <= 0) {
            console.warn(`⚠️ Valor da parcela inválido para boleto ${i + 1}, usando valor total`);
            installmentValue = boletoPayment.amount;
          }
          
          const debtBoletoData: Omit<DebtBoleto, 'id' | 'createdAt' | 'updatedAt'> = {
            debtId: debt.id,
            number: `${debt.company.substring(0, 3).toUpperCase()}-DEBT-${Date.now()}-${i + 1}`,
            dueDate: dueDate.toISOString().split('T')[0],
            value: installmentValue,
          console.log(`🔄 Criando boleto de dívida ${i + 1}/${installments}:`, debtBoletoData);
          
          try {
            await debtBoletosService.create(debtBoletoData);
            console.log(`✅ Boleto de dívida ${i + 1}/${installments} criado para dívida ${debt.id}`);
          } catch (error) {
            console.error(`❌ Erro ao criar boleto de dívida ${i + 1}/${installments}:`, error);
            // Don't throw error to prevent debt creation failure
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de boletos para dívida:', error);
      // Don't throw error to prevent debt creation failure
    }
  }

  // Create cheques for debts
  static async createChequesForDebt(debt: Debt): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('⚠️ Supabase não configurado, pulando criação automática de cheques para dívida');
      return;
    }
            status: 'pendente',
    try {
      console.log('🔄 Criando cheques automáticos para dívida:', debt.id);
      
      // Find payment methods that are cheques
      const chequePayments = debt.paymentMethods.filter(method => method.type === 'cheque');
      
      if (chequePayments.length === 0) {
        console.log('ℹ️ Nenhum pagamento em cheque encontrado para dívida');
        return;
      }
      
      for (const chequePayment of chequePayments) {
        const installments = chequePayment.installments || 1;
        let installmentValue = chequePayment.installmentValue || chequePayment.amount;
        const installmentInterval = chequePayment.installmentInterval || 30;
        const startDate = new Date(chequePayment.firstInstallmentDate || debt.date);
            interest: 0,
        // Create cheques for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));
            observations: `Boleto gerado automaticamente da dívida para ${debt.company} - Parcela ${i + 1}/${installments}`
          // Validate installment value
          if (!installmentValue || installmentValue <= 0) {
            console.warn(`⚠️ Valor da parcela inválido para cheque ${i + 1}, usando valor total`);
            installmentValue = chequePayment.amount;
          }
          
          const debtChequeData: Omit<DebtCheque, 'id' | 'createdAt' | 'updatedAt'> = {
            debtId: debt.id,
            bank: 'Banco da empresa',
            number: `CHQ-DEBT-${Date.now()}-${i + 1}`,
            dueDate: dueDate.toISOString().split('T')[0],
            value: installmentValue,
            status: 'pendente',
            observations: `Cheque gerado automaticamente da dívida para ${debt.company} - Parcela ${i + 1}/${installments}`
          };
          };
          console.log(`🔄 Criando cheque de dívida ${i + 1}/${installments}:`, debtChequeData);
          
          try {
            await debtChequesService.create(debtChequeData);
            console.log(`✅ Cheque de dívida ${i + 1}/${installments} criado para dívida ${debt.id}`);
          } catch (error) {
            console.error(`❌ Erro ao criar cheque de dívida ${i + 1}/${installments}:`, error);
            // Don't throw error to prevent debt creation failure
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de cheques para dívida:', error);
      // Don't throw error to prevent debt creation failure
    }
  }
}