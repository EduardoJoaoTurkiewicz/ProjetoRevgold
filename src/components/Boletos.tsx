import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Boleto } from '../types';
import { BoletoForm } from './forms/BoletoForm';

export function Boletos() {
  const { state, createBoleto, updateBoleto, deleteBoleto } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.boletos.filter(boleto => boleto.dueDate === today);
  const overdue = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');

  const handleAddBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    createBoleto(boleto).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar boleto: ' + error.message);
    });
  };

  const handleEditBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (editingBoleto) {
      const updatedBoleto: Boleto = {
        ...boleto,
        id: editingBoleto.id,
        createdAt: editingBoleto.createdAt
      };
      updateBoleto(updatedBoleto).then(() => {
        setEditingBoleto(null);
      }).catch(error => {
        alert('Erro ao atualizar boleto: ' + error.message);
      });
    }
  };

  const handleDeleteBoleto = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este boleto? Esta ação não pode ser desfeita.')) {
      deleteBoleto(id).catch(error => {
        alert('Erro ao excluir boleto: ' + error.message);
      });
    }
  };

  const updateBoletoStatus = (boletoId: string, status: Boleto['status']) => {
    const boleto = state.boletos.find(b => b.id === boletoId);
    if (boleto) {
      const updatedBoleto = { ...boleto, status };
      updateBoleto(updatedBoleto).catch(error => {
        alert('Erro ao atualizar status: ' + error.message);
      });
    }
  };

  const getStatusColor = (status: Boleto['status']) => {
    switch (status) {
      case 'compensado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'nao_pago': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: Boleto['status']) => {
    switch (status) {
      case 'compensado': return 'Compensado';
      case 'vencido': return 'Vencido';
      case 'cancelado': return 'Cancelado';
      case 'nao_pago': return 'Não Pago';
      default: return 'Pendente';
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando boletos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Boletos</h1>
            <p className="text-slate-600 text-lg">Controle completo de boletos bancários</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Boleto
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Vencimentos Hoje</h3>
                  <p className="text-blue-700 font-medium">{dueToday.length} boleto(s)</p>
                  <p className="text-sm text-blue-600 font-semibold">
                    Total: R$ {dueToday.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 text-lg">Boletos Vencidos</h3>
                  <p className="text-red-700 font-medium">{overdue.length} boleto(s)</p>
                  <p className="text-sm text-red-600 font-semibold">
                    Total: R$ {overdue.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Boletos List */}
      <div className="card modern-shadow-xl">
        {state.boletos.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Vencimento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Parcela</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Venda</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.boletos.map(boleto => (
                  <tr key={boleto.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{boleto.client}</td>
                    <td className="py-4 px-6 text-sm font-black text-blue-600">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={
                        boleto.dueDate === today ? 'text-blue-600 font-medium' :
                        boleto.dueDate < today ? 'text-red-600 font-medium' :
                        'text-gray-900'
                      }>
                        {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(boleto.status)}`}>
                          {getStatusLabel(boleto.status)}
                        </span>
                        {(boleto.status === 'pendente' || boleto.status === 'vencido') && (
                          <select
                            value={boleto.status}
                            onChange={(e) => updateBoletoStatus(boleto.id, e.target.value as Boleto['status'])}
                            className="text-xs border rounded-lg px-2 py-1 bg-white modern-shadow"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="compensado">Compensado</option>
                            <option value="vencido">Vencido</option>
                            <option value="cancelado">Cancelado</option>
                            <option value="nao_pago">Não Pago</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {boleto.installmentNumber}/{boleto.totalInstallments}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {boleto.saleId ? (
                        (() => {
                          const sale = state.sales.find(s => s.id === boleto.saleId);
                          return sale ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              Venda: {sale.client}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Venda não encontrada</span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-xs">Manual</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingBoleto(boleto)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBoleto(boleto)}
                          className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBoleto(boleto.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum boleto registrado</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando seu primeiro boleto para controlar os recebimentos.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeiro boleto
            </button>
          </div>
        )}
      </div>

      {/* Boleto Form Modal */}
      {(isFormOpen || editingBoleto) && (
        <BoletoForm
          boleto={editingBoleto}
          onSubmit={editingBoleto ? handleEditBoleto : handleAddBoleto}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingBoleto(null);
          }}
        />
      )}

      {/* View Boleto Modal */}
      {viewingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes do Boleto</h2>
                </div>
                <button
                  onClick={() => setViewingBoleto(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingBoleto.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-slate-900 font-bold text-blue-600">
                    R$ {viewingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingBoleto.status)}`}>
                    {getStatusLabel(viewingBoleto.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Parcela</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {viewingBoleto.installmentNumber} de {viewingBoleto.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="form-label">Venda Associada</label>
                  <p className="text-sm text-slate-900">
                    {viewingBoleto.saleId ? (
                      (() => {
                        const sale = state.sales.find(s => s.id === viewingBoleto.saleId);
                        return sale ? `Venda: ${sale.client} (${new Date(sale.date).toLocaleDateString('pt-BR')})` : 'Venda não encontrada';
                      })()
                    ) : (
                      'Boleto manual'
                    )}
                  </p>
                </div>
              </div>

              {viewingBoleto.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingBoleto.observations}
                  </p>
                </div>
              )}

              {viewingBoleto.boletoFile && (
                <div className="mb-8">
                  <label className="form-label">Arquivo do Boleto</label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 font-medium">
                      ✓ Arquivo anexado
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      {viewingBoleto.boletoFile}
                    </p>
                  </div>
                </div>
              )}

              {viewingBoleto.saleId && (
                <div className="mb-8">
                  <label className="form-label">Informações da Venda</label>
                  {(() => {
                    const sale = state.sales.find(s => s.id === viewingBoleto.saleId);
                    return sale ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <p><strong>Cliente:</strong> {sale.client}</p>
                          <p><strong>Data da Venda:</strong> {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Valor Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p><strong>Status da Venda:</strong> {sale.status.toUpperCase()}</p>
                          {sale.deliveryDate && (
                            <p><strong>Data de Entrega:</strong> {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}</p>
                          )}
                          {sale.sellerId && (
                            <p><strong>Vendedor:</strong> {state.employees.find(e => e.id === sale.sellerId)?.name || 'N/A'}</p>
                          )}
                        </div>
                        {sale.observations && (
                          <div className="mt-4">
                            <p><strong>Observações da Venda:</strong></p>
                            <p className="text-slate-700 mt-1">{sale.observations}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700">Venda não encontrada</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingBoleto(null)}
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