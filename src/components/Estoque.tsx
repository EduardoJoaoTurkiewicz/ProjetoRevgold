import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  AlertCircle,
  Boxes,
  PackageCheck,
  PackageX,
  Filter,
  ShoppingCart,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { EstoqueProdutoCompleto } from '../types';
import EstoqueForm from './forms/EstoqueForm';
import EstoqueDetalhes from './forms/EstoqueDetalhes';
import { VendasDoProdutoModal } from './modals/VendasDoProdutoModal';

const Estoque: React.FC = () => {
  const { estoqueProdutos, isLoadingEstoque, loadEstoqueData, deleteEstoqueProduto } = useAppContext();

  const [search, setSearch] = useState('');
  const [filterCor, setFilterCor] = useState('');
  const [filterVariacao, setFilterVariacao] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<EstoqueProdutoCompleto | null>(null);
  const [showDetalhes, setShowDetalhes] = useState<EstoqueProdutoCompleto | null>(null);
  const [vendaModalProduto, setVendaModalProduto] = useState<EstoqueProdutoCompleto | null>(null);

  useEffect(() => {
    loadEstoqueData();
  }, []);

  const allCores = useMemo(() => {
    const set = new Set<string>();
    estoqueProdutos.forEach(p => p.cores.forEach(c => set.add(c.nomeCor)));
    return Array.from(set).sort();
  }, [estoqueProdutos]);

  const allVariacoes = useMemo(() => {
    const set = new Set<string>();
    estoqueProdutos.forEach(p => p.variacoes.forEach(v => set.add(v.nomeVariacao)));
    return Array.from(set).sort();
  }, [estoqueProdutos]);

  const filteredProdutos = useMemo(() => {
    return estoqueProdutos.filter(p => {
      const matchSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase());
      const matchCor =
        !filterCor ||
        (!p.temCor && filterCor === '') ||
        p.cores.some(c => c.nomeCor.toLowerCase().includes(filterCor.toLowerCase()));
      const matchVar =
        !filterVariacao ||
        p.variacoes.some(v => v.nomeVariacao.toLowerCase().includes(filterVariacao.toLowerCase()));
      return matchSearch && matchCor && matchVar;
    });
  }, [estoqueProdutos, search, filterCor, filterVariacao]);

  const stats = useMemo(() => {
    const total = estoqueProdutos.length;
    const comSaldo = estoqueProdutos.filter(p => p.saldos.some(s => s.quantidadeAtual > 0)).length;
    const zerados = total - comSaldo;
    return { total, comSaldo, zerados };
  }, [estoqueProdutos]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSaldoLabels = (produto: EstoqueProdutoCompleto) => {
    const labels: string[] = [];
    if (produto.temCor) {
      for (const saldo of produto.saldos) {
        if (saldo.quantidadeAtual > 0) {
          const variacao = produto.variacoes.find(v => v.id === saldo.variacaoId);
          const cor = produto.cores.find(c => c.id === saldo.corId);
          if (variacao && cor) labels.push(`${saldo.quantidadeAtual} ${variacao.nomeVariacao} ${cor.nomeCor}`);
        }
      }
    } else {
      for (const saldo of produto.saldos) {
        if (saldo.quantidadeAtual > 0) {
          const variacao = produto.variacoes.find(v => v.id === saldo.variacaoId);
          if (variacao) labels.push(`${saldo.quantidadeAtual} ${variacao.nomeVariacao}`);
        }
      }
    }
    return labels;
  };

  const getAllSaldoRows = (produto: EstoqueProdutoCompleto) => {
    const rows: { label: string; quantidade: number; hasStock: boolean }[] = [];
    if (produto.temCor) {
      for (const variacao of produto.variacoes) {
        for (const cor of produto.cores) {
          const saldo = produto.saldos.find(
            s => s.variacaoId === variacao.id && s.corId === cor.id
          );
          rows.push({
            label: `${variacao.nomeVariacao} · ${cor.nomeCor}`,
            quantidade: saldo?.quantidadeAtual ?? 0,
            hasStock: (saldo?.quantidadeAtual ?? 0) > 0,
          });
        }
      }
    } else {
      for (const variacao of produto.variacoes) {
        const saldo = produto.saldos.find(s => s.variacaoId === variacao.id);
        rows.push({
          label: variacao.nomeVariacao,
          quantidade: saldo?.quantidadeAtual ?? 0,
          hasStock: (saldo?.quantidadeAtual ?? 0) > 0,
        });
      }
    }
    return rows;
  };

  const getTotalSaldo = (produto: EstoqueProdutoCompleto) =>
    produto.saldos.reduce((acc, s) => acc + s.quantidadeAtual, 0);

  const handleDeleteFromDetalhes = async () => {
    if (!showDetalhes) return;
    await deleteEstoqueProduto(showDetalhes.id);
    setShowDetalhes(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduto(null);
  };

  useEffect(() => {
    if (!showDetalhes) return;
    const updated = estoqueProdutos.find(p => p.id === showDetalhes.id);
    if (updated) setShowDetalhes(updated);
  }, [estoqueProdutos]);

  const hasActiveFilters = search || filterCor || filterVariacao;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Estoque</h1>
            <p className="text-sm text-gray-500 mt-0.5">Controle de produtos, variacoes e saldos</p>
          </div>
          <button
            onClick={() => { setEditingProduto(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Boxes className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total de Produtos</p>
              <p className="text-3xl font-bold text-gray-900 leading-none mt-1">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Com Estoque</p>
              <p className="text-3xl font-bold text-blue-600 leading-none mt-1">{stats.comSaldo}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <PackageX className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Zerados</p>
              <p className="text-3xl font-bold text-red-500 leading-none mt-1">{stats.zerados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome do produto..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={filterCor}
                onChange={e => setFilterCor(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white min-w-[130px] transition-all"
              >
                <option value="">Todas as cores</option>
                {allCores.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterVariacao}
                onChange={e => setFilterVariacao(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white min-w-[150px] transition-all"
              >
                <option value="">Todas as variacoes</option>
                {allVariacoes.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">{filteredProdutos.length} produto{filteredProdutos.length !== 1 ? 's' : ''} encontrado{filteredProdutos.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setSearch(''); setFilterCor(''); setFilterVariacao(''); }}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {isLoadingEstoque ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2.5">
                    <div className="h-5 bg-gray-200 rounded-lg w-52" />
                    <div className="flex gap-2">
                      <div className="h-4 bg-gray-100 rounded-full w-16" />
                      <div className="h-4 bg-gray-100 rounded-full w-20" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-xl w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-sm text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {estoqueProdutos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              {estoqueProdutos.length === 0
                ? 'Adicione o primeiro produto ao estoque para comecar a controlar os saldos.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
            {estoqueProdutos.length === 0 && (
              <button
                onClick={() => { setEditingProduto(null); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar primeiro produto
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProdutos.map(produto => {
              const isExpanded = expandedIds.has(produto.id);
              const total = getTotalSaldo(produto);
              const saldoLabels = getSaldoLabels(produto);
              const allRows = getAllSaldoRows(produto);
              const hasStock = total > 0;

              return (
                <div
                  key={produto.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-gray-200 hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${hasStock ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <h3 className="text-base font-bold text-gray-900 truncate">{produto.nome}</h3>
                          {!produto.temCor && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 font-medium flex-shrink-0">
                              Sem cor
                            </span>
                          )}
                        </div>
                        <div className="mt-2 ml-5 flex flex-wrap gap-1.5">
                          {produto.temCor && produto.cores.slice(0, 4).map(c => (
                            <span key={c.id} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 font-medium border border-blue-100">
                              {c.nomeCor}
                            </span>
                          ))}
                          {produto.temCor && produto.cores.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-400 border border-gray-100">
                              +{produto.cores.length - 4}
                            </span>
                          )}
                          {produto.variacoes.slice(0, 3).map(v => (
                            <span key={v.id} className="px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-600 font-medium border border-slate-100">
                              {v.nomeVariacao}
                            </span>
                          ))}
                          {produto.variacoes.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-400 border border-gray-100">
                              +{produto.variacoes.length - 3} var.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3.5 py-1.5 rounded-xl text-sm font-bold ${hasStock ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {total} un.
                        </span>
                        <button
                          onClick={() => setShowDetalhes(produto)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg transition-colors font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver detalhes
                        </button>
                        <button
                          onClick={() => setVendaModalProduto(produto)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-lg transition-colors font-semibold"
                          title="Ver vendas deste produto"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Ver vendas
                        </button>
                        <button
                          onClick={() => { setEditingProduto(produto); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar produto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleExpand(produto.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {!isExpanded && saldoLabels.length > 0 && (
                      <div className="mt-3 ml-5 flex flex-wrap gap-1.5">
                        {saldoLabels.slice(0, 6).map((label, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                            {label}
                          </span>
                        ))}
                        {saldoLabels.length > 6 && (
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-gray-50 text-gray-400 border border-gray-100">
                            +{saldoLabels.length - 6} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-50 px-5 pb-5 pt-4 bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Especificacoes e Saldos
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {allRows.map((row, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
                              row.hasStock
                                ? 'border-blue-100 bg-blue-50'
                                : 'border-gray-100 bg-white'
                            }`}
                          >
                            <span className="text-xs text-gray-600 truncate pr-2 font-medium">{row.label}</span>
                            <span className={`text-sm font-bold flex-shrink-0 ${row.hasStock ? 'text-blue-700' : 'text-gray-300'}`}>
                              {row.quantidade}
                            </span>
                          </div>
                        ))}
                      </div>
                      {allRows.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <AlertCircle className="w-4 h-4" />
                          Nenhum saldo cadastrado ainda
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <EstoqueForm
          produto={editingProduto ?? undefined}
          onClose={() => { setShowForm(false); setEditingProduto(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showDetalhes && (
        <EstoqueDetalhes
          produto={showDetalhes}
          onClose={() => setShowDetalhes(null)}
          onEditProduto={() => {
            setEditingProduto(showDetalhes);
            setShowDetalhes(null);
            setShowForm(true);
          }}
          onDelete={handleDeleteFromDetalhes}
        />
      )}

      {vendaModalProduto && (
        <VendasDoProdutoModal
          produtoId={vendaModalProduto.id}
          produtoNome={vendaModalProduto.nome}
          onClose={() => setVendaModalProduto(null)}
        />
      )}
    </div>
  );
};

export default Estoque;
