import React, { useState } from 'react';
import { X, Car } from 'lucide-react';
import { Permuta } from '../../types';

interface PermutaFormProps {
  permuta?: Permuta | null;
  onSubmit: (permuta: Omit<Permuta, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const VEHICLE_MAKES = [
  'Chevrolet', 'Volkswagen', 'Ford', 'Fiat', 'Toyota', 'Honda', 'Hyundai', 
  'Nissan', 'Renault', 'Peugeot', 'Citroën', 'Jeep', 'BMW', 'Mercedes-Benz', 
  'Audi', 'Volvo', 'Mitsubishi', 'Kia', 'Suzuki', 'Subaru', 'Outros'
];

const VEHICLE_COLORS = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 
  'Amarelo', 'Marrom', 'Bege', 'Dourado', 'Laranja', 'Rosa', 'Roxo', 'Outros'
];

export function PermutaForm({ permuta, onSubmit, onCancel }: PermutaFormProps) {
  const [formData, setFormData] = useState({
    clientName: permuta?.clientName || '',
    vehicleMake: permuta?.vehicleMake || '',
    vehicleModel: permuta?.vehicleModel || '',
    vehicleYear: permuta?.vehicleYear || new Date().getFullYear(),
    vehiclePlate: permuta?.vehiclePlate || '',
    vehicleChassis: permuta?.vehicleChassis || '',
    vehicleColor: permuta?.vehicleColor || '',
    vehicleMileage: permuta?.vehicleMileage || 0,
    vehicleValue: permuta?.vehicleValue || 0,
    consumedValue: permuta?.consumedValue || 0,
    remainingValue: permuta?.remainingValue || 0,
    status: permuta?.status || 'ativo' as const,
    notes: permuta?.notes || '',
    registrationDate: permuta?.registrationDate || new Date().toISOString().split('T')[0]
  });

  // Auto-calculate remaining value
  React.useEffect(() => {
    const remaining = Math.max(0, formData.vehicleValue - formData.consumedValue);
    const status = remaining <= 0 ? 'finalizado' : 'ativo';
    
    setFormData(prev => ({ 
      ...prev, 
      remainingValue: remaining,
      status: status as Permuta['status']
    }));
  }, [formData.vehicleValue, formData.consumedValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (!formData.vehicleMake || !formData.vehicleMake.trim()) {
      alert('Por favor, informe a marca do veículo.');
      return;
    }
    
    if (!formData.vehicleModel || !formData.vehicleModel.trim()) {
      alert('Por favor, informe o modelo do veículo.');
      return;
    }
    
    if (!formData.vehiclePlate || !formData.vehiclePlate.trim()) {
      alert('Por favor, informe a placa do veículo.');
      return;
    }
    
    if (!formData.vehicleValue || formData.vehicleValue <= 0) {
      alert('O valor do veículo deve ser maior que zero.');
      return;
    }
    
    if (formData.consumedValue < 0) {
      alert('O valor consumido não pode ser negativo.');
      return;
    }
    
    if (formData.consumedValue > formData.vehicleValue) {
      alert('O valor consumido não pode ser maior que o valor do veículo.');
      return;
    }
    
    // Clean data
    const cleanedData = {
      ...formData,
      clientName: formData.clientName.trim(),
      vehicleMake: formData.vehicleMake.trim(),
      vehicleModel: formData.vehicleModel.trim(),
      vehiclePlate: formData.vehiclePlate.trim().toUpperCase(),
      vehicleChassis: !formData.vehicleChassis || formData.vehicleChassis.trim() === '' ? null : formData.vehicleChassis.trim(),
      vehicleColor: !formData.vehicleColor || formData.vehicleColor.trim() === '' ? null : formData.vehicleColor,
      notes: !formData.notes || formData.notes.trim() === '' ? null : formData.notes.trim()
    };
    
    console.log('📝 Enviando permuta:', cleanedData);
    onSubmit(cleanedData as Omit<Permuta, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 modern-shadow-xl">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {permuta ? 'Editar Permuta' : 'Nova Permuta'}
                </h2>
                <p className="text-slate-600">Registre um veículo recebido em troca</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações do Cliente */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Informações do Cliente</h3>
              <div className="form-group">
                <label className="form-label">Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="input-field"
                  placeholder="Nome completo do cliente"
                  required
                />
                <p className="text-xs text-blue-600 mt-1 font-semibold">
                  💡 Este nome deve ser exatamente igual ao usado nas vendas
                </p>
              </div>
            </div>

            {/* Informações do Veículo */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">Informações do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Marca *</label>
                  <select
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Selecione a marca...</option>
                    {VEHICLE_MAKES.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                  {formData.vehicleMake === 'Outros' && (
                    <input
                      type="text"
                      placeholder="Digite a marca"
                      className="input-field mt-2"
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Modelo *</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    className="input-field"
                    placeholder="Modelo do veículo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ano *</label>
                  <input
                    type="number"
                    min="1900"
                    max="2030"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="input-field"
                    placeholder="2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Placa *</label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehiclePlate: e.target.value.toUpperCase() }))}
                    className="input-field"
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chassi</label>
                  <input
                    type="text"
                    value={formData.vehicleChassis}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleChassis: e.target.value.toUpperCase() }))}
                    className="input-field"
                    placeholder="Número do chassi"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cor</label>
                  <select
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecione a cor...</option>
                    {VEHICLE_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  {formData.vehicleColor === 'Outros' && (
                    <input
                      type="text"
                      placeholder="Digite a cor"
                      className="input-field mt-2"
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Quilometragem</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.vehicleMileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleMileage: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Registro *</label>
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Informações Financeiras */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-4">Informações Financeiras</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="form-label">Valor Avaliado do Veículo *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.vehicleValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleValue: parseFloat(e.target.value) || 0 }))}
                    className="input-field"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Já Consumido</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.vehicleValue}
                    value={formData.consumedValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, consumedValue: parseFloat(e.target.value) || 0 }))}
                    className="input-field"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-green-600 mt-1 font-semibold">
                    Valor já usado em vendas anteriores
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Disponível</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.remainingValue}
                    className="input-field bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-blue-600 mt-1 font-bold">
                    ✓ Calculado automaticamente
                  </p>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Observações sobre o veículo, condições, defeitos, etc..."
              />
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-indigo-800 mb-4">Resumo da Permuta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Veículo:</span>
                  <p className="text-lg font-bold text-indigo-800">
                    {formData.vehicleMake} {formData.vehicleModel}
                  </p>
                  <p className="text-sm text-indigo-600">{formData.vehicleYear} • {formData.vehiclePlate}</p>
                </div>
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Valor Avaliado:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {formData.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-indigo-600 font-semibold block mb-1">Disponível:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {formData.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                {permuta ? 'Atualizar' : 'Registrar'} Permuta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: Permuta['status']) {
  switch (status) {
    case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
    case 'finalizado': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusLabel(status: Permuta['status']) {
  switch (status) {
    case 'ativo': return 'Ativo';
    case 'finalizado': return 'Finalizado';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
}