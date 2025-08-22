import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EmployeeOvertime } from '../../types';

interface EmployeeOvertimeFormProps {
  employeeId: string;
  employeeName: string;
  overtime?: EmployeeOvertime | null;
  onSubmit: (overtime: Omit<EmployeeOvertime, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function EmployeeOvertimeForm({ employeeId, employeeName, overtime, onSubmit, onCancel }: EmployeeOvertimeFormProps) {
  const [formData, setFormData] = useState({
    employeeId,
    hours: overtime?.hours || 0,
    hourlyRate: overtime?.hourlyRate || 0,
    totalAmount: overtime?.totalAmount || 0,
    date: overtime?.date || new Date().toISOString().split('T')[0],
    description: overtime?.description || '',
    status: overtime?.status || 'pendente' as const
  });

  // Calcular valor total automaticamente
  const calculateTotal = (hours: number, rate: number) => {
    const total = hours * rate;
    setFormData(prev => ({ ...prev, totalAmount: total }));
  };

  const handleHoursChange = (hours: number) => {
    setFormData(prev => ({ ...prev, hours }));
    calculateTotal(hours, formData.hourlyRate);
  };

  const handleRateChange = (rate: number) => {
    setFormData(prev => ({ ...prev, hourlyRate: rate }));
    calculateTotal(formData.hours, rate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {overtime ? 'Editar Horas Extras' : 'Registrar Horas Extras'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
            <h3 className="text-xl font-bold text-green-900 mb-2">Funcionário</h3>
            <p className="text-green-700 font-semibold">{employeeName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Quantidade de Horas *</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
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
                  value={formData.hourlyRate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
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
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as EmployeeOvertime['status'] }))}
                  className="input-field"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descrição das horas extras realizadas..."
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Cálculo Automático</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-blue-600 font-semibold">Horas</p>
                      <p className="text-2xl font-black text-blue-800">{formData.hours}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-semibold">Valor/Hora</p>
                      <p className="text-2xl font-black text-blue-800">
                        R$ {formData.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-semibold">Total</p>
                      <p className="text-3xl font-black text-green-600">
                        R$ {formData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {overtime ? 'Atualizar' : 'Registrar'} Horas Extras
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}