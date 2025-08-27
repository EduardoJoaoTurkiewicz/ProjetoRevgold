import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info } from 'lucide-react';
import { Sale, PaymentMethod } from '../../types';
import { ThirdPartyCheckDetails } from '../../types';
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
  const { employees } = useApp();
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
  const sellers = employees.filter(emp => emp.isActive && emp.isSeller);

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
            delete updatedMethod.isThirdPartyCheck;
            delete updatedMethod.thirdPartyDetails;
          }
          
          return updatedMethod;
        }
        return method;
      })
    }));
  };

  const addThirdPartyCheck = (paymentMethodIndex: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === paymentMethodIndex && method.type === 'cheque' && method.isThirdPartyCheck) {
          const thirdPartyDetails = method.thirdPartyDetails || [];
          return {
            ...method,
            thirdPartyDetails: [...thirdPartyDetails, {
              bank: '',
              agency: '',
              account: '',
              checkNumber: '',
              issuer: '',
              cpfCnpj: '',
              observations: ''
            }]
          };
        }
        return method;
      })
    }));
  };

  const updateThirdPartyCheck = (paymentMethodIndex: number, checkIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === paymentMethodIndex && method.thirdPartyDetails) {
          return {
            ...method,
            thirdPartyDetails: method.thirdPartyDetails.map((check, j) => 
              j === checkIndex ? { ...check, [field]: value } : check
            )
          };
        }
        return method;
      })
    }));
  };

  const removeThirdPartyCheck = (paymentMethodIndex: number, checkIndex: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === paymentMethodIndex && method.thirdPartyDetails) {
          return {
            ...method,
            thirdPartyDetails: method.thirdPartyDetails.filter((_, j) => j !== checkIndex)
          };
        }
        return method;
      })
    }));
  };

  const calculateAmounts = () => {
    // Calcular valores recebidos corretamente
    const totalPaid = formData.paymentMethods.reduce((sum, method) => {
      // Apenas pagamentos instantâneos são considerados recebidos
      if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') {
        return sum + method.amount;
      }
      // Cartão de crédito à vista é considerado recebido
      if (method.type === 'cartao_credito' && (!method.installments || method.installments === 1)) {
        return sum + method.amount;
      }
      // Cheques, boletos e cartão parcelado são sempre pendentes até serem compensados
      return sum;
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
    
    // Convert empty sellerId to null for UUID field
    const sellerId = formData.sellerId === '' ? null : formData.sellerId;
    
    onSubmit({
      ...formData,
      sellerId,
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {sale ? 'Editar Venda' : 'Nova Venda'}
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
                <label className="form-label">Descrição dos Produtos</label>
                <textarea
                  value={typeof formData.products === 'string' ? formData.products : 'Produtos vendidos'}
                  onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Descreva os produtos vendidos..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Campo opcional - deixe em branco se não quiser especificar
                </p>
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

                      {method.type === 'cheque' && (
                        <>
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={method.isThirdPartyCheck || false}
                                onChange={(e) => updatePaymentMethod(index, 'isThirdPartyCheck', e.target.checked)}
                                className="rounded"
                              />
                              <span className="form-label mb-0">Cheques de Terceiros</span>
                            </label>
                            <p className="text-xs text-blue-600 mt-1">
                              Marque se os cheques são de terceiros (será necessário preencher dados de cada cheque)
                            </p>
                          </div>
                          
                          {method.isThirdPartyCheck && method.installments && method.installments > 1 && (
                            <div className="md:col-span-2">
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-2 mb-4">
                                  <Info className="w-5 h-5 text-blue-600" />
                                  <h4 className="font-bold text-blue-900">
                                    Dados dos Cheques de Terceiros ({method.installments} cheques)
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => addThirdPartyCheck(index)}
                                    className="btn-secondary text-xs py-1 px-2"
                                  >
                                    Adicionar Cheque
                                  </button>
                                </div>
                                
                                {(!method.thirdPartyDetails || method.thirdPartyDetails.length < (method.installments || 1)) && (
                                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-700 font-medium">
                                      ⚠️ Você precisa adicionar {(method.installments || 1) - (method.thirdPartyDetails?.length || 0)} cheque(s) de terceiros
                                    </p>
                                  </div>
                                )}
                                
                                <div className="space-y-4">
                                  {(method.thirdPartyDetails || []).map((check, checkIndex) => (
                                    <div key={checkIndex} className="p-4 bg-white rounded-lg border border-blue-100">
                                      <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-blue-900">Cheque {checkIndex + 1}</h5>
                                        <button
                                          type="button"
                                          onClick={() => removeThirdPartyCheck(index, checkIndex)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">Banco *</label>
                                          <input
                                            type="text"
                                            value={check.bank}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'bank', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="Nome do banco"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">Agência *</label>
                                          <input
                                            type="text"
                                            value={check.agency}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'agency', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="0000"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">Conta *</label>
                                          <input
                                            type="text"
                                            value={check.account}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'account', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="00000-0"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">Nº do Cheque *</label>
                                          <input
                                            type="text"
                                            value={check.checkNumber}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'checkNumber', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="000000"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">Emissor *</label>
                                          <input
                                            type="text"
                                            value={check.issuer}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'issuer', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="Nome do emissor"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-blue-700">CPF/CNPJ *</label>
                                          <input
                                            type="text"
                                            value={check.cpfCnpj}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'cpfCnpj', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="000.000.000-00"
                                            required
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-xs font-medium text-blue-700">Observações</label>
                                          <input
                                            type="text"
                                            value={check.observations || ''}
                                            onChange={(e) => updateThirdPartyCheck(index, checkIndex, 'observations', e.target.value)}
                                            className="input-field text-sm"
                                            placeholder="Observações sobre o cheque"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {method.type === 'cheque' && !method.isThirdPartyCheck && (
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={method.isOwnCheck || false}
                              onChange={(e) => updatePaymentMethod(index, 'isOwnCheck', e.target.checked)}
                              className="rounded"
                            />
                            <span className="form-label mb-0">Cheque Próprio</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl">
                <h3 className="text-xl font-black text-green-800 mb-4">
                  Resumo da Venda
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Total:</span>
                    <p className="text-2xl font-black text-green-800">
                      R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Recebido:</span>
                    <p className="text-2xl font-black text-green-600">
                      R$ {calculateAmounts().receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Pendente:</span>
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
                {sale ? 'Atualizar Venda' : 'Criar Venda'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}