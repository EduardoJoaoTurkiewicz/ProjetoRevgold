import { supabase, isSupabaseConfigured } from './supabase';
import type { Orcamento, OrcamentoItem } from '../types';

async function safeOp<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  fallback: T | null = null,
  ctx: string = 'orcamento'
): Promise<T | null> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data, error } = await operation();
    if (error) {
      if (error.code === 'PGRST116') return fallback;
      throw error;
    }
    return data;
  } catch (err: any) {
    console.error(`❌ OrcamentoService error [${ctx}]:`, err);
    return fallback;
  }
}

function rowToOrcamento(row: any, itens: any[] = []): Orcamento {
  return {
    id: row.id,
    numero: row.numero,
    clienteId: row.cliente_id ?? null,
    clienteNome: row.cliente_nome ?? '',
    vendedor: row.vendedor ?? '',
    dataCriacao: row.data_criacao,
    dataValidade: row.data_validade,
    valorTotal: parseFloat(row.valor_total) || 0,
    status: row.status as Orcamento['status'],
    observacoes: row.observacoes ?? null,
    vendaId: row.venda_id ?? null,
    itens: itens.map(rowToOrcamentoItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToOrcamentoItem(row: any): OrcamentoItem {
  return {
    id: row.id,
    orcamentoId: row.orcamento_id,
    produtoId: row.produto_id,
    variacaoId: row.variacao_id,
    corId: row.cor_id ?? null,
    nomeProduto: row.nome_produto ?? '',
    nomeVariacao: row.nome_variacao ?? '',
    nomeCor: row.nome_cor ?? null,
    quantidade: parseFloat(row.quantidade) || 0,
    valorUnitario: parseFloat(row.valor_unitario) || 0,
    subtotal: parseFloat(row.subtotal) || 0,
    createdAt: row.created_at,
  };
}

export const orcamentoService = {
  async getAll(): Promise<Orcamento[]> {
    const data = await safeOp<any[]>(
      () =>
        supabase!
          .from('orcamentos')
          .select('*, orcamento_itens(*)')
          .order('numero', { ascending: false }),
      [],
      'getAll'
    );
    if (!data) return [];
    const today = new Date().toISOString().split('T')[0];
    return data.map((row) => {
      const orcamento = rowToOrcamento(row, row.orcamento_itens ?? []);
      if (orcamento.status === 'pendente' && orcamento.dataValidade < today) {
        orcamento.status = 'vencido';
      }
      return orcamento;
    });
  },

  async getById(id: string): Promise<Orcamento | null> {
    const data = await safeOp<any>(
      () =>
        supabase!
          .from('orcamentos')
          .select('*, orcamento_itens(*)')
          .eq('id', id)
          .maybeSingle(),
      null,
      'getById'
    );
    if (!data) return null;
    return rowToOrcamento(data, data.orcamento_itens ?? []);
  },

  async create(
    payload: Omit<Orcamento, 'id' | 'numero' | 'createdAt' | 'updatedAt' | 'itens'> & { itens: OrcamentoItem[] }
  ): Promise<Orcamento | null> {
    if (!isSupabaseConfigured()) return null;

    const { itens, ...orcamentoData } = payload;

    const { data: row, error } = await supabase!
      .from('orcamentos')
      .insert({
        cliente_id: orcamentoData.clienteId ?? null,
        cliente_nome: orcamentoData.clienteNome,
        vendedor: orcamentoData.vendedor,
        data_criacao: orcamentoData.dataCriacao,
        data_validade: orcamentoData.dataValidade,
        valor_total: orcamentoData.valorTotal,
        status: orcamentoData.status,
        observacoes: orcamentoData.observacoes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ OrcamentoService create error:', error);
      return null;
    }

    if (itens.length > 0) {
      const itensRows = itens.map((item) => ({
        orcamento_id: row.id,
        produto_id: item.produtoId,
        variacao_id: item.variacaoId,
        cor_id: item.corId ?? null,
        nome_produto: item.nomeProduto,
        nome_variacao: item.nomeVariacao,
        nome_cor: item.nomeCor ?? null,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase!.from('orcamento_itens').insert(itensRows);
      if (itensError) {
        console.error('❌ OrcamentoService create itens error:', itensError);
      }
    }

    return this.getById(row.id);
  },

  async update(id: string, updates: Partial<Omit<Orcamento, 'itens'>>): Promise<Orcamento | null> {
    const mapped: Record<string, any> = {};
    if (updates.clienteId !== undefined) mapped.cliente_id = updates.clienteId;
    if (updates.clienteNome !== undefined) mapped.cliente_nome = updates.clienteNome;
    if (updates.vendedor !== undefined) mapped.vendedor = updates.vendedor;
    if (updates.dataCriacao !== undefined) mapped.data_criacao = updates.dataCriacao;
    if (updates.dataValidade !== undefined) mapped.data_validade = updates.dataValidade;
    if (updates.valorTotal !== undefined) mapped.valor_total = updates.valorTotal;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.observacoes !== undefined) mapped.observacoes = updates.observacoes;
    if (updates.vendaId !== undefined) mapped.venda_id = updates.vendaId;
    mapped.updated_at = new Date().toISOString();

    const data = await safeOp<any>(
      () => supabase!.from('orcamentos').update(mapped).eq('id', id).select().single(),
      null,
      'update'
    );
    if (!data) return null;
    return this.getById(id);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase!.from('orcamentos').delete().eq('id', id);
    if (error) {
      console.error('❌ OrcamentoService delete error:', error);
      return false;
    }
    return true;
  },

  async marcarComoConvertido(id: string, vendaId: string): Promise<boolean> {
    const result = await this.update(id, { status: 'convertido', vendaId });
    return result !== null;
  },

  async updateItens(orcamentoId: string, itens: OrcamentoItem[]): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error: delError } = await supabase!
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', orcamentoId);

    if (delError) {
      console.error('❌ OrcamentoService updateItens delete error:', delError);
      return false;
    }

    if (itens.length > 0) {
      const rows = itens.map((item) => ({
        orcamento_id: orcamentoId,
        produto_id: item.produtoId,
        variacao_id: item.variacaoId,
        cor_id: item.corId ?? null,
        nome_produto: item.nomeProduto,
        nome_variacao: item.nomeVariacao,
        nome_cor: item.nomeCor ?? null,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        subtotal: item.subtotal,
      }));

      const { error: insError } = await supabase!.from('orcamento_itens').insert(rows);
      if (insError) {
        console.error('❌ OrcamentoService updateItens insert error:', insError);
        return false;
      }
    }
    return true;
  },
};
