import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, FileText, DollarSign, Calendar, AlertCircle, X, Building2, Receipt } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Tax } from '../types';
import { TaxForm } from './forms/TaxForm';
import { getCurrentDateString } from '../utils/dateUtils';

export function Taxes() {
  const { taxes, isLoading, error, createTax, updateTax, deleteTax } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [viewingTax, setViewingTax] = useState<Tax | null>(null);

  const today = getCurrentDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // Calcular totais
  const monthlyTaxes = taxes.filter(tax => {
    const taxDate = new Date(tax.date);
    return taxDate.getMonth() === thisMonth && taxDate.getFullYear() === thisYear;
  });

  const totalMonthlyTaxes = monthlyTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const totalAllTaxes = taxes.reduce((sum, tax) => sum + tax.amount, 0);

  // Agrupar por tipo de imposto
  const taxesByType = taxes.reduce((acc, tax) => {
    if (!acc[tax.taxType]) {
      acc[tax.taxType] = { count: 0, total: 0 };
    }
    acc[tax.taxType].count += 1;
    acc[tax.taxType].total += tax.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const handleAddTax = (tax: Omit<Tax, 'id' | 'createdAt'>) => {
    createTax(tax).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar imposto: ' + error.message);
    });
  };

  const handleEditTax = (tax: Omit<Tax, 'id' | 'createdAt'>) => {
    if (editingTax) {
      updateTax(editingTax.id, { ...tax, id: editingTax.id, createdAt: editingTax.createdAt }).then(() => {
        setEditingTax(null);
      }).catch(error => {
        alert('Erro ao atualizar imposto: ' + error.message);
      });
    }
  };

  const handleDeleteTax = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita.')) {
      deleteTax(id).catch(error => {
        alert('Erro ao excluir imposto: ' + error.message);
      });
    }
  };

  const getTaxTypeLabel = (type: Tax['taxType']) => {
    const labels = {
      'irpj': 'IRPJ',
      'csll': 'CSLL',
      'pis': 'PIS',
      'cofins': 'COFINS',
      'icms': 'ICMS',
      'iss': 'ISS',
      'simples_nacional': 'Simples Nacional',
      'inss': 'INSS',
      'fgts': 'FGTS',
      'iptu': 'IPTU',
      'ipva': 'IPVA',
      'outros': 'Outros'
    };
    return labels[type] || type;
  };

  const getTaxTypeColor = (type: Tax['taxType']) => {
    const colors = {
      'irpj': 'bg-red-100 text-red-800 border-red-200',
      'csll': 'bg-red-100 text-red-800 border-red-200',
      'pis': 'bg-blue-100 text-blue-800 border-blue-200',
      'cofins': 'bg-blue-100 text-blue-800 border-blue-200',
      'icms': 'bg-purple-100 text-purple-800 border-purple-200',
      'iss': 'bg-purple-100 text-purple-800 border-purple-200',
      'simples_nacional': 'bg-green-100 text-green-800 border-green-200',
      'inss': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'fgts': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'iptu': 'bg-orange-100 text-orange-800 border-orange-200',
      'ipva': 'bg-orange-100 text-orange-800 border-orange-200',
      'outros': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando impostos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-red-700 shadow-xl floating-animation">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Impostos</h1>
            <p className="text-slate-600 text-lg">Controle completo de impostos e tributos</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Imposto
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
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Impostos do Mês</h3>
              <p className="text-orange-700 font-medium">{monthlyTaxes.length} imposto(s)</p>
              <p className="text-sm text-orange-600 font-semibold">
                Total: R$ {totalMonthlyTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <p className="text-red-700 font-medium">{taxes.length} imposto(s)</p>
              <p className="text-sm text-red-600 font-semibold">
                Total: R$ {totalAllTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <h3 className="font-bold text-purple-900 text-lg">Tipos</h3>
              <p className="text-purple-700 font-medium">{Object.keys(taxesByType).length} tipo(s)</p>
              <p className="text-sm text-purple-600 font-semibold">
                Média: R$ {(totalAllTaxes / Math.max(taxes.length, 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Taxes by Type */}
      {Object.keys(taxesByType).length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Impostos por Tipo</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(taxesByType).map(([type, stats]) => (
              <div key={type} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-600">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-orange-900">{getTaxTypeLabel(type as Tax['taxType'])}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-orange-700">Pagamentos:</span>
                    <span className="font-bold text-orange-800">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Total Pago:</span>
                    <span className="font-bold text-red-600">
                      R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Média:</span>
                    <span className="font-bold text-orange-800">
                      R$ {(stats.total / stats.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taxes List */}
      <div className="card modern-shadow-xl">
        {taxes.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Tipo</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Descrição</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Vencimento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Período</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map(tax => (
                  <tr key={tax.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {new Date(tax.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTaxTypeColor(tax.taxType)}`}>
                        {getTaxTypeLabel(tax.taxType)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      <div className="max-w-48 truncate">{tax.description}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-red-600">
                      R$ {tax.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {tax.dueDate ? (
                        <span className={
                          tax.dueDate === today ? 'text-blue-600 font-medium' :
                          tax.dueDate < today ? 'text-red-600 font-medium' :
                          'text-gray-900'
                        }>
                          {new Date(tax.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {tax.referencePeriod || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingTax(tax)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTax(tax)}
                          className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTax(tax.id!)}
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
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <FileText className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum imposto registrado</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando seu primeiro imposto para controlar os tributos.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeiro imposto
            </button>
          </div>
        )}
      </div>

      {/* Tax Form Modal */}
      {(isFormOpen || editingTax) && (
        <TaxForm
          tax={editingTax}
          onSubmit={editingTax ? handleEditTax : handleAddTax}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTax(null);
          }}
        />
      )}

      {/* View Tax Modal */}
      {viewingTax && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-red-700 modern-shadow-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes do Imposto</h2>
                </div>
                <button
                  onClick={() => setViewingTax(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Data do Pagamento</label>
                  <p className="text-sm text-slate-900 font-semibold">
                    {new Date(viewingTax.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Tipo de Imposto</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTaxTypeColor(viewingTax.taxType)}`}>
                    {getTaxTypeLabel(viewingTax.taxType)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Valor Pago</label>
                  <p className="text-xl font-black text-red-600">
                    R$ {viewingTax.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Forma de Pagamento</label>
                  <p className="text-sm text-slate-900 font-medium capitalize">
                    {viewingTax.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                {viewingTax.dueDate && (
                  <div>
                    <label className="form-label">Data de Vencimento</label>
                    <p className="text-sm text-slate-900 font-medium">
                      {new Date(viewingTax.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {viewingTax.referencePeriod && (
                  <div>
                    <label className="form-label">Período de Referência</label>
                    <p className="text-sm text-slate-900 font-medium">{viewingTax.referencePeriod}</p>
                  </div>
                )}
                {viewingTax.documentNumber && (
                  <div className="md:col-span-2">
                    <label className="form-label">Número do Documento</label>
                    <p className="text-sm text-slate-900 font-mono">{viewingTax.documentNumber}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="form-label">Descrição</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingTax.description}</p>
                </div>
              </div>

              {viewingTax.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingTax.observations}
                  </p>
                </div>
              )}

              {viewingTax.receiptFile && (
                <div className="mb-8">
                  <label className="form-label">Comprovante</label>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-medium">
                      ✓ Comprovante anexado
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      {viewingTax.receiptFile}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingTax(null)}
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