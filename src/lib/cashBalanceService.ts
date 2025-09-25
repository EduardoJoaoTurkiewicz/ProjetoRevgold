// Service to handle cash balance updates when payments are marked as paid
import { supabaseServices } from './supabaseServices';
import { safeNumber } from '../utils/numberUtils';

export class CashBalanceService {
  // Update cash balance when a check is marked as paid
  static async handleCheckPayment(check: any, oldStatus: string, newStatus: string): Promise<void> {
    if (oldStatus !== 'compensado' && newStatus === 'compensado') {
      const amount = safeNumber(check.value, 0);
      
      if (check.isOwnCheck || check.isCompanyPayable) {
        // Company's own check = cash outflow
        await this.createCashTransaction({
          date: check.paymentDate || check.dueDate,
          type: 'saida',
          amount: amount,
          description: `Cheque próprio pago - ${check.companyName || check.client}`,
          category: 'cheque',
          relatedId: check.id,
          paymentMethod: 'cheque'
        });
      } else {
        // Third-party check = cash inflow
        await this.createCashTransaction({
          date: check.paymentDate || check.dueDate,
          type: 'entrada',
          amount: amount,
          description: `Cheque compensado - ${check.client}`,
          category: 'cheque',
          relatedId: check.id,
          paymentMethod: 'cheque'
        });
      }
    }
  }

  // Update cash balance when a boleto is marked as paid
  static async handleBoletoPayment(boleto: any, oldStatus: string, newStatus: string): Promise<void> {
    if (oldStatus !== 'compensado' && newStatus === 'compensado') {
      const amount = safeNumber(boleto.value, 0);
      const finalAmount = safeNumber(boleto.finalAmount, amount);
      const notaryCosts = safeNumber(boleto.notaryCosts, 0);
      
      if (boleto.isCompanyPayable) {
        // Company's boleto = cash outflow
        await this.createCashTransaction({
          date: boleto.paymentDate || boleto.dueDate,
          type: 'saida',
          amount: finalAmount,
          description: `Boleto pago - ${boleto.companyName || boleto.client}`,
          category: 'boleto',
          relatedId: boleto.id,
          paymentMethod: 'boleto'
        });
      } else {
        // Received boleto = cash inflow (minus notary costs)
        const netAmount = finalAmount - notaryCosts;
        
        await this.createCashTransaction({
          date: boleto.paymentDate || boleto.dueDate,
          type: 'entrada',
          amount: netAmount,
          description: `Boleto recebido - ${boleto.client}`,
          category: 'boleto',
          relatedId: boleto.id,
          paymentMethod: 'boleto'
        });
        
        // Create separate transaction for notary costs if any
        if (notaryCosts > 0) {
          await this.createCashTransaction({
            date: boleto.paymentDate || boleto.dueDate,
            type: 'saida',
            amount: notaryCosts,
            description: `Custos de cartório - ${boleto.client}`,
            category: 'outro',
            relatedId: boleto.id,
            paymentMethod: 'cartorio'
          });
        }
      }
    }
  }

  // Create cash transaction
  private static async createCashTransaction(transactionData: any): Promise<void> {
    try {
      await supabaseServices.cashTransactions.create(transactionData);
      console.log('✅ Cash transaction created:', transactionData.description);
    } catch (error) {
      console.error('❌ Error creating cash transaction:', error);
      throw error;
    }
  }
}