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
          date: check.paymentDate || new Date().toISOString().split('T')[0],
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
          date: check.paymentDate || new Date().toISOString().split('T')[0],
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
          date: boleto.paymentDate || new Date().toISOString().split('T')[0],
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
          date: boleto.paymentDate || new Date().toISOString().split('T')[0],
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
            date: boleto.paymentDate || new Date().toISOString().split('T')[0],
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

  // Handle debt installment payment - creates cash outflow when paid via company cash
  static async handleDebtInstallmentPayment(
    debt: any,
    installmentInfo: { number: number, total: number, amount: number },
    paymentMethod: string,
    paymentDate: string
  ): Promise<void> {
    // Payment methods that come from company cash (create outflow)
    const cashPaymentMethods = ['dinheiro', 'pix', 'cartao_debito', 'transferencia'];

    // Only create cash outflow if payment is via company cash
    if (cashPaymentMethods.includes(paymentMethod)) {
      const amount = safeNumber(installmentInfo.amount, 0);

      await this.createCashTransaction({
        date: paymentDate,
        type: 'saida',
        amount: amount,
        description: `Pagamento parcela ${installmentInfo.number}/${installmentInfo.total} - ${debt.company} - ${debt.description}`,
        category: 'divida',
        relatedId: debt.id,
        paymentMethod: paymentMethod
      });

      console.log(`✅ Cash outflow created for debt installment: R$ ${amount.toFixed(2)}`);
    } else {
      console.log(`ℹ️ No cash outflow for payment method: ${paymentMethod} (not a cash payment)`);
    }
  }

  // Handle credit card debt installment payment
  static async handleCreditCardDebtInstallmentPayment(
    installmentData: any,
    debtInfo: { supplierName: string, totalAmount: number }
  ): Promise<void> {
    const amount = safeNumber(installmentData.amount, 0);

    await this.createCashTransaction({
      date: installmentData.paid_date || new Date().toISOString().split('T')[0],
      type: 'saida',
      amount: amount,
      description: `Pagamento cartão de crédito - Parcela ${installmentData.installment_number} - ${debtInfo.supplierName}`,
      category: 'cartao',
      relatedId: installmentData.credit_card_debt_id,
      paymentMethod: 'cartao_credito'
    });

    console.log(`✅ Cash outflow created for credit card debt installment: R$ ${amount.toFixed(2)}`);
  }

  // Handle acerto payment processing
  static async handleAcertoPayment(acerto: any, paymentData: any): Promise<void> {
    try {
      // If payment method creates installments, process them
      if (paymentData.paymentMethod === 'cheque' && paymentData.paymentInstallments > 1) {
        await this.createChecksForAcerto(acerto, paymentData);
      } else if (paymentData.paymentMethod === 'boleto' && paymentData.paymentInstallments > 1) {
        await this.createBoletosForAcerto(acerto, paymentData);
      } else if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(paymentData.paymentMethod)) {
        // Direct cash payment
        await this.createCashTransaction({
          date: paymentData.paymentDate,
          type: acerto.type === 'cliente' ? 'entrada' : 'saida',
          amount: paymentData.paymentAmount || (paymentData.paidAmount - acerto.paidAmount),
          description: `Pagamento de acerto - ${acerto.clientName}`,
          category: 'outro',
          relatedId: acerto.id,
          paymentMethod: paymentData.paymentMethod
        });
      }
    } catch (error) {
      console.error('❌ Error handling acerto payment:', error);
      throw error;
    }
  }

  // Create checks for acerto payment
  private static async createChecksForAcerto(acerto: any, paymentData: any): Promise<void> {
    const installments = paymentData.paymentInstallments || 1;
    const installmentValue = paymentData.paymentInstallmentValue || 0;
    const interval = paymentData.paymentInterval || 30;
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(paymentData.paymentDate);
      dueDate.setDate(dueDate.getDate() + (i - 1) * interval);
      
      const checkData = {
        client: acerto.clientName,
        value: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pendente',
        isOwnCheck: acerto.type === 'empresa',
        isCompanyPayable: acerto.type === 'empresa',
        companyName: acerto.type === 'empresa' ? acerto.companyName : null,
        installmentNumber: i,
        totalInstallments: installments,
        observations: `Cheque ${i}/${installments} - Pagamento de acerto para ${acerto.clientName}`
      };
      
      await supabaseServices.checks.create(checkData);
    }
  }

  // Create boletos for acerto payment
  private static async createBoletosForAcerto(acerto: any, paymentData: any): Promise<void> {
    const installments = paymentData.paymentInstallments || 1;
    const installmentValue = paymentData.paymentInstallmentValue || 0;
    const interval = paymentData.paymentInterval || 30;
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(paymentData.paymentDate);
      dueDate.setDate(dueDate.getDate() + (i - 1) * interval);
      
      const boletoData = {
        client: acerto.clientName,
        value: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pendente',
        installmentNumber: i,
        totalInstallments: installments,
        isCompanyPayable: acerto.type === 'empresa',
        companyName: acerto.type === 'empresa' ? acerto.companyName : null,
        observations: `Boleto ${i}/${installments} - Pagamento de acerto para ${acerto.clientName}`
      };
      
      await supabaseServices.boletos.create(boletoData);
    }
  }
}