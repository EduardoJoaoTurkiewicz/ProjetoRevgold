import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PixFee } from '../../types';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';
import { getCurrentDateString } from '../../utils/dateUtils';

interface PixFeeFormProps {
  pixFee?: PixFee | null;
  onSubmit: (pixFee: Omit<PixFee, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TRANSACTION_TYPES = [
  { value: 'pix_out', label: 'PIX Enviado' },
  { value: 'pix_in', label: 'PIX Recebido' },
  { value: 'ted', label: 'TED' },
  { value: 'doc', label: 'DOC' },
  { value: 'other', label: 'Outros' }
];

const COMMON_BANKS = [
  'Banco do Brasil',
  'Bradesco',
  'Caixa Econômica Federal',
  'Itaú',
  'Santander',
  'Nubank',
  'Inter',
  'C6 Bank',
  'Sicoob',
  'Sicredi',
  'Banco Original',
  'Banco Pan',
  'Banco Safra',
  'BTG Pactual',
  'Banco Votorantim',
  'Outros'
];

export function PixFeeForm({ pixFee, onSubmit, onCancel }: PixFeeFormProps) {
  const [formData, setFormData] = useState({
    date: pixFee?.date || formatDateForInput(new Date()),
    amount: pixFee?.amount || 0,
    description: pixFee?.description || '',
    bank: pixFee?.bank || '',
    transactionType: pixFee?.transactionType || 'pix_out' as const,
    relatedTransactionId: pixFee?.relatedTransactionId || null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      date: parseInputDate(formData.date),
      relatedTransactionId: formData.relatedTransactionId || null
    };
    onSubmit(submitData as Omit<PixFee, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {pixFee ? 'Editar Tarifa PIX' : 'Nova Tarifa PIX'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: parseInputDate(e.target.value) }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor da Tarifa *</label>
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
                <label className="form-label">Banco *</label>
                <select
                  value={formData.bank}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Selecione o banco...</option>
                  {COMMON_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                {formData.bank === 'Outros' && (
                  <input
                    type="text"
                    placeholder="Digite o nome do banco"
                    className="input-field mt-2"
                    onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Transação *</label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value as PixFee['transactionType'] }))}
                  className="input-field"
                  required
                >
                  {TRANSACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
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
                  placeholder="Descreva a tarifa (ex: Tarifa PIX para pagamento de fornecedor, Taxa de transferência, etc.)"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">ID da Transação Relacionada (Opcional)</label>
                <input
                  type="text"
                  value={formData.relatedTransactionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, relatedTransactionId: e.target.value }))}
                  className="input-field"
                  placeholder="ID da venda, dívida ou transação relacionada"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Campo opcional para vincular esta tarifa a uma transação específica
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border-2 border-red-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-red-800 mb-4">Resumo da Tarifa</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Banco:</span>
                  <p className="text-lg font-bold text-red-800">{formData.bank || 'Não selecionado'}</p>
                </div>
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Tipo:</span>
                  <p className="text-lg font-bold text-red-800">
                    {TRANSACTION_TYPES.find(t => t.value === formData.transactionType)?.label || 'Não selecionado'}
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
                  ⚠️ Esta tarifa será registrada como GASTO da empresa e reduzirá o saldo do caixa
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {pixFee ? 'Atualizar' : 'Registrar'} Tarifa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}