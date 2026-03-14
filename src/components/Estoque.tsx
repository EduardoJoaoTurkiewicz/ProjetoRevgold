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
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { EstoqueProdutoCompleto } from '../types';
import EstoqueForm from './forms/EstoqueForm';
import EstoqueDetalhes from './forms/EstoqueDetalhes';

const Estoque: React.FC = () => {
  const { estoqueProdutos, isLoadingEstoque, loadEstoqueData, deleteEstoqueProduto } = useAppContext();

  const [search, setSearch] = useState('');
  const [filterCor, setFilterCor] = useState('');
  const [filterVariacao, setFilterVariacao] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<EstoqueProdutoCompleto | null>(null);
  const [showDetalhes, setShowDetalhes] = useState<EstoqueProdutoCompleto | null>(null);

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

  const getSaldoLabel = (produto: EstoqueProdutoCompleto) => {
    if (produto.saldos.length === 0) return [];
    const labels: string[] = [];

    if (produto.temCor) {
      for (const saldo of produto.saldos) {
        if (saldo.quantidadeAtual > 0) {
          const variacao = produto.variacoes.find(v => v.id === saldo.variacaoId);
          const cor = produto.cores.find(c => c.id === saldo.corId);
          if (variacao && cor) {
            labels.push(`${saldo.quantidadeAtual} ${variacao.nomeVariacao} ${cor.nomeCor}`);
          }
        }
      }
    } else {
      for (const saldo of produto.saldos) {
        if (saldo.quantidadeAtual > 0) {
          const variacao = produto.variacoes.find(v => v.id === saldo.variacaoId);
          if (variacao) {
            labels.push(`${saldo.quantidadeAtual} ${variacao.nomeVariacao}`);
          }
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

  const refreshDetalhes = () => {
    if (!showDetalhes) return;
    const updated = estoqueProdutos.find(p => p.id === showDetalhes.id);
    if (updated) setShowDetalhes(updated);
  };

  useEffect(() => {
    refreshDetalhes();
  }, [estoqueProdutos]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
            <p className="text-sm text-gray-500 mt-0.5">Controle de produtos e saldos</p>
          </div>
          <button
            onClick={() => { setEditingProduto(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar novo produto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Com Estoque</p>
              <p className="text-2xl font-bold text-gray-900">{stats.comSaldo}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
              <PackageX className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Zerados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.zerados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome do produto..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCor}
              onChange={e => setFilterCor(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white min-w-[140px]"
            >
              <option value="">Todas as cores</option>
              {allCores.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterVariacao}
              onChange={e => setFilterVariacao(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white min-w-[160px]"
            >
              <option value="">Todas as variacoes</option>
              {allVariacoes.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingEstoque ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {estoqueProdutos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {estoqueProdutos.length === 0
                ? 'Adicione o primeiro produto ao estoque para comecar.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
            {estoqueProdutos.length === 0 && (
              <button
                onClick={() => { setEditingProduto(null); setShowForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:from-teal-700 hover:to-emerald-800"
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
              const saldoLabels = getSaldoLabel(produto);
              const allRows = getAllSaldoRows(produto);
              const hasStock = total > 0;

              return (
                <div
                  key={produto.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasStock ? 'bg-teal-500' : 'bg-gray-300'}`} />
                          <h3 className="text-base font-semibold text-gray-900 truncate">{produto.nome}</h3>
                          {!produto.temCor && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 flex-shrink-0">Sem cor</span>
                          )}
                        </div>
                        <div className="mt-1 ml-4.5 flex flex-wrap gap-1.5">
                          {produto.temCor && produto.cores.slice(0, 4).map(c => (
                            <span key={c.id} className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                              {c.nomeCor}
                            </span>
                          ))}
                          {produto.temCor && produto.cores.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-500">
                              +{produto.cores.length - 4} cores
                            </span>
                          )}
                          {produto.variacoes.slice(0, 3).map(v => (
                            <span key={v.id} className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-600">
                              {v.nomeVariacao}
                            </span>
                          ))}
                          {produto.variacoes.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-500">
                              +{produto.variacoes.length - 3} variacoes
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${hasStock ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
                          {total} un.
                        </span>
                        <button
                          onClick={() => setShowDetalhes(produto)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver detalhes
                        </button>
                        <button
                          onClick={() => { setEditingProduto(produto); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {saldoLabels.slice(0, 6).map((label, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-teal-50 text-teal-700 border border-teal-100">
                            {label}
                          </span>
                        ))}
                        {saldoLabels.length > 6 && (
                          <span className="px-2 py-0.5 rounded-lg text-xs bg-gray-50 text-gray-500">
                            +{saldoLabels.length - 6} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-50 px-5 pb-5 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Especificacoes e Saldos
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {allRows.map((row, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${row.hasStock ? 'border-teal-100 bg-teal-50' : 'border-gray-100 bg-gray-50'}`}
                          >
                            <span className="text-xs text-gray-600 truncate pr-2">{row.label}</span>
                            <span className={`text-sm font-bold flex-shrink-0 ${row.hasStock ? 'text-teal-700' : 'text-gray-400'}`}>
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
    </div>
  );
};

export default Estoque;
