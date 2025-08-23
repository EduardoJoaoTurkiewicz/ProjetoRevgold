import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, DollarSign, FileText, Calculator } from 'lucide-react';
import { Boleto } from '../../types';

interface OverdueBoletoFormProps {
  boleto: Boleto;
  onSubmit: (boleto: Omit<Boleto, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const OVERDUE_ACTIONS = [
  { value: 'pago_com_juros', label: 'Pago com Juros', color: 'text-green-700' },
  { value: 'pago_com_multa', label: 'Pago com Multa', color: 'text-green-700' },
  { value: 'pago_integral', label: 'Pago Valor Integral', color: 'text-green-700' },
  { value: 'acordo_realizado', label: 'Acordo Realizado', color: 'text-blue-700' },
  { value: 'protestado', label: 'Protestado', color: 'text-orange-700' },
  { value: 'negativado', label: 'Negativado', color: 'text-orange-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'text-red-700' },
  { value: 'perda_total', label: 'Perda Total', color: 'text-red-700' }
];

export function OverdueBoletoForm({ boleto, onSubmit, onCancel }: OverdueBoletoFormProps) {
  const [formData, setFormData] = useState({
    ...boleto,
    overdueAction: boleto.overdueAction || '',
    interestAmount: boleto.interestAmount || 0,
    penaltyAmount: boleto.penaltyAmount || 0,
    notaryCosts: boleto.notaryCosts || 0,
    finalAmount: boleto.finalAmount || boleto.value,
    overdueNotes: boleto.overdueNotes || ''
  });

  const today = new Date();
  const dueDate = new Date(boleto.dueDate);
  const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular valor final automaticamente
  useEffect(() => {
    const finalAmount = formData.value + formData.interestAmount + formData.penaltyAmount + formData.notaryCosts;
    setFormData(prev => ({ ...prev, finalAmount }));
  }, [formData.value, formData.interestAmount, formData.penaltyAmount, formData.notaryCosts]);

  // Atualizar status baseado na ação
  useEffect(() => {
    if (formData.overdueAction) {
      let newStatus = formData.status;
      
      if (['pago_com_juros', 'pago_com_multa', 'pago_integral', 'acordo_realizado'].includes(formData.overdueAction)) {
        newStatus = 'compensado';
      } else if (['cancelado', 'perda_total'].includes(formData.overdueAction)) {
        newStatus = 'cancelado';
      } else {
        newStatus = 'vencido';
      }
      
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  }, [formData.overdueAction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.overdueAction) {
      alert('Por favor, selecione o que aconteceu com o boleto vencido.');
      return;
    }

    onSubmit(formData as Omit<Boleto, 'id' | 'createdAt'>);
  };

  const calculateInterestSuggestion = () => {
    // Sugestão de 2% ao mês
    const monthsOverdue = Math.ceil(daysOverdue / 30);
    return (boleto.value * 0.02 * monthsOverdue);
  };

  const calculatePenaltySuggestion = () => {
    // Sugestão de 2% de multa
    return (boleto.value * 0.02);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 modern-shadow-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Gerenciar Boleto Vencido</h2>
                <p className="text-red-600 font-semibold">
                  Vencido há {daysOverdue} dias
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Informações do Boleto */}
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4">Informações do Boleto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-red-600 font-semibold">Cliente</p>
                <p className="text-red-800 font-bold">{boleto.client}</p>
              </div>
              <div>
                <p className="text-red-600 font-semibold">Valor Original</p>
                <p className="text-red-800 font-bold">
                  R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-red-600 font-semibold">Vencimento</p>
                <p className="text-red-800 font-bold">
                  {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ação Tomada */}
            <div className="form-group">
              <label className="form-label">O que aconteceu com este boleto vencido? *</label>
              <select
                value={formData.overdueAction}
                onChange={(e) => setFormData(prev => ({ ...prev, overdueAction: e.target.value as any }))}
                className="input-field"
                required
              >
                <option value="">Selecione a ação tomada...</option>
                {OVERDUE_ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos de Valores - Apenas se foi pago */}
            {formData.overdueAction && ['pago_com_juros', 'pago_com_multa', 'pago_integral', 'acordo_realizado'].includes(formData.overdueAction) && (
              <div className="space-y-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-green-600">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900">Valores Adicionais (Opcional)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Juros */}
                    <div className="form-group">
                      <label className="form-label">Juros Aplicados</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.interestAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, interestAmount: parseFloat(e.target.value) || 0 }))}
                          className="input-field"
                          placeholder="0,00"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, interestAmount: calculateInterestSuggestion() }))}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
                          title="Sugestão: 2% ao mês"
                        >
                          Sugerir
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Sugestão: R$ {calculateInterestSuggestion().toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (2% ao mês)
                      </p>
                    </div>

                    {/* Multa */}
                    <div className="form-group">
                      <label className="form-label">Multa Aplicada</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.penaltyAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, penaltyAmount: parseFloat(e.target.value) || 0 }))}
                          className="input-field"
                          placeholder="0,00"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, penaltyAmount: calculatePenaltySuggestion() }))}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
                          title="Sugestão: 2% do valor"
                        >
                          Sugerir
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Sugestão: R$ {calculatePenaltySuggestion().toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (2% do valor)
                      </p>
                    </div>

                    {/* Custos de Cartório */}
                    <div className="form-group">
                      <label className="form-label">Custos de Cartório</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.notaryCosts}
                        onChange={(e) => setFormData(prev => ({ ...prev, notaryCosts: parseFloat(e.target.value) || 0 }))}
                        className="input-field"
                        placeholder="0,00"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        Custos de protesto, cartório ou outros serviços
                      </p>
                    </div>

                    {/* Valor Final (Calculado) */}
                    <div className="form-group">
                      <label className="form-label">Valor Final Pago</label>
                      <div className="p-4 bg-green-100 rounded-xl border border-green-300">
                        <div className="flex items-center gap-3">
                          <Calculator className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="text-2xl font-black text-green-700">
                              R$ {formData.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-green-600 font-semibold">
                              Calculado automaticamente
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown dos Valores */}
                  <div className="mt-6 p-4 bg-white rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3">Composição do Valor Final</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Valor Original:</span>
                        <span className="font-bold text-green-800">R$ {formData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {formData.interestAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">+ Juros:</span>
                          <span className="font-bold text-green-800">R$ {formData.interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {formData.penaltyAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">+ Multa:</span>
                          <span className="font-bold text-green-800">R$ {formData.penaltyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {formData.notaryCosts > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">+ Cartório:</span>
                          <span className="font-bold text-green-800">R$ {formData.notaryCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-green-200 pt-2">
                        <span className="text-green-700 font-bold">Total Final:</span>
                        <span className="font-black text-green-800 text-lg">R$ {formData.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Observações sobre o Vencimento */}
            <div className="form-group">
              <label className="form-label">Observações sobre o Vencimento</label>
              <textarea
                value={formData.overdueNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, overdueNotes: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Descreva detalhes sobre o que aconteceu com este boleto vencido, negociações realizadas, acordos feitos, etc..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Campo opcional para registrar informações importantes sobre o vencimento
              </p>
            </div>

            {/* Resumo da Situação */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-600">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Resumo da Situação</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong className="text-blue-800">Cliente:</strong> <span className="text-blue-700">{boleto.client}</span></p>
                  <p><strong className="text-blue-800">Dias em Atraso:</strong> <span className="text-red-600 font-bold">{daysOverdue} dias</span></p>
                  <p><strong className="text-blue-800">Valor Original:</strong> <span className="text-blue-700">R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                </div>
                <div>
                  <p><strong className="text-blue-800">Ação:</strong> 
                    <span className={`ml-2 ${OVERDUE_ACTIONS.find(a => a.value === formData.overdueAction)?.color || 'text-slate-700'}`}>
                      {formData.overdueAction ? OVERDUE_ACTIONS.find(a => a.value === formData.overdueAction)?.label : 'Não definida'}
                    </span>
                  </p>
                  <p><strong className="text-blue-800">Novo Status:</strong> 
                    <span className={`ml-2 font-bold ${
                      formData.status === 'compensado' ? 'text-green-600' :
                      formData.status === 'cancelado' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      {formData.status === 'compensado' ? 'Compensado' :
                       formData.status === 'cancelado' ? 'Cancelado' :
                       formData.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </p>
                  {formData.finalAmount !== formData.value && (
                    <p><strong className="text-blue-800">Valor Final:</strong> 
                      <span className="text-green-600 font-bold ml-2">
                        R$ {formData.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Salvar Situação do Boleto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}