import React from 'react';
import { X, Car, User, Calendar, DollarSign, FileText, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import { Permuta, Sale } from '../types';

interface PermutaDetailsProps {
  permuta: Permuta;
  relatedSales: Sale[];
  onClose: () => void;
}

export function PermutaDetails({ permuta, relatedSales, onClose }: PermutaDetailsProps) {
  // Calcular total consumido pelas vendas relacionadas
  const totalConsumedBySales = relatedSales.reduce((sum, sale) => {
    const permutaAmount = sale.paymentMethods
      ?.filter(method => method.type === 'permuta')
      .reduce((methodSum, method) => methodSum + method.amount, 0) || 0;
    return sum + permutaAmount;
  }, 0);

  const progressPercentage = permuta.vehicleValue > 0 
    ? Math.min(100, (permuta.consumedValue / permuta.vehicleValue) * 100)
    : 0;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 modern-shadow-xl">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear}
                </h2>
                <p className="text-slate-600">Cliente: {permuta.clientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Status e Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-indigo-900 mb-2">Status</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(permuta.status)}`}>
                  {getStatusLabel(permuta.status)}
                </span>
                <p className="text-sm text-indigo-600 mt-2">
                  Registrado em {new Date(permuta.registrationDate).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h4 className="font-bold text-green-900 mb-2">Valor do Veículo</h4>
                <p className="text-2xl font-black text-green-700">
                  R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600">Valor avaliado</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Valor Consumido</h4>
                <p className="text-2xl font-black text-blue-700">
                  R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600">{relatedSales.length} venda(s)</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-900 mb-2">Valor Disponível</h4>
                <p className="text-2xl font-black text-orange-700">
                  R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-orange-600">Para futuras vendas</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Progresso de Consumo</h3>
                  <p className="text-blue-700">
                    {progressPercentage.toFixed(1)}% do valor total já foi consumido
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden mb-4">
                <div 
                  className={`h-6 rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-bold ${
                    progressPercentage >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                    progressPercentage >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${Math.max(10, Math.min(100, progressPercentage))}%` }}
                >
                  {progressPercentage >= 10 && `${progressPercentage.toFixed(0)}%`}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-blue-600 font-semibold">Valor Total</p>
                  <p className="text-xl font-black text-blue-800">
                    R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Consumido</p>
                  <p className="text-xl font-black text-green-600">
                    R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Disponível</p>
                  <p className="text-xl font-black text-orange-600">
                    R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Informações Completas do Veículo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Dados do Veículo</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Marca:</span>
                    <span className="font-bold text-slate-900">{permuta.vehicleMake}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Modelo:</span>
                    <span className="font-bold text-slate-900">{permuta.vehicleModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ano:</span>
                    <span className="font-bold text-slate-900">{permuta.vehicleYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Placa:</span>
                    <span className="font-bold text-slate-900">{permuta.vehiclePlate}</span>
                  </div>
                  {permuta.vehicleChassis && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Chassi:</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">{permuta.vehicleChassis}</span>
                    </div>
                  )}
                  {permuta.vehicleColor && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cor:</span>
                      <span className="font-bold text-slate-900">{permuta.vehicleColor}</span>
                    </div>
                  )}
                  {permuta.vehicleMileage && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Quilometragem:</span>
                      <span className="font-bold text-slate-900">
                        {permuta.vehicleMileage.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Dados do Cliente</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nome:</span>
                    <span className="font-bold text-slate-900">{permuta.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Data de Registro:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(permuta.registrationDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total de Vendas:</span>
                    <span className="font-bold text-blue-600">{relatedSales.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Valor Consumido:</span>
                    <span className="font-bold text-green-600">
                      R$ {totalConsumedBySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {permuta.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Criado em:</span>
                      <span className="font-bold text-slate-900">
                        {new Date(permuta.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendas Relacionadas */}
            <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">
                    Vendas Relacionadas ({relatedSales.length})
                  </h3>
                  <p className="text-green-700">
                    Total consumido: R$ {totalConsumedBySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              {relatedSales.length > 0 ? (
                <div className="space-y-4">
                  {relatedSales.map(sale => {
                    const permutaAmount = sale.paymentMethods
                      ?.filter(method => method.type === 'permuta')
                      .reduce((sum, method) => sum + method.amount, 0) || 0;
                    
                    return (
                      <div key={sale.id} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-green-900">
                                {new Date(sale.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                sale.status === 'pago' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {sale.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-green-700 mb-1">
                              Produtos: {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">
                                Total da Venda: R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-blue-600">
                                Recebido: R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-orange-600">
                                Pendente: R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="p-3 bg-indigo-100 rounded-lg border border-indigo-200">
                              <p className="text-sm text-indigo-600 font-semibold">Via Permuta</p>
                              <p className="text-xl font-black text-indigo-700">
                                R$ {permutaAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Total Summary */}
                  <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-lg font-bold text-green-900">
                          Total Consumido em Vendas
                        </span>
                      </div>
                      <span className="text-2xl font-black text-green-700">
                        R$ {totalConsumedBySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-green-300" />
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    Nenhuma venda relacionada
                  </h3>
                  <p className="text-green-500">
                    As vendas com pagamento via permuta aparecerão aqui automaticamente.
                  </p>
                </div>
              )}
            </div>

            {/* Observações */}
            {permuta.notes && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Observações</h4>
                <p className="text-slate-700">{permuta.notes}</p>
              </div>
            )}

            {/* Resumo Final */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">Resumo da Permuta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-indigo-800 mb-3">Situação Financeira</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor do Veículo:</span>
                      <span className="font-bold">R$ {permuta.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Consumido:</span>
                      <span className="font-bold text-green-600">R$ {permuta.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-200 pt-2">
                      <span className="font-bold">Valor Disponível:</span>
                      <span className="font-bold text-orange-600">R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-indigo-800 mb-3">Atividade</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total de Vendas:</span>
                      <span className="font-bold">{relatedSales.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progresso:</span>
                      <span className="font-bold">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-bold ${
                        permuta.status === 'ativo' ? 'text-green-600' :
                        permuta.status === 'finalizado' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {getStatusLabel(permuta.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}