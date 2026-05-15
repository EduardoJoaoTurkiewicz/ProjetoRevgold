import { supabase } from './supabase';
import { safeNumber } from '../utils/numberUtils';
import { Acerto } from '../types';
import { getCurrentDateISO } from './dateOnly';

export class AcertoPaymentService {
  /**
   * Processa o pagamento de acerto de cliente.
   * Atualiza as vendas selecionadas, cria transações de caixa e
   * registros de parcelas (cheques/boletos) conforme necessário.
   */
  static async processClientPayment(
    acerto: Acerto,
    selectedSaleIds: string[],
    paymentAmount: number,
    paymentMethods: any[]
  ): Promise<void> {
    console.log('🔄 Processing acerto payment:', {
      acertoId: acerto.id,
      selectedSales: selectedSaleIds,
      paymentAmount,
      methods: paymentMethods
    });

    // 1. Marcar as vendas selecionadas como pagas
    for (const saleId of selectedSaleIds) {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .maybeSingle();

      if (saleError || !sale) {
        console.error('❌ Error fetching sale:', saleError);
        continue;
      }

      const currentPending = safeNumber(sale.pending_amount, 0);
      const currentReceived = safeNumber(sale.received_amount, 0);

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          received_amount: currentReceived + currentPending,
          pending_amount: 0,
          status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (updateError) {
        console.error('❌ Error updating sale:', updateError);
      } else {
        console.log('✅ Sale updated:', saleId);
      }
    }

    // 2. Processar cada método de pagamento
    for (const method of paymentMethods) {
      const methodAmount = safeNumber(method.amount, 0);
      if (methodAmount <= 0) continue;

      // Dinheiro, PIX, transferência — entrada imediata no caixa
      if (['dinheiro', 'pix', 'transferencia'].includes(method.type)) {
        const { error } = await supabase.from('cash_transactions').insert({
          type: 'entrada',
          amount: methodAmount,
          description: `Pagamento de acerto - Cliente: ${acerto.clientName}`,
          category: 'acerto_cliente',
          date: getCurrentDateISO(),
          created_at: new Date().toISOString()
        });
        if (error) console.error('❌ Error creating cash transaction for', method.type, error);
        else console.log('✅ Cash transaction created for:', method.type);
      }

      // Cartão de débito — entrada com valor real após taxas
      if (method.type === 'cartao_debito') {
        const actualAmount = safeNumber(method.actualAmount, methodAmount);
        const { error } = await supabase.from('cash_transactions').insert({
          type: 'entrada',
          amount: actualAmount,
          description: `Pagamento de acerto (Cartão de Débito) - Cliente: ${acerto.clientName}`,
          category: 'acerto_cliente',
          date: getCurrentDateISO(),
          created_at: new Date().toISOString()
        });
        if (error) console.error('❌ Error creating cash transaction for debit card:', error);
        else console.log('✅ Cash transaction created for debit card');
      }

      // Cartão de crédito — cria registro no módulo de cartão de crédito
      if (method.type === 'cartao_credito') {
        const { CreditCardService } = await import('./creditCardService');
        await CreditCardService.createFromAcerto({
          acertoId: acerto.id,
          clientName: acerto.clientName,
          totalAmount: methodAmount,
          installments: safeNumber(method.installments, 1),
          paymentDate: getCurrentDateISO(),
          firstDueDate: method.firstInstallmentDate || getCurrentDateISO()
        });
        console.log('✅ Credit card record created');
      }

      // Cheque — cria cheques sem vínculo de venda/dívida (são do acerto)
      if (method.type === 'cheque') {
        const installments = safeNumber(method.installments, 1);
        const installmentValue = methodAmount / installments;
        const installmentInterval = safeNumber(method.installmentInterval, 30);
        const firstDate = new Date(method.firstInstallmentDate || new Date());

        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(firstDate);
          dueDate.setDate(firstDate.getDate() + i * installmentInterval);

          const { error } = await supabase.from('checks').insert({
            client: acerto.clientName,
            value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            installment_number: i + 1,
            total_installments: installments,
            observations: `Cheque ${i + 1}/${installments} - Pagamento de acerto (${acerto.clientName})`,
            created_at: new Date().toISOString()
          });
          if (error) console.error(`❌ Error creating check ${i + 1}:`, error);
        }
        console.log(`✅ ${installments} check(s) created`);
      }

      // Boleto — cria boletos sem vínculo de venda/dívida (são do acerto)
      if (method.type === 'boleto') {
        const installments = safeNumber(method.installments, 1);
        const installmentValue = methodAmount / installments;
        const installmentInterval = safeNumber(method.installmentInterval, 30);
        const firstDate = new Date(method.firstInstallmentDate || new Date());

        for (let i = 0; i < installments; i++) {
          const dueDate = new Date(firstDate);
          dueDate.setDate(firstDate.getDate() + i * installmentInterval);

          const { error } = await supabase.from('boletos').insert({
            client: acerto.clientName,
            value: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            installment_number: i + 1,
            total_installments: installments,
            observations: `Boleto ${i + 1}/${installments} - Pagamento de acerto (${acerto.clientName})`,
            created_at: new Date().toISOString()
          });
          if (error) console.error(`❌ Error creating boleto ${i + 1}:`, error);
        }
        console.log(`✅ ${installments} boleto(s) created`);
      }

      // Permuta — atualiza saldo consumido do veículo
      if (method.type === 'permuta' && method.vehicleId) {
        const { data: permuta, error: permutaError } = await supabase
          .from('permutas')
          .select('*')
          .eq('id', method.vehicleId)
          .maybeSingle();

        if (!permutaError && permuta) {
          const newConsumed = safeNumber(permuta.consumed_value, 0) + methodAmount;
          const newRemaining = safeNumber(permuta.vehicle_value, 0) - newConsumed;

          await supabase
            .from('permutas')
            .update({
              consumed_value: newConsumed,
              remaining_value: Math.max(0, newRemaining),
              updated_at: new Date().toISOString()
            })
            .eq('id', method.vehicleId);

          console.log('✅ Permuta updated:', method.vehicleId);
        }
      }
    }

    // 3. Atualizar o registro do acerto
    const newPaidAmount = safeNumber(acerto.paidAmount, 0) + paymentAmount;
    const newPendingAmount = safeNumber(acerto.totalAmount, 0) - newPaidAmount;
    const newStatus = newPendingAmount <= 0.01 ? 'pago' : 'parcial';

    const { error: acertoUpdateError } = await supabase
      .from('acertos')
      .update({
        paid_amount: newPaidAmount,
        pending_amount: Math.max(0, newPendingAmount),
        status: newStatus,
        payment_date: getCurrentDateISO(),
        updated_at: new Date().toISOString()
      })
      .eq('id', acerto.id);

    if (acertoUpdateError) {
      console.error('❌ Error updating acerto:', acertoUpdateError);
      throw acertoUpdateError;
    }

    console.log('✅ Acerto updated successfully');
  }
}
