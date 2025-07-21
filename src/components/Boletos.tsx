import React, { useState } from 'react';
import { Eye, Upload, Calendar, AlertTriangle, CheckCircle, Receipt, Plus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Boleto } from '../types';
import { BoletoForm } from './forms/BoletoForm';

export function Boletos() {
  const { state, dispatch } = useApp();
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [uploadingBoleto, setUploadingBoleto] = useState<Boleto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.boletos.filter(boleto => boleto.dueDate === today);
  const overdue = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');

  const handleAddBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    const newBoleto: Boleto = {
      ...boleto,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_BOLETO', payload: newBoleto });
    setIsFormOpen(false);
  };

  const handleEditBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (editingBoleto) {
      const updatedBoleto: Boleto = {
        ...boleto,
        id: editingBoleto.id,
        createdAt: editingBoleto.createdAt
      };
      dispatch({ type: 'UPDATE_BOLETO', payload: updatedBoleto });
      setEditingBoleto(null);
    }
  };

  const handleDeleteBoleto = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este boleto?')) {
      dispatch({ type: 'DELETE_BOLETO', payload: id });
    }
  };

  const updateBoletoStatus = (boletoId: string, status: Boleto['status']) => {
    const boleto = state.boletos.find(b => b.id === boletoId);
    if (boleto) {
      const updatedBoleto = { ...boleto, status };
      dispatch({ type: 'UPDATE_BOLETO', payload: updatedBoleto });
    }
  };

  const handleFileUpload = (boletoId: string, file: File) => {
    const boleto = state.boletos.find(b => b.id === boletoId);
    if (boleto) {
      const updatedBoleto = { 
        ...boleto, 
        boletoFile: `boleto-${Date.now()}-${file.name}`,
        observations: `${boleto.observations || ''}\nArquivo anexado: ${file.name}`.trim()
      };
      dispatch({ type: 'UPDATE_BOLETO', payload: updatedBoleto });
      setUploadingBoleto(null);
    }
  };

  const getStatusColor = (status: Boleto['status']) => {
    switch (status) {
      case 'pago': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getStatusLabel = (status: Boleto['status']) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'vencido': return 'Vencido';
      default: return 'Pendente';
    }
  };

  const canEdit = state.user?.role === 'admin' || state.user?.role === 'financeiro';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Boletos</h1>
            <p className="text-slate-600 text-lg">Controle completo de boletos bancários</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-xl hover:shadow-2xl"
          >
            <Plus className="w-5 h-5" />
            Novo Boleto
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-600 shadow-lg">
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
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-600 shadow-lg">
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
        </div>
      )}

      {/* Boletos List */}
      <div className="card shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lista de Boletos</h2>
          <p className="text-slate-600">Gerados automaticamente das vendas parceladas e boletos manuais</p>
        </div>
        
        {state.boletos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Vencimento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Parcela</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Arquivo</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.boletos.map(boleto => (
                  <tr key={boleto.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{boleto.client}</td>
                    <td className="py-4 px-6 text-sm font-bold text-emerald-600">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={
                        boleto.dueDate === today ? 'text-blue-600 font-bold' :
                        boleto.dueDate < today ? 'text-red-600 font-bold' :
                        'text-slate-900 font-medium'
                      }>
                        {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(boleto.status)}`}>
                          {getStatusLabel(boleto.status)}
                        </span>
                        {canEdit && boleto.status === 'pendente' && (
                          <select
                            value={boleto.status}
                            onChange={(e) => updateBoletoStatus(boleto.id, e.target.value as Boleto['status'])}
                            className="text-xs border rounded-lg px-2 py-1 bg-white shadow-sm"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="vencido">Vencido</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        {boleto.installmentNumber}/{boleto.totalInstallments}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {boleto.boletoFile ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          ✓ Anexado
                        </span>
                      ) : (
                        <button
                          onClick={() => setUploadingBoleto(boleto)}
                          className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-bold border border-amber-200"
                        >
                          Anexar
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingBoleto(boleto)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditingBoleto(boleto)}
                              className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBoleto(boleto.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!boleto.boletoFile && (
                          <button
                            onClick={() => setUploadingBoleto(boleto)}
                            className="text-amber-600 hover:text-amber-800 p-2 rounded-lg hover:bg-amber-50 transition-all duration-200"
                            title="Anexar Boleto"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Receipt className="w-20 h-20 mx-auto mb-6 text-slate-300" />
            <p className="text-slate-500 mb-4 text-xl font-medium">Nenhum boleto registrado ainda.</p>
            <p className="text-slate-400 text-sm mb-6">
              Os boletos são criados automaticamente quando você registra vendas parceladas no boleto,
              ou você pode criar boletos manuais.
            </p>
            {canEdit && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary"
              >
                Criar Primeiro Boleto
              </button>
            )}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Detalhes do Boleto</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingBoleto.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-slate-900 font-bold text-emerald-600">
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
                  <label className="form-label">Arquivo</label>
                  {viewingBoleto.boletoFile ? (
                    <p className="text-sm text-emerald-600 font-bold">✓ Boleto anexado</p>
                  ) : (
                    <p className="text-sm text-amber-600 font-bold">⚠️ Aguardando anexo</p>
                  )}
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

      {/* Upload Modal */}
      {uploadingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Anexar Boleto</h2>
              </div>
              
              <div className="mb-8">
                <p className="text-sm text-slate-600 mb-6">
                  <strong>Cliente:</strong> {uploadingBoleto.client}<br />
                  <strong>Valor:</strong> R$ {uploadingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br />
                  <strong>Parcela:</strong> {uploadingBoleto.installmentNumber}/{uploadingBoleto.totalInstallments}
                </p>
                
                <div className="border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center hover:border-amber-400 transition-colors bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                  <Upload className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <p className="text-sm text-slate-700 mb-2 font-bold">
                    Clique para selecionar o arquivo do boleto
                  </p>
                  <p className="text-xs text-slate-500">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(uploadingBoleto.id, file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setUploadingBoleto(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}