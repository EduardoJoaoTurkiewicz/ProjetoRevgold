import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Tax } from '../../types';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';

interface TaxFormProps {
  tax?: Tax | null;
  onSubmit: (tax: Omit<Tax, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TAX_TYPES = [
  { value: 'irpj', label: 'IRPJ - Imposto de Renda Pessoa Jurídica' },
  { value: 'csll', label: 'CSLL - Contribuição Social sobre Lucro Líquido' },
  { value: 'pis', label: 'PIS - Programa de Integração Social' },
  { value: 'cofins', label: 'COFINS - Contribuição para Financiamento da Seguridade Social' },
  { value: 'icms', label: 'ICMS - Imposto sobre Circulação de Mercadorias e Serviços' },
  { value: 'iss', label: 'ISS - Imposto sobre Serviços' },
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'inss', label: 'INSS - Instituto Nacional do Seguro Social' },
  { value: 'fgts', label: 'FGTS - Fundo de Garantia do Tempo de Serviço' },
  { value: 'iptu', label: 'IPTU - Imposto Predial e Territorial Urbano' },
  { value: 'ipva', label: 'IPVA - Imposto sobre Propriedade de Veículos Automotores' },
  { value: 'outros', label: 'Outros Impostos' }
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'outros', label: 'Outros' }
];

export function TaxForm({ tax, onSubmit, onCancel }: TaxFormProps) {
  const [formData, setFormData] = useState({
    date: tax?.date || formatDateForInput(new Date()),
    taxType: tax?.taxType || 'outros' as const,
    description: tax?.description || '',
    amount: tax?.amount || 0,
    dueDate: tax?.dueDate || '',
    paymentMethod: tax?.paymentMethod || 'pix' as const,
    referencePeriod: tax?.referencePeriod || '',
    documentNumber: tax?.documentNumber || '',
    observations: tax?.observations || '',
    receiptFile: tax?.receiptFile || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      date: parseInputDate(formData.date),
      dueDate: formData.dueDate ? parseInputDate(formData.dueDate) : null
    };
    onSubmit(submitData as Omit<Tax, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {tax ? 'Editar Imposto' : 'Novo Imposto'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Data do Pagamento *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: parseInputDate(e.target.value) }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Imposto *</label>
                <select
                  value={formData.taxType}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxType: e.target.value as Tax['taxType'] }))}
                  className="input-field"
                  required
                >
                  {TAX_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Valor Pago *</label>
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
                <label className="form-label">Data de Vencimento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: parseInputDate(e.target.value) }))}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as Tax['paymentMethod'] }))}
                  className="input-field"
                  required
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Período de Referência</label>
                <input
                  type="text"
                  value={formData.referencePeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencePeriod: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Janeiro/2025, 1º Trimestre/2025"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descreva o imposto pago (ex: IRPJ referente ao lucro do 4º trimestre de 2024)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número do Documento</label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                  className="input-field"
                  placeholder="Número da guia, DARF, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Comprovante</label>
                <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-orange-500 mb-3" />
                  <p className="text-sm text-orange-700 font-semibold mb-2">Anexar comprovante (opcional)</p>
                  <p className="text-xs text-orange-600">PDF, JPG, PNG (máx. 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Arquivo muito grande. Máximo 10MB.');
                        e.target.value = '';
                        return;
                      }
                      setFormData(prev => ({ ...prev, receiptFile: file.name }));
                    }
                  }}
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={4}
                  placeholder="Observações adicionais sobre o pagamento do imposto..."
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-200 modern-shadow-xl mx-8 mb-8">
              <h3 className="text-xl font-black text-red-800 mb-4">Resumo do Imposto</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Tipo:</span>
                  <p className="text-lg font-bold text-red-800">{getTaxTypeLabel(formData.taxType)}</p>
                </div>
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Pagamento:</span>
                  <p className="text-lg font-bold text-red-800 capitalize">
                    {formData.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Valor:</span>
                  <p className="text-2xl font-black text-red-600">
                    R$ {formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold text-center">
                  ⚠️ Este imposto será registrado como DESPESA da empresa e reduzirá o saldo do caixa
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 mx-8 pb-8">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {tax ? 'Atualizar' : 'Registrar'} Imposto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getTaxTypeLabel(type: Tax['taxType']) {
  const labels = {
    'irpj': 'IRPJ',
    'csll': 'CSLL',
    'pis': 'PIS',
    'cofins': 'COFINS',
    'icms': 'ICMS',
    'iss': 'ISS',
    'simples_nacional': 'Simples Nacional',
    'inss': 'INSS',
    'fgts': 'FGTS',
    'iptu': 'IPTU',
    'ipva': 'IPVA',
    'outros': 'Outros'
  };
  return labels[type] || type;
}