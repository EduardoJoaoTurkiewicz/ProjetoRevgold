import { Sale, Check, Boleto, PaymentMethod } from '../types';
import { checksService, boletosService } from './supabaseServices';

export class AutomationService {
  // Criar cheques automaticamente para vendas com pagamento em cheque
  static async createChecksForSale(sale: Sale): Promise<Check[]> {
    const createdChecks: Check[] = [];
    
    for (const [methodIndex, method] of sale.paymentMethods.entries()) {
      if (method.type === 'cheque') {
        const installments = method.installments || 1;
        
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const checkData: Omit<Check, 'id' | 'createdAt'> = {
            saleId: sale.id,
            client: sale.client,
            value: method.installmentValue || method.amount,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            isOwnCheck: false, // Default, pode ser alterado depois
            usedFor: `Venda - ${sale.client}`,
            installmentNumber: i + 1,
            totalInstallments: installments,
            thirdPartyCheckDetails: method.thirdPartyDetails && method.thirdPartyDetails[i] ? method.thirdPartyDetails[i] : undefined,
            observations: `Cheque gerado automaticamente para venda ${sale.id} - Parcela ${i + 1}/${installments}`
          };
          
          try {
            const check = await checksService.create(checkData);
            createdChecks.push(check);
            console.log(`✅ Cheque ${i + 1}/${installments} criado para venda ${sale.id}`);
          } catch (error) {
            console.error(`❌ Erro ao criar cheque ${i + 1}/${installments}:`, error);
          }
        }
      }
    }
    
    return createdChecks;
  }

  // Criar boletos automaticamente para vendas com pagamento em boleto
  static async createBoletosForSale(sale: Sale): Promise<Boleto[]> {
    console.log('🔄 Criando boletos para venda:', sale.id);
    const createdBoletos: Boleto[] = [];
    
    for (const [methodIndex, method] of sale.paymentMethods.entries()) {
      if (method.type === 'boleto') {
        console.log(`📄 Processando método de pagamento ${methodIndex + 1}: boleto`);
        const installments = method.installments || 1;
        
        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const boletoData: Omit<Boleto, 'id' | 'createdAt'> = {
            saleId: sale.id,
            client: sale.client,
            value: method.installmentValue || method.amount,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            installmentNumber: i + 1,
            totalInstallments: installments,
            boletoFile: '',
            observations: `Boleto gerado automaticamente para venda ${sale.id} - Parcela ${i + 1}/${installments}`
          };
          
          try {
            // Verificar se já existe um boleto idêntico para evitar duplicatas
            const existingBoleto = await boletosService.findDuplicate(boletoData);
            if (!existingBoleto) {
              const boleto = await boletosService.create(boletoData);
              createdBoletos.push(boleto);
              console.log(`✅ Boleto ${i + 1}/${installments} criado para venda ${sale.id}`);
            } else {
              console.log(`⚠️ Boleto ${i + 1}/${installments} já existe para venda ${sale.id}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao criar boleto ${i + 1}/${installments}:`, error);
          }
        }
      }
    }
    
    return createdBoletos;
  }

  // Atualizar cheques quando uma venda for editada
  static async updateChecksForSale(sale: Sale, existingChecks: Check[]): Promise<void> {
    // Remover cheques antigos desta venda
    for (const check of existingChecks.filter(c => c.saleId === sale.id)) {
      try {
        await checksService.delete(check.id);
        console.log(`✅ Cheque antigo removido: ${check.id}`);
      } catch (error) {
        console.error(`❌ Erro ao remover cheque antigo:`, error);
      }
    }
    
    // Criar novos cheques
    await this.createChecksForSale(sale);
  }

  // Atualizar boletos quando uma venda for editada
  static async updateBoletosForSale(sale: Sale, existingBoletos: Boleto[]): Promise<void> {
    // Remover boletos antigos desta venda
    for (const boleto of existingBoletos.filter(b => b.saleId === sale.id)) {
      try {
        await boletosService.delete(boleto.id);
        console.log(`✅ Boleto antigo removido: ${boleto.id}`);
      } catch (error) {
        console.error(`❌ Erro ao remover boleto antigo:`, error);
      }
    }
    
    // Criar novos boletos
    await this.createBoletosForSale(sale);
  }
}