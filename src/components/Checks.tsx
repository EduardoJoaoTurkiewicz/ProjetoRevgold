import React, { useState } from 'react';
import { Plus, Edit, Eye, Upload, Calendar, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Check } from '../types';
import { CheckForm } from './forms/CheckForm';

export function Checks() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [viewingCheck, setViewingCheck] = useState<Check | null>(null);

  const handleAddCheck = (check: Omit<Check, 'id' | 'createdAt'>) => {
    const newCheck: Check = {
      ...check,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_CHECK', payload: newCheck });
    
    // Update observations for selected available checks
    if (check.selectedAvailableChecks && check.selectedAvailableChecks.length > 0) {
      check.selectedAvailableChecks.forEach(checkId => {
        const checkToUpdate = state.checks.find(c => c.id === checkId);
        if (checkToUpdate) {
          const updatedCheck = {
            ...checkToUpdate,
            observations: `${checkToUpdate.observations ? checkToUpdate.observations + '\n' : ''}Usado para pagamento de dívida: ${check.client} - ${check.usedFor || 'Pagamento'}`,
            usedFor: `${checkToUpdate.usedFor ? checkToUpdate.usedFor + ' | ' : ''}Usado para pagamento de dívida`
          };
          dispatch({ type: 'UPDATE_CHECK', payload: updatedCheck });
        }
      });
    }
    
    setIsFormOpen(false);
  };

  const handleEditCheck = (check: Omit<Check, 'id' | 'createdAt'>) => {
    if (editingCheck) {
      const updatedCheck: Check = {
        ...check,
        id: editingCheck.id,
        createdAt: editingCheck.createdAt
      };
      dispatch({ type: 'UPDATE_CHECK', payload: updatedCheck });
      
      // Update observations for selected available checks
      if (check.selectedAvailableChecks && check.selectedAvailableChecks.length > 0) {
        check.selectedAvailableChecks.forEach(checkId => {
          const checkToUpdate = state.checks.find(c => c.id === checkId);
          if (checkToUpdate && checkId !== editingCheck.id) {
            const updatedAvailableCheck = {
              ...checkToUpdate,
              observations: `${checkToUpdate.observations ? checkToUpdate.observations + '\n' : ''}Usado para pagamento de dívida: ${check.client} - ${check.usedFor || 'Pagamento'}`,
              usedFor: `${checkToUpdate.usedFor ? checkToUpdate.usedFor + ' | ' : ''}Usado para pagamento de dívida`
            };
            dispatch({ type: 'UPDATE_CHECK', payload: updatedAvailableCheck });
          }
        });
      }
      
      setEditingCheck(null);
    }
  };

  const handleDeleteCheck = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cheque?')) {
      dispatch({ type: 'DELETE_CHECK', payload: id });
    }
  };

  const updateCheckStatus = (checkId: string, status: Check['status']) => {
    const check = state.checks.find(c => c.id === checkId);
    if (check) {
      const updatedCheck = { ...check, status };
      dispatch({ type: 'UPDATE_CHECK', payload: updatedCheck });
      
      // Update related sale/debt status
      if (check.saleId) {
        const sale = state.sales.find(s => s.id === check.saleId);
        if (sale) {
          // Recalculate sale status based on check status
          const updatedSale = { ...sale };
          // This would need more complex logic for proper status calculation
          dispatch({ type: 'UPDATE_SALE', payload: updatedSale });
        }
      }
    }
  };

  const getStatusColor = (status: Check['status']) => {
    switch (status) {
      case 'compensado': return 'bg-green-100 text-green-700';
      case 'devolvido': return 'bg-red-100 text-red-700';
      case 'reapresentado': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.checks.filter(check => check.dueDate === today);
  const overdue = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');

  const canEdit = state.user?.role === 'admin' || state.user?.role === 'financeiro';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cheques</h1>
        {canEdit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Cheque
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dueToday.length > 0 && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Vencimentos Hoje</h3>
                  <p className="text-blue-700">{dueToday.length} cheque(s)</p>
                  <p className="text-sm text-blue-600">
                    Total: R$ {dueToday.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Vencidos</h3>
                  <p className="text-red-700">{overdue.length} cheque(s)</p>
                  <p className="text-sm text-red-600">
                    Total: R$ {overdue.reduce((sum, check) => sum + check.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checks List */}
      <div className="card">
        {state.checks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vencimento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Usado em</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.checks.map(check => (
                  <tr key={check.id} className="border-b hover:bg-gray-50">
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
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(check.status)}`}>
                          {getStatusLabel(check.status)}
                        </span>
                        {canEdit && check.status === 'pendente' && (
                          <select
                            value={check.status}
                            onChange={(e) => updateCheckStatus(check.id, e.target.value as Check['status'])}
                            className="text-xs border rounded px-1 py-0.5"
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
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditingCheck(check)}
                              className="text-green-600 hover:text-green-800"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCheck(check.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhum cheque registrado ainda.</p>
            {canEdit && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary"
              >
                Adicionar primeiro cheque
              </button>
            )}
          </div>
        )}
      </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Detalhes do Cheque</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-gray-900">{viewingCheck.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-gray-900">
                    R$ {viewingCheck.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {viewingCheck.installmentNumber && viewingCheck.totalInstallments && (
                      <span className="text-xs text-gray-500 block">
                        Parcela {viewingCheck.installmentNumber} de {viewingCheck.totalInstallments}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingCheck.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(viewingCheck.status)}`}>
                    {getStatusLabel(viewingCheck.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Tipo</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    viewingCheck.isOwnCheck ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {viewingCheck.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}
                  </span>
                </div>
                <div>
                  <label className="form-label">Utilizado em</label>
                  <p className="text-sm text-gray-900">{viewingCheck.usedFor || 'Não especificado'}</p>
                </div>
              </div>

              {viewingCheck.observations && (
                <div className="mb-6">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                    {viewingCheck.observations}
                  </p>
                </div>
              )}

              {viewingCheck.usedInDebt && (
                <div className="mb-6">
                  <label className="form-label">Usado em Dívida</label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Imagens do Cheque</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingCheck.frontImage && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Frente</p>
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Imagem da frente anexada</p>
                        </div>
                      </div>
                    )}
                    {viewingCheck.backImage && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Verso</p>
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Imagem do verso anexada</p>
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