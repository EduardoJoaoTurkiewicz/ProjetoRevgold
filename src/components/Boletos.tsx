import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, AlertCircle, X, Clock, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Boleto } from '../types';
import { BoletoForm } from './forms/BoletoForm';
import { OverdueBoletoForm } from './forms/OverdueBoletoForm';

export function Boletos() {
  const { state, createBoleto, updateBoleto, deleteBoleto } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [managingOverdueBoleto, setManagingOverdueBoleto] = useState<Boleto | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.boletos.filter(boleto => boleto.dueDate === today);
  const overdue = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
  const overdueManaged = state.boletos.filter(boleto => boleto.dueDate < today && boleto.overdueAction);
  
  // Novos cálculos para widgets
  const notDueYet = state.boletos.filter(boleto => boleto.dueDate > today && boleto.status === 'pendente');
  const totalNotDueYet = notDueYet.reduce((sum, boleto) => sum + boleto.value, 0);
  
  // Boletos que a empresa tem para pagar (simulando - você pode ajustar conforme sua lógica de negócio)
  const companyPayableBoletos = state.debts.filter(debt => 
    debt.paymentMethods.some(method => method.type === 'boleto') && !debt.isPaid
  );
  const totalCompanyPayableBoletos = companyPayableBoletos.reduce((sum, debt) => {
    return sum + debt.paymentMethods
      .filter(method => method.type === 'boleto')
      .reduce((methodSum, method) => methodSum + method.amount, 0);
  }, 0);

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

  const handleOverdueAction = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (managingOverdueBoleto) {
      const updatedBoleto: Boleto = {
        ...boleto,
        id: managingOverdueBoleto.id,
        createdAt: managingOverdueBoleto.createdAt
      };
      updateBoleto(updatedBoleto).then(() => {
        setManagingOverdueBoleto(null);
      }).catch(error => {
        alert('Erro ao atualizar boleto vencido: ' + error.message);
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
      let updatedBoleto = { ...boleto, status };
      
      // Se o boleto foi marcado como compensado, atualizar o caixa
      if (status === 'compensado' && boleto.status !== 'compensado') {
        // Calcular valor líquido recebido (valor final menos custos de cartório)
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        
        // Criar transação de entrada no caixa para o valor líquido
        if (netReceived > 0) {
          const { createCashTransaction } = useApp();
          createCashTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'entrada',
            amount: netReceived,
            description: `Boleto pago - ${boleto.client}${boleto.overdueAction ? ` (${getOverdueActionLabel(boleto.overdueAction)})` : ''}`,
            category: 'boleto',
            relatedId: boleto.id,
            paymentMethod: 'boleto'
          }).catch(error => {
            console.error('Erro ao criar transação de caixa para boleto:', error);
          });
        }
        
        // Se houve custos de cartório, criar transação de saída
        if (notaryCosts > 0) {
          createCashTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'saida',
            amount: notaryCosts,
            description: `Custos de cartório - Boleto ${boleto.client}`,
            category: 'outro',
            relatedId: boleto.id,
            paymentMethod: 'outros'
          }).catch(error => {
            console.error('Erro ao criar transação de custos de cartório:', error);
          });
        }
      }
      
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

  const getOverdueActionLabel = (action?: string) => {
    switch (action) {
      case 'pago_com_juros': return 'Pago com Juros';
      case 'pago_com_multa': return 'Pago com Multa';
      case 'pago_integral': return 'Pago Integral';
      case 'protestado': return 'Protestado';
      case 'negativado': return 'Negativado';
      case 'acordo_realizado': return 'Acordo Realizado';
      case 'cancelado': return 'Cancelado';
      case 'perda_total': return 'Perda Total';
      default: return 'Não Definido';
    }
  };

  const getOverdueActionColor = (action?: string) => {
    switch (action) {
      case 'pago_com_juros':
      case 'pago_com_multa':
      case 'pago_integral': return 'bg-green-100 text-green-800 border-green-200';
      case 'acordo_realizado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'protestado':
      case 'negativado': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelado':
      case 'perda_total': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Boletos não vencidos */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Não Vencidos</h3>
              <p className="text-green-700 font-medium">{notDueYet.length} boleto(s)</p>
              <p className="text-sm text-green-600 font-semibold">
                Total: R$ {totalNotDueYet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Boletos para pagar */}
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Para Pagar</h3>
              <p className="text-orange-700 font-medium">{companyPayableBoletos.length} dívida(s)</p>
              <p className="text-sm text-orange-600 font-semibold">
                Total: R$ {totalCompanyPayableBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <AlertTriangle className="w-8 h-8 text-white" />
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

          {overdueManaged.length > 0 && (
            <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 text-lg">Vencidos Gerenciados</h3>
                  <p className="text-orange-700 font-medium">{overdueManaged.length} boleto(s)</p>
                  <p className="text-sm text-orange-600 font-semibold">
                    Total Final: R$ {overdueManaged.reduce((sum, boleto) => sum + (boleto.finalAmount || boleto.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

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
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Situação</th>
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
                      <div>
                        <span>R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {boleto.finalAmount && boleto.finalAmount !== boleto.value && (
                          <div className="text-xs text-green-600 font-bold">
                            Final: R$ {boleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={
                        boleto.dueDate === today ? 'text-blue-600 font-medium' :
                        boleto.dueDate < today ? 'text-red-600 font-medium' :
                        'text-gray-900'
                      }>
                        {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      {boleto.dueDate < today && (
                        <div className="text-xs text-red-500 font-bold">
                          {Math.ceil((new Date().getTime() - new Date(boleto.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias vencido
                        </div>
                      )}
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
                      {boleto.dueDate < today ? (
                        <div className="space-y-1">
                          {boleto.overdueAction ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getOverdueActionColor(boleto.overdueAction)}`}>
                              {getOverdueActionLabel(boleto.overdueAction)}
                            </span>
                          ) : (
                            <button
                              onClick={() => setManagingOverdueBoleto(boleto)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                            >
                              Gerenciar Vencimento
                            </button>
                          )}
                          {boleto.overdueAction && (
                            <button
                              onClick={() => setManagingOverdueBoleto(boleto)}
                              className="block px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              Editar Situação
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Em dia</span>
                      )}
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

      {/* Boletos que a empresa tem para pagar */}
      {companyPayableBoletos.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-orange-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-900">Boletos para Pagar</h3>
            <span className="text-orange-600 font-semibold">
              Total: R$ {totalCompanyPayableBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-4">
            {companyPayableBoletos.map(debt => (
              <div key={debt.id} className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-orange-900 text-lg">{debt.company}</h4>
                    <p className="text-orange-700">{debt.description}</p>
                    <p className="text-sm text-orange-600">
                      Data: {new Date(debt.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-orange-600">
                      R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('Marcar esta dívida como paga?')) {
                          const updatedDebt = { ...debt, isPaid: true, paidAmount: debt.totalValue, pendingAmount: 0 };
                          const { updateDebt, createCashTransaction } = useApp();
                          updateDebt(updatedDebt).then(() => {
                            // Criar transação de caixa para reduzir o saldo
                            createCashTransaction({
                              date: new Date().toISOString().split('T')[0],
                              type: 'saida',
                              amount: debt.totalValue,
                              description: `Pagamento de boleto - ${debt.company}`,
                              category: 'divida',
                              relatedId: debt.id,
                              paymentMethod: 'boleto'
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
                    <p><strong>Valor Total:</strong> R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Pago:</strong> R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Pendente:</strong> R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p><strong>Métodos de Pagamento:</strong></p>
                    {(debt.paymentMethods || []).map((method, index) => (
                      <p key={index} className="text-orange-600 font-medium">
                        • {method.type.replace('_', ' ')}: R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Overdue Boleto Management Modal */}
      {managingOverdueBoleto && (
        <OverdueBoletoForm
          boleto={managingOverdueBoleto}
          onSubmit={handleOverdueAction}
          onCancel={() => setManagingOverdueBoleto(null)}
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
                  {viewingBoleto.finalAmount && viewingBoleto.finalAmount !== viewingBoleto.value && (
                    <p className="text-sm text-green-600 font-bold">
                      Valor Final: R$ {viewingBoleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  {viewingBoleto.dueDate < today && (
                    <p className="text-sm text-red-600 font-bold">
                      {Math.ceil((new Date().getTime() - new Date(viewingBoleto.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias vencido
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingBoleto.status)}`}>
                    {getStatusLabel(viewingBoleto.status)}
                  </span>
                </div>
                {viewingBoleto.overdueAction && (
                  <div className="md:col-span-2">
                    <label className="form-label">Situação do Vencimento</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOverdueActionColor(viewingBoleto.overdueAction)}`}>
                      {getOverdueActionLabel(viewingBoleto.overdueAction)}
                    </span>
                  </div>
                )}
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

              {/* Informações de Vencimento */}
              {viewingBoleto.dueDate < today && viewingBoleto.overdueAction && (
                <div className="mb-8">
                  <label className="form-label">Detalhes do Vencimento</label>
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Ação Tomada:</strong> {getOverdueActionLabel(viewingBoleto.overdueAction)}</p>
                        {viewingBoleto.interestAmount && viewingBoleto.interestAmount > 0 && (
                          <p><strong>Juros:</strong> R$ {viewingBoleto.interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                        {viewingBoleto.penaltyAmount && viewingBoleto.penaltyAmount > 0 && (
                          <p><strong>Multa:</strong> R$ {viewingBoleto.penaltyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                      <div>
                        {viewingBoleto.notaryCosts && viewingBoleto.notaryCosts > 0 && (
                          <p><strong>Custos de Cartório:</strong> R$ {viewingBoleto.notaryCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                        {viewingBoleto.finalAmount && (
                          <p><strong>Valor Final:</strong> R$ {viewingBoleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                    </div>
                    {viewingBoleto.overdueNotes && (
                      <div className="mt-4">
                        <p><strong>Observações do Vencimento:</strong></p>
                        <p className="text-slate-700 mt-1 p-3 bg-white rounded-lg border">{viewingBoleto.overdueNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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