import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Debt } from '../types';
import { DebtForm } from './forms/DebtForm';

export function Debts() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [viewingDebt, setViewingDebt] = useState<Debt | null>(null);

  const handleAddDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debt,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_DEBT', payload: newDebt });
    
    // Create installments if needed
    debt.paymentMethods.forEach(method => {
      if (method.installments && method.installments > 1) {
        for (let i = 0; i < method.installments; i++) {
          const dueDate = new Date(method.startDate || debt.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const installment = {
            id: `${newDebt.id}-${i}`,
            debtId: newDebt.id,
            amount: method.installmentValue || 0,
            dueDate: dueDate.toISOString().split('T')[0],
            isPaid: debt.isPaid && i === 0, // First installment paid if debt is paid
            type: 'divida' as const,
            description: `${debt.description} - Parcela ${i + 1}/${method.installments}`
          };
          
          dispatch({ type: 'ADD_INSTALLMENT', payload: installment });
        }
      }
    });
    
    setIsFormOpen(false);
  };

  const handleEditDebt = (debt: Omit<Debt, 'id' | 'createdAt'>) => {
    if (editingDebt) {
      const updatedDebt: Debt = {
        ...debt,
        id: editingDebt.id,
        createdAt: editingDebt.createdAt
      };
      dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
      setEditingDebt(null);
    }
  };

  const handleDeleteDebt = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta dívida?')) {
      dispatch({ type: 'DELETE_DEBT', payload: id });
    }
  };

  const canEdit = true;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dívidas e Gastos</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary group flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Dívida
        </button>
      </div>

      {/* Debts List */}
      <div className="card">
        {state.debts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Valor Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pago</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pendente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.debts.map(debt => (
                  <tr key={debt.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(debt.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm">{debt.description}</td>
                    <td className="py-3 px-4 text-sm">{debt.company}</td>
                    <td className="py-3 px-4 text-sm">
                      R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600">
                      R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-red-600">
                      R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        debt.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {debt.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingDebt(debt)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDebt(debt)}
                          className="text-green-600 hover:text-green-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="text-red-600 hover:text-red-800"
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
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhuma dívida registrada ainda.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Detalhes da Dívida</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingDebt.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    viewingDebt.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {viewingDebt.isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Descrição</label>
                  <p className="text-sm text-gray-900">{viewingDebt.description}</p>
                </div>
                <div>
                  <label className="form-label">Empresa/Fornecedor</label>
                  <p className="text-sm text-gray-900">{viewingDebt.company}</p>
                </div>
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-sm text-gray-900">
                    R$ {viewingDebt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pago</label>
                  <p className="text-sm text-green-600">
                    R$ {viewingDebt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Métodos de Pagamento</h3>
                <div className="space-y-2">
                  {viewingDebt.paymentMethods.map((method, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                        <span>R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {method.installments && method.installments > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          <button
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingDebt.checksUsed && viewingDebt.checksUsed.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Cheques Utilizados</h3>
                  <div className="space-y-2">
                    {viewingDebt.checksUsed.map((checkId, index) => {
                      const check = state.checks.find(c => c.id === checkId);
                      return (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          {check ? (
                            <div className="flex justify-between">
                              <div>
                                <span className="font-medium">{check.client}</span>
                                <div className="text-sm text-gray-600">
                                  Status: {check.status === 'compensado' ? 'Compensado ✓' : check.status}
                                </div>
                                {check.installmentNumber && check.totalInstallments && (
                                  <div className="text-sm text-gray-600">
                                    Parcela {check.installmentNumber}/{check.totalInstallments}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-medium">R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <div className="text-sm text-gray-600">
                                  Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Cheque não encontrado</span>
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
    </div>
  );
}