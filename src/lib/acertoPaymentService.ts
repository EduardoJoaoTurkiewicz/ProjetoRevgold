import { supabase } from './supabase';
import { safeNumber, transformToSnakeCase } from '../utils/numberUtils';
import { Sale, Acerto } from '../types';
import { getCurrentDateISO } from './dateOnly';

export class AcertoPaymentService {
  /**
   * Processa o pagamento de acerto de cliente
   * Atualiza as vendas selecionadas e cria os registros de pagamento adequados
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

    try {
      // 1. Atualizar as vendas selecionadas
      for (const saleId of selectedSaleIds) {
        // Buscar a venda atual
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .select('*')
          .eq('id', saleId)
          .maybeSingle();

        if (saleError || !sale) {
          console.error('❌ Error fetching sale:', saleError);
          continue;
        }

        // Calcular novos valores
        const currentPending = safeNumber(sale.pending_amount, 0);
        const currentReceived = safeNumber(sale.received_amount, 0);

        // Marcar a venda como totalmente recebida
        const newReceived = currentReceived + currentPending;
        const newPending = 0;
        const newStatus = 'pago';

        // Atualizar a venda
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            received_amount: newReceived,
            pending_amount: newPending,
            status: newStatus,
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

        // Dinheiro, PIX e transferência - entrada de caixa
        if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'transferencia') {
          await supabase.from('cash_transactions').insert({
            type: 'entrada',
            amount: methodAmount,
            description: `Pagamento de acerto - Cliente: ${acerto.clientName}`,
            category: 'acerto_cliente',
            date: getCurrentDateISO(),
            created_at: new Date().toISOString()
          });
          console.log('✅ Cash transaction created for:', method.type);
        }

        // Cartão de débito - entrada de caixa (com valor real após taxas)
        if (method.type === 'cartao_debito') {
          const actualAmount = safeNumber(method.actualAmount, methodAmount);
          await supabase.from('cash_transactions').insert({
            type: 'entrada',
            amount: actualAmount,
            description: `Pagamento de acerto (Cartão de Débito) - Cliente: ${acerto.clientName}`,
            category: 'acerto_cliente',
            date: getCurrentDateISO(),
            created_at: new Date().toISOString()
          });
          console.log('✅ Cash transaction created for debit card');
        }

        // Cartão de crédito - criar registro de cartão de crédito
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

        // Cheque - criar registros de cheques
        if (method.type === 'cheque') {
          const installments = safeNumber(method.installments, 1);
          const installmentValue = methodAmount / installments;
          const installmentInterval = safeNumber(method.installmentInterval, 30);
          const firstDate = new Date(method.firstInstallmentDate || new Date());

          for (let i = 0; i < installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setDate(firstDate.getDate() + (i * installmentInterval));

            await supabase.from('checks').insert({
              value: installmentValue,
              due_date: dueDate.toISOString().split('T')[0],
              client_name: acerto.clientName,
              status: 'pendente',
              installment_number: i + 1,
              total_installments: installments,
              related_type: 'acerto',
              related_id: acerto.id,
              created_at: new Date().toISOString()
            });
          }
          console.log(`✅ ${installments} check(s) created`);
        }

        // Boleto - criar registros de boletos
        if (method.type === 'boleto') {
          const installments = safeNumber(method.installments, 1);
          const installmentValue = methodAmount / installments;
          const installmentInterval = safeNumber(method.installmentInterval, 30);
          const firstDate = new Date(method.firstInstallmentDate || new Date());

          for (let i = 0; i < installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setDate(firstDate.getDate() + (i * installmentInterval));

            await supabase.from('boletos').insert({
              value: installmentValue,
              due_date: dueDate.toISOString().split('T')[0],
              client_name: acerto.clientName,
              status: 'pendente',
              installment_number: i + 1,
              total_installments: installments,
              related_type: 'acerto',
              related_id: acerto.id,
              created_at: new Date().toISOString()
            });
          }
          console.log(`✅ ${installments} boleto(s) created`);
        }

        // Permuta - atualizar o veículo usado
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

      // 3. Atualizar o acerto
      const newPaidAmount = safeNumber(acerto.paidAmount, 0) + paymentAmount;
      const newPendingAmount = safeNumber(acerto.totalAmount, 0) - newPaidAmount;
      const newStatus = newPendingAmount <= 0.01 ? 'pago' : 'parcial';

      await supabase
        .from('acertos')
        .update({
          paid_amount: newPaidAmount,
          pending_amount: Math.max(0, newPendingAmount),
          status: newStatus,
          payment_date: getCurrentDateISO(),
          updated_at: new Date().toISOString()
        })
        .eq('id', acerto.id);

      console.log('✅ Acerto updated successfully');
    } catch (error) {
      console.error('❌ Error processing acerto payment:', error);
      throw error;
    }
  }
}
