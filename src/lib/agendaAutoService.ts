import { supabase } from './supabase';
import { AgendaEvent } from '../types';

export class AgendaAutoService {
  static async registerEvent(eventData: {
    title: string;
    description: string;
    date: string;
    type: 'vencimento' | 'entrega' | 'pagamento' | 'importante';
    relatedType?: 'boleto' | 'cheque' | 'venda' | 'divida' | 'cartao' | 'acerto' | 'imposto';
    relatedId?: string;
    priority?: 'baixa' | 'media' | 'alta' | 'urgente';
    status?: 'pendente' | 'concluido' | 'cancelado' | 'adiado';
  }): Promise<void> {
    try {
      // Check if an event already exists for this specific item
      if (eventData.relatedId) {
        const { data: existingEvent } = await supabase
          .from('agenda_events')
          .select('id')
          .eq('related_id', eventData.relatedId)
          .eq('date', eventData.date)
          .maybeSingle();

        if (existingEvent) {
          console.log('ℹ️ Agenda event already exists for this item and date');
          return;
        }
      }

      const { error } = await supabase
        .from('agenda_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          type: eventData.type,
          priority: eventData.priority || 'media',
          status: eventData.status || 'pendente',
          related_type: eventData.relatedType,
          related_id: eventData.relatedId,
        });

      if (error) {
        console.error('Error registering agenda event:', error);
      } else {
        console.log('✅ Agenda event registered:', eventData.title);
      }
    } catch (error) {
      console.error('Error in agenda auto service:', error);
    }
  }

  static async registerBoletoVencimento(boletoId: string, dueDate: string, description: string): Promise<void> {
    await this.registerEvent({
      title: `Vencimento de Boleto`,
      description: `Boleto: ${description}`,
      date: dueDate,
      type: 'vencimento',
      relatedType: 'boleto',
      relatedId: boletoId,
    });
  }

  static async registerCheckVencimento(checkId: string, dueDate: string, description: string, isOwnCheck: boolean = false): Promise<void> {
    await this.registerEvent({
      title: isOwnCheck ? `Pagamento de Cheque Próprio` : `Vencimento de Cheque`,
      description: `Cheque: ${description}`,
      date: dueDate,
      type: isOwnCheck ? 'pagamento' : 'vencimento',
      relatedType: 'cheque',
      relatedId: checkId,
    });
  }

  static async registerSaleDelivery(saleId: string, deliveryDate: string, clientName: string, saleDetails?: {
    totalValue?: number;
    products?: string;
    paymentMethods?: string;
  }): Promise<void> {
    let description = `Entrega de venda para: ${clientName}`;

    if (saleDetails) {
      if (saleDetails.totalValue) {
        description += `\nValor Total: R$ ${saleDetails.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      if (saleDetails.products) {
        description += `\nProdutos: ${saleDetails.products}`;
      }
      if (saleDetails.paymentMethods) {
        description += `\nFormas de Pagamento: ${saleDetails.paymentMethods}`;
      }
    }

    await this.registerEvent({
      title: `Entrega de Venda - ${clientName}`,
      description,
      date: deliveryDate,
      type: 'entrega',
      relatedType: 'venda',
      relatedId: saleId,
      priority: 'alta',
    });
  }

  static async registerDebtPayment(debtId: string, paymentDate: string, supplierName: string): Promise<void> {
    await this.registerEvent({
      title: `Pagamento de Dívida`,
      description: `Fornecedor: ${supplierName}`,
      date: paymentDate,
      type: 'pagamento',
      relatedType: 'divida',
      relatedId: debtId,
    });
  }

  static async registerCreditCardInstallment(installmentId: string, dueDate: string, description: string, type: 'sale' | 'debt'): Promise<void> {
    await this.registerEvent({
      title: `Vencimento Cartão ${type === 'sale' ? 'Recebível' : 'Pagável'}`,
      description: description,
      date: dueDate,
      type: 'vencimento',
      relatedType: 'cartao',
      relatedId: installmentId,
    });
  }

  static async registerAcertoPayment(acertoId: string, paymentDate: string, clientName: string, amount: number): Promise<void> {
    await this.registerEvent({
      title: `Pagamento de Acerto`,
      description: `Cliente: ${clientName} - R$ ${amount.toFixed(2)}`,
      date: paymentDate,
      type: 'pagamento',
      relatedType: 'acerto',
      relatedId: acertoId,
    });
  }

  static async registerTaxPayment(taxId: string, dueDate: string, taxName: string, amount: number): Promise<void> {
    await this.registerEvent({
      title: `Vencimento de Imposto`,
      description: `${taxName} - R$ ${amount.toFixed(2)}`,
      date: dueDate,
      type: 'vencimento',
      relatedType: 'imposto',
      relatedId: taxId,
    });
  }

  static async registerSaleInstallments(saleId: string, clientName: string, installments: Array<{date: string, amount: number, type: string, number: number, total: number}>): Promise<void> {
    for (const installment of installments) {
      const typeLabel = installment.type === 'cheque' ? 'Cheque' :
                        installment.type === 'boleto' ? 'Boleto' :
                        installment.type === 'cartao_credito' ? 'Cartão' : installment.type;

      await this.registerEvent({
        title: `Vencimento Parcela ${installment.number}/${installment.total} - ${typeLabel}`,
        description: `Cliente: ${clientName} - ${typeLabel} - R$ ${installment.amount.toFixed(2)}`,
        date: installment.date,
        type: 'vencimento',
        relatedType: 'venda',
        relatedId: saleId,
        priority: 'media',
        status: 'pendente'
      });
    }
  }

  static async registerDebtInstallments(debtId: string, supplierName: string, installments: Array<{date: string, amount: number, type: string, number: number, total: number}>): Promise<void> {
    for (const installment of installments) {
      const typeLabel = installment.type === 'cheque' ? 'Cheque' :
                        installment.type === 'boleto' ? 'Boleto' :
                        installment.type === 'cartao_credito' ? 'Cartão' : installment.type;

      await this.registerEvent({
        title: `Pagamento Parcela ${installment.number}/${installment.total} - ${typeLabel}`,
        description: `Fornecedor: ${supplierName} - ${typeLabel} - R$ ${installment.amount.toFixed(2)}`,
        date: installment.date,
        type: 'pagamento',
        relatedType: 'divida',
        relatedId: debtId,
        priority: 'alta',
        status: 'pendente'
      });
    }
  }

  static async removeEventsByRelatedId(relatedType: string, relatedId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda_events')
        .delete()
        .eq('related_type', relatedType)
        .eq('related_id', relatedId);

      if (error) {
        console.error('Error removing agenda events:', error);
      } else {
        console.log(`✅ Removed agenda events for ${relatedType}:${relatedId}`);
      }
    } catch (error) {
      console.error('Error in removeEventsByRelatedId:', error);
    }
  }

  static async removeCheckEvents(checkId: string): Promise<void> {
    await this.removeEventsByRelatedId('cheque', checkId);
  }

  static async updateEventStatus(relatedType: string, relatedId: string, status: 'concluido' | 'cancelado'): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda_events')
        .update({ status: status })
        .eq('related_type', relatedType)
        .eq('related_id', relatedId);

      if (error) {
        console.error('Error updating agenda event status:', error);
      } else {
        console.log(`✅ Updated agenda events status for ${relatedType}:${relatedId} to ${status}`);
      }
    } catch (error) {
      console.error('Error in updateEventStatus:', error);
    }
  }

  static async removeSaleInstallmentsFromAgenda(saleId: string): Promise<void> {
    await this.removeEventsByRelatedId('venda', saleId);
  }

  static async removeDebtInstallmentsFromAgenda(debtId: string): Promise<void> {
    await this.removeEventsByRelatedId('divida', debtId);
  }
}
