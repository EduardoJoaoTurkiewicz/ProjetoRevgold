import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Acerto } from '../../types';
import { CashBalanceService } from '../../lib/cashBalanceService';

interface AcertoPaymentFormProps {
  acerto: Acerto;
  onSubmit: (paymentData: Partial<Acerto>) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' }
];

export function AcertoPaymentForm({ acerto, onSubmit, onCancel }: AcertoPaymentFormProps) {
  const [formData, setFormData] = useState({
    paymentAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'dinheiro' as const,
    paymentInstallments: 1,
    paymentInstallmentValue: 0,
    paymentInterval: 30,
    observations: ''
  });

  // Auto-calculate installment value
  React.useEffect(() => {
    if (formData.paymentInstallments > 1) {
      const installmentValue = formData.paymentAmount / formData.paymentInstallments;
      setFormData(prev => ({ ...prev, paymentInstallmentValue: installmentValue }));
    } else {
      setFormData(prev => ({ ...prev, paymentInstallmentValue: formData.paymentAmount }));
    }
  }, [formData.paymentAmount, formData.paymentInstallments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return;
    }
    
    if (formData.paymentAmount > acerto.pendingAmount) {
      alert('O valor do pagamento não pode ser maior que o valor pendente.');
      return;
    }
    
    // Calculate new amounts
    const newPaidAmount = acerto.paidAmount + formData.paymentAmount;
    const newPendingAmount = acerto.totalAmount - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? 'pago' : 'parcial';
    
    const paymentData = {
      paidAmount: newPaidAmount,
      pendingAmount: Math.max(0, newPendingAmount),
      status: newStatus as Acerto['status'],
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
      paymentInstallments: formData.paymentInstallments > 1 ? formData.paymentInstallments : undefined,
      paymentInstallmentValue: formData.paymentInstallments > 1 ? formData.paymentInstallmentValue : undefined,
      paymentInterval: formData.paymentInstallments > 1 ? formData.paymentInterval : undefined,
      observations: formData.observations || acerto.observations
    };
    
    // Process payment through cash balance service
    CashBalanceService.handleAcertoPayment(acerto, { ...paymentData, paymentAmount: formData.paymentAmount })
      .then(() => {
        console.log('✅ Acerto payment processed through cash service');
      })
      .catch(error => {
        console.error('❌ Error processing acerto payment:', error);
      });
    
    console.log('📝 Enviando pagamento de acerto:', paymentData);
    onSubmit(paymentData);
  };

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
                <h2 className="text-3xl font-bold text-slate-900">Registrar Pagamento</h2>
                <p className="text-slate-600">Cliente: {acerto.clientName}</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Informações do Acerto */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">Situação Atual do Acerto</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-indigo-600 font-semibold">Total</p>
                <p className="text-xl font-bold text-indigo-800">
                  R$ {acerto.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-indigo-600 font-semibold">Já Pago</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {acerto.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-indigo-600 font-semibold">Pendente</p>
                <p className="text-xl font-bold text-orange-600">
                  R$ {acerto.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Valor do Pagamento *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={acerto.pendingAmount}
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  Máximo: R$ {acerto.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Data do Pagamento *</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as Acerto['paymentMethod'] }))}
                  className="input-field"
                  required
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.paymentMethod === 'cartao_credito' || formData.paymentMethod === 'cheque' || formData.paymentMethod === 'boleto') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Número de Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formData.paymentInstallments}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentInstallments: parseInt(e.target.value) || 1 }))}
                      className="input-field"
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valor da Parcela</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.paymentInstallmentValue}
                      className="input-field bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Intervalo (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.paymentInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentInterval: parseInt(e.target.value) || 30 }))}
                      className="input-field"
                      placeholder="30"
                    />
                  </div>
                </>
              )}

              <div className="form-group md:col-span-2">
                <label className="form-label">Observações sobre o Pagamento</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Observações sobre este pagamento..."
                />
              </div>
            </div>

            {/* Preview do Resultado */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-green-800 mb-4">Resultado Após Pagamento</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Pago:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {(acerto.paidAmount + formData.paymentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Pendente:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {Math.max(0, acerto.pendingAmount - formData.paymentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Status:</span>
                  <p className="text-lg font-bold text-green-800">
                    {(acerto.paidAmount + formData.paymentAmount) >= acerto.totalAmount ? 'PAGO' : 'PARCIAL'}
                  </p>
                </div>
              </div>
              
              {formData.paymentMethod === 'cheque' && formData.paymentInstallments > 1 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-semibold text-center">
                    📋 Serão criados {formData.paymentInstallments} cheques na aba "Cheques"
                  </p>
                </div>
              )}
              
              {formData.paymentMethod === 'boleto' && formData.paymentInstallments > 1 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold text-center">
                    📋 Serão criados {formData.paymentInstallments} boletos na aba "Boletos"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Registrar Pagamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}