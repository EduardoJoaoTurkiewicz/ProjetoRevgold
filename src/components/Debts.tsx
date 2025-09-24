import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, CreditCard, FileText, AlertCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Debt } from '../types';
import { DebtForm } from './forms/DebtForm';
import { DeduplicationService } from '../lib/deduplicationService';
import { UUIDManager } from '../lib/uuidManager';

export function Debts() {
  const { debts, checks, isLoading, error, createDebt, updateDebt, deleteDebt } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [viewingDebt, setViewingDebt] = useState<Debt | null>(null);

  // Ensure debts data is deduplicated in the UI
  const deduplicatedDebts = React.useMemo(() => {
    return DeduplicationService.removeDuplicatesById(debts || []);
  }, [debts]);
  const handleAddDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando nova dívida:', debt);
    
    // Clean UUID fields before submission
    const cleanedDebt = UUIDManager.cleanObjectUUIDs(debt);
    
    // Verificar se há método de pagamento "acerto"
    const hasAcertoPayment = cleanedDebt.paymentMethods?.some(method => method.type === 'acerto');
    
    // Validate debt data before submitting
    if (!cleanedDebt.company || !cleanedDebt.company.trim()) {
      alert('Por favor, informe o nome da empresa/fornecedor.');
      return;
    }
    
    if (!cleanedDebt.description || !cleanedDebt.description.trim()) {
      alert('Por favor, informe a descrição da dívida.');
      return;
    }
    
    if (cleanedDebt.totalValue <= 0) {
      alert('O valor total da dívida deve ser maior que zero.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    if (cleanedDebt.paymentMethods && cleanedDebt.paymentMethods.length > 0) {
      for (const method of cleanedDebt.paymentMethods) {
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
    
    createDebt(cleanedDebt).then(() => {
      console.log('✅ Dívida adicionada com sucesso');
      
      // Se há pagamento por acerto, criar acerto automaticamente
      if (hasAcertoPayment) {
        createAcertoFromDebt(cleanedDebt);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Dívidas</h1>
            <p className="text-slate-600 text-lg">Controle completo de despesas e pagamentos</p>
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
      <div className="space-y-6">
        {deduplicatedDebts.length > 0 ? (
          deduplicatedDebts.map((debt) => {
            // Additional safety check for duplicates in render
            if (!debt.id || !UUIDManager.isValidUUID(debt.id)) {
              console.warn('⚠️ Invalid debt ID detected in render:', debt.id);
              return null;
            }
            
            return (
            <div key={debt.id} className="card modern-shadow-xl">
              {/* Debt Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-600">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{debt.company}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {new Date(debt.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-3xl font-black text-red-600">
                    R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                    debt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {debt.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-2">Descrição</h4>
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <p className="text-slate-700">{debt.description}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-4">Métodos de Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(debt.paymentMethods || []).map((method, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          method.type === 'dinheiro' ? 'bg-green-100 text-green-800 border-green-200' :
                          method.type === 'pix' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          method.type === 'cartao_credito' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          method.type === 'cartao_debito' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          method.type === 'cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          method.type === 'boleto' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {method.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xl font-black text-red-600">
                          R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {method.installments && method.installments > 1 && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-red-700">Parcelas:</span>
                            <span className="font-bold text-red-800">
                              {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {method.installmentInterval && (
                            <div className="flex justify-between">
                              <span className="text-red-700">Intervalo:</span>
                              <span className="font-bold text-red-800">{method.installmentInterval} dias</span>
                            </div>
                          )}
                          {method.firstInstallmentDate && (
                            <div className="flex justify-between">
                              <span className="text-red-700">Primeira parcela:</span>
                              <span className="font-bold text-red-800">
                                {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-4">Resumo Financeiro</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-red-600 font-semibold">Total</p>
                    <p className="text-2xl font-black text-red-700">
                      R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-green-600 font-semibold">Pago</p>
                    <p className="text-2xl font-black text-green-700">
                      R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-orange-600 font-semibold">Pendente</p>
                    <p className="text-2xl font-black text-orange-700">
                      R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {debt.paymentDescription && (
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-2">Observações do Pagamento</h4>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-red-700">{debt.paymentDescription}</p>
                  </div>
                </div>
              )}

              {debt.debtPaymentDescription && (
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-2">Descrição da Dívida</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700">{debt.debtPaymentDescription}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setViewingDebt(debt)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                  title="Visualizar Detalhes Completos"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingDebt(debt)}
                  className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteDebt(debt.id)}
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
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 modern-shadow-xl">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Detalhes Completos da Dívida</h2>
                    <p className="text-slate-600">{viewingDebt.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingDebt(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Empresa:</strong> {viewingDebt.company}</p>
                      <p><strong>Data:</strong> {new Date(viewingDebt.date).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${
                          viewingDebt.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {viewingDebt.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">Valores</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total:</strong> R$ {viewingDebt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p><strong>Pago:</strong> <span className="text-green-600 font-bold">R$ {viewingDebt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      <p><strong>Pendente:</strong> <span className="text-orange-600 font-bold">R$ {viewingDebt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID:</strong> <span className="font-mono text-xs">{viewingDebt.id}</span></p>
                      <p><strong>Criado:</strong> {new Date(viewingDebt.createdAt).toLocaleString('pt-BR')}</p>
                      {viewingDebt.updatedAt && (
                        <p><strong>Atualizado:</strong> {new Date(viewingDebt.updatedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4">Descrição da Dívida</h4>
                  <p className="text-slate-700 text-lg">{viewingDebt.description}</p>
                </div>

                {/* Payment Methods Detailed */}
                <div className="p-6 bg-red-50 rounded-2xl border border-red-200">
                  <h4 className="font-bold text-red-900 mb-4">Métodos de Pagamento Detalhados</h4>
                  <div className="space-y-4">
                    {(viewingDebt.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                            method.type === 'dinheiro' ? 'bg-green-100 text-green-800 border-green-200' :
                            method.type === 'pix' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            method.type === 'cartao_credito' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            method.type === 'cartao_debito' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            method.type === 'cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            method.type === 'boleto' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-2xl font-black text-red-600">
                            R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p><strong className="text-red-800">Parcelas:</strong> {method.installments}x</p>
                              <p><strong className="text-red-800">Valor por parcela:</strong> R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <p><strong className="text-red-800">Intervalo:</strong> {method.installmentInterval} dias</p>
                              {method.firstInstallmentDate && (
                                <p><strong className="text-red-800">Primeira parcela:</strong> {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Observations */}
                {(viewingDebt.paymentDescription || viewingDebt.debtPaymentDescription) && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Todas as Observações</h4>
                    <div className="space-y-4">
                      {viewingDebt.paymentDescription && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Descrição do Pagamento:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingDebt.paymentDescription}</p>
                        </div>
                      )}
                      {viewingDebt.debtPaymentDescription && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Descrição da Dívida:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingDebt.debtPaymentDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
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
    </div>
  );
}