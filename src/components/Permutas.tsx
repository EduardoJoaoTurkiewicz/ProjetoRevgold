import React, { useState, useMemo } from 'react';
import { Plus, Car, Eye, CreditCard as Edit, Trash2, Calendar, DollarSign, User, AlertTriangle, X, FileText, Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Permuta } from '../types';
import { PermutaForm } from './forms/PermutaForm';
import { PermutaDetails } from './PermutaDetails';
import { dbDateToDisplay } from '../utils/dateUtils';

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

  // Calcular estatísticas
  const stats = useMemo(() => {
    const activePermutas = permutas.filter(p => p.status === 'ativo');
    const finishedPermutas = permutas.filter(p => p.status === 'finalizado');
    const totalVehicleValue = permutas.reduce((sum, p) => sum + p.vehicleValue, 0);
    const totalConsumedValue = permutas.reduce((sum, p) => sum + p.consumedValue, 0);
    const totalRemainingValue = permutas.reduce((sum, p) => sum + p.remainingValue, 0);
    
    return {
      total: permutas.length,
      active: activePermutas.length,
      finished: finishedPermutas.length,
      totalVehicleValue,
      totalConsumedValue,
      totalRemainingValue
    };
  }, [permutas]);

  // Obter vendas relacionadas a uma permuta específica (usando vehicleId)
  const getRelatedSales = (permutaId: string) => {
    return sales.filter(sale => {
      // Verificar se a venda usa este veículo específico de permuta
      return sale.paymentMethods?.some(method =>
        method.type === 'permuta' && method.vehicleId === permutaId
      );
    });
  };

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

  const getStatusColor = (status: Permuta['status']) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
      case 'finalizado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Permuta['status']) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getProgressPercentage = (permuta: Permuta) => {
    if (permuta.vehicleValue === 0) return 0;
    return Math.min(100, (permuta.consumedValue / permuta.vehicleValue) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Car className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando permutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl floating-animation">
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

      {/* Error Display */}
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
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600 modern-shadow-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 text-lg">Total de Veículos</h3>
              <p className="text-3xl font-black text-indigo-700">{stats.total}</p>
              <p className="text-sm text-indigo-600 font-semibold">
                {stats.active} ativo(s)
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
              <p className="text-3xl font-black text-green-700">
                R$ {stats.totalVehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                Em veículos
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Valor Consumido</h3>
              <p className="text-3xl font-black text-blue-700">
                R$ {stats.totalConsumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                Em vendas
              </p>
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
              <p className="text-3xl font-black text-orange-700">
                R$ {stats.totalRemainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600 font-semibold">
                Para vendas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permutas List */}
      <div className="space-y-6">
        {permutas.length > 0 ? (
          permutas.map((permuta) => {
            const relatedSales = getRelatedSales(permuta.id!);
            const progressPercentage = getProgressPercentage(permuta);
            
            return (
              <div key={permuta.id} className="card modern-shadow-xl">
                {/* Permuta Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-600">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {permuta.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dbDateToDisplay(permuta.registrationDate)}
                        </span>
                        <span className="font-bold text-indigo-600">
                          Placa: {permuta.vehiclePlate}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-black text-indigo-600">
                      R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(permuta.status)}`}>
                      {getStatusLabel(permuta.status)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-900">Progresso de Consumo</h4>
                    <span className="text-sm font-bold text-slate-700">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        progressPercentage >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        progressPercentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>Consumido: R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Restante: R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Vehicle Details Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <h4 className="font-bold text-indigo-900 mb-2">Valor do Veículo</h4>
                    <p className="text-2xl font-black text-indigo-700">
                      R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-indigo-600">Valor avaliado</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">Valor Consumido</h4>
                    <p className="text-2xl font-black text-blue-700">
                      R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-600">{relatedSales.length} venda(s)</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-2">Valor Disponível</h4>
                    <p className="text-2xl font-black text-orange-700">
                      R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-orange-600">Para futuras vendas</p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Informações do Veículo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Marca:</span>
                      <p className="font-bold text-slate-900">{permuta.vehicleMake}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Modelo:</span>
                      <p className="font-bold text-slate-900">{permuta.vehicleModel}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Ano:</span>
                      <p className="font-bold text-slate-900">{permuta.vehicleYear}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Placa:</span>
                      <p className="font-bold text-slate-900">{permuta.vehiclePlate}</p>
                    </div>
                    {permuta.vehicleColor && (
                      <div>
                        <span className="text-slate-600">Cor:</span>
                        <p className="font-bold text-slate-900">{permuta.vehicleColor}</p>
                      </div>
                    )}
                    {permuta.vehicleMileage && (
                      <div>
                        <span className="text-slate-600">Quilometragem:</span>
                        <p className="font-bold text-slate-900">
                          {permuta.vehicleMileage.toLocaleString('pt-BR')} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Sales */}
                {relatedSales.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4">Vendas Relacionadas ({relatedSales.length})</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto modern-scrollbar">
                      {relatedSales.slice(0, 3).map(sale => {
                        const permutaAmount = sale.paymentMethods
                          ?.filter(method => method.type === 'permuta')
                          .reduce((sum, method) => sum + method.amount, 0) || 0;
                        
                        return (
                          <div key={sale.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-blue-900">
                                  {dbDateToDisplay(sale.date)}
                                </p>
                                <p className="text-sm text-blue-700">
                                  Total: R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-indigo-600">
                                  R$ {permutaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <p className="text-xs text-indigo-500">via permuta</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {relatedSales.length > 3 && (
                        <p className="text-sm text-blue-600 text-center">
                          ... e mais {relatedSales.length - 3} venda(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {permuta.notes && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <p className="text-slate-700">{permuta.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setViewingPermuta(permuta)}
                    className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition-modern"
                    title="Ver Detalhes Completos"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingPermuta(permuta)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePermuta(permuta.id!)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Car className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhuma permuta registrada</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando seu primeiro veículo recebido em troca.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeira permuta
            </button>
          </div>
        )}
      </div>

      {/* Permuta Form Modal */}
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

      {/* Permuta Details Modal */}
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