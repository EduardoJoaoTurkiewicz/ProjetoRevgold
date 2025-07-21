import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Check } from '../../types';
import { useApp } from '../../context/AppContext';

interface CheckFormProps {
  check?: Check | null;
  onSubmit: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function CheckForm({ check, onSubmit, onCancel }: CheckFormProps) {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    saleId: check?.saleId || '',
    debtId: check?.debtId || '',
    client: check?.client || '',
    value: check?.value || 0,
    dueDate: check?.dueDate || new Date().toISOString().split('T')[0],
    status: check?.status || 'pendente' as const,
    isOwnCheck: check?.isOwnCheck || false,
    observations: check?.observations || '',
    usedFor: check?.usedFor || '',
    frontImage: check?.frontImage || '',
    backImage: check?.backImage || '',
    selectedAvailableChecks: check?.selectedAvailableChecks || [],
    useOwnCheck: false
  });

  // Get available checks that are not already used
  const availableChecks = state.checks.filter(existingCheck => 
    existingCheck.id !== check?.id && // Don't include the current check being edited
    existingCheck.status === 'pendente' &&
    !existingCheck.usedFor?.includes('Usado para pagamento') &&
    !existingCheck.observations?.includes('Usado para pagamento')
  );

  const handleSaleSelection = (saleId: string) => {
    const sale = state.sales.find(s => s.id === saleId);
    if (sale) {
      setFormData(prev => ({
        ...prev,
        saleId,
        client: sale.client,
        value: sale.pendingAmount > 0 ? sale.pendingAmount : sale.totalValue,
        usedFor: `Venda - ${sale.client}`,
        dueDate: prev.dueDate // Keep the current due date
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        saleId: '',
        client: prev.client,
        value: prev.value,
        usedFor: prev.usedFor
      }));
    }
  };

  const toggleAvailableCheck = (checkId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAvailableChecks: prev.selectedAvailableChecks.includes(checkId)
        ? prev.selectedAvailableChecks.filter(id => id !== checkId)
        : [...prev.selectedAvailableChecks, checkId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit(formData as Omit<Check, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {check ? 'Editar Cheque' : 'Adicionar Cheque'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group md:col-span-2">
                <label className="form-label">Venda Associada (Opcional)</label>
                <select
                  value={formData.saleId}
                  onChange={(e) => handleSaleSelection(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecionar venda...</option>
                  {state.sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      {sale.client} - R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      ({new Date(sale.date).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
                {formData.saleId && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ✓ Dados da venda carregados automaticamente
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Vencimento *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Check['status'] }))}
                  className="input-field"
                >
                  <option value="pendente">Pendente</option>
                  <option value="compensado">Compensado</option>
                  <option value="devolvido">Devolvido</option>
                  <option value="reapresentado">Reapresentado</option>
                </select>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Utilizado em</label>
                <input
                  type="text"
                  value={formData.usedFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, usedFor: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Venda, Dívida, Pagamento específico"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Observações sobre o cheque..."
                />
              </div>

              {/* Image Upload Areas */}
              <div className="form-group">
                <label className="form-label">Imagem da Frente</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Clique para adicionar a imagem da frente
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real app, you'd upload to a server
                        setFormData(prev => ({ ...prev, frontImage: `front-${Date.now()}` }));
                      }
                    }}
                    className="hidden"
                  />
                </div>
                {formData.frontImage && (
                  <p className="text-sm text-green-600 mt-2">✓ Imagem da frente anexada</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Imagem do Verso</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Clique para adicionar a imagem do verso
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In a real app, you'd upload to a server
                        setFormData(prev => ({ ...prev, backImage: `back-${Date.now()}` }));
                      }
                    }}
                    className="hidden"
                  />
                </div>
                {formData.backImage && (
                  <p className="text-sm text-green-600 mt-2">✓ Imagem do verso anexada</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {check ? 'Atualizar' : 'Adicionar'} Cheque
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}