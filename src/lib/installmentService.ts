// Service to handle installment creation and management
import { supabaseServices } from './supabaseServices';
import { formatDateForInput, addDays } from '../utils/dateUtils';
import { safeNumber } from '../utils/numberUtils';
import { UUIDManager } from './uuidManager';

export class InstallmentService {
  // Create checks for sale payment method
  static async createChecksForSale(saleId: string, client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'cheque') return;

    const installments = safeNumber(paymentMethod.installments, 1);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || new Date().toISOString().split('T')[0];

    // Check if using custom values
    const useCustomValues = paymentMethod.useCustomValues && paymentMethod.customInstallmentValues && paymentMethod.customInstallmentValues.length === installments;

    console.log(`🔄 Creating ${installments} checks for sale ${saleId}${useCustomValues ? ' with custom values' : ''}`);

    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);

      // Use custom value if available, otherwise use default installment value
      const checkValue = useCustomValues
        ? safeNumber(paymentMethod.customInstallmentValues[i - 1], 0)
        : safeNumber(paymentMethod.installmentValue, paymentMethod.amount);

      const checkData = {
        id: UUIDManager.generateUUID(),
        saleId,
        client,
        value: checkValue,
        dueDate,
        status: 'pendente',
        isOwnCheck: paymentMethod.isOwnCheck || false,
        isThirdPartyCheck: paymentMethod.isThirdPartyCheck || false,
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Cheque ${i}/${installments} - Venda para ${client}`,
        // Add third party details if available
        thirdPartyDetails: paymentMethod.thirdPartyDetails?.[i-1] || null
      };
      
      try {
        await supabaseServices.checks.create(checkData);
        console.log(`✅ Check ${i}/${installments} created for sale`);
      } catch (error) {
        console.error(`❌ Error creating check ${i}/${installments}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${installments} checks created for sale ${saleId}`);
  }

  // Create boletos for sale payment method
  static async createBoletosForSale(saleId: string, client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'boleto') return;

    const installments = safeNumber(paymentMethod.installments, 1);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || new Date().toISOString().split('T')[0];

    // Check if using custom values
    const useCustomValues = paymentMethod.useCustomValues && paymentMethod.customInstallmentValues && paymentMethod.customInstallmentValues.length === installments;
    
    console.log(`🔄 Creating ${installments} boletos for sale ${saleId}${useCustomValues ? ' with custom values' : ''}`);

    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);

      // Use custom value if available, otherwise use default installment value
      const boletoValue = useCustomValues
        ? safeNumber(paymentMethod.customInstallmentValues[i - 1], 0)
        : safeNumber(paymentMethod.installmentValue, paymentMethod.amount);

      const boletoData = {
        id: UUIDManager.generateUUID(),
        saleId,
        client,
        value: boletoValue,
        dueDate,
        status: 'pendente',
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Boleto ${i}/${installments} - Venda para ${client}`
      };
      
      try {
        await supabaseServices.boletos.create(boletoData);
        console.log(`✅ Boleto ${i}/${installments} created for sale`);
      } catch (error) {
        console.error(`❌ Error creating boleto ${i}/${installments}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${installments} boletos created for sale ${saleId}`);
  }

  // Create acerto for sale payment method
  static async createAcertoForSale(client: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'acerto') return;
    
    const amount = safeNumber(paymentMethod.amount, 0);
    if (amount <= 0) return;
    
    console.log(`🔄 Creating/updating acerto for client ${client}, amount: ${amount}`);
    
    // Check if acerto already exists for this client
    try {
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
          status: 'pendente' as const,
          updatedAt: new Date().toISOString()
        };
      
        await supabaseServices.acertos.update(existingAcerto.id!, updatedAcerto);
        console.log(`✅ Acerto updated for client ${client}`);
      } else {
        // Create new acerto
        const acertoData = {
          id: UUIDManager.generateUUID(),
          clientName: client,
          type: 'cliente' as const,
          totalAmount: amount,
          paidAmount: 0,
          pendingAmount: amount,
          status: 'pendente' as const,
          observations: `Acerto criado automaticamente para vendas de ${client}`
        };
      
        await supabaseServices.acertos.create(acertoData);
        console.log(`✅ New acerto created for client ${client}`);
      }
    } catch (error) {
      console.error(`❌ Error creating/updating acerto for client ${client}:`, error);
      throw error;
    }
  }

  // Create checks for debt payment method
  static async createChecksForDebt(debtId: string, company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'cheque') return;

    const installments = safeNumber(paymentMethod.installments, 1);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || new Date().toISOString().split('T')[0];

    // Check if using custom values
    const useCustomValues = paymentMethod.useCustomValues && paymentMethod.customInstallmentValues && paymentMethod.customInstallmentValues.length === installments;

    console.log(`🔄 Creating ${installments} checks for debt ${debtId}${useCustomValues ? ' with custom values' : ''}`);

    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);

      // Use custom value if available, otherwise use default installment value
      const checkValue = useCustomValues
        ? safeNumber(paymentMethod.customInstallmentValues[i - 1], 0)
        : safeNumber(paymentMethod.installmentValue, paymentMethod.amount);

      const checkData = {
        id: UUIDManager.generateUUID(),
        debtId,
        client: company,
        value: checkValue,
        dueDate,
        status: 'pendente',
        isOwnCheck: true,
        isCompanyPayable: true,
        companyName: company,
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Cheque próprio ${i}/${installments} - Pagamento para ${company}`,
        usedFor: `Pagamento de dívida - ${company}`
      };
      
      try {
        await supabaseServices.checks.create(checkData);
        console.log(`✅ Check ${i}/${installments} created for debt`);
      } catch (error) {
        console.error(`❌ Error creating check ${i}/${installments}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${installments} checks created for debt ${debtId}`);
  }

  // Create boletos for debt payment method
  static async createBoletosForDebt(debtId: string, company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'boleto') return;

    const installments = safeNumber(paymentMethod.installments, 1);
    const interval = safeNumber(paymentMethod.installmentInterval, 30);
    const startDate = paymentMethod.firstInstallmentDate || new Date().toISOString().split('T')[0];

    // Check if using custom values
    const useCustomValues = paymentMethod.useCustomValues && paymentMethod.customInstallmentValues && paymentMethod.customInstallmentValues.length === installments;

    console.log(`🔄 Creating ${installments} boletos for debt ${debtId}${useCustomValues ? ' with custom values' : ''}`);

    for (let i = 1; i <= installments; i++) {
      const dueDate = addDays(startDate, (i - 1) * interval);

      // Use custom value if available, otherwise use default installment value
      const boletoValue = useCustomValues
        ? safeNumber(paymentMethod.customInstallmentValues[i - 1], 0)
        : safeNumber(paymentMethod.installmentValue, paymentMethod.amount);

      const boletoData = {
        id: UUIDManager.generateUUID(),
        debtId,
        client: company,
        value: boletoValue,
        dueDate,
        status: 'pendente',
        installmentNumber: i,
        totalInstallments: installments,
        isCompanyPayable: true,
        companyName: company,
        observations: `Boleto ${i}/${installments} - Pagamento para ${company}`
      };
      
      try {
        await supabaseServices.boletos.create(boletoData);
        console.log(`✅ Boleto ${i}/${installments} created for debt`);
      } catch (error) {
        console.error(`❌ Error creating boleto ${i}/${installments}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${installments} boletos created for debt ${debtId}`);
  }

  // Create acerto for debt payment method
  static async createAcertoForDebt(company: string, paymentMethod: any): Promise<void> {
    if (paymentMethod.type !== 'acerto') return;
    
    const amount = safeNumber(paymentMethod.amount, 0);
    if (amount <= 0) return;
    
    console.log(`🔄 Creating/updating acerto for company ${company}, amount: ${amount}`);
    
    // Check if acerto already exists for this company
    try {
      const existingAcertos = await supabaseServices.acertos.getAcertos();
      const existingAcerto = existingAcertos.find(a => 
        (a.companyName === company || a.clientName === company) && a.type === 'empresa'
      );
    
      if (existingAcerto) {
        // Update existing acerto
        const updatedAcerto = {
          ...existingAcerto,
          totalAmount: existingAcerto.totalAmount + amount,
          pendingAmount: existingAcerto.pendingAmount + amount,
          status: 'pendente' as const,
          updatedAt: new Date().toISOString()
        };
      
        await supabaseServices.acertos.update(existingAcerto.id!, updatedAcerto);
        console.log(`✅ Acerto updated for company ${company}`);
      } else {
        // Create new acerto
        const acertoData = {
          id: UUIDManager.generateUUID(),
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
        console.log(`✅ New acerto created for company ${company}`);
      }
    } catch (error) {
      console.error(`❌ Error creating/updating acerto for company ${company}:`, error);
      throw error;
    }
  }

  // Process all installments for a sale
  static async processInstallmentsForSale(saleId: string, client: string, paymentMethods: any[]): Promise<void> {
    console.log(`🔄 Processing installments for sale ${saleId}, client: ${client}`);
    
    for (const method of paymentMethods) {
      try {
        // Handle cheques (both single and multiple installments)
        if (method.type === 'cheque') {
          if (method.installments && method.installments > 1) {
            await this.createChecksForSale(saleId, client, method);
          } else {
            // Single check
            await this.createChecksForSale(saleId, client, { 
              ...method, 
              installments: 1, 
              installmentValue: method.amount,
              firstInstallmentDate: method.firstInstallmentDate || new Date().toISOString().split('T')[0]
            });
          }
        }
        
        // Handle boletos (both single and multiple installments)
        if (method.type === 'boleto') {
          if (method.installments && method.installments > 1) {
            await this.createBoletosForSale(saleId, client, method);
          } else {
            // Single boleto
            await this.createBoletosForSale(saleId, client, { 
              ...method, 
              installments: 1, 
              installmentValue: method.amount,
              firstInstallmentDate: method.firstInstallmentDate || new Date().toISOString().split('T')[0]
            });
          }
        }
        
        // Handle acertos
        if (method.type === 'acerto') {
          await this.createAcertoForSale(client, method);
        }
      } catch (error) {
        console.error(`❌ Error processing payment method ${method.type} for sale:`, error);
        // Continue with other methods even if one fails
      }
    }
    
    console.log(`✅ All installments processed for sale ${saleId}`);
  }

  // Process all installments for a debt
  static async processInstallmentsForDebt(debtId: string, company: string, paymentMethods: any[]): Promise<void> {
    console.log(`🔄 Processing installments for debt ${debtId}, company: ${company}`);

    for (const method of paymentMethods) {
      try {
        // Handle cheques (both single and multiple installments)
        if (method.type === 'cheque') {
          // First, handle selected checks from sales
          if (method.selectedChecks && method.selectedChecks.length > 0) {
            console.log(`🔄 Updating ${method.selectedChecks.length} selected checks for debt ${debtId}`);
            for (const checkId of method.selectedChecks) {
              try {
                // Update the check to mark it as used in this debt
                await supabaseServices.checks.update({
                  id: checkId,
                  debtId: debtId,
                  used_in_debt: debtId,
                  usedFor: `Pagamento de dívida - ${company}`,
                  updatedAt: new Date().toISOString()
                });
                console.log(`✅ Check ${checkId} marked as used for debt ${debtId}`);
              } catch (error) {
                console.error(`❌ Error updating check ${checkId}:`, error);
              }
            }
          }

          // Then create new checks if needed (for installments not covered by selected checks)
          if (method.installments && method.installments > 1 && !method.selectedChecks) {
            await this.createChecksForDebt(debtId, company, method);
          } else if (!method.selectedChecks || method.selectedChecks.length === 0) {
            // Single check
            await this.createChecksForDebt(debtId, company, {
              ...method,
              installments: 1,
              installmentValue: method.amount,
              firstInstallmentDate: method.firstInstallmentDate || new Date().toISOString().split('T')[0]
            });
          }
        }
        
        // Handle boletos (both single and multiple installments)
        if (method.type === 'boleto') {
          if (method.installments && method.installments > 1) {
            await this.createBoletosForDebt(debtId, company, method);
          } else {
            // Single boleto
            await this.createBoletosForDebt(debtId, company, { 
              ...method, 
              installments: 1, 
              installmentValue: method.amount,
              firstInstallmentDate: method.firstInstallmentDate || new Date().toISOString().split('T')[0]
            });
          }
        }
        
        // Handle acertos
        if (method.type === 'acerto') {
          await this.createAcertoForDebt(company, method);
        }
      } catch (error) {
        console.error(`❌ Error processing payment method ${method.type} for debt:`, error);
        // Continue with other methods even if one fails
      }
    }
    
    console.log(`✅ All installments processed for debt ${debtId}`);
  }
}