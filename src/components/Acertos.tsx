import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, HandCoins, DollarSign, Calendar, AlertCircle, X, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Acerto } from '../types';
import { AcertoForm } from './forms/AcertoForm';
import { AcertoPaymentForm } from './forms/AcertoPaymentForm';

export function Acertos() {
  const { acertos, sales, isLoading, error, createAcerto, updateAcerto, deleteAcerto } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAcerto, setEditingAcerto] = useState<Acerto | null>(null);
  const [viewingAcerto, setViewingAcerto] = useState<Acerto | null>(null);
  const [payingAcerto, setPayingAcerto] = useState<Acerto | null>(null);

  // Calcular totais
  const totalPendingAmount = acertos.filter(a => a.status !== 'pago').reduce((sum, a) => sum + a.pendingAmount, 0);
  const totalPaidAmount = acertos.reduce((sum, a) => sum + a.paidAmount, 0);
  const pendingAcertos = acertos.filter(a => a.status === 'pendente');
  const partialAcertos = acertos.filter(a => a.status === 'parcial');

  // Obter vendas relacionadas a um acerto
  const getAcertoSales = (clientName: string) => {
    return sales.filter(sale => 
      sale.client === clientName && 
      sale.paymentMethods?.some(method => method.type === 'acerto')
    );
  };

  const handleAddAcerto = (acerto: Omit<Acerto, 'id' | 'createdAt'>) => {
    createAcerto(acerto).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar acerto: ' + error.message);
    });
  };

  const handleEditAcerto = (acerto: Omit<Acerto, 'id' | 'createdAt'>) => {
    if (editingAcerto) {
      const updatedAcerto: Acerto = {
        ...acerto,
        id: editingAcerto.id,
        createdAt: editingAcerto.createdAt
      };
      updateAcerto(updatedAcerto).then(() => {
        setEditingAcerto(null);
      }).catch(error => {
        alert('Erro ao atualizar acerto: ' + error.message);
      });
    }
  };

  const handleDeleteAcerto = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este acerto? Esta ação não pode ser desfeita.')) {
      deleteAcerto(id).catch(error => {
        alert('Erro ao excluir acerto: ' + error.message);
      });
    }
  };

  const handlePaymentSubmit = (paymentData: any) => {
    if (payingAcerto) {
      const updatedAcerto: Acerto = {
        ...payingAcerto,
        ...paymentData
      };
      updateAcerto(updatedAcerto).then(() => {
        setPayingAcerto(null);
      }).catch(error => {
        alert('Erro ao registrar pagamento: ' + error.message);
      });
    }
  };

  const getStatusColor = (status: Acerto['status']) => {
    switch (status) {
      case 'pago': return 'bg-green-100 text-green-800 border-green-200';
      case 'parcial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusLabel = (status: Acerto['status']) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'parcial': return 'Parcial';
      default: return 'Pendente';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <HandCoins className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando acertos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl floating-animation">
            <HandCoins className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Acertos de Clientes</h1>
            <p className="text-slate-600 text-lg">Gestão de pagamentos mensais e acertos de contas</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Acerto
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
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
              <HandCoins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 text-lg">Total de Acertos</h3>
              <p className="text-indigo-700 font-medium">{acertos.length} cliente(s)</p>
              <p className="text-sm text-indigo-600 font-semibold">
                Valor: R$ {(totalPendingAmount + totalPaidAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Pendentes</h3>
              <p className="text-red-700 font-medium">{pendingAcertos.length} acerto(s)</p>
              <p className="text-sm text-red-600 font-semibold">
                Total: R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-600 modern-shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900 text-lg">Parciais</h3>
              <p className="text-yellow-700 font-medium">{partialAcertos.length} acerto(s)</p>
              <p className="text-sm text-yellow-600 font-semibold">
                Em andamento
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Recebido</h3>
              <p className="text-green-700 font-medium">Total pago</p>
              <p className="text-sm text-green-600 font-semibold">
                R$ {totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acertos List */}
      <div className="card modern-shadow-xl">
        {acertos.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Vendas</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Valor Total</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Pago</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Pendente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {acertos.map(acerto => {
                  const clientSales = getAcertoSales(acerto.clientName);
                  
                  return (
                    <tr key={acerto.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{acerto.clientName}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {clientSales.length} venda(s)
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-indigo-600">
                        R$ {acerto.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-green-600">
                        R$ {acerto.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-orange-600">
                        R$ {acerto.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(acerto.status)}`}>
                          {getStatusLabel(acerto.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingAcerto(acerto)}
                            className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300 modern-shadow"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {acerto.status !== 'pago' && (
                            <button
                              onClick={() => setPayingAcerto(acerto)}
                              className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300 modern-shadow"
                              title="Registrar Pagamento"
                            >
                              <DollarSign className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingAcerto(acerto)}
                            className="p-2 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all duration-300 modern-shadow"
                            title="Editar Acerto"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAcerto(acerto.id!)}
                            className="p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-300 modern-shadow"
                            title="Excluir Acerto"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <HandCoins className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum acerto registrado</h3>
            <p className="text-slate-600 mb-8 text-lg">
              Acertos são criados automaticamente quando você registra vendas com pagamento "Acerto".
            </p>
            <p className="text-slate-500 mb-6">
              Ou você pode criar um acerto manual para clientes que pagam mensalmente.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Criar primeiro acerto
            </button>
          </div>
        )}
      </div>

      {/* Acerto Form Modal */}
      {(isFormOpen || editingAcerto) && (
        <AcertoForm
          acerto={editingAcerto}
          onSubmit={editingAcerto ? handleEditAcerto : handleAddAcerto}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingAcerto(null);
          }}
        />
      )}

      {/* Payment Form Modal */}
      {payingAcerto && (
        <AcertoPaymentForm
          acerto={payingAcerto}
          onSubmit={handlePaymentSubmit}
          onCancel={() => setPayingAcerto(null)}
        />
      )}

      {/* View Acerto Modal */}
      {viewingAcerto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 modern-shadow-xl">
                    <HandCoins className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes do Acerto</h2>
                </div>
                <button
                  onClick={() => setViewingAcerto(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-bold">{viewingAcerto.clientName}</p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingAcerto.status)}`}>
                    {getStatusLabel(viewingAcerto.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-xl font-black text-indigo-600">
                    R$ {viewingAcerto.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pago</label>
                  <p className="text-sm font-bold text-green-600">
                    R$ {viewingAcerto.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pendente</label>
                  <p className="text-sm font-bold text-orange-600">
                    R$ {viewingAcerto.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {viewingAcerto.paymentDate && (
                  <div>
                    <label className="form-label">Data do Pagamento</label>
                    <p className="text-sm text-slate-900 font-medium">
                      {new Date(viewingAcerto.paymentDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {/* Vendas Relacionadas */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-indigo-800 mb-4">Vendas Relacionadas</h3>
                <div className="space-y-3">
                  {getAcertoSales(viewingAcerto.clientName).map(sale => (
                    <div key={sale.id} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-indigo-900">
                            Venda de {new Date(sale.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-indigo-700">
                            {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                          </p>
                        </div>
                        <span className="font-bold text-indigo-600">
                          R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getAcertoSales(viewingAcerto.clientName).length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-indigo-300" />
                      <p className="text-indigo-600 font-medium">Nenhuma venda encontrada para este cliente</p>
                    </div>
                  )}
                </div>
              </div>

              {viewingAcerto.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingAcerto.observations}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingAcerto(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}