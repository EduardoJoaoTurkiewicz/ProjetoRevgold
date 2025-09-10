import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EmployeeOvertime } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface EmployeeOvertimeFormProps {
  employeeId?: string;
  employeeName?: string;
  onSubmit: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function EmployeeOvertimeForm({ employeeId, employeeName, onSubmit, onCancel }: EmployeeOvertimeFormProps) {
  const { employees } = useAppContext();
  const [formData, setFormData] = useState({
    employeeId: employeeId || '',
    hours: 0,
    hourlyRate: 0,
    totalAmount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pendente' as const
  });

  const activeEmployees = employees.filter(emp => emp.isActive);

  // Auto-calculate total amount when hours or hourly rate changes
  React.useEffect(() => {
    const total = formData.hours * formData.hourlyRate;
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.hours, formData.hourlyRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId || formData.employeeId.trim() === '') {
      alert('Por favor, selecione um funcionário.');
      return;
    }
    
    if (!formData.hours || formData.hours <= 0) {
      alert('O número de horas deve ser maior que zero.');
      return;
    }
    
    if (!formData.hourlyRate || formData.hourlyRate <= 0) {
      alert('O valor por hora deve ser maior que zero.');
      return;
    }
    
    if (!formData.description || !formData.description.trim()) {
      alert('Por favor, informe a descrição das horas extras.');
      return;
    }
    
    // Clean UUID fields - ensure employeeId is valid
    const cleanedData = {
      ...formData,
      employeeId: cleanUUIDField(formData.employeeId),
      description: formData.description.trim()
    };
    
    // Helper function to clean UUID fields
    function cleanUUIDField(value: any): string | null {
      if (!value) return null;
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
      return trimmed;
    }
    
    // Validate that employeeId is not null after cleaning
    if (!cleanedData.employeeId) {
      alert('Por favor, selecione um funcionário válido.');
      return;
    }
    
    console.log('📝 Enviando hora extra:', cleanedData);
    onSubmit(cleanedData as Omit<EmployeeOvertime, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Nova Hora Extra
              {employeeName && (
                <span className="text-lg font-normal text-slate-600 block">
                  para {employeeName}
                </span>
              )}
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
                  disabled={!!employeeId}
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
                <label className="form-label">Horas Trabalhadas *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor por Hora *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Valor Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  className="input-field bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-blue-600 mt-1 font-bold">
                  ✓ Calculado automaticamente: {formData.hours} horas × R$ {formData.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descrição das horas extras trabalhadas..."
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
                Criar Hora Extra
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}