import React, { useState, useMemo } from 'react';
import { X, Search, Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { SaleItem, EstoqueProdutoCompleto } from '../../types';
import { safeNumber } from '../../utils/numberUtils';

interface ProdutoSelectorModalProps {
  itensExistentes: SaleItem[];
  onConfirm: (itens: SaleItem[]) => void;
  onClose: () => void;
}

interface ItemRascunho {
  produto: EstoqueProdutoCompleto;
  variacaoId: string;
  corId: string;
  quantidade: number;
  valorUnitario: number;
}

export function ProdutoSelectorModal({ itensExistentes, onConfirm, onClose }: ProdutoSelectorModalProps) {
  const { estoqueProdutos, isLoadingEstoque, loadEstoqueData } = useAppContext();
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<ItemRascunho[]>(() =>
    itensExistentes.map(item => {
      const produto = estoqueProdutos.find(p => p.id === item.produtoId);
      return {
        produto: produto!,
        variacaoId: item.variacaoId,
        corId: item.corId ?? '',
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
      };
    }).filter(i => i.produto)
  );

  React.useEffect(() => {
    if (estoqueProdutos.length === 0 && !isLoadingEstoque) {
      loadEstoqueData();
    }
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return estoqueProdutos;
    const termo = busca.toLowerCase();
    return estoqueProdutos.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      (p.descricao ?? '').toLowerCase().includes(termo)
    );
  }, [estoqueProdutos, busca]);

  function getSaldo(produto: EstoqueProdutoCompleto, variacaoId: string, corId: string): number {
    const saldo = produto.saldos.find(s =>
      s.variacaoId === variacaoId &&
      (corId ? s.corId === corId : !s.corId)
    );
    return saldo?.quantidadeAtual ?? 0;
  }

  function adicionarProduto(produto: EstoqueProdutoCompleto) {
    if (produto.variacoes.length === 0) return;
    const primeiraVariacao = produto.variacoes[0];
    const primeiraCor = produto.temCor && produto.cores.length > 0 ? produto.cores[0].id : '';

    setItens(prev => [...prev, {
      produto,
      variacaoId: primeiraVariacao.id,
      corId: primeiraCor,
      quantidade: 1,
      valorUnitario: primeiraVariacao.valorUnitarioPadrao,
    }]);
  }

  function removerItem(index: number) {
    setItens(prev => prev.filter((_, i) => i !== index));
  }

  function atualizarItem(index: number, campo: Partial<ItemRascunho>) {
    setItens(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, ...campo };
      if (campo.variacaoId) {
        const variacao = updated.produto.variacoes.find(v => v.id === campo.variacaoId);
        if (variacao) updated.valorUnitario = variacao.valorUnitarioPadrao;
      }
      return updated;
    }));
  }

  function handleConfirm() {
    const saleItems: SaleItem[] = itens.map(item => ({
      produtoId: item.produto.id,
      variacaoId: item.variacaoId,
      corId: item.corId || null,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.quantidade * item.valorUnitario,
      nomeProduto: item.produto.nome,
      nomeVariacao: item.produto.variacoes.find(v => v.id === item.variacaoId)?.nomeVariacao,
      nomeCor: item.corId ? item.produto.cores.find(c => c.id === item.corId)?.nomeCor : undefined,
    }));
    onConfirm(saleItems);
    onClose();
  }

  const totalGeral = itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-600">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Adicionar Produtos</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-80 border-r border-slate-200 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoadingEstoque ? (
                <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Nenhum produto encontrado.</div>
              ) : (
                produtosFiltrados.map(produto => (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => adicionarProduto(produto)}
                    disabled={produto.variacoes.length === 0}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-sm text-slate-900">{produto.nome}</div>
                    {produto.descricao && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{produto.descricao}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-700 font-medium">{produto.variacoes.length} variação(ões)</span>
                      {produto.temCor && <span className="text-xs text-blue-600">{produto.cores.length} cor(es)</span>}
                      {produto.variacoes.length === 0 && (
                        <span className="text-xs text-red-500">Sem variações</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-semibold text-slate-800 text-sm">Itens selecionados ({itens.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <Package className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm text-center">Selecione produtos da lista ao lado para adicionar.</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {itens.map((item, index) => {
                    const saldoAtual = getSaldo(item.produto, item.variacaoId, item.corId);
                    const semEstoque = item.quantidade > saldoAtual;

                    return (
                      <div key={index} className={`p-4 rounded-xl border-2 ${semEstoque ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">{item.produto.nome}</span>
                          </div>
                          <button type="button" onClick={() => removerItem(index)} className="text-red-500 hover:text-red-700 p-1 rounded ml-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Variação</label>
                            <select
                              value={item.variacaoId}
                              onChange={e => atualizarItem(index, { variacaoId: e.target.value })}
                              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              {item.produto.variacoes.map(v => (
                                <option key={v.id} value={v.id}>{v.nomeVariacao}</option>
                              ))}
                            </select>
                          </div>

                          {item.produto.temCor && item.produto.cores.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-slate-600 block mb-1">Cor</label>
                              <select
                                value={item.corId}
                                onChange={e => atualizarItem(index, { corId: e.target.value })}
                                className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Sem cor</option>
                                {item.produto.cores.map(c => (
                                  <option key={c.id} value={c.id}>{c.nomeCor}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Quantidade</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantidade}
                              onChange={e => atualizarItem(index, { quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
                              className={`w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                semEstoque ? 'border-red-400 bg-red-50' : 'border-slate-300'
                              }`}
                            />
                            <span className="text-xs text-slate-500 mt-0.5 block">Saldo: {saldoAtual}</span>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Valor Unit. (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.valorUnitario}
                              onChange={e => atualizarItem(index, { valorUnitario: safeNumber(e.target.value, 0) })}
                              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Total</label>
                            <div className="text-sm font-bold text-green-700 py-1.5">
                              R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {semEstoque && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Saldo insuficiente: disponivel {saldoAtual}, solicitado {item.quantidade}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-50 rounded-b-3xl">
          <div className="text-sm font-semibold text-slate-700">
            Total geral:{' '}
            <span className="text-green-700 text-base font-bold">
              R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Confirmar Itens ({itens.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
