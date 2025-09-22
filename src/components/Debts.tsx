import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, CreditCard, FileText, AlertCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Debt } from '../types';
import { DebtForm } from './forms/DebtForm';

export function Debts() {
  const { debts, checks, isLoading, error, createDebt, updateDebt, deleteDebt } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [viewingDebt, setViewingDebt] = useState<Debt | null>(null);
  const [viewingObservations, setViewingObservations] = useState<Debt | null>(null);

  const handleAddDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando nova dívida:', debt);
    
    // Verificar se há método de pagamento "acerto"
    const hasAcertoPayment = debt.paymentMethods?.some(method => method.type === 'acerto');
    
    // Validate debt data before submitting
    if (!debt.company || !debt.company.trim()) {
      alert('Por favor, informe o nome da empresa/fornecedor.');
      return;
    }
    
    if (!debt.description || !debt.description.trim()) {
      alert('Por favor, informe a descrição da dívida.');
      return;
    }
    
    if (debt.totalValue <= 0) {
      alert('O valor total da dívida deve ser maior que zero.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    if (debt.paymentMethods && debt.paymentMethods.length > 0) {
      for (const method of debt.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          alert('Todos os métodos de pagamento devem ter um tipo válido.');
          return;
        }
        if (typeof method.amount !== 'number' || method.amount < 0) {
          alert('Todos os métodos de pagamento devem ter um valor válido.');
          return;
        }
      }
    }
    
    createDebt(debt).then(() => {
      console.log('✅ Dívida adicionada com sucesso');
      
      // Se há pagamento por acerto, criar acerto automaticamente
      if (hasAcertoPayment) {
        createAcertoFromDebt(debt);
      }
      
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar dívida:', error);
      let errorMessage = 'Erro ao criar dívida';
      
      if (error?.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('já existe')) {
          errorMessage = 'Esta dívida já existe no sistema. O sistema previne duplicatas automaticamente.';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou duplicados. Verifique as informações inseridas.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Formato de dados inválido. Verifique os valores inseridos.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Campos obrigatórios não preenchidos. Verifique todos os campos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert('Erro ao criar dívida: ' + errorMessage);
    });
  };

  // Função para criar acerto automaticamente a partir de dívida
  const createAcertoFromDebt = async (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      const acertoAmount = debt.paymentMethods
        ?.filter(method => method.type === 'acerto')
        .reduce((sum, method) => sum + method.amount, 0) || 0;
      
      if (acertoAmount > 0) {
        const newAcerto = {
          clientName: debt.company, // Usar nome da empresa como cliente
          companyName: debt.company,
          type: 'empresa' as const,
          totalAmount: acertoAmount,
          paidAmount: 0,
          pendingAmount: acertoAmount,
          status: 'pendente' as const,
          observations: `Acerto criado automaticamente para dívida: ${debt.description}`,
          relatedDebts: [] // Será preenchido após criação da dívida
        };
        
        await createAcerto(newAcerto);
        console.log('✅ Acerto criado automaticamente para empresa:', debt.company);
      }
    } catch (error) {
      console.error('❌ Erro ao criar acerto automático:', error);
    }
  };
  const handleEditDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    if (editingDebt) {
      const updatedDebt: Debt = {
        ...debt,
        id: editingDebt.id,
        createdAt: editingDebt.createdAt
      };
      updateDebt(updatedDebt).then(() => {
        setEditingDebt(null);
      }).catch(error => {
        alert('Erro ao atualizar dívida: ' + error.message);
      });
    }
  };

  const handleDeleteDebt = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.')) {
      deleteDebt(id).catch(error => {
        alert('Erro ao excluir dívida: ' + error.message);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando dívidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl floating-animation">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dívidas e Gastos</h1>
            <p className="text-slate-600 text-lg">Controle de despesas e pagamentos</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Dívida
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

      {/* Debts List */}
      <div className="card modern-shadow-xl">
        {debts.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Descrição</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Empresa</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Valor Total</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Pago</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Pendente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-red-50 to-rose-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {debts.map(debt => (
                  <tr key={debt.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-rose-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {new Date(debt.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      <div className="max-w-48 truncate">{debt.description}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{debt.company}</td>
                    <td className="py-4 px-6 text-sm font-black text-red-600">
                      R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-green-600">
                      R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-orange-600">
                      R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        debt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {debt.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingObservations(debt)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300 modern-shadow"
                          title="Ver Todas as Informações"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewingDebt(debt)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300 modern-shadow"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingDebt(debt)}
                          className="p-2 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all duration-300 modern-shadow"
                          title="Editar Dívida"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-2 rounded-lg text-green-700 hover:text-green-900 hover:bg-green-100 transition-all duration-300 modern-shadow"
                          title="Excluir Dívida"
                        >
                          <Trash2 className="w-5 h-5" />
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
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <CreditCard className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhuma dívida registrada</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando sua primeira dívida para controlar os gastos.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeira dívida
            </button>
          </div>
        )}
      </div>

      {/* Debt Form Modal */}
      {(isFormOpen || editingDebt) && (
        <DebtForm
          debt={editingDebt}
          onSubmit={editingDebt ? handleEditDebt : handleAddDebt}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingDebt(null);
          }}
        />
      )}

      {/* View Debt Modal */}
      {viewingDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 modern-shadow-xl">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes da Dívida</h2>
                </div>
                <button
                  onClick={() => setViewingDebt(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-slate-900 font-semibold">
                    {new Date(viewingDebt.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    viewingDebt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {viewingDebt.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Descrição</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingDebt.description}</p>
                </div>
                <div>
                  <label className="form-label">Empresa/Fornecedor</label>
                  <p className="text-sm text-slate-900 font-bold">{viewingDebt.company}</p>
                </div>
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-xl font-black text-red-600">
                    R$ {viewingDebt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pago</label>
                  <p className="text-sm font-bold text-green-600">
                    R$ {viewingDebt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pendente</label>
                  <p className="text-sm font-bold text-orange-600">
                    R$ {viewingDebt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-red-800 mb-4">Métodos de Pagamento</h3>
                <div className="space-y-3">
                  {(viewingDebt.paymentMethods || []).map((method, index) => (
                    <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-red-800 capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-red-600">R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {method.installments && method.installments > 1 && (
                        <div className="text-sm text-red-600 mt-2 font-semibold">
                          {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {method.installmentInterval && ` a cada ${method.installmentInterval} dias`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingDebt.checksUsed && viewingDebt.checksUsed.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Cheques Utilizados</h3>
                  <div className="space-y-3">
                    {viewingDebt.checksUsed.map((checkId, index) => {
                      const check = checks.find(c => c.id === checkId);
                      return (
                        <div key={index} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          {check ? (
                            <div className="flex justify-between">
                              <div>
                                <span className="font-bold text-blue-900">{check.client}</span>
                                <div className="text-sm text-blue-700">
                                  Status: {check.status === 'compensado' ? 'Compensado ✓' : check.status}
                                </div>
                                {check.installmentNumber && check.totalInstallments && (
                                  <div className="text-sm text-blue-700">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-blue-600">R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <div className="text-sm text-blue-700">
                                  Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Cheque não encontrado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingDebt(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Observations Modal */}
      {viewingObservations && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Todas as Informações da Dívida</h2>
                </div>
                <button
                  onClick={() => setViewingObservations(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong className="text-green-800">ID da Dívida:</strong> <span className="text-green-700 font-mono">{viewingObservations.id}</span></p>
                    <p><strong className="text-green-800">Data:</strong> <span className="text-green-700">{new Date(viewingObservations.date).toLocaleDateString('pt-BR')}</span></p>
                    <p><strong className="text-green-800">Empresa:</strong> <span className="text-green-700 font-bold">{viewingObservations.company}</span></p>
                    <p><strong className="text-green-800">Valor Total:</strong> <span className="text-green-700 font-bold">R$ {viewingObservations.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Valor Pago:</strong> <span className="text-emerald-600 font-bold">R$ {viewingObservations.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Valor Pendente:</strong> <span className="text-orange-600 font-bold">R$ {viewingObservations.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Status:</strong> <span className="text-green-700 font-bold capitalize">{viewingObservations.isPaid ? 'Pago' : 'Pendente'}</span></p>
                    <p><strong className="text-green-800">Data de Criação:</strong> <span className="text-green-700">{new Date(viewingObservations.createdAt).toLocaleString('pt-BR')}</span></p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-300">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Descrição da Dívida</h3>
                  <p className="text-green-800 font-semibold text-lg">{viewingObservations.description}</p>
                </div>

                {/* Payment Methods */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Métodos de Pagamento</h3>
                  <div className="space-y-4">
                    {(viewingObservations.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-green-800 capitalize text-lg">
                            {method.type.replace('_', ' ')}
                          </span>
                          <span className="font-black text-green-600 text-xl">
                            R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {method.installments && method.installments > 1 && (
                          <div className="text-sm text-green-600 font-semibold space-y-1">
                            <p>Parcelas: {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            {method.installmentInterval && <p>Intervalo: {method.installmentInterval} dias</p>}
                            {method.startDate && <p>Data de início: {new Date(method.startDate).toLocaleDateString('pt-BR')}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checks Used */}
                {viewingObservations.checksUsed && viewingObservations.checksUsed.length > 0 && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">Cheques Utilizados</h3>
                    <div className="space-y-3">
                      {viewingObservations.checksUsed.map((checkId, index) => {
                        const check = checks.find(c => c.id === checkId);
                        return (
                          <div key={index} className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                            {check ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p><strong className="text-blue-800">Cliente:</strong> <span className="text-blue-700 font-bold">{check.client}</span></p>
                                  <p><strong className="text-blue-800">Status:</strong> <span className="text-blue-700">{check.status === 'compensado' ? 'Compensado ✓' : check.status}</span></p>
                                  {check.installmentNumber && check.totalInstallments && (
                                    <p><strong className="text-blue-800">Parcela:</strong> <span className="text-blue-700">{check.installmentNumber}/{check.totalInstallments}</span></p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p><strong className="text-blue-800">Valor:</strong> <span className="text-blue-700 font-bold">R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                  <p><strong className="text-blue-800">Vencimento:</strong> <span className="text-blue-700">{new Date(check.dueDate).toLocaleDateString('pt-BR')}</span></p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">Cheque não encontrado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Observations */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Todas as Observações e Informações</h3>
                  <div className="space-y-4">
                    {viewingObservations.paymentDescription && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Descrição do Pagamento:</h4>
                        <p className="text-slate-700 font-medium p-4 bg-white rounded-xl border">{viewingObservations.paymentDescription}</p>
                      </div>
                    )}
                    {viewingObservations.debtPaymentDescription && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Descrição da Dívida:</h4>
                        <p className="text-slate-700 font-medium p-4 bg-white rounded-xl border">{viewingObservations.debtPaymentDescription}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Informações do Sistema:</h4>
                      <div className="text-sm text-slate-600 space-y-2 p-4 bg-white rounded-xl border">
                        <p><strong>ID da Dívida:</strong> <span className="font-mono">{viewingObservations.id}</span></p>
                        <p><strong>Data de Criação:</strong> {new Date(viewingObservations.createdAt).toLocaleString('pt-BR')}</p>
                        <p><strong>Valor Pago:</strong> R$ {viewingObservations.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Valor Pendente:</strong> R$ {viewingObservations.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {viewingObservations.checksUsed && viewingObservations.checksUsed.length > 0 && (
                          <p><strong>Cheques Utilizados:</strong> {viewingObservations.checksUsed.length} cheque(s)</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingObservations(null)}
                  className="btn-success"
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