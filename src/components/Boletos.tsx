import React, { useState } from 'react';
import { Eye, Upload, Calendar, AlertTriangle, CheckCircle, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Boleto } from '../types';

export function Boletos() {
  const { state, dispatch } = useApp();
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [uploadingBoleto, setUploadingBoleto] = useState<Boleto | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.boletos.filter(boleto => boleto.dueDate === today);
  const overdue = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');

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
      // In a real app, you'd upload to a server
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
      case 'pago': return 'bg-green-100 text-green-700';
      case 'vencido': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-green-500 shadow-lg">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boletos</h1>
            <p className="text-gray-600">Gerados automaticamente das vendas parceladas</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Vencimentos Hoje</h3>
                  <p className="text-blue-700">{dueToday.length} boleto(s)</p>
                  <p className="text-sm text-blue-600">
                    Total: R$ {dueToday.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Vencidos</h3>
                  <p className="text-red-700">{overdue.length} boleto(s)</p>
                  <p className="text-sm text-red-600">
                    Total: R$ {overdue.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Boletos List */}
      <div className="card">
        <div>
          {state.boletos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Cliente</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Valor</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Vencimento</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Parcela</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Arquivo</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {state.boletos.map(boleto => (
                    <tr key={boleto.id} className="border-b border-gray-100 hover:bg-green-50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-medium">{boleto.client}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-green-600">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(boleto.status)}`}>
                            {getStatusLabel(boleto.status)}
                          </span>
                          {canEdit && boleto.status === 'pendente' && (
                            <select
                              value={boleto.status}
                              onChange={(e) => updateBoletoStatus(boleto.id, e.target.value as Boleto['status'])}
                              className="text-xs border rounded px-2 py-1 bg-white"
                            >
                              <option value="pendente">Pendente</option>
                              <option value="pago">Pago</option>
                              <option value="vencido">Vencido</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                          {boleto.installmentNumber}/{boleto.totalInstallments}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {boleto.boletoFile ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                            ✓ Anexado
                          </span>
                        ) : (
                          <button
                            onClick={() => setUploadingBoleto(boleto)}
                            className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors font-medium"
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
                          {!boleto.boletoFile && (
                            <button
                              onClick={() => setUploadingBoleto(boleto)}
                              className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50 transition-all duration-200"
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
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2 text-lg">Nenhum boleto gerado ainda.</p>
              <p className="text-gray-400 text-sm">
                Os boletos são criados automaticamente quando você registra vendas parceladas no boleto.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Boleto Modal */}
      {viewingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-green-500 shadow-lg">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Boleto</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-gray-900 font-medium">{viewingBoleto.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-gray-900 font-semibold text-green-600">
                    R$ {viewingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingBoleto.status)}`}>
                    {getStatusLabel(viewingBoleto.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Parcela</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {viewingBoleto.installmentNumber} de {viewingBoleto.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="form-label">Arquivo</label>
                  {viewingBoleto.boletoFile ? (
                    <p className="text-sm text-green-600 font-medium">✓ Boleto anexado</p>
                  ) : (
                    <p className="text-sm text-yellow-600 font-medium">⚠️ Aguardando anexo</p>
                  )}
                </div>
              </div>

              {viewingBoleto.observations && (
                <div className="mb-6">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-gray-900 p-4 bg-gray-50 rounded-xl">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-green-500 shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Anexar Boleto</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Cliente:</strong> {uploadingBoleto.client}<br />
                  <strong>Valor:</strong> R$ {uploadingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br />
                  <strong>Parcela:</strong> {uploadingBoleto.installmentNumber}/{uploadingBoleto.totalInstallments}
                </p>
                
                <div className="border-2 border-dashed border-yellow-300 rounded-xl p-8 text-center hover:border-yellow-400 transition-colors bg-gradient-to-br from-yellow-50 to-green-50">
                  <Upload className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                  <p className="text-sm text-gray-700 mb-2 font-medium">
                    Clique para selecionar o arquivo do boleto
                  </p>
                  <p className="text-xs text-gray-500">
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