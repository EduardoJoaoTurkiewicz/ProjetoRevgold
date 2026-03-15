import { supabase } from './supabase';
import type { SaleItem, EstoqueMovimento, EstoqueProdutoCompleto } from '../types';

export interface StockValidationError {
  nomeProduto: string;
  nomeVariacao: string;
  nomeCor?: string;
  solicitado: number;
  disponivel: number;
}

async function getSaldoId(produtoId: string, variacaoId: string, corId?: string | null): Promise<{ id: string; quantidade: number } | null> {
  let query = supabase
    .from('estoque_saldos')
    .select('id, quantidade_atual')
    .eq('produto_id', produtoId)
    .eq('variacao_id', variacaoId);

  if (corId) {
    query = query.eq('cor_id', corId);
  } else {
    query = query.is('cor_id', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, quantidade: Number(data.quantidade_atual) };
}

async function registrarMovimento(movimento: EstoqueMovimento): Promise<void> {
  const { error } = await supabase.from('estoque_movimentos').insert({
    tipo: movimento.tipo,
    origem: movimento.origem,
    sale_id: movimento.saleId ?? null,
    produto_id: movimento.produtoId,
    variacao_id: movimento.variacaoId,
    cor_id: movimento.corId ?? null,
    quantidade: movimento.quantidade,
  });
  if (error) throw error;
}

export async function validarEstoqueParaItens(
  itens: SaleItem[],
  estoqueProdutos: EstoqueProdutoCompleto[]
): Promise<StockValidationError[]> {
  const erros: StockValidationError[] = [];

  for (const item of itens) {
    const produto = estoqueProdutos.find(p => p.id === item.produtoId);
    const variacao = produto?.variacoes.find(v => v.id === item.variacaoId);
    const cor = item.corId ? produto?.cores.find(c => c.id === item.corId) : undefined;

    const saldo = produto?.saldos.find(s =>
      s.variacaoId === item.variacaoId &&
      (item.corId ? s.corId === item.corId : !s.corId)
    );

    const disponivel = saldo?.quantidadeAtual ?? 0;
    if (item.quantidade > disponivel) {
      erros.push({
        nomeProduto: produto?.nome ?? item.produtoId,
        nomeVariacao: variacao?.nomeVariacao ?? item.variacaoId,
        nomeCor: cor?.nomeCor,
        solicitado: item.quantidade,
        disponivel,
      });
    }
  }

  return erros;
}

export async function aplicarBaixaEstoque(saleId: string, itens: SaleItem[]): Promise<void> {
  for (const item of itens) {
    const saldo = await getSaldoId(item.produtoId, item.variacaoId, item.corId);
    if (!saldo) continue;

    const novaQtd = saldo.quantidade - item.quantidade;
    const { error } = await supabase
      .from('estoque_saldos')
      .update({ quantidade_atual: Math.max(0, novaQtd), updated_at: new Date().toISOString() })
      .eq('id', saldo.id);
    if (error) throw error;

    await registrarMovimento({
      tipo: 'OUT',
      origem: 'SALE_CREATE',
      saleId,
      produtoId: item.produtoId,
      variacaoId: item.variacaoId,
      corId: item.corId,
      quantidade: item.quantidade,
    });
  }
}

export async function reverterBaixaEstoque(saleId: string, itens: SaleItem[]): Promise<void> {
  for (const item of itens) {
    const saldo = await getSaldoId(item.produtoId, item.variacaoId, item.corId);
    if (!saldo) continue;

    const novaQtd = saldo.quantidade + item.quantidade;
    const { error } = await supabase
      .from('estoque_saldos')
      .update({ quantidade_atual: novaQtd, updated_at: new Date().toISOString() })
      .eq('id', saldo.id);
    if (error) throw error;

    await registrarMovimento({
      tipo: 'IN',
      origem: 'SALE_DELETE',
      saleId,
      produtoId: item.produtoId,
      variacaoId: item.variacaoId,
      corId: item.corId,
      quantidade: item.quantidade,
    });
  }
}

export async function aplicarDeltaEstoque(
  saleId: string,
  itensAntigos: SaleItem[],
  itensNovos: SaleItem[],
  estoqueProdutos: EstoqueProdutoCompleto[]
): Promise<StockValidationError[]> {
  type ItemKey = string;

  const makeKey = (item: SaleItem): ItemKey =>
    `${item.produtoId}|${item.variacaoId}|${item.corId ?? ''}`;

  const mapaAntigo = new Map<ItemKey, SaleItem>();
  for (const item of itensAntigos) {
    mapaAntigo.set(makeKey(item), item);
  }

  const mapaNovo = new Map<ItemKey, SaleItem>();
  for (const item of itensNovos) {
    mapaNovo.set(makeKey(item), item);
  }

  const todasChaves = new Set([...mapaAntigo.keys(), ...mapaNovo.keys()]);
  const erros: StockValidationError[] = [];

  for (const chave of todasChaves) {
    const antigo = mapaAntigo.get(chave);
    const novo = mapaNovo.get(chave);

    const qtdAntiga = antigo?.quantidade ?? 0;
    const qtdNova = novo?.quantidade ?? 0;
    const delta = qtdNova - qtdAntiga;

    if (delta === 0) continue;

    const item = novo ?? antigo!;

    if (delta > 0) {
      const produto = estoqueProdutos.find(p => p.id === item.produtoId);
      const variacao = produto?.variacoes.find(v => v.id === item.variacaoId);
      const cor = item.corId ? produto?.cores.find(c => c.id === item.corId) : undefined;
      const saldo = produto?.saldos.find(s =>
        s.variacaoId === item.variacaoId &&
        (item.corId ? s.corId === item.corId : !s.corId)
      );
      const disponivel = saldo?.quantidadeAtual ?? 0;

      if (delta > disponivel) {
        erros.push({
          nomeProduto: produto?.nome ?? item.produtoId,
          nomeVariacao: variacao?.nomeVariacao ?? item.variacaoId,
          nomeCor: cor?.nomeCor,
          solicitado: delta,
          disponivel,
        });
      }
    }
  }

  if (erros.length > 0) return erros;

  for (const chave of todasChaves) {
    const antigo = mapaAntigo.get(chave);
    const novo = mapaNovo.get(chave);

    const qtdAntiga = antigo?.quantidade ?? 0;
    const qtdNova = novo?.quantidade ?? 0;
    const delta = qtdNova - qtdAntiga;

    if (delta === 0) continue;

    const item = novo ?? antigo!;
    const saldo = await getSaldoId(item.produtoId, item.variacaoId, item.corId);
    if (!saldo) continue;

    const novaQtd = saldo.quantidade - delta;
    const { error } = await supabase
      .from('estoque_saldos')
      .update({ quantidade_atual: Math.max(0, novaQtd), updated_at: new Date().toISOString() })
      .eq('id', saldo.id);
    if (error) throw error;

    await registrarMovimento({
      tipo: delta > 0 ? 'OUT' : 'IN',
      origem: 'SALE_EDIT',
      saleId,
      produtoId: item.produtoId,
      variacaoId: item.variacaoId,
      corId: item.corId,
      quantidade: Math.abs(delta),
    });
  }

  return [];
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    saleId: row.sale_id,
    produtoId: row.produto_id,
    variacaoId: row.variacao_id,
    corId: row.cor_id ?? null,
    quantidade: Number(row.quantidade),
    valorUnitario: Number(row.valor_unitario),
    valorTotal: Number(row.valor_total),
    createdAt: row.created_at,
  }));
}

export async function saveSaleItems(saleId: string, itens: SaleItem[]): Promise<void> {
  const { error: delError } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', saleId);
  if (delError) throw delError;

  if (itens.length === 0) return;

  const rows = itens.map(item => ({
    sale_id: saleId,
    produto_id: item.produtoId,
    variacao_id: item.variacaoId,
    cor_id: item.corId ?? null,
    quantidade: item.quantidade,
    valor_unitario: item.valorUnitario,
    valor_total: item.valorTotal,
  }));

  const { error } = await supabase.from('sale_items').insert(rows);
  if (error) throw error;
}
