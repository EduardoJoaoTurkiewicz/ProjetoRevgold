import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Employee } from '../../types';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';
import { getCurrentDateString } from '../../utils/dateUtils';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    position: employee?.position || '',
    isSeller: employee?.isSeller || false,
    salary: employee?.salary || 0,
    paymentDay: employee?.paymentDay || 5,
    nextPaymentDate: employee?.nextPaymentDate || '',
    isActive: employee?.isActive !== undefined ? employee.isActive : true,
    hireDate: employee?.hireDate || formatDateForInput(new Date()),
    observations: employee?.observations || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      alert('Por favor, informe o nome do funcionário.');
      return;
    }
    
    if (!formData.position || !formData.position.trim()) {
      alert('Por favor, informe o cargo do funcionário.');
      return;
    }
    
    if (!formData.salary || formData.salary < 0) {
      alert('O salário deve ser maior ou igual a zero.');
      return;
    }
    
    if (!formData.paymentDay || formData.paymentDay < 1 || formData.paymentDay > 31) {
      alert('O dia de pagamento deve estar entre 1 e 31.');
      return;
    }
    
    // Clean data - ensure empty strings become null for optional fields
    const cleanedData = {
      ...formData,
      hireDate: parseInputDate(formData.hireDate),
      nextPaymentDate: !formData.nextPaymentDate || formData.nextPaymentDate.trim() === '' ? null : formData.nextPaymentDate,
      observations: !formData.observations || formData.observations.trim() === '' ? null : formData.observations
    };
    
    console.log('📝 Enviando funcionário:', cleanedData);
    onSubmit(cleanedData as Omit<Employee, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cargo *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="input-field"
                  placeholder="Cargo/função"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salário *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dia de Pagamento *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDay: parseInt(e.target.value) || 5 }))}
                  className="input-field"
                  placeholder="5"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Contratação *</label>
                <input
                  type="date"
                  value={formData.hireDate}
                 onChange={(e) => setFormData(prev => ({ ...prev, hireDate: parseInputDate(e.target.value) }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Próximo Pagamento</label>
                <input
                  type="date"
                  value={formData.nextPaymentDate}
                 onChange={(e) => setFormData(prev => ({ ...prev, nextPaymentDate: parseInputDate(e.target.value) }))}
                  className="input-field"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isSeller}
                    onChange={(e) => setFormData(prev => ({ ...prev, isSeller: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">É Vendedor</span>
                </label>
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Funcionário Ativo</span>
                </label>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Informações adicionais sobre o funcionário (opcional)"
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
                {employee ? 'Atualizar Funcionário' : 'Criar Funcionário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}