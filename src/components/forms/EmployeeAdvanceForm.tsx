import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EmployeeAdvance } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface EmployeeAdvanceFormProps {
  advance?: EmployeeAdvance | null;
  onSubmit: (advance: Omit<EmployeeAdvance, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'desconto_folha', label: 'Desconto em Folha' }
];

export function EmployeeAdvanceForm({ advance, onSubmit, onCancel }: EmployeeAdvanceFormProps) {
  const { employees } = useAppContext();
  const [formData, setFormData] = useState({
    employeeId: advance?.employeeId || '',
    amount: advance?.amount || 0,
    date: advance?.date || new Date().toISOString().split('T')[0],
    description: advance?.description || '',
    paymentMethod: advance?.paymentMethod || 'dinheiro',
    status: advance?.status || 'pendente'
  });

  const activeEmployees = employees.filter(emp => emp.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || formData.employeeId.trim() === '') {
      alert('Por favor, selecione um funcionário.');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      alert('O valor do adiantamento deve ser maior que zero.');
      return;
    }
    
    if (!formData.description || !formData.description.trim()) {
      alert('Por favor, informe a descrição do adiantamento.');
      return;
    }
    
    // Clean UUID fields - ensure employeeId is valid
    const cleanedData = {
      ...formData,
      employeeId: !formData.employeeId || formData.employeeId.trim() === '' ? null : formData.employeeId,
      description: formData.description.trim()
    };
    
    // Validate that employeeId is not null after cleaning
    if (!cleanedData.employeeId) {
      alert('Por favor, selecione um funcionário válido.');
      return;
    }
    
    console.log('📝 Enviando adiantamento:', cleanedData);
    onSubmit(cleanedData as Omit<EmployeeAdvance, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {advance ? 'Editar Adiantamento' : 'Novo Adiantamento'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Funcionário *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Selecionar funcionário...</option>
                  {activeEmployees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
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
                <label className="form-label">Método de Pagamento *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="input-field"
                  required
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
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
                {advance ? 'Atualizar Adiantamento' : 'Criar Adiantamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}