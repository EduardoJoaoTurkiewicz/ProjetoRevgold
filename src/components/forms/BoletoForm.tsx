import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Boleto } from '../../types';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';
import { getCurrentDateString } from '../../utils/dateUtils';

interface BoletoFormProps {
  boleto?: Boleto | null;
  onSubmit: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function BoletoForm({ boleto, onSubmit, onCancel }: BoletoFormProps) {
  const [formData, setFormData] = useState({
    saleId: boleto?.saleId || null,
    client: boleto?.client || '',
    value: boleto?.value || 0,
    dueDate: boleto?.dueDate || formatDateForInput(new Date()),
    installmentNumber: boleto?.installmentNumber || 1,
    totalInstallments: boleto?.totalInstallments || 1,
    observations: boleto?.observations || '',
    isCompanyPayable: boleto?.isCompanyPayable || false,
    companyName: boleto?.companyName || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client || !formData.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (!formData.value || formData.value <= 0) {
      alert('O valor do boleto deve ser maior que zero.');
      return;
    }
    
    // Clean UUID fields - convert empty strings to null
    const cleanedData = {
      ...formData,
      dueDate: parseInputDate(formData.dueDate),
      saleId: cleanUUIDField(formData.saleId),
      companyName: !formData.companyName || formData.companyName.trim() === '' ? null : formData.companyName
    };
    
    // Helper function to clean UUID fields
    function cleanUUIDField(value: any): string | null {
      if (!value) return null;
      if (typeof value !== 'string') return null;
      const trimmed = value.toString().trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
      return trimmed;
    }
    
    console.log('📝 Enviando boleto:', cleanedData);
    onSubmit(cleanedData as Omit<Boleto, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {boleto ? 'Editar Boleto' : 'Novo Boleto'}
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
                 onChange={(e) => setFormData(prev => ({ ...prev, dueDate: parseInputDate(e.target.value) }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número da Parcela</label>
                <input
                  type="number"
                  min="1"
                  value={formData.installmentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, installmentNumber: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                  placeholder="1"
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
                  placeholder="1"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isCompanyPayable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCompanyPayable: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Boleto a Pagar pela Empresa</span>
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
                    placeholder="Nome da empresa que pagará o boleto"
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
                  placeholder="Informações adicionais sobre o boleto (opcional)"
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
                {boleto ? 'Atualizar Boleto' : 'Criar Boleto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}