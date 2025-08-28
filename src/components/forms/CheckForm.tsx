import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Check } from '../../types';
import { useApp } from '../../context/AppContext';
import { ImageUpload } from '../ImageUpload';

interface CheckFormProps {
  check?: Check | null;
  onSubmit: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function CheckForm({ check, onSubmit, onCancel }: CheckFormProps) {
  const { sales, checks } = useApp();
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
    installmentNumber: check?.installmentNumber || 1,
    totalInstallments: check?.totalInstallments || 1,
    frontImage: check?.frontImage || '',
    backImage: check?.backImage || '',
    selectedAvailableChecks: check?.selectedAvailableChecks || [],
    usedInDebt: check?.usedInDebt || '',
    discountDate: check?.discountDate || '',
    isCompanyPayable: check?.isCompanyPayable || false,
    companyName: check?.companyName || '',
    paymentDate: check?.paymentDate || ''
  });

  // Get available checks that are not already used
  const availableChecks = checks.filter(existingCheck => 
    existingCheck.id !== check?.id && // Don't include the current check being edited
    existingCheck.status === 'pendente' &&
    !existingCheck.usedFor?.includes('Usado para pagamento') &&
    !existingCheck.observations?.includes('Usado para pagamento')
  );

  const handleSaleSelection = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {check ? 'Editar Cheque' : 'Adicionar Cheque'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group md:col-span-2">
                <label className="form-label">Venda Associada (Opcional)</label>
                <select
                  value={formData.saleId}
                  onChange={(e) => handleSaleSelection(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecionar venda...</option>
                  {sales.map(sale => (
                    <option key={sale.id} value={sale.id}>
                      {sale.client} - R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      ({new Date(sale.date).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
                {formData.saleId && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
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

              <div className="form-group">
                <label className="form-label">Número da Parcela</label>
                <input
                  type="number"
                  min="1"
                  value={formData.installmentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, installmentNumber: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isOwnCheck}
                    onChange={(e) => setFormData(prev => ({ ...prev, isOwnCheck: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Cheque Próprio</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.isCompanyPayable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCompanyPayable: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Cheque que a empresa deve pagar</span>
                </label>
              </div>

              {formData.isCompanyPayable && (
                <div className="form-group">
                  <label className="form-label">Nome da Empresa/Fornecedor *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="input-field"
                    placeholder="Nome da empresa que deve receber o pagamento"
                    required={formData.isCompanyPayable}
                  />
                </div>
              )}

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
              <div className="form-group md:col-span-2 relative">
                <ImageUpload
                  checkId={check?.id || `temp-${Date.now()}`}
                  imageType="front"
                  currentImage={formData.frontImage}
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, frontImage: imageUrl }))}
                  onImageDeleted={() => setFormData(prev => ({ ...prev, frontImage: '' }))}
                  label="Imagem da Frente do Cheque"
                />
              </div>

              <div className="form-group md:col-span-2 relative">
                <ImageUpload
                  checkId={check?.id || `temp-${Date.now()}`}
                  imageType="back"
                  currentImage={formData.backImage}
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, backImage: imageUrl }))}
                  onImageDeleted={() => setFormData(prev => ({ ...prev, backImage: '' }))}
                  label="Imagem do Verso do Cheque"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
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