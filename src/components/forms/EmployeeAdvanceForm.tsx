import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EmployeeAdvance } from '../../types';

interface EmployeeAdvanceFormProps {
  employeeId: string;
  employeeName: string;
  advance?: EmployeeAdvance | null;
  onSubmit: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function EmployeeAdvanceForm({ employeeId, employeeName, advance, onSubmit, onCancel }: EmployeeAdvanceFormProps) {
  const [formData, setFormData] = useState({
    employeeId,
    amount: advance?.amount || 0,
    date: advance?.date || new Date().toISOString().split('T')[0],
    description: advance?.description || '',
    paymentMethod: advance?.paymentMethod || 'dinheiro' as const,
    status: advance?.status || 'pendente' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {advance ? 'Editar Adiantamento' : 'Novo Adiantamento'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Funcionário</h3>
            <p className="text-blue-700 font-semibold">{employeeName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Valor do Adiantamento *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as EmployeeAdvance['paymentMethod'] }))}
                  className="input-field"
                  required
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="desconto_folha">Desconto em Folha</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EmployeeAdvance['status'] }))}
                  className="input-field"
                >
                  <option value="pendente">Pendente</option>
                  <option value="descontado">Descontado</option>
                </select>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Motivo do adiantamento..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {advance ? 'Atualizar' : 'Registrar'} Adiantamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}