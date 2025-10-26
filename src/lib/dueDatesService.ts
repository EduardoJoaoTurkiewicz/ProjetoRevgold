import { supabase } from './supabase';
import type { Receivable } from '../components/duedates/ReceivableCard';
import type { Payable } from '../components/duedates/PayableCard';

export const dueDatesService = {
  async getReceivables(startDate: string, endDate: string): Promise<Receivable[]> {
    try {
      const receivables: Receivable[] = [];

      const [boletosResult, checksResult, acertosResult] = await Promise.all([
        supabase
          .from('boletos')
          .select('*, sales(client)')
          .not('sale_id', 'is', null)
          .in('status', ['pendente'])
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: true }),

        supabase
          .from('checks')
          .select('*, sales(client)')
          .not('sale_id', 'is', null)
          .eq('is_own_check', false)
          .in('status', ['pendente'])
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: true }),

        supabase
          .from('acertos')
          .select('*')
          .eq('type', 'cliente')
          .in('status', ['pendente', 'parcial'])
          .gte('payment_date', startDate)
          .lte('payment_date', endDate)
          .order('payment_date', { ascending: true })
      ]);

      if (boletosResult.data) {
        boletosResult.data.forEach(boleto => {
          receivables.push({
            id: boleto.id,
            type: 'boleto',
            clientName: boleto.sales?.client || boleto.client || 'Cliente não identificado',
            value: Number(boleto.value) || 0,
            dueDate: boleto.due_date,
            installmentNumber: boleto.installment_number || undefined,
            totalInstallments: boleto.total_installments || undefined,
            observations: boleto.observations || undefined,
            saleId: boleto.sale_id || undefined,
            status: boleto.status
          });
        });
      }

      if (checksResult.data) {
        checksResult.data.forEach(check => {
          receivables.push({
            id: check.id,
            type: 'cheque',
            clientName: check.sales?.client || check.client || 'Cliente não identificado',
            value: Number(check.value) || 0,
            dueDate: check.due_date,
            installmentNumber: check.installment_number || undefined,
            totalInstallments: check.total_installments || undefined,
            observations: check.observations || undefined,
            saleId: check.sale_id || undefined,
            status: check.status
          });
        });
      }

      if (acertosResult.data) {
        acertosResult.data.forEach(acerto => {
          receivables.push({
            id: acerto.id,
            type: 'acerto',
            clientName: acerto.client_name || 'Cliente não identificado',
            value: Number(acerto.pending_amount) || 0,
            dueDate: acerto.payment_date || acerto.created_at?.split('T')[0] || '',
            observations: acerto.observations || undefined,
            status: acerto.status
          });
        });
      }

      receivables.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      return receivables;
    } catch (error) {
      console.error('Error fetching receivables:', error);
      throw error;
    }
  },

  async getPayables(startDate: string, endDate: string): Promise<Payable[]> {
    try {
      const payables: Payable[] = [];

      const [boletosResult, checksResult, taxesResult] = await Promise.all([
        supabase
          .from('boletos')
          .select('*, debts(company, description)')
          .or('is_company_payable.eq.true,debt_id.not.is.null')
          .in('status', ['pendente'])
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: true }),

        supabase
          .from('checks')
          .select('*, debts(company, description)')
          .or('is_company_payable.eq.true,debt_id.not.is.null')
          .in('status', ['pendente'])
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: true }),

        supabase
          .from('taxes')
          .select('*')
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .order('due_date', { ascending: true })
      ]);

      if (boletosResult.data) {
        boletosResult.data.forEach(boleto => {
          const description = boleto.debts?.company
            ? `${boleto.debts.company} - ${boleto.debts.description || 'Boleto'}`
            : boleto.company_name || 'Boleto a pagar';

          payables.push({
            id: boleto.id,
            type: 'boleto',
            description,
            value: Number(boleto.value) || 0,
            dueDate: boleto.due_date,
            installmentNumber: boleto.installment_number || undefined,
            totalInstallments: boleto.total_installments || undefined,
            observations: boleto.observations || undefined,
            relatedId: boleto.debt_id || undefined,
            status: boleto.status
          });
        });
      }

      if (checksResult.data) {
        checksResult.data.forEach(check => {
          const description = check.debts?.company
            ? `${check.debts.company} - ${check.debts.description || 'Cheque'}`
            : check.company_name || 'Cheque a pagar';

          payables.push({
            id: check.id,
            type: 'cheque',
            description,
            value: Number(check.value) || 0,
            dueDate: check.due_date,
            installmentNumber: check.installment_number || undefined,
            totalInstallments: check.total_installments || undefined,
            observations: check.observations || undefined,
            relatedId: check.debt_id || undefined,
            status: check.status
          });
        });
      }

      if (taxesResult.data) {
        taxesResult.data.forEach(tax => {
          payables.push({
            id: tax.id,
            type: 'imposto',
            description: tax.description || 'Imposto',
            value: Number(tax.amount) || 0,
            dueDate: tax.due_date || tax.date,
            observations: tax.observations || undefined,
            status: 'pendente'
          });
        });
      }

      payables.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      return payables;
    } catch (error) {
      console.error('Error fetching payables:', error);
      throw error;
    }
  },

  async markBoletoAsPaid(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('boletos')
        .update({
          status: 'compensado',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking boleto as paid:', error);
      throw error;
    }
  },

  async markCheckAsPaid(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('checks')
        .update({
          status: 'compensado',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking check as paid:', error);
      throw error;
    }
  },

  async markAcertoAsPaid(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('acertos')
        .update({
          status: 'pago',
          paid_amount: supabase.rpc('get_acerto_total', { acerto_id: id }),
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking acerto as paid:', error);
      throw error;
    }
  }
};
