import { supabase, isSupabaseConfigured } from './supabase';
import type { Sale, Check, Boleto } from '../types';

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
      // Find payment methods that are checks
      const checkPayments = sale.paymentMethods.filter(method => method.type === 'cheque');
      
      for (const checkPayment of checkPayments) {
        const installments = checkPayment.installments || 1;
        const installmentValue = checkPayment.installmentValue || checkPayment.amount;
        const installmentInterval = checkPayment.installmentInterval || 30;
        const startDate = new Date(checkPayment.firstInstallmentDate || sale.date);

        // Create checks for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));

          // Check if check already exists to prevent duplicates

          const checkData = {
            sale_id: sale.id,
            client: sale.client,
            value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            is_own_check: checkPayment.isOwnCheck || false,
            used_for: `Venda - ${sale.client}`,
            installment_number: i + 1,
            total_installments: installments,
            observations: `Cheque gerado automaticamente da venda para ${sale.client}`
          };

          const { error } = await supabase.from('checks').insert([checkData]);
          if (error) {
            if (error.code === '23505') {
              console.log(`⚠️ Cheque ${i + 1}/${installments} já existe (constraint violation)`);
            } else {
              console.error('Erro ao criar cheque automático:', error);
            }
          } else {
            console.log(`✅ Cheque ${i + 1}/${installments} criado para venda ${sale.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de cheques:', error);
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
      // Find payment methods that are boletos
      const boletoPayments = sale.paymentMethods.filter(method => method.type === 'boleto');
      
      for (const boletoPayment of boletoPayments) {
        const installments = boletoPayment.installments || 1;
        const installmentValue = boletoPayment.installmentValue || boletoPayment.amount;
        const installmentInterval = boletoPayment.installmentInterval || 30;
        const startDate = new Date(boletoPayment.firstInstallmentDate || sale.date);

        // Create boletos for each installment
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * installmentInterval));

          // Check if boleto already exists to prevent duplicates
          const boletoData = {
            sale_id: sale.id,
            client: sale.client,
            value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            installment_number: i + 1,
            total_installments: installments,
            observations: `Boleto gerado automaticamente da venda para ${sale.client}`
          };

          const { error } = await supabase.from('boletos').insert([boletoData]);
          if (error) {
            if (error.code === '23505') {
              console.log(`⚠️ Boleto ${i + 1}/${installments} já existe (constraint violation)`);
            } else {
              console.error('Erro ao criar boleto automático:', error);
            }
          } else {
            console.log(`✅ Boleto ${i + 1}/${installments} criado para venda ${sale.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro na criação automática de boletos:', error);
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
}