import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Employee } from '../../types';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    position: employee?.position || '',
    salary: employee?.salary || 0,
    paymentDay: employee?.paymentDay || 5,
    isActive: employee?.isActive ?? true,
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    observations: employee?.observations || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do funcionário"
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
                  placeholder="Ex: Vendedor, Gerente, Auxiliar"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Salário *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor base do salário. Pode ser editado no momento do pagamento para incluir comissões e horas extras.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Dia do Pagamento *</label>
                <select
                  value={formData.paymentDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDay: parseInt(e.target.value) }))}
                  className="input-field"
                  required
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Dia {day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Data de Contratação *</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                  className="input-field"
                  required
                />
                  <p className="text-xs text-gray-500 mt-1">
                    Dia do mês em que o funcionário deve receber o salário
                  <p className="text-xs text-gray-500 mt-1">
                    Desmarque se o funcionário não estiver mais trabalhando na empresa
                  </p>
                  </p>
              </div>

              <div className="form-group">
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
                  placeholder="Informações adicionais sobre o funcionário..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
              <button type="submit" className="btn-primary group">
                {employee ? 'Atualizar' : 'Cadastrar'} Funcionário
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}