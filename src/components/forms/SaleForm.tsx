import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Sale, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';

interface SaleFormProps {
  sale?: Sale | null;
  onSubmit: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;
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

const INSTALLMENT_TYPES = ['cartao_credito', 'cheque', 'boleto'];

export function SaleForm({ sale, onSubmit, onCancel }: SaleFormProps) {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    date: sale?.date || new Date().toISOString().split('T')[0],
    deliveryDate: sale?.deliveryDate || '',
    client: sale?.client || '',
    sellerId: sale?.sellerId || '',
    customCommissionRate: sale?.customCommissionRate || 5,
    products: sale?.products || 'Produtos vendidos', // Simplified to string
    observations: sale?.observations || '',
    totalValue: sale?.totalValue || 0,
    paymentMethods: sale?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    paymentDescription: sale?.paymentDescription || '',
    paymentObservations: sale?.paymentObservations || ''
  });

  // Filtrar apenas vendedores ativos
  const sellers = state.employees.filter(emp => emp.isActive && emp.isSeller);

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
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === index) {
          const updatedMethod = { ...method, [field]: value };
          
          // Calculate installment value when installments change
          if (field === 'installments' && value > 1) {
            updatedMethod.installmentValue = method.amount / value;
          } else if (field === 'amount' && method.installments && method.installments > 1) {
            // Recalculate installment value when amount changes
            updatedMethod.installmentValue = value / method.installments;
          }
          
          // Reset installment fields if payment type doesn't support installments
          if (field === 'type' && !INSTALLMENT_TYPES.includes(value)) {
            delete updatedMethod.installments;
            delete updatedMethod.installmentValue;
            delete updatedMethod.installmentInterval;
            delete updatedMethod.startDate;
            delete updatedMethod.firstInstallmentDate;
          }
          
          return updatedMethod;
        }
        return method;
      })
    }));
  };

  const calculateAmounts = () => {
    // Only count immediate payments (not installments) as received
    const totalPaid = formData.paymentMethods.reduce((sum, method) => {
      // For installments, only the first installment is considered "received" immediately
      if (method.installments && method.installments > 1) {
        return sum + (method.installmentValue || 0); // Only first installment
      }
      // For single payments, full amount is received
      if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') {
        return sum + method.amount;
      }
      // For checks and other methods, consider as pending unless it's a single payment
      return sum + (method.installments === 1 || !method.installments ? method.amount : 0);
    }, 0);
    
    const pending = formData.totalValue - totalPaid;
    
    return {
      receivedAmount: totalPaid,
      pendingAmount: Math.max(0, pending),
      status: pending <= 0 ? 'pago' : (totalPaid > 0 ? 'parcial' : 'pendente')
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amounts = calculateAmounts();
    
    // Adicionar descrição do pagamento às observações se fornecida
    let finalObservations = formData.observations;
    if (formData.paymentObservations.trim()) {
      finalObservations = finalObservations 
        ? `${finalObservations}\n\nDescrição do Pagamento: ${formData.paymentObservations}`
        : `Descrição do Pagamento: ${formData.paymentObservations}`;
    }
    
    onSubmit({
      ...formData,
      observations: finalObservations,
      ...amounts
    } as Omit<Sale, 'id' | 'createdAt'>);
  };

  // Auto-update payment method amount when total value changes
  useEffect(() => {
    if (formData.paymentMethods.length === 1 && formData.paymentMethods[0].amount === 0) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: [{
          ...prev.paymentMethods[0],
          amount: prev.totalValue
        }]
      }));
    }
  }, [formData.totalValue]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {sale ? 'Editar Venda' : 'Nova Venda'}
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
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
                <label className="form-label">Data de Entrega</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="input-field"
                  placeholder="Data prevista para entrega"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vendedor (Opcional)</label>
                <select
                  value={formData.sellerId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Selecionar vendedor...</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name} - {seller.position}
                    </option>
                  ))}
                </select>
                {formData.sellerId && (
                  <div className="mt-3">
                    <label className="form-label">Comissão Personalizada (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.customCommissionRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCommissionRate: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                      placeholder="5.0"
                    />
                    <p className="text-xs text-blue-600 mt-1 font-bold">
                      ✓ Comissão: R$ {((formData.totalValue * (formData.customCommissionRate || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({formData.customCommissionRate}%)
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Descrição dos Produtos *</label>
                <textarea
                  value={typeof formData.products === 'string' ? formData.products : 'Produtos vendidos'}
                  onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descreva os produtos vendidos..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total da Venda *</label>
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
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Informações adicionais sobre a venda (opcional)"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Descrição sobre o Pagamento (Opcional)</label>
                <textarea
                  value={formData.paymentObservations}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentObservations: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Informações específicas sobre como será feito o pagamento (opcional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta descrição será adicionada automaticamente às observações da venda.
                </p>
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

                      {INSTALLMENT_TYPES.includes(method.type) && (
                        <>
                          <div>
                            <label className="form-label">Número de Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              value={method.installments || 1}
                              onChange={(e) => updatePaymentMethod(index, 'installments', parseInt(e.target.value) || 1)}
                              className="input-field"
                            />
                          </div>

                          {method.installments && method.installments > 1 && (
                            <>
                              <div>
                                <label className="form-label">Valor por Parcela</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={method.installmentValue || 0}
                                  onChange={(e) => updatePaymentMethod(index, 'installmentValue', parseFloat(e.target.value) || 0)}
                                  className="input-field"
                                  placeholder="0,00"
                                  readOnly
                                />
                                <p className="text-xs text-blue-600 mt-1 font-bold">
                                  ✓ Calculado automaticamente: R$ {method.amount && method.installments ? (method.amount / method.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'} por parcela
                                </p>
                              </div>

                              <div>
                                <label className="form-label">Intervalo (dias)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={method.installmentInterval || 30}
                                  onChange={(e) => updatePaymentMethod(index, 'installmentInterval', parseInt(e.target.value) || 30)}
                                  className="input-field"
                                  placeholder="30"
                                />
                              </div>

                              <div>
                                <label className="form-label">Data da Primeira Parcela</label>
                                <input
                                  type="date"
                                  value={method.firstInstallmentDate || formData.date}
                                  onChange={(e) => updatePaymentMethod(index, 'firstInstallmentDate', e.target.value)}
                                  className="input-field"
                                />
                              </div>
                            </>
                          )}

                          {/* Campo para data de pagamento único para cheque e boleto */}
                          {(method.type === 'cheque' || method.type === 'boleto') && (!method.installments || method.installments === 1) && (
                            <div>
                              <label className="form-label">Data de Vencimento/Pagamento *</label>
                              <input
                                type="date"
                                value={method.firstInstallmentDate || formData.date}
                                onChange={(e) => updatePaymentMethod(index, 'firstInstallmentDate', e.target.value)}
                                className="input-field"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Data em que o {method.type === 'cheque' ? 'cheque' : 'boleto'} será pago/vencerá
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-gray-500/20 blur-2xl"></div>
              <div className="relative p-6 bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl border-2 border-slate-300 shadow-xl"
                   style={{ 
                     boxShadow: '0 20px 40px -12px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                   }}>
                <h3 className="text-xl font-black text-slate-800 mb-4 bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">
                  Resumo da Venda
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <span className="text-slate-600 font-semibold block mb-1">Total:</span>
                    <p className="text-2xl font-black text-slate-800">
                      R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-600 font-semibold block mb-1">Recebido:</span>
                    <p className="text-2xl font-black text-green-600">
                      R$ {calculateAmounts().receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-600 font-semibold block mb-1">Pendente:</span>
                    <p className="text-2xl font-black text-orange-600">
                      R$ {calculateAmounts().pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
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
                {sale ? 'Atualizar Venda' : 'Criar Venda'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}