import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Acerto } from '../../types';

interface AcertoFormProps {
  acerto?: Acerto | null;
  onSubmit: (acerto: Omit<Acerto, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function AcertoForm({ acerto, onSubmit, onCancel }: AcertoFormProps) {
  const [formData, setFormData] = useState({
    clientName: acerto?.clientName || '',
    totalAmount: acerto?.totalAmount || 0,
    paidAmount: acerto?.paidAmount || 0,
    pendingAmount: acerto?.pendingAmount || 0,
    status: acerto?.status || 'pendente' as const,
    observations: acerto?.observations || ''
  });

  // Auto-calculate pending amount
  React.useEffect(() => {
    const pending = Math.max(0, formData.totalAmount - formData.paidAmount);
    const status = formData.paidAmount >= formData.totalAmount ? 'pago' : 
                  formData.paidAmount > 0 ? 'parcial' : 'pendente';
    
    setFormData(prev => ({ 
      ...prev, 
      pendingAmount: pending,
      status: status as Acerto['status']
    }));
  }, [formData.totalAmount, formData.paidAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      alert('O valor total do acerto deve ser maior que zero.');
      return;
    }
    
    if (formData.paidAmount < 0) {
      alert('O valor pago não pode ser negativo.');
      return;
    }
    
    if (formData.paidAmount > formData.totalAmount) {
      alert('O valor pago não pode ser maior que o valor total.');
      return;
    }
    
    // Clean data
    const cleanedData = {
      ...formData,
      clientName: formData.clientName.trim(),
      observations: !formData.observations || formData.observations.trim() === '' ? null : formData.observations.trim()
    };
    
    console.log('📝 Enviando acerto:', cleanedData);
    onSubmit(cleanedData as Omit<Acerto, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {acerto ? 'Editar Acerto' : 'Novo Acerto'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group md:col-span-2">
                <label className="form-label">Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do cliente"
                  required
                />
                <p className="text-xs text-indigo-600 mt-1 font-semibold">
                  💡 Este nome deve ser exatamente igual ao usado nas vendas
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total do Acerto *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Já Pago</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.totalAmount}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Pendente</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pendingAmount}
                  className="input-field bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-green-600 mt-1 font-bold">
                  ✓ Calculado automaticamente
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <input
                  type="text"
                  value={getStatusLabel(formData.status)}
                  className="input-field bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-blue-600 mt-1 font-bold">
                  ✓ Atualizado automaticamente baseado nos valores
                </p>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Observações sobre o acerto (opcional)"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-indigo-800 mb-4">Resumo do Acerto</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Total:</span>
                  <p className="text-2xl font-black text-indigo-800">
                    R$ {formData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Pago:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {formData.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Pendente:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {formData.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(formData.status)}`}>
                  Status: {getStatusLabel(formData.status)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {acerto ? 'Atualizar' : 'Criar'} Acerto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: Acerto['status']) {
  switch (status) {
    case 'pago': return 'Pago';
    case 'parcial': return 'Parcial';
    default: return 'Pendente';
  }
}