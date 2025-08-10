import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Debt, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';

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

const INSTALLMENT_TYPES = ['cartao_credito', 'cheque', 'boleto'];

export function DebtForm({ debt, onSubmit, onCancel }: DebtFormProps) {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    date: debt?.date || new Date().toISOString().split('T')[0],
    description: debt?.description || '',
    company: debt?.company || '',
    totalValue: debt?.totalValue || 0,
    paymentMethods: debt?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    isPaid: debt?.isPaid || false,
    checksUsed: debt?.checksUsed || [],
    paymentDescription: debt?.paymentDescription || '',
    debtPaymentDescription: debt?.debtPaymentDescription || '',
    useOwnCheck: false,
    ownCheckDiscountDate: new Date().toISOString().split('T')[0]
  });

  // Get available checks from sales that have check payment method
  const availableChecks = state.checks.filter(check => 
    !check.usedInDebt && // Não usado em outras dívidas
    !formData.checksUsed.includes(check.id)
  );

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
          
          if (field === 'installments' && value > 1) {
            updatedMethod.installmentValue = method.amount / value;
          }
          
          if (field === 'type' && !INSTALLMENT_TYPES.includes(value)) {
            delete updatedMethod.installments;
            delete updatedMethod.installmentValue;
            delete updatedMethod.installmentInterval;
            delete updatedMethod.startDate;
          }
          
          return updatedMethod;
        }
        return method;
      })
    }));
  };

  const toggleCheckUsed = (saleId: string) => {
    setFormData(prev => ({
      ...prev,
      checksUsed: prev.checksUsed.includes(saleId)
        ? prev.checksUsed.filter(id => id !== saleId)
        : [...prev.checksUsed, saleId]
    }));
  };

  const hasCheckPayment = formData.paymentMethods.some(method => method.type === 'cheque');
  
  const calculateAmounts = () => {
    // Calcular valor pago baseado nos cheques selecionados
    const checksValue = formData.checksUsed.reduce((sum, checkId) => {
      const check = state.checks.find(c => c.id === checkId);
      return sum + (check ? check.value : 0);
    }, 0);
    
    const totalPaid = formData.isPaid ? formData.totalValue : checksValue;
    const pending = formData.totalValue - totalPaid;
    
    return {
      paidAmount: totalPaid,
      pendingAmount: Math.max(0, pending)
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amounts = calculateAmounts();
    
    onSubmit({
      ...formData,
      ...amounts
    } as Omit<Debt, 'id' | 'createdAt'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {debt ? 'Editar Dívida' : 'Nova Dívida'}
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
                <label className="form-label">Valor Total *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
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
                  placeholder="Descreva a dívida ou gasto"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Empresa/Fornecedor *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="input-field"
                  placeholder="Nome da empresa ou fornecedor que vai ser pago"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="form-label mb-0">Dívida foi paga</span>
                </label>
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
                          value={method.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0,00"
                        />
                      </div>

                      {method.type === 'cheque' && (
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
                                  value={method.installmentValue || 0}
                                  onChange={(e) => updatePaymentMethod(index, 'installmentValue', parseFloat(e.target.value) || 0)}
                                  className="input-field"
                                  placeholder="0,00"
                                />
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
                                <label className="form-label">Data de Início</label>
                                <input
                                  type="date"
                                  value={method.startDate || formData.date}
                                  onChange={(e) => updatePaymentMethod(index, 'startDate', e.target.value)}
                                  className="input-field"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Check Payment Description - Required when check payment is selected */}
            {hasCheckPayment && (
              <div>
                <div className="form-group">
                  <label className="form-label">Descrição do Pagamento com Cheque *</label>
                  <textarea
                    value={formData.paymentDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDescription: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Descreva exatamente como será feito o pagamento com cheque (obrigatório)"
                    required
                  />
                </div>

                {/* Cheque Próprio Option */}
                <div className="mb-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.useOwnCheck || false}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        useOwnCheck: e.target.checked,
                        checksUsed: e.target.checked ? [] : prev.checksUsed
                      }))}
                      className="rounded"
                    />
                    <span className="form-label mb-0">Cheque Próprio</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Marque esta opção se for usar um cheque próprio (desativa a seleção de cheques disponíveis)
                  </p>
                  
                  {formData.useOwnCheck && (
                    <div className="mt-4">
                      <label className="form-label">Data de Desconto do Cheque Próprio *</label>
                      <input
                        type="date"
                        value={formData.ownCheckDiscountDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, ownCheckDiscountDate: e.target.value }))}
                        className="input-field"
                        required
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Data em que o cheque próprio será descontado
                      </p>
                    </div>
                  )}
                </div>

                {/* Available Checks - Only show if not using own check */}
                {!formData.useOwnCheck && availableChecks.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-3">Cheques Quitados Disponíveis para Pagamento</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableChecks.map(check => (
                        <label key={check.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.checksUsed.includes(check.id)}
                            onChange={() => toggleCheckUsed(check.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{check.client}</span>
                                <div className="text-sm text-gray-600">
                                  Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {check.installmentNumber && check.totalInstallments && (
                                    `Parcela ${check.installmentNumber}/${check.totalInstallments}`
                                  )}
                                </div>
                                <div className={`text-sm font-medium ${
                                  check.status === 'compensado' ? 'text-green-600' :
                                  check.status === 'pendente' ? 'text-yellow-600' :
                                  check.status === 'devolvido' ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  Status: {check.status === 'compensado' ? 'Compensado ✓' :
                                          check.status === 'pendente' ? 'Pendente ⏳' :
                                          check.status === 'devolvido' ? 'Devolvido ❌' :
                                          'Reapresentado 🔄'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Usado em: {check.usedFor || 'Não especificado'}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Resumo</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total:</span>
                  <p className="font-medium">R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-gray-600">Pago:</span>
                  <p className="font-medium text-green-600">
                    R$ {calculateAmounts().paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Pendente:</span>
                  <p className="font-medium text-red-600">
                    R$ {calculateAmounts().pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {debt ? 'Atualizar' : 'Salvar'} Dívida
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}