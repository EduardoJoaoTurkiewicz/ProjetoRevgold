import React, { useState } from 'react';
import { X, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CashTransaction } from '../../types';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';
import { getCurrentDateString } from '../../utils/dateUtils';

interface CashTransactionFormProps {
  transaction?: CashTransaction | null;
  onSubmit: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TRANSACTION_TYPES = [
  { value: 'entrada', label: 'Entrada', icon: ArrowUpCircle, color: 'text-green-600' },
  { value: 'saida', label: 'Saída', icon: ArrowDownCircle, color: 'text-red-600' }
];

const CATEGORIES = [
  { value: 'venda', label: 'Venda' },
  { value: 'divida', label: 'Dívida' },
  { value: 'adiantamento', label: 'Adiantamento' },
  { value: 'salario', label: 'Salário' },
  { value: 'comissao', label: 'Comissão' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'outro', label: 'Outro' }
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outros', label: 'Outros' }
];

export function CashTransactionForm({ transaction, onSubmit, onCancel }: CashTransactionFormProps) {
  const { sales, debts, checks, boletos } = useAppContext();
  
  const [formData, setFormData] = useState({
    date: transaction?.date || formatDateForInput(new Date()),
    type: transaction?.type || 'entrada' as const,
    amount: transaction?.amount || 0,
    description: transaction?.description || '',
    category: transaction?.category || 'outro' as const,
    paymentMethod: transaction?.paymentMethod || 'dinheiro',
    relatedId: transaction?.relatedId || null
  });

  // Opções de referência baseadas na categoria
  const getReferenceOptions = () => {
    switch (formData.category) {
      case 'venda':
        return sales.map(sale => ({
          value: sale.id,
          label: `${sale.client} - ${new Date(sale.date).toLocaleDateString('pt-BR')} - R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));
      case 'divida':
        return debts.map(debt => ({
          value: debt.id,
          label: `${debt.company} - ${new Date(debt.date).toLocaleDateString('pt-BR')} - R$ ${debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));
      case 'cheque':
        return checks.map(check => ({
          value: check.id,
          label: `${check.client} - Venc: ${new Date(check.dueDate).toLocaleDateString('pt-BR')} - R$ ${check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));
      case 'boleto':
        return boletos.map(boleto => ({
          value: boleto.id,
          label: `${boleto.client} - Venc: ${new Date(boleto.dueDate).toLocaleDateString('pt-BR')} - R$ ${boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }));
      default:
        return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.description.trim()) {
      alert('Por favor, informe a descrição da transação.');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      alert('O valor da transação deve ser maior que zero.');
      return;
    }
    
    // Clean data - ensure empty strings become null for optional fields
    const cleanedData = {
      ...formData,
      date: formData.date,
      description: formData.description.trim(),
      relatedId: !formData.relatedId || formData.relatedId === '' ? null : formData.relatedId,
      paymentMethod: !formData.paymentMethod || formData.paymentMethod === '' ? null : formData.paymentMethod
    };
    
    console.log('📝 Enviando transação:', cleanedData);
    onSubmit(cleanedData as Omit<CashTransaction, 'id' | 'createdAt'>);
  };

  const referenceOptions = getReferenceOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {transaction ? 'Editar Transação' : 'Nova Transação'}
                </h2>
                <p className="text-slate-600">Registre uma movimentação no caixa</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900">Informações da Transação</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="form-group md:col-span-2">
                  <label className="form-label">Tipo de Transação *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {TRANSACTION_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.value}
                          className={`
                            flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                            ${formData.type === type.value 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-slate-200 bg-white hover:border-green-200 hover:bg-green-50/50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={type.value}
                            checked={formData.type === type.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'entrada' | 'saida' }))}
                            className="sr-only"
                          />
                          <div className={`p-2 rounded-lg ${
                            type.value === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className={`font-bold ${type.color}`}>{type.label}</p>
                            <p className="text-sm text-slate-600">
                              {type.value === 'entrada' ? 'Aumenta o saldo' : 'Diminui o saldo'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        category: e.target.value as CashTransaction['category'],
                        relatedId: null // Reset related ID when category changes
                      }));
                    }}
                    className="input-field"
                    required
                  >
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Forma de Pagamento</label>
                  <select
                    value={formData.paymentMethod || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value || null }))}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
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
                    placeholder="Descreva a transação..."
                    required
                  />
                </div>

                {referenceOptions.length > 0 && (
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Referência (Opcional)</label>
                    <select
                      value={formData.relatedId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, relatedId: e.target.value || null }))}
                      className="input-field"
                    >
                      <option value="">Nenhuma referência</option>
                      {referenceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-green-600 mt-1 font-semibold">
                      💡 Vincule esta transação a uma venda, dívida, cheque ou boleto específico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo da Transação */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-blue-800 mb-4">Resumo da Transação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Tipo:</span>
                  <div className="flex items-center justify-center gap-2">
                    {React.createElement(
                      TRANSACTION_TYPES.find(t => t.value === formData.type)?.icon || DollarSign,
                      { className: `w-5 h-5 ${formData.type === 'entrada' ? 'text-green-600' : 'text-red-600'}` }
                    )}
                    <p className={`text-lg font-bold ${formData.type === 'entrada' ? 'text-green-800' : 'text-red-800'}`}>
                      {formData.type === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Categoria:</span>
                  <p className="text-lg font-bold text-blue-800 capitalize">
                    {CATEGORIES.find(c => c.value === formData.category)?.label || formData.category}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Valor:</span>
                  <p className={`text-2xl font-black ${formData.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.type === 'entrada' ? '+' : '-'}R$ {formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold text-center">
                  ⚠️ Esta transação {formData.type === 'entrada' ? 'aumentará' : 'diminuirá'} o saldo do caixa automaticamente
                </p>
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
                className="btn-primary"
              >
                {transaction ? 'Atualizar' : 'Criar'} Transação
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}