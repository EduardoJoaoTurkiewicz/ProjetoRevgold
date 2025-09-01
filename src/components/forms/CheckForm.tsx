import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Check } from '../../types';

interface CheckFormProps {
  check?: Check | null;
  onSubmit: (check: Omit<Check, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function CheckForm({ check, onSubmit, onCancel }: CheckFormProps) {
  const [formData, setFormData] = useState({
    saleId: check?.saleId || null,
    debtId: check?.debtId || null,
    client: check?.client || '',
    value: check?.value || 0,
    dueDate: check?.dueDate || new Date().toISOString().split('T')[0],
    isOwnCheck: check?.isOwnCheck || false,
    observations: check?.observations || '',
    usedFor: check?.usedFor || '',
    installmentNumber: check?.installmentNumber || null,
    totalInstallments: check?.totalInstallments || null,
    isCompanyPayable: check?.isCompanyPayable || false,
    companyName: check?.companyName || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client || !formData.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (!formData.value || formData.value <= 0) {
      alert('O valor do cheque deve ser maior que zero.');
      return;
    }
    
    // Clean UUID fields - convert empty strings to null
    const cleanedData = {
      ...formData,
      saleId: !formData.saleId || formData.saleId.toString().trim() === '' ? null : formData.saleId,
      debtId: !formData.debtId || formData.debtId.toString().trim() === '' ? null : formData.debtId,
      companyName: !formData.companyName || formData.companyName.trim() === '' ? null : formData.companyName,
      installmentNumber: !formData.installmentNumber ? null : formData.installmentNumber,
      totalInstallments: !formData.totalInstallments ? null : formData.totalInstallments
    };
    
    console.log('📝 Enviando cheque:', cleanedData);
    onSubmit(cleanedData as Omit<Check, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {check ? 'Editar Cheque' : 'Novo Cheque'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  min="0"
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
                <label className="form-label">Usado Para</label>
                <input
                  type="text"
                  value={formData.usedFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, usedFor: e.target.value }))}
                  className="input-field"
                  placeholder="Finalidade do cheque"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número da Parcela</label>
                <input
                  type="number"
                  min="1"
                  value={formData.installmentNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, installmentNumber: parseInt(e.target.value) || null }))}
                  className="input-field"
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalInstallments || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: parseInt(e.target.value) || null }))}
                  className="input-field"
                  placeholder="1"
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
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isCompanyPayable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCompanyPayable: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Cheque a Pagar pela Empresa</span>
                </label>
              </div>

              {formData.isCompanyPayable && (
                <div className="form-group md:col-span-2">
                  <label className="form-label">Nome da Empresa Pagadora</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="input-field"
                    placeholder="Nome da empresa que pagará o cheque"
                  />
                </div>
              )}

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Informações adicionais sobre o cheque (opcional)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary group"
              >
                {check ? 'Atualizar Cheque' : 'Criar Cheque'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}