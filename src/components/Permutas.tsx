import React, { useState, useMemo } from 'react';
import { Plus, Car, Eye, CreditCard as Edit, Trash2, Calendar, DollarSign, User, AlertTriangle, X, Activity, TrendingUp, CheckCircle, Clock, Search, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Permuta } from '../types';
import { PermutaForm } from './forms/PermutaForm';
import { PermutaDetails } from './PermutaDetails';
import { dbDateToDisplay } from '../utils/dateUtils';

type SortOption = 'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc' | 'disponivel_desc';

export function Permutas() {
  const {
    permutas,
    sales,
    isLoading,
    error,
    createPermuta,
    updatePermuta,
    deletePermuta
  } = useAppContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPermuta, setEditingPermuta] = useState<Permuta | null>(null);
  const [viewingPermuta, setViewingPermuta] = useState<Permuta | null>(null);

  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSort, setPendingSort] = useState<SortOption>('data_desc');
  const [finalizedSearch, setFinalizedSearch] = useState('');
  const [finalizedSort, setFinalizedSort] = useState<SortOption>('data_desc');
  const [showFinalizedSection, setShowFinalizedSection] = useState(true);

  const stats = useMemo(() => {
    const totalVehicleValue = permutas.reduce((sum, p) => sum + p.vehicleValue, 0);
    const totalConsumedValue = permutas.reduce((sum, p) => sum + p.consumedValue, 0);
    const totalRemainingValue = permutas.reduce((sum, p) => sum + p.remainingValue, 0);
    const activeCount = permutas.filter(p => p.status === 'ativo' && p.remainingValue > 0).length;
    const finalizedCount = permutas.filter(p => p.status === 'finalizado' || p.remainingValue <= 0).length;

    return { total: permutas.length, activeCount, finalizedCount, totalVehicleValue, totalConsumedValue, totalRemainingValue };
  }, [permutas]);

  const getRelatedSales = (permutaId: string) => {
    return sales.filter(sale =>
      sale.paymentMethods?.some((method: any) =>
        method.type === 'permuta' && method.vehicleId === permutaId
      )
    );
  };

  const pendingPermutas = useMemo(() => {
    return permutas.filter(p => p.status !== 'cancelado' && p.remainingValue > 0);
  }, [permutas]);

  const finalizedPermutas = useMemo(() => {
    return permutas.filter(p => p.status === 'finalizado' || (p.status !== 'cancelado' && p.remainingValue <= 0));
  }, [permutas]);

  const applyFiltersAndSort = (list: Permuta[], search: string, sort: SortOption) => {
    let filtered = list;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = list.filter(p =>
        p.clientName?.toLowerCase().includes(q) ||
        p.vehicleMake?.toLowerCase().includes(q) ||
        p.vehicleModel?.toLowerCase().includes(q) ||
        p.vehiclePlate?.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'data_asc': return (a.registrationDate || '').localeCompare(b.registrationDate || '');
        case 'data_desc': return (b.registrationDate || '').localeCompare(a.registrationDate || '');
        case 'valor_desc': return b.vehicleValue - a.vehicleValue;
        case 'valor_asc': return a.vehicleValue - b.vehicleValue;
        case 'disponivel_desc': return b.remainingValue - a.remainingValue;
        default: return 0;
      }
    });
  };

  const filteredPendingPermutas = useMemo(() =>
    applyFiltersAndSort(pendingPermutas, pendingSearch, pendingSort),
    [pendingPermutas, pendingSearch, pendingSort]
  );

  const filteredFinalizedPermutas = useMemo(() =>
    applyFiltersAndSort(finalizedPermutas, finalizedSearch, finalizedSort),
    [finalizedPermutas, finalizedSearch, finalizedSort]
  );

  const handleAddPermuta = (permuta: Omit<Permuta, 'id' | 'createdAt'>) => {
    createPermuta(permuta).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar permuta: ' + error.message);
    });
  };

  const handleEditPermuta = (permuta: Omit<Permuta, 'id' | 'createdAt'>) => {
    if (editingPermuta) {
      updatePermuta({ ...permuta, id: editingPermuta.id, createdAt: editingPermuta.createdAt }).then(() => {
        setEditingPermuta(null);
      }).catch(error => {
        alert('Erro ao atualizar permuta: ' + error.message);
      });
    }
  };

  const handleDeletePermuta = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta permuta? Esta ação não pode ser desfeita.')) {
      deletePermuta(id).catch(error => {
        alert('Erro ao excluir permuta: ' + error.message);
      });
    }
  };

  const getProgressPercentage = (permuta: Permuta) => {
    if (permuta.vehicleValue === 0) return 0;
    return Math.min(100, (permuta.consumedValue / permuta.vehicleValue) * 100);
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-600';
    if (pct >= 75) return 'bg-gradient-to-r from-amber-400 to-orange-500';
    return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Car className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando permutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 shadow-xl floating-animation">
            <Car className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Permutas</h1>
            <p className="text-slate-600 text-lg">Controle de veículos recebidos em troca</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Permuta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Total de Veículos</h3>
              <p className="text-3xl font-black text-blue-700">{stats.total}</p>
              <p className="text-sm text-blue-600 font-semibold">
                {stats.activeCount} com saldo disponível
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Valor Total</h3>
              <p className="text-2xl font-black text-green-700">
                R$ {stats.totalVehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">Em veículos</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-600 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sky-900 text-lg">Valor Consumido</h3>
              <p className="text-2xl font-black text-sky-700">
                R$ {stats.totalConsumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-sky-600 font-semibold">Em vendas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Valor Disponível</h3>
              <p className="text-2xl font-black text-orange-700">
                R$ {stats.totalRemainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600 font-semibold">Para vendas</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION A: Veículos com Permutas Pendentes */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Veículos com Permutas Pendentes</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
              {filteredPendingPermutas.length} veículo(s)
            </span>
          </div>
        </div>
        <p className="text-slate-500 text-sm ml-5">Veículos com saldo de permuta ainda disponível para uso em vendas</p>

        {/* Filters for Pending */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Buscar por cliente, marca, modelo ou placa..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {pendingSearch && (
              <button onClick={() => setPendingSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={pendingSort}
            onChange={(e) => setPendingSort(e.target.value as SortOption)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700"
          >
            <option value="data_desc">Mais recentes</option>
            <option value="data_asc">Mais antigos</option>
            <option value="valor_desc">Maior valor</option>
            <option value="valor_asc">Menor valor</option>
            <option value="disponivel_desc">Maior disponível</option>
          </select>
        </div>

        {filteredPendingPermutas.length > 0 ? (
          <div className="space-y-4">
            {filteredPendingPermutas.map((permuta) => {
              const relatedSales = getRelatedSales(permuta.id!);
              const progressPercentage = getProgressPercentage(permuta);

              return (
                <div key={permuta.id} className="card modern-shadow-xl border-l-4 border-l-blue-500 hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-600">
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {permuta.clientName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {dbDateToDisplay(permuta.registrationDate)}
                          </span>
                          <span className="font-bold text-blue-600">Placa: {permuta.vehiclePlate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-700">
                        R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="inline-flex px-2.5 py-0.5 mt-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Ativo
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">Progresso de Consumo</span>
                      <span className="text-sm font-bold text-slate-600">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${getProgressColor(progressPercentage)}`}
                        style={{ width: `${Math.min(100, progressPercentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                      <span>Consumido: R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="font-semibold text-orange-600">Restante: R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Valor do Veículo</p>
                      <p className="text-lg font-black text-slate-800">
                        R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-sky-50 rounded-xl border border-sky-200">
                      <p className="text-xs text-sky-600 mb-1 font-semibold">Consumido</p>
                      <p className="text-lg font-black text-sky-700">
                        R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-sky-500">{relatedSales.length} venda(s)</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-xs text-orange-600 mb-1 font-semibold">Disponível</p>
                      <p className="text-lg font-black text-orange-700">
                        R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-orange-500">Para novas vendas</p>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    {[
                      { label: 'Marca', value: permuta.vehicleMake },
                      { label: 'Modelo', value: permuta.vehicleModel },
                      { label: 'Ano', value: permuta.vehicleYear },
                      { label: 'Placa', value: permuta.vehiclePlate },
                      ...(permuta.vehicleColor ? [{ label: 'Cor', value: permuta.vehicleColor }] : []),
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
                        <p className="font-bold text-slate-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Related Sales */}
                  {relatedSales.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">Vendas Relacionadas ({relatedSales.length})</h4>
                      <div className="space-y-2 max-h-36 overflow-y-auto modern-scrollbar">
                        {relatedSales.slice(0, 3).map(sale => {
                          const permutaAmount = sale.paymentMethods
                            ?.filter((m: any) => m.type === 'permuta')
                            .reduce((s: number, m: any) => s + m.amount, 0) || 0;
                          return (
                            <div key={sale.id} className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                              <div>
                                <p className="text-sm font-bold text-blue-900">{dbDateToDisplay(sale.date)}</p>
                                <p className="text-xs text-blue-600">Total: R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-blue-700">
                                  R$ {permutaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <p className="text-xs text-blue-500">via permuta</p>
                              </div>
                            </div>
                          );
                        })}
                        {relatedSales.length > 3 && (
                          <p className="text-xs text-blue-600 text-center py-1">+ {relatedSales.length - 3} venda(s)</p>
                        )}
                      </div>
                    </div>
                  )}

                  {permuta.notes && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Observações</p>
                      <p className="text-sm text-slate-700">{permuta.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button onClick={() => setViewingPermuta(permuta)} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern" title="Ver Detalhes">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingPermuta(permuta)} className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern" title="Editar">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeletePermuta(permuta.id!)} className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium text-lg">
              {pendingSearch ? 'Nenhuma permuta encontrada com os filtros aplicados.' : 'Nenhuma permuta ativa com saldo disponível.'}
            </p>
            {!pendingSearch && (
              <button onClick={() => setIsFormOpen(true)} className="mt-4 btn-primary">
                Registrar nova permuta
              </button>
            )}
            {pendingSearch && (
              <button onClick={() => setPendingSearch('')} className="mt-4 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION B: Veículos Permuta Finalizada */}
      <div className="space-y-4">
        <button
          onClick={() => setShowFinalizedSection(!showFinalizedSection)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Veículos Permuta Finalizada</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold border border-emerald-200">
                {finalizedPermutas.length} veículo(s)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-sm">Valor total utilizado</span>
            <span className="font-bold text-slate-700">
              R$ {finalizedPermutas.reduce((s, p) => s + p.consumedValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {showFinalizedSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showFinalizedSection && (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm ml-5">Veículos cujo valor total da permuta foi completamente utilizado em vendas</p>

            {/* Filters for Finalized */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={finalizedSearch}
                  onChange={(e) => setFinalizedSearch(e.target.value)}
                  placeholder="Buscar por cliente, marca, modelo ou placa..."
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
                {finalizedSearch && (
                  <button onClick={() => setFinalizedSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select
                value={finalizedSort}
                onChange={(e) => setFinalizedSort(e.target.value as SortOption)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-700"
              >
                <option value="data_desc">Mais recentes</option>
                <option value="data_asc">Mais antigos</option>
                <option value="valor_desc">Maior valor</option>
                <option value="valor_asc">Menor valor</option>
              </select>
            </div>

            {filteredFinalizedPermutas.length > 0 ? (
              <div className="space-y-3">
                {filteredFinalizedPermutas.map((permuta) => {
                  const relatedSales = getRelatedSales(permuta.id!);
                  return (
                    <div key={permuta.id} className="card modern-shadow border-l-4 border-l-emerald-500 bg-gradient-to-r from-slate-50 to-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-emerald-100">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">
                              {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />{permuta.clientName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />{dbDateToDisplay(permuta.registrationDate)}
                              </span>
                              <span className="font-bold text-slate-600">Placa: {permuta.vehiclePlate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-lg font-black text-slate-700">
                            R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                              Finalizado
                            </span>
                            <span className="text-xs text-slate-500">{relatedSales.length} venda(s)</span>
                          </div>
                        </div>
                      </div>

                      {/* Compact progress - 100% */}
                      <div className="mt-4 mb-3">
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 w-full" />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Consumido: R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="font-semibold text-emerald-600">100% utilizado</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button onClick={() => setViewingPermuta(permuta)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-modern" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingPermuta(permuta)} className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-modern" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePermuta(permuta.id!)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-modern" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CheckCircle className="w-14 h-14 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">
                  {finalizedSearch ? 'Nenhuma permuta encontrada.' : 'Nenhuma permuta finalizada ainda.'}
                </p>
                {finalizedSearch && (
                  <button onClick={() => setFinalizedSearch('')} className="mt-3 px-4 py-2 text-sm text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors">
                    Limpar filtro
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(isFormOpen || editingPermuta) && (
        <PermutaForm
          permuta={editingPermuta}
          onSubmit={editingPermuta ? handleEditPermuta : handleAddPermuta}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPermuta(null);
          }}
        />
      )}

      {viewingPermuta && (
        <PermutaDetails
          permuta={viewingPermuta}
          relatedSales={getRelatedSales(viewingPermuta.id!)}
          onClose={() => setViewingPermuta(null)}
        />
      )}
    </div>
  );
}
