import React, { useState, useMemo } from 'react';
import { X, DollarSign, Calendar, CreditCard, Check, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Acerto, Sale, Permuta } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { getCurrentDateString } from '../../utils/dateUtils';
import { safeNumber } from '../../utils/numberUtils';

interface AcertoPaymentFormProps {
  acerto: Acerto;
  onSubmit: (paymentData: any) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'permuta', label: 'Permuta (Troca de Veículo)' },
  { value: 'transferencia', label: 'Transferência' }
];

export function AcertoPaymentForm({ acerto, onSubmit, onCancel }: AcertoPaymentFormProps) {
  const { sales, permutas } = useAppContext();
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
  const [paymentMethods, setPaymentMethods] = useState([
    { type: 'dinheiro' as const, amount: 0, installments: 1, installmentInterval: 30, firstInstallmentDate: getCurrentDateString() }
  ]);

  // Obter vendas relacionadas a este acerto (vendas com método de pagamento "acerto" deste cliente)
  const relatedSales = useMemo(() => {
    return sales.filter(sale => {
      return sale.paymentMethods?.some(method => method.type === 'acerto') &&
             sale.client.toLowerCase() === acerto.clientName.toLowerCase() &&
             sale.pendingAmount > 0; // Apenas vendas com saldo pendente
    });
  }, [sales, acerto.clientName]);

  // Calcular total das vendas selecionadas
  const selectedTotal = useMemo(() => {
    return Array.from(selectedSaleIds).reduce((sum, saleId) => {
      const sale = relatedSales.find(s => s.id === saleId);
      return sum + (sale ? sale.pendingAmount : 0);
    }, 0);
  }, [selectedSaleIds, relatedSales]);

  // Calcular total dos métodos de pagamento
  const paymentTotal = useMemo(() => {
    return paymentMethods.reduce((sum, method) => sum + safeNumber(method.amount, 0), 0);
  }, [paymentMethods]);

  // Filtrar permutas com crédito disponível
  const availablePermutas = useMemo(() => {
    return permutas.filter(permuta =>
      permuta.status === 'ativo' &&
      permuta.remainingValue > 0
    );
  }, [permutas]);

  const toggleSaleSelection = (saleId: string) => {
    const newSelection = new Set(selectedSaleIds);
    if (newSelection.has(saleId)) {
      newSelection.delete(saleId);
    } else {
      newSelection.add(saleId);
    }
    setSelectedSaleIds(newSelection);
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, {
      type: 'dinheiro',
      amount: 0,
      installments: 1,
      installmentInterval: 30,
      firstInstallmentDate: getCurrentDateString()
    }]);
  };

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    setPaymentMethods(paymentMethods.map((method, i) => {
      if (i === index) {
        return { ...method, [field]: value };
      }
      return method;
    }));
  };

  const handleProceedToPayment = () => {
    if (selectedSaleIds.size === 0) {
      alert('Por favor, selecione pelo menos uma venda para pagar.');
      return;
    }

    // Auto-preencher primeiro método com o total
    const updated = [...paymentMethods];
    if (updated[0]) {
      updated[0].amount = selectedTotal;
    }
    setPaymentMethods(updated);
    setStep('payment');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSaleIds.size === 0) {
      alert('Por favor, selecione pelo menos uma venda para pagar.');
      return;
    }

    if (paymentTotal === 0) {
      alert('O valor total do pagamento deve ser maior que zero.');
      return;
    }

    if (Math.abs(paymentTotal - selectedTotal) > 0.01) {
      alert(`O valor total dos pagamentos (R$ ${paymentTotal.toFixed(2)}) deve ser igual ao total selecionado (R$ ${selectedTotal.toFixed(2)}).`);
      return;
    }

    const paymentData = {
      selectedSaleIds: Array.from(selectedSaleIds),
      paymentAmount: selectedTotal,
      paymentDate: getCurrentDateString(),
      paymentMethods: paymentMethods,
      observations: `Pagamento de ${selectedSaleIds.size} venda(s)`
    };

    console.log('📝 Enviando pagamento de acerto:', paymentData);
    onSubmit(paymentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
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

          {step === 'select' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-slate-900">Selecione as Vendas para Pagar</h3>
                <span className="text-sm text-slate-600">
                  {selectedSaleIds.size} venda(s) selecionada(s)
                </span>
              </div>

              {relatedSales.length > 0 ? (
                <div className="space-y-4">
                  {relatedSales.map(sale => (
                    <div
                      key={sale.id}
                      onClick={() => toggleSaleSelection(sale.id)}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedSaleIds.has(sale.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            selectedSaleIds.has(sale.id)
                              ? 'bg-green-600'
                              : 'bg-slate-200'
                          }`}>
                            {selectedSaleIds.has(sale.id) ? (
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            ) : (
                              <FileText className="w-6 h-6 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-lg">
                              Venda de {new Date(sale.date).toLocaleDateString('pt-BR')}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              Produtos: {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-slate-700">
                                <strong>Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-sm text-orange-600 font-bold">
                                Pendente: R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-orange-600">
                            R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 font-medium">Nenhuma venda pendente encontrada para este cliente</p>
                </div>
              )}

              {selectedSaleIds.size > 0 && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl sticky bottom-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-green-900">
                        Total Selecionado: R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-sm text-green-700">{selectedSaleIds.size} venda(s) selecionada(s)</p>
                    </div>
                    <button
                      onClick={handleProceedToPayment}
                      className="btn-primary flex items-center gap-2"
                    >
                      Prosseguir para Pagamento
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-slate-900">Formas de Pagamento</h3>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="btn-secondary flex items-center gap-2"
                >
                  Voltar à Seleção
                </button>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 mb-6">
                <h4 className="font-bold text-blue-900 mb-2">Vendas Selecionadas</h4>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">{selectedSaleIds.size} venda(s)</span>
                  <span className="text-2xl font-black text-blue-900">
                    R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="p-6 border-2 border-slate-200 rounded-2xl bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-slate-900">Método {index + 1}</h4>
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Forma de Pagamento</label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          className="input-field"
                          required
                        >
                          {PAYMENT_METHODS.map(pm => (
                            <option key={pm.value} value={pm.value}>{pm.label}</option>
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
                          required
                        />
                      </div>

                      {['cartao_credito', 'cheque', 'boleto'].includes(method.type) && (
                        <>
                          <div>
                            <label className="form-label">Número de Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              value={method.installments}
                              onChange={(e) => updatePaymentMethod(index, 'installments', parseInt(e.target.value) || 1)}
                              className="input-field"
                            />
                          </div>

                          {method.installments > 1 && (
                            <>
                              <div>
                                <label className="form-label">Intervalo (dias)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={method.installmentInterval}
                                  onChange={(e) => updatePaymentMethod(index, 'installmentInterval', parseInt(e.target.value) || 30)}
                                  className="input-field"
                                />
                              </div>

                              <div>
                                <label className="form-label">Data da Primeira Parcela</label>
                                <input
                                  type="date"
                                  value={method.firstInstallmentDate}
                                  onChange={(e) => updatePaymentMethod(index, 'firstInstallmentDate', e.target.value)}
                                  className="input-field"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {method.type === 'permuta' && (
                        <div className="md:col-span-2">
                          <label className="form-label">Selecione o Veículo</label>
                          <select
                            value={method.vehicleId || ''}
                            onChange={(e) => updatePaymentMethod(index, 'vehicleId', e.target.value)}
                            className="input-field"
                            required
                          >
                            <option value="">Selecione um veículo...</option>
                            {availablePermutas.map(permuta => (
                              <option key={permuta.id} value={permuta.id}>
                                {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear} -
                                Disponível: R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {method.type === 'cartao_debito' && (
                        <div className="md:col-span-2">
                          <label className="form-label">Valor Real Recebido (após taxas do banco)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={method.actualAmount || method.amount}
                            onChange={(e) => updatePaymentMethod(index, 'actualAmount', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            placeholder="Valor que caiu na conta"
                          />
                          <p className="text-xs text-slate-600 mt-1">
                            Informe o valor real que entrou na conta, já descontando as taxas do banco
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPaymentMethod}
                  className="btn-secondary w-full"
                >
                  + Adicionar Forma de Pagamento
                </button>
              </div>

              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl">
                <h3 className="text-xl font-black text-green-800 mb-4">Resumo do Pagamento</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Total Selecionado:</span>
                    <p className="text-2xl font-black text-green-800">
                      R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Total Pagando:</span>
                    <p className="text-2xl font-black text-green-600">
                      R$ {paymentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Diferença:</span>
                    <p className={`text-2xl font-black ${Math.abs(paymentTotal - selectedTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {Math.abs(paymentTotal - selectedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {Math.abs(paymentTotal - selectedTotal) > 0.01 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                    <p className="text-sm text-yellow-800 font-semibold text-center">
                      ⚠️ O total dos pagamentos deve ser igual ao total selecionado!
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={Math.abs(paymentTotal - selectedTotal) > 0.01}
                >
                  Registrar Pagamento
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
