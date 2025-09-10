import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Debt, PaymentMethod } from '../../types';

interface DebtFormProps {
  debt?: Debt | null;
  onSubmit: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const PAYMENT_TYPES = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' }
];

export function DebtForm({ debt, onSubmit, onCancel }: DebtFormProps) {
  const [formData, setFormData] = useState({
    date: debt?.date || new Date().toISOString().split('T')[0],
    description: debt?.description || '',
    company: debt?.company || '',
    totalValue: debt?.totalValue || 0,
    paymentMethods: debt?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    paymentDescription: debt?.paymentDescription || '',
    debtPaymentDescription: debt?.debtPaymentDescription || ''
  });

  const addPaymentMethod = () => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, { type: 'dinheiro', amount: 0 }]
    }));
  };

  const removePaymentMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method, i) => 
        i === index ? { ...method, [field]: value } : method
      )
    }));
  };

  const calculateAmounts = () => {
    const totalPaid = formData.paymentMethods.reduce((sum, method) => {
      if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') {
        return sum + method.amount;
      }
      if (method.type === 'cartao_credito' && (!method.installments || method.installments === 1)) {
        return sum + method.amount;
      }
      return sum;
    }, 0);
    
    const pending = formData.totalValue - totalPaid;
    
    return {
      paidAmount: totalPaid,
      pendingAmount: Math.max(0, pending),
      isPaid: pending <= 0
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company || !formData.company.trim()) {
      alert('Por favor, informe o nome da empresa.');
      return;
    }
    
    if (!formData.description || !formData.description.trim()) {
      alert('Por favor, informe a descrição da dívida.');
      return;
    }
    
    if (!formData.totalValue || formData.totalValue <= 0) {
      alert('O valor total da dívida deve ser maior que zero.');
      return;
    }
    
    if (!formData.paymentMethods || formData.paymentMethods.length === 0) {
      alert('Por favor, adicione pelo menos um método de pagamento.');
      return;
    }
    
    const totalPaymentAmount = formData.paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    if (totalPaymentAmount === 0) {
      alert('Por favor, informe pelo menos um método de pagamento com valor maior que zero.');
      return;
    }
    
    if (totalPaymentAmount > formData.totalValue) {
      alert('O total dos métodos de pagamento não pode ser maior que o valor total da dívida.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    for (const method of formData.paymentMethods) {
      if (!method.type || typeof method.type !== 'string') {
        alert('Todos os métodos de pagamento devem ter um tipo válido.');
        return;
      }
      if (typeof method.amount !== 'number' || method.amount < 0) {
        alert('Todos os métodos de pagamento devem ter um valor válido.');
        return;
      }
    }
    
    // Clean payment methods data
    const cleanedPaymentMethods = formData.paymentMethods.map(method => {
      const cleaned: PaymentMethod = { ...method };
      
      // Garantir campos obrigatórios
      if (!cleaned.type) cleaned.type = 'dinheiro';
      if (typeof cleaned.amount !== 'number') cleaned.amount = 0;
      
      // Limpar campos opcionais vazios
      if (cleaned.installments === 1) {
        delete cleaned.installments;
        delete cleaned.installmentValue;
        delete cleaned.installmentInterval;
      }
      
      // Limpar strings vazias
      Object.keys(cleaned).forEach(key => {
        const value = cleaned[key as keyof PaymentMethod];
        if (typeof value === 'string' && value.trim() === '') {
          delete cleaned[key as keyof PaymentMethod];
        }
        // Clean UUID fields specifically
        if ((key.endsWith('Id') || key.endsWith('_id')) && (value === '' || value === 'null' || value === 'undefined')) {
          cleaned[key as keyof PaymentMethod] = null;
        }
      });
      
      return cleaned;
    });
    
    const amounts = calculateAmounts();
    
    // Add payment description to observations if provided
    let finalPaymentDescription = formData.paymentDescription;
    if (formData.debtPaymentDescription.trim()) {
      finalPaymentDescription = finalPaymentDescription 
        ? `${finalPaymentDescription}\n\nDescrição do Pagamento: ${formData.debtPaymentDescription}`
        : `Descrição do Pagamento: ${formData.debtPaymentDescription}`;
    }
    
    // Garantir que campos opcionais sejam null se vazios
    const paymentDescription = !finalPaymentDescription || finalPaymentDescription.trim() === '' ? null : finalPaymentDescription;
    const debtPaymentDescription = !formData.debtPaymentDescription || formData.debtPaymentDescription.trim() === '' ? null : formData.debtPaymentDescription;
    
    const debtToSubmit = {
      ...formData,
      paymentMethods: cleanedPaymentMethods,
      paymentDescription,
      debtPaymentDescription,
      ...amounts
    };
    
    console.log('📝 Enviando dívida:', debtToSubmit);
    onSubmit(debtToSubmit as Omit<Debt, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {debt ? 'Editar Dívida' : 'Nova Dívida'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="form-label">Empresa *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="input-field"
                  placeholder="Nome da empresa"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descrição da dívida..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição sobre o Pagamento (Opcional)</label>
                <textarea
                  value={formData.debtPaymentDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, debtPaymentDescription: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Informações específicas sobre como será feito o pagamento (opcional)"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Métodos de Pagamento</h3>
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Método
                </button>
              </div>

              <div className="space-y-4">
                {formData.paymentMethods.map((method, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Método {index + 1}</h4>
                      {formData.paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Tipo de Pagamento</label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          className="input-field"
                        >
                          {PAYMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Valor</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={method.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border-2 border-red-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-red-800 mb-4">
                Resumo da Dívida
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Total:</span>
                  <p className="text-2xl font-black text-red-800">
                    R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Pago:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {calculateAmounts().paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-red-600 font-semibold block mb-1">Pendente:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {calculateAmounts().pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
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
                {debt ? 'Atualizar Dívida' : 'Criar Dívida'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}