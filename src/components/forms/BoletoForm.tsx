import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Boleto } from '../../types';
import { useApp } from '../../context/AppContext';

interface BoletoFormProps {
  boleto?: Boleto | null;
  onSubmit: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function BoletoForm({ boleto, onSubmit, onCancel }: BoletoFormProps) {
  const { sales } = useApp();
  const [formData, setFormData] = useState({
    saleId: boleto?.saleId || '',
    client: boleto?.client || '',
    value: boleto?.value || 0,
    dueDate: boleto?.dueDate || new Date().toISOString().split('T')[0],
    status: boleto?.status || 'pendente' as const,
    installmentNumber: boleto?.installmentNumber || 1,
    totalInstallments: boleto?.totalInstallments || 1,
    observations: boleto?.observations || '',
    boletoFile: boleto?.boletoFile || '',
    overdueAction: boleto?.overdueAction || '',
    interestAmount: boleto?.interestAmount || 0,
    penaltyAmount: boleto?.penaltyAmount || 0,
    notaryCosts: boleto?.notaryCosts || 0,
    finalAmount: boleto?.finalAmount || 0,
    overdueNotes: boleto?.overdueNotes || '',
    overdueAction: boleto?.overdueAction || null
  });

  const handleSaleSelection = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setFormData(prev => ({
        ...prev,
        saleId,
        client: sale.client,
        value: sale.pendingAmount > 0 ? sale.pendingAmount : sale.totalValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        saleId: '',
        client: prev.client,
        value: prev.value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as Omit<Boleto, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {boleto ? 'Editar Boleto' : 'Novo Boleto'}
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
                  <option value="">Boleto manual (sem venda associada)</option>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Boleto['status'] }))}
                  className="input-field"
                >
                  <option value="pendente">Pendente</option>
                  <option value="compensado">Compensado</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="nao_pago">Não Pago</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Número da Parcela *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.installmentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, installmentNumber: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total de Parcelas *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalInstallments: parseInt(e.target.value) || 1 }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={4}
                  placeholder="Observações sobre o boleto..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary group">
                {boleto ? 'Atualizar' : 'Criar'} Boleto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}