import React, { useState } from 'react';
import { Plus, Edit, Eye, Upload, Calendar, Trash2, ChevronDown, ChevronRight, FileText, AlertTriangle, CreditCard, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Check } from '../types';
import { CheckForm } from './forms/CheckForm';
import { getCheckImageUrl } from '../lib/supabase';

export function Checks() {
  const { state, createCheck, updateCheck, deleteCheck } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [viewingCheck, setViewingCheck] = useState<Check | null>(null);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [expandedDebts, setExpandedDebts] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.checks.filter(check => check.dueDate === today);
  const overdue = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
  
  // Novos cálculos para widgets
  const notDueYet = state.checks.filter(check => check.dueDate > today && check.status === 'pendente');
  const totalNotDueYet = notDueYet.reduce((sum, check) => sum + check.value, 0);
  const totalOverdue = overdue.reduce((sum, check) => sum + check.value, 0);
  
  // Cheques próprios que a empresa tem para pagar
  const companyPayableChecks = state.checks.filter(check => 
    check.isOwnCheck && check.status === 'pendente'
  );
  const totalCompanyPayableChecks = companyPayableChecks.reduce((sum, check) => sum + check.value, 0);

  // Group checks by sales and debts
  const salesWithChecks = state.sales.filter(sale => 
    state.checks.some(check => check.saleId === sale.id)
  ).map(sale => ({
    ...sale,
    checks: state.checks.filter(check => check.saleId === sale.id)
  }));

  const debtsWithChecks = state.debts.filter(debt => 
    debt.checksUsed && debt.checksUsed.length > 0
  ).map(debt => ({
    ...debt,
    checks: state.checks.filter(check => 
      debt.checksUsed?.includes(check.id)
    )
  }));

  const handleAddCheck = (check: Omit<Check, 'id' | 'createdAt'>) => {
    createCheck(check).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar cheque: ' + error.message);
    });
  };

  const handleEditCheck = (check: Omit<Check, 'id' | 'createdAt'>) => {
    if (editingCheck) {
      const updatedCheck: Check = {
        ...check,
        id: editingCheck.id,
        createdAt: editingCheck.createdAt
      };
      updateCheck(updatedCheck).then(() => {
        setEditingCheck(null);
      }).catch(error => {
        alert('Erro ao atualizar cheque: ' + error.message);
      });
    }
  };

  const handleDeleteCheck = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cheque? Esta ação não pode ser desfeita.')) {
      deleteCheck(id).catch(error => {
        alert('Erro ao excluir cheque: ' + error.message);
      });
    }
  };

  const updateCheckStatus = (checkId: string, status: Check['status']) => {
    const check = state.checks.find(c => c.id === checkId);
    if (check) {
      const updatedCheck = { ...check, status };
      updateCheck(updatedCheck).catch(error => {
        alert('Erro ao atualizar status: ' + error.message);
      });
    }
  };

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const toggleDebtExpansion = (debtId: string) => {
    const newExpanded = new Set(expandedDebts);
    if (newExpanded.has(debtId)) {
      newExpanded.delete(debtId);
    } else {
      newExpanded.add(debtId);
    }
    setExpandedDebts(newExpanded);
  };

  const getStatusColor = (status: Check['status']) => {
    switch (status) {
      case 'compensado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'devolvido': return 'bg-red-100 text-red-800 border-red-200';
      case 'reapresentado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Check['status']) => {
    switch (status) {
      case 'compensado': return 'Compensado';
      case 'devolvido': return 'Devolvido';
      case 'reapresentado': return 'Reapresentado';
      default: return 'Pendente';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Cheques</h1>
            <p className="text-slate-600 text-lg">Controle completo de cheques por venda e dívida</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Adicionar Cheque
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cheques não vencidos */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Não Vencidos</h3>
              <p className="text-green-700 font-medium">{notDueYet.length} cheque(s)</p>
              <p className="text-sm text-green-600 font-semibold">
                Total: R$ {totalNotDueYet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Cheques vencidos */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Vencidos</h3>
              <p className="text-red-700 font-medium">{overdue.length} cheque(s)</p>
              <p className="text-sm text-red-600 font-semibold">
                Total: R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Cheques para pagar */}
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Para Pagar</h3>
              <p className="text-orange-700 font-medium">{companyPayableChecks.length} cheque(s)</p>
              <p className="text-sm text-orange-600 font-semibold">
                Total: R$ {totalCompanyPayableChecks.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

          {dueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Vencimentos Hoje</h3>
                  <p className="text-blue-700 font-medium">{dueToday.length} cheque(s)</p>
                  <p className="text-sm text-blue-600 font-semibold">
                    Total: R$ {dueToday.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Sales with Checks */}
      <div className="card modern-shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Vendas com Cheques</h2>
          <p className="text-slate-600">Vendas que possuem cheques gerados</p>
        </div>
        
        {salesWithChecks.length > 0 ? (
          <div className="space-y-4">
            {salesWithChecks.map(sale => (
              <div key={sale.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div 
                  className="p-6 bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 cursor-pointer transition-modern"
                  onClick={() => toggleSaleExpansion(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="p-2 rounded-lg bg-blue-600 text-white modern-shadow">
                        {expandedSales.has(sale.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{sale.client}</h3>
                        <p className="text-sm text-slate-600">
                          Data: {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                          {sale.checks.length} cheque(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                        sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sale.status === 'pago' ? 'Pago' :
                         sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedSales.has(sale.id) && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Cheques desta Venda</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Cliente</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Valor</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Vencimento</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipo</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Usado em</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.checks.map(check => (
                              <tr key={check.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm">{check.client}</td>
                                <td className="py-3 px-4 text-sm">
                                  R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  {check.installmentNumber && check.totalInstallments && (
                                    <div className="text-xs text-gray-500">
                                      Parcela {check.installmentNumber}/{check.totalInstallments}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={
                                    check.dueDate === today ? 'text-blue-600 font-medium' :
                                    check.dueDate < today ? 'text-red-600 font-medium' :
                                    'text-gray-900'
                                  }>
                                    {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(check.status)}`}>
                                      {getStatusLabel(check.status)}
                                    </span>
                                    {(check.status === 'pendente' || check.status === 'reapresentado') && (
                                      <select
                                        value={check.status}
                                        onChange={(e) => updateCheckStatus(check.id, e.target.value as Check['status'])}
                                        className="text-xs border rounded-lg px-2 py-1 bg-white modern-shadow"
                                      >
                                        <option value="pendente">Pendente</option>
                                        <option value="compensado">Compensado</option>
                                        <option value="devolvido">Devolvido</option>
                                        <option value="reapresentado">Reapresentado</option>
                                      </select>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    check.isOwnCheck ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {check.isOwnCheck ? 'Próprio' : 'Terceiros'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {check.usedFor || '-'}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setViewingCheck(check)}
                                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                                      title="Visualizar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCheck(check)}
                                      className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCheck(check.id)}
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
                      
                      {sale.observations && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                          <h5 className="font-medium text-slate-900 mb-2">Observações da Venda</h5>
                          <p className="text-sm text-slate-600">{sale.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-20 h-20 mx-auto mb-6 text-slate-300" />
            <p className="text-slate-500 mb-4 text-xl font-medium">Nenhuma venda com cheques ainda.</p>
            <p className="text-slate-400 text-sm mb-6">
              Os cheques são criados automaticamente quando você registra vendas com pagamento em cheque.
            </p>
          </div>
        )}
      </div>

      {/* Debts with Checks */}
      {debtsWithChecks.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Dívidas com Cheques</h2>
            <p className="text-slate-600">Dívidas que utilizaram cheques para pagamento</p>
          </div>
          
          <div className="space-y-4">
            {debtsWithChecks.map(debt => (
              <div key={debt.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div 
                  className="p-6 bg-gradient-to-r from-orange-50 to-transparent hover:from-orange-100 cursor-pointer transition-modern"
                  onClick={() => toggleDebtExpansion(debt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="p-2 rounded-lg bg-orange-600 text-white modern-shadow">
                        {expandedDebts.has(debt.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{debt.company}</h3>
                        <p className="text-sm text-slate-600">
                          Data: {new Date(debt.date).toLocaleDateString('pt-BR')} • 
                          {debt.checks.length} cheque(s) utilizados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">
                        R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        debt.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {debt.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDebts.has(debt.id) && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Cheques Utilizados nesta Dívida</h4>
                      <div className="space-y-3">
                        {debt.checks.map(check => (
                          <div key={check.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-slate-900">{check.client}</span>
                                <div className="text-sm text-slate-600 mt-1">
                                  Status: {getStatusLabel(check.status)}
                                  {check.status === 'compensado' && ' ✓'}
                                </div>
                                {check.installmentNumber && check.totalInstallments && (
                                  <div className="text-sm text-slate-600">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </div>
                                )}
                                <div className="text-sm text-slate-600">
                                  Usado para: {check.usedFor || 'Pagamento de dívida'}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-blue-600">
                                  R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <div className="text-sm text-slate-600">
                                  Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cheques próprios que a empresa tem para pagar */}
      {companyPayableChecks.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-orange-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-900">Cheques Próprios para Pagar</h3>
            <span className="text-orange-600 font-semibold">
              Total: R$ {totalCompanyPayableChecks.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-4">
            {companyPayableChecks.map(check => (
              <div key={check.id} className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-orange-900 text-lg">{check.client}</h4>
                    <p className="text-orange-700">{check.usedFor || 'Cheque próprio'}</p>
                    <p className="text-sm text-orange-600">
                      Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                    {check.installmentNumber && check.totalInstallments && (
                      <p className="text-sm text-orange-600">
                        Parcela: {check.installmentNumber}/{check.totalInstallments}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-orange-600">
                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('Marcar este cheque como pago?')) {
                          const updatedCheck = { ...check, status: 'compensado' as const };
                          const { updateCheck, createCashTransaction } = useApp();
                          updateCheck(updatedCheck).then(() => {
                            // Criar transação de caixa para reduzir o saldo
                            createCashTransaction({
                              date: new Date().toISOString().split('T')[0],
                              type: 'saida',
                              amount: check.value,
                              description: `Pagamento de cheque próprio - ${check.client}`,
                              category: 'cheque',
                              relatedId: check.id,
                              paymentMethod: 'cheque'
                            }).catch(error => {
                              console.error('Erro ao criar transação de caixa:', error);
                            });
                          }).catch(error => {
                            alert('Erro ao marcar como pago: ' + error.message);
                          });
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
                    >
                      Marcar como Pago
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Status:</strong> {getStatusLabel(check.status)}</p>
                    <p><strong>Tipo:</strong> Cheque Próprio</p>
                    {check.observations && (
                      <p><strong>Observações:</strong> {check.observations}</p>
                    )}
                  </div>
                  <div>
                    {check.discountDate && (
                      <p><strong>Data de Desconto:</strong> {new Date(check.discountDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    {check.usedInDebt && (
                      <p><strong>Usado em Dívida:</strong> Sim</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check Form Modal */}
      {(isFormOpen || editingCheck) && (
        <CheckForm
          check={editingCheck}
          onSubmit={editingCheck ? handleEditCheck : handleAddCheck}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCheck(null);
          }}
        />
      )}

      {/* View Check Modal */}
      {viewingCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes do Cheque</h2>
                </div>
                <button
                  onClick={() => setViewingCheck(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingCheck.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-slate-900 font-bold text-emerald-600">
                    R$ {viewingCheck.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(viewingCheck.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingCheck.status)}`}>
                    {getStatusLabel(viewingCheck.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Parcela</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {viewingCheck.installmentNumber} de {viewingCheck.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="form-label">Tipo</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    viewingCheck.isOwnCheck ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingCheck.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}
                  </span>
                </div>
                <div>
                  <label className="form-label">Utilizado em</label>
                  <p className="text-sm text-slate-900">{viewingCheck.usedFor || 'Não especificado'}</p>
                </div>
              </div>

              {viewingCheck.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingCheck.observations}
                  </p>
                </div>
              )}

              {viewingCheck.usedInDebt && (
                <div className="mb-8">
                  <label className="form-label">Usado em Dívida</label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 font-medium">
                      ✓ Este cheque foi usado para pagamento de dívida
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      ID da Dívida: {viewingCheck.usedInDebt}
                    </p>
                    {viewingCheck.discountDate && (
                      <p className="text-blue-600 text-sm">
                        Data de Desconto: {new Date(viewingCheck.discountDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(viewingCheck.frontImage || viewingCheck.backImage) && (
                <div className="mb-8">
                  <h3 className="font-medium text-slate-900 mb-4">Imagens do Cheque</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingCheck.frontImage && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Frente</p>
                        <div className="relative group">
                          <img
                            src={getCheckImageUrl(viewingCheck.frontImage)}
                            alt="Frente do cheque"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem da frente:', viewingCheck.frontImage);
                              const target = e.target as HTMLImageElement;
                              target.src = '/logo-fallback.svg';
                              target.className = 'w-full h-48 object-contain rounded-lg border border-gray-200 shadow-sm bg-gray-100';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => window.open(getCheckImageUrl(viewingCheck.frontImage), '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Ver em tamanho real
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {viewingCheck.backImage && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Verso</p>
                        <div className="relative group">
                          <img
                            src={getCheckImageUrl(viewingCheck.backImage)}
                            alt="Verso do cheque"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem do verso:', viewingCheck.backImage);
                              const target = e.target as HTMLImageElement;
                              target.src = '/logo-fallback.svg';
                              target.className = 'w-full h-48 object-contain rounded-lg border border-gray-200 shadow-sm bg-gray-100';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => window.open(getCheckImageUrl(viewingCheck.backImage), '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Ver em tamanho real
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingCheck(null)}
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