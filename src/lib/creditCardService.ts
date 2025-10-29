import { supabase } from './supabase';
import { safeNumber } from '../utils/numberUtils';
import toast from 'react-hot-toast';

export interface CreditCardSale {
  id: string;
  sale_id: string | null;
  client_name: string;
  total_amount: number;
  remaining_amount: number;
  installments: number;
  sale_date: string;
  first_due_date: string;
  status: string;
  anticipated: boolean;
  anticipated_date: string | null;
  anticipated_fee: number | null;
  anticipated_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCardSaleInstallment {
  id: string;
  credit_card_sale_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  received_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCardDebt {
  id: string;
  debt_id: string | null;
  supplier_name: string;
  total_amount: number;
  remaining_amount: number;
  installments: number;
  purchase_date: string;
  first_due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreditCardDebtInstallment {
  id: string;
  credit_card_debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
}

export const CreditCardService = {
  async createFromSale(params: {
    saleId: string;
    clientName: string;
    totalAmount: number;
    installments: number;
    saleDate: string;
    firstDueDate: string;
  }): Promise<string> {
    const { saleId, clientName, totalAmount, installments, saleDate, firstDueDate } = params;
    const installmentAmount = totalAmount / installments;

    const { data: sale, error: saleError } = await supabase
      .from('credit_card_sales')
      .insert({
        sale_id: saleId,
        client_name: clientName,
        total_amount: totalAmount,
        remaining_amount: totalAmount,
        installments: installments,
        sale_date: saleDate,
        first_due_date: firstDueDate,
        status: 'active',
        anticipated: false,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    const installmentsData = [];
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      installmentsData.push({
        credit_card_sale_id: sale.id,
        installment_number: i + 1,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    const { error: installmentsError } = await supabase
      .from('credit_card_sale_installments')
      .insert(installmentsData);

    if (installmentsError) throw installmentsError;

    return sale.id;
  },

  async createFromDebt(params: {
    debtId: string;
    supplierName: string;
    totalAmount: number;
    installments: number;
    purchaseDate: string;
    firstDueDate: string;
  }): Promise<string> {
    const { debtId, supplierName, totalAmount, installments, purchaseDate, firstDueDate } = params;
    const installmentAmount = totalAmount / installments;

    const { data: debt, error: debtError } = await supabase
      .from('credit_card_debts')
      .insert({
        debt_id: debtId,
        supplier_name: supplierName,
        total_amount: totalAmount,
        remaining_amount: totalAmount,
        installments: installments,
        purchase_date: purchaseDate,
        first_due_date: firstDueDate,
        status: 'active',
      })
      .select()
      .single();

    if (debtError) throw debtError;

    const installmentsData = [];
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      installmentsData.push({
        credit_card_debt_id: debt.id,
        installment_number: i + 1,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    const { error: installmentsError } = await supabase
      .from('credit_card_debt_installments')
      .insert(installmentsData);

    if (installmentsError) throw installmentsError;

    return debt.id;
  },

  async anticipateSale(saleId: string, anticipationFee: number): Promise<void> {
    const { data: sale, error: saleError } = await supabase
      .from('credit_card_sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) throw saleError;
    if (!sale) throw new Error('Venda não encontrada');

    const anticipatedAmount = sale.remaining_amount - anticipationFee;

    const { error: updateError } = await supabase
      .from('credit_card_sales')
      .update({
        anticipated: true,
        anticipated_date: new Date().toISOString().split('T')[0],
        anticipated_fee: anticipationFee,
        anticipated_amount: anticipatedAmount,
        remaining_amount: 0,
        status: 'completed'
      })
      .eq('id', saleId);

    if (updateError) throw updateError;

    const { error: installmentsError } = await supabase
      .from('credit_card_sale_installments')
      .update({
        status: 'received',
        received_date: new Date().toISOString().split('T')[0]
      })
      .eq('credit_card_sale_id', saleId)
      .eq('status', 'pending');

    if (installmentsError) throw installmentsError;

    const { error: cashError } = await supabase
      .from('cash_transactions')
      .insert([{
        date: new Date().toISOString().split('T')[0],
        type: 'entrada',
        amount: anticipatedAmount,
        description: `Antecipação de venda (Cartão de Crédito) - ${sale.client_name}`,
        category: 'antecipacao_cartao',
        related_id: saleId,
        payment_method: 'cartao_credito'
      }]);

    if (cashError) throw cashError;

    const { AgendaAutoService } = await import('./agendaAutoService');
    await AgendaAutoService.removeSaleInstallmentsFromAgenda(saleId);
  },

  async checkAndProcessDueInstallments(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { data: dueInstallments, error: queryError } = await supabase
      .from('credit_card_sale_installments')
      .select('*, credit_card_sales!inner(*)')
      .eq('status', 'pending')
      .lte('due_date', today);

    if (queryError) {
      console.error('Erro ao buscar parcelas vencidas:', queryError);
      return;
    }

    for (const installment of dueInstallments || []) {
      const sale = (installment as any).credit_card_sales;

      await supabase
        .from('credit_card_sale_installments')
        .update({
          status: 'received',
          received_date: today
        })
        .eq('id', installment.id);

      await supabase
        .from('cash_transactions')
        .insert([{
          date: today,
          type: 'entrada',
          amount: installment.amount,
          description: `Recebimento parcela ${installment.installment_number} - ${sale.client_name} (Cartão de Crédito)`,
          category: 'recebimento_cartao',
          related_id: sale.id,
          payment_method: 'cartao_credito'
        }]);

      const { data: allInstallments } = await supabase
        .from('credit_card_sale_installments')
        .select('*')
        .eq('credit_card_sale_id', sale.id);

      const allReceived = allInstallments?.every(i => i.status === 'received');

      if (allReceived) {
        await supabase
          .from('credit_card_sales')
          .update({
            remaining_amount: 0,
            status: 'completed'
          })
          .eq('id', sale.id);
      } else {
        const remainingAmount = allInstallments
          ?.filter(i => i.status === 'pending')
          .reduce((sum, i) => sum + i.amount, 0) || 0;

        await supabase
          .from('credit_card_sales')
          .update({ remaining_amount: remainingAmount })
          .eq('id', sale.id);
      }
    }

    const { data: dueDebtInstallments, error: debtQueryError } = await supabase
      .from('credit_card_debt_installments')
      .select('*, credit_card_debts!inner(*)')
      .eq('status', 'pending')
      .lte('due_date', today);

    if (debtQueryError) {
      console.error('Erro ao buscar parcelas de dívida vencidas:', debtQueryError);
      return;
    }

    for (const installment of dueDebtInstallments || []) {
      const debt = (installment as any).credit_card_debts;

      await supabase
        .from('credit_card_debt_installments')
        .update({
          status: 'paid',
          paid_date: today
        })
        .eq('id', installment.id);

      await supabase
        .from('cash_transactions')
        .insert([{
          date: today,
          type: 'saida',
          amount: installment.amount,
          description: `Pagamento parcela ${installment.installment_number} - ${debt.supplier_name} (Cartão de Crédito)`,
          category: 'pagamento_cartao',
          related_id: debt.id,
          payment_method: 'cartao_credito'
        }]);

      const { data: allDebtInstallments } = await supabase
        .from('credit_card_debt_installments')
        .select('*')
        .eq('credit_card_debt_id', debt.id);

      const allPaid = allDebtInstallments?.every(i => i.status === 'paid');

      if (allPaid) {
        await supabase
          .from('credit_card_debts')
          .update({
            remaining_amount: 0,
            status: 'completed'
          })
          .eq('id', debt.id);
      } else {
        const remainingAmount = allDebtInstallments
          ?.filter(i => i.status === 'pending')
          .reduce((sum, i) => sum + i.amount, 0) || 0;

        await supabase
          .from('credit_card_debts')
          .update({ remaining_amount: remainingAmount })
          .eq('id', debt.id);
      }
    }
  }
};
