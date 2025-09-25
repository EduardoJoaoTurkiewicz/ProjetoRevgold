import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Zap, DollarSign, Calendar, AlertCircle, X, Building2, CreditCard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PixFee } from '../types';
import { PixFeeForm } from './forms/PixFeeForm';

export function PixFees() {
  const { pixFees, isLoading, error, createPixFee, updatePixFee, deletePixFee } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPixFee, setEditingPixFee] = useState<PixFee | null>(null);
  const [viewingPixFee, setViewingPixFee] = useState<PixFee | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // Calcular totais
  const monthlyFees = pixFees.filter(fee => {
    const feeDate = new Date(fee.date);
    return feeDate.getMonth() === thisMonth && feeDate.getFullYear() === thisYear;
  });

  const totalMonthlyFees = monthlyFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalAllFees = pixFees.reduce((sum, fee) => sum + fee.amount, 0);

  // Agrupar por banco
  const feesByBank = pixFees.reduce((acc, fee) => {
    if (!acc[fee.bank]) {
      acc[fee.bank] = { count: 0, total: 0 };
    }
    acc[fee.bank].count += 1;
    acc[fee.bank].total += fee.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const handleAddPixFee = (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => {
    createPixFee(pixFee).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar tarifa PIX: ' + error.message);
    });
  };

  const handleEditPixFee = (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => {
    if (editingPixFee) {
      const updatedPixFee: PixFee = {
        ...pixFee,
        id: editingPixFee.id,
        createdAt: editingPixFee.createdAt
      };
      updatePixFee(editingPixFee.id, updatedPixFee).then(() => {
        setEditingPixFee(null);
      }).catch(error => {
        alert('Erro ao atualizar tarifa PIX: ' + error.message);
      });
    }
  };

  const handleDeletePixFee = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarifa PIX? Esta ação não pode ser desfeita.')) {
      deletePixFee(id).catch(error => {
        alert('Erro ao excluir tarifa PIX: ' + error.message);
      });
    }
  };

  const getTransactionTypeLabel = (type: PixFee['transactionType']) => {
    switch (type) {
      case 'pix_out': return 'PIX Enviado';
      case 'pix_in': return 'PIX Recebido';
      case 'ted': return 'TED';
      case 'doc': return 'DOC';
      case 'other': return 'Outros';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: PixFee['transactionType']) => {
    switch (type) {
      case 'pix_out': return 'bg-red-100 text-red-800 border-red-200';
      case 'pix_in': return 'bg-green-100 text-green-800 border-green-200';
      case 'ted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'doc': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando tarifas PIX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tarifas PIX</h1>
            <p className="text-slate-600 text-lg">Controle de tarifas bancárias e custos de transações</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Tarifa
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Tarifas do Mês</h3>
              <p className="text-blue-700 font-medium">{monthlyFees.length} tarifa(s)</p>
              <p className="text-sm text-blue-600 font-semibold">
                Total: R$ {totalMonthlyFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Total Geral</h3>
              <p className="text-red-700 font-medium">{pixFees.length} tarifa(s)</p>
              <p className="text-sm text-red-600 font-semibold">
                Total: R$ {totalAllFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600 modern-shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Bancos</h3>
              <p className="text-purple-700 font-medium">{Object.keys(feesByBank).length} banco(s)</p>
              <p className="text-sm text-purple-600 font-semibold">
                Média: R$ {(totalAllFees / Math.max(pixFees.length, 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fees by Bank */}
      {Object.keys(feesByBank).length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Tarifas por Banco</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(feesByBank).map(([bank, stats]) => (
              <div key={bank} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-600">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-900">{bank}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Transações:</span>
                    <span className="font-bold text-blue-800">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Tarifas:</span>
                    <span className="font-bold text-red-600">
                      R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Média:</span>
                    <span className="font-bold text-blue-800">
                      R$ {(stats.total / stats.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIX Fees List */}
      <div className="card modern-shadow-xl">
        {pixFees.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Banco</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Tipo</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Descrição</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pixFees.map(pixFee => (
                  <tr key={pixFee.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {new Date(pixFee.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{pixFee.bank}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTransactionTypeColor(pixFee.transactionType)}`}>
                        {getTransactionTypeLabel(pixFee.transactionType)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      <div className="max-w-48 truncate">{pixFee.description}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-red-600">
                      R$ {pixFee.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingPixFee(pixFee)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPixFee(pixFee)}
                          className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePixFee(pixFee.id)}
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
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhuma tarifa PIX registrada</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando sua primeira tarifa PIX para controlar os custos bancários.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeira tarifa
            </button>
          </div>
        )}
      </div>

      {/* PIX Fee Form Modal */}
      {(isFormOpen || editingPixFee) && (
        <PixFeeForm
          pixFee={editingPixFee}
          onSubmit={editingPixFee ? handleEditPixFee : handleAddPixFee}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPixFee(null);
          }}
        />
      )}

      {/* View PIX Fee Modal */}
      {viewingPixFee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes da Tarifa PIX</h2>
                </div>
                <button
                  onClick={() => setViewingPixFee(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-slate-900 font-semibold">
                    {new Date(viewingPixFee.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Banco</label>
                  <p className="text-sm text-slate-900 font-bold">{viewingPixFee.bank}</p>
                </div>
                <div>
                  <label className="form-label">Tipo de Transação</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTransactionTypeColor(viewingPixFee.transactionType)}`}>
                    {getTransactionTypeLabel(viewingPixFee.transactionType)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Valor da Tarifa</label>
                  <p className="text-xl font-black text-red-600">
                    R$ {viewingPixFee.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Descrição</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingPixFee.description}</p>
                </div>
                {viewingPixFee.relatedTransactionId && (
                  <div className="md:col-span-2">
                    <label className="form-label">Transação Relacionada</label>
                    <p className="text-sm text-slate-900 font-mono">{viewingPixFee.relatedTransactionId}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingPixFee(null)}
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