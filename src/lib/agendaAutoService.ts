import { supabase } from './supabase';
import { AgendaEvent } from '../types';

export class AgendaAutoService {
  static async registerEvent(eventData: {
    title: string;
    description: string;
    date: string;
    type: 'vencimento' | 'entrega' | 'pagamento' | 'importante';
    relatedType?: 'boleto' | 'cheque' | 'venda' | 'divida' | 'cartao' | 'acerto';
    relatedId?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('agenda_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          type: eventData.type,
          completed: false,
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

  static async registerCheckVencimento(checkId: string, dueDate: string, description: string): Promise<void> {
    await this.registerEvent({
      title: `Vencimento de Cheque`,
      description: `Cheque: ${description}`,
      date: dueDate,
      type: 'vencimento',
      relatedType: 'cheque',
      relatedId: checkId,
    });
  }

  static async registerSaleDelivery(saleId: string, deliveryDate: string, clientName: string): Promise<void> {
    await this.registerEvent({
      title: `Entrega de Venda`,
      description: `Venda para: ${clientName}`,
      date: deliveryDate,
      type: 'entrega',
      relatedType: 'venda',
      relatedId: saleId,
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
      relatedType: 'divida',
      relatedId: taxId,
    });
  }
}
