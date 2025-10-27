import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Info } from 'lucide-react';
import { Sale, PaymentMethod } from '../../types';
import { ThirdPartyCheckDetails } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { safeNumber, validateFormNumber, logMonetaryValues } from '../../utils/numberUtils';
import { formatDateForInput, parseInputDate } from '../../utils/dateUtils';
import { getCurrentDateString } from '../../utils/dateUtils';

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
  { value: 'transferencia', label: 'Transferência' },
  { value: 'acerto', label: 'Acerto (Pagamento Mensal)' },
  { value: 'permuta', label: 'Permuta (Troca de Veículo)' }
];

const INSTALLMENT_TYPES = ['cartao_credito', 'cheque', 'boleto'];

export function SaleForm({ sale, onSubmit, onCancel }: SaleFormProps) {
  const { employees, permutas, acertos } = useAppContext();
  const [formData, setFormData] = useState({
    date: sale?.date || getCurrentDateString(),
    deliveryDate: sale?.deliveryDate || '',
    client: sale?.client || '',
    sellerId: sale?.sellerId || '',
    customCommissionRate: safeNumber(sale?.customCommissionRate, 5),
    products: sale?.products || 'Produtos vendidos', // Simplified to string
    observations: sale?.observations || '',
    totalValue: safeNumber(sale?.totalValue, 0),
    paymentMethods: (sale?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }]).map(method => ({
      ...method,
      amount: safeNumber(method.amount, 0),
      installmentValue: safeNumber(method.installmentValue, 0),
      installments: safeNumber(method.installments, 1),
      installmentInterval: safeNumber(method.installmentInterval, 30),
      useCustomValues: method.useCustomValues || false,
      customInstallmentValues: method.customInstallmentValues || []
    })),
    paymentDescription: sale?.paymentDescription || '',
    paymentObservations: sale?.paymentObservations || ''
  });

  // Filtrar apenas vendedores ativos
  const sellers = employees.filter(emp => emp.isActive && emp.isSeller);

  // Filtrar permutas com crédito disponível
  // Não precisa ser do mesmo cliente - qualquer permuta com crédito disponível pode ser usada
  const availablePermutas = React.useMemo(() => {
    return permutas.filter(permuta =>
      permuta.status === 'ativo' &&
      permuta.remainingValue > 0
    );
  }, [permutas]);

  // Obter lista de clientes com acerto ativo
  const clientesComAcerto = useMemo(() => {
    const clientSet = new Set<string>();
    acertos.filter(acerto => acerto.type === 'cliente').forEach(acerto => {
      clientSet.add(acerto.clientName);
    });
    return Array.from(clientSet).sort();
  }, [acertos]);

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

          // Sanitize numeric values
          if (field === 'amount') {
            updatedMethod.amount = safeNumber(value, 0);
          }
          if (field === 'installments') {
            updatedMethod.installments = safeNumber(value, 1);
            // Initialize custom values array when installments change
            if (updatedMethod.useCustomValues) {
              const newInstallments = safeNumber(value, 1);
              const installmentValue = safeNumber(method.amount, 0) / newInstallments;
              updatedMethod.customInstallmentValues = Array(newInstallments).fill(installmentValue);
            }
          }
          if (field === 'installmentInterval') {
            updatedMethod.installmentInterval = safeNumber(value, 30);
          }

          // Handle custom values toggle
          if (field === 'useCustomValues') {
            if (value) {
              // Initialize custom values array with equal distribution
              const numInstallments = safeNumber(method.installments, 1);
              const installmentValue = safeNumber(method.amount, 0) / numInstallments;
              updatedMethod.customInstallmentValues = Array(numInstallments).fill(installmentValue);
            } else {
              // Clear custom values
              updatedMethod.customInstallmentValues = [];
            }
          }

          // Calculate installment value when installments change (for non-custom mode)
          if (field === 'installments' && safeNumber(value, 1) > 1 && !updatedMethod.useCustomValues) {
            updatedMethod.installmentValue = safeNumber(method.amount, 0) / safeNumber(value, 1);
          } else if (field === 'amount' && safeNumber(method.installments, 1) > 1 && !updatedMethod.useCustomValues) {
            // Recalculate installment value when amount changes
            updatedMethod.installmentValue = safeNumber(value, 0) / safeNumber(method.installments, 1);
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
            delete updatedMethod.isOwnCheck;
            delete updatedMethod.useCustomValues;
            delete updatedMethod.customInstallmentValues;
          }

          return updatedMethod;
        }
        return method;
      })
    }));
  };

  const updateCustomInstallmentValue = (methodIndex: number, installmentIndex: number, value: number) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === methodIndex && method.customInstallmentValues) {
          const newCustomValues = [...method.customInstallmentValues];
          newCustomValues[installmentIndex] = safeNumber(value, 0);
          return {
            ...method,
            customInstallmentValues: newCustomValues
          };
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
      const methodAmount = safeNumber(method.amount, 0);
      // Apenas pagamentos instantâneos são considerados recebidos
      if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') {
        return sum + methodAmount;
      }
      // Cartão de crédito à vista é considerado recebido
      if (method.type === 'cartao_credito' && safeNumber(method.installments, 1) === 1) {
        return sum + methodAmount;
      }
      // Permuta é tratada como "recebida" (troca de produto, não dinheiro a receber)
      if (method.type === 'permuta') {
        return sum + methodAmount;
      }
      // Acerto também é tratado como recebido (será cobrado depois no acerto mensal)
      if (method.type === 'acerto') {
        return sum + methodAmount;
      }
      // Cheques, boletos e cartão parcelado são sempre pendentes até serem compensados
      return sum;
    }, 0);

    const totalValue = safeNumber(formData.totalValue, 0);
    const pending = totalValue - totalPaid;

    return {
      receivedAmount: totalPaid,
      pendingAmount: Math.max(0, pending),
      status: pending <= 0.01 ? 'pago' : (totalPaid > 0 ? 'parcial' : 'pendente')
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações mais rigorosas
    if (!formData.client || !formData.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    // Garantir que totalValue seja um número válido e maior que zero
    const totalValue = safeNumber(formData.totalValue, 0);
    if (totalValue <= 0) {
      alert('O valor total da venda deve ser maior que zero.');
      return;
    }
    
    if (!formData.paymentMethods || formData.paymentMethods.length === 0) {
      alert('Por favor, adicione pelo menos um método de pagamento.');
      return;
    }
    
    // Validar se há pelo menos um método de pagamento com valor
    const totalPaymentAmount = formData.paymentMethods.reduce((sum, method) => sum + safeNumber(method.amount, 0), 0);
    if (totalPaymentAmount === 0) {
      alert('Por favor, informe pelo menos um método de pagamento com valor maior que zero.');
      return;
    }
    
    // Validar se o total dos métodos de pagamento não excede o valor total da venda
    if (totalPaymentAmount > totalValue) {
      alert('O total dos métodos de pagamento não pode ser maior que o valor total da venda.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    for (const method of formData.paymentMethods) {
      if (!method.type || typeof method.type !== 'string') {
        alert('Todos os métodos de pagamento devem ter um tipo válido.');
        return;
      }
      const methodAmount = safeNumber(method.amount, 0);
      if (methodAmount < 0) {
        alert('Todos os métodos de pagamento devem ter um valor válido.');
        return;
      }
      
      // Validar parcelas para métodos que suportam
      if (INSTALLMENT_TYPES.includes(method.type) && safeNumber(method.installments, 1) > 1) {
        if (safeNumber(method.installmentValue, 0) <= 0) {
          alert(`Valor da parcela deve ser maior que zero para ${method.type}.`);
          return;
        }
        if (safeNumber(method.installmentInterval, 0) <= 0) {
          alert(`Intervalo entre parcelas deve ser maior que zero para ${method.type}.`);
          return;
        }
      }
      
      // Validar cheques de terceiros
      if (method.type === 'cheque' && method.isThirdPartyCheck && safeNumber(method.installments, 1) > 1) {
        const requiredChecks = safeNumber(method.installments, 1);
        if (!method.thirdPartyDetails || method.thirdPartyDetails.length < requiredChecks) {
          alert(`Você deve adicionar ${requiredChecks} cheque(s) de terceiros para este método de pagamento.`);
          return;
        }

        // Validar dados de cada cheque de terceiros
        for (let i = 0; i < method.thirdPartyDetails.length; i++) {
          const check = method.thirdPartyDetails[i];
          if (!check.bank || !check.agency || !check.account || !check.checkNumber || !check.issuer || !check.cpfCnpj) {
            alert(`Por favor, preencha todos os campos obrigatórios do cheque ${i + 1}.`);
            return;
          }
        }
      }

      // Validar permuta - veículo selecionado e crédito disponível
      if (method.type === 'permuta') {
        if (!method.vehicleId) {
          alert('Por favor, selecione um veículo para a permuta.');
          return;
        }

        const selectedVehicle = availablePermutas.find(p => p.id === method.vehicleId);
        if (!selectedVehicle) {
          alert('Veículo selecionado não encontrado. Por favor, selecione outro veículo.');
          return;
        }

        if (methodAmount > selectedVehicle.remainingValue) {
          alert(`O valor da permuta (R$ ${methodAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o crédito disponível no veículo (R$ ${selectedVehicle.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Por favor, ajuste o valor ou selecione outro veículo.`);
          return;
        }
      }

      // Validar acerto - cliente selecionado
      if (method.type === 'acerto') {
        if (!method.acertoClientName && !formData.client.trim()) {
          alert('Por favor, informe o nome do cliente para criar o acerto.');
          return;
        }
      }
    }
    
    // Validar produtos
    if (!formData.products || (typeof formData.products === 'string' && !formData.products.trim())) {
      formData.products = 'Produtos vendidos';
    }
    
    const amounts = calculateAmounts();
    
    // Adicionar descrição do pagamento às observações se fornecida
    let finalObservations = formData.observations;
    if (formData.paymentObservations.trim()) {
      finalObservations = finalObservations 
        ? `${finalObservations}\n\nDescrição do Pagamento: ${formData.paymentObservations}`
        : `Descrição do Pagamento: ${formData.paymentObservations}`;
    }
    
    // Convert empty sellerId to null for UUID field
    const sellerId = !formData.sellerId || formData.sellerId.trim() === '' ? null : formData.sellerId.trim();
    
    // Limpar dados antes de enviar
    const cleanedPaymentMethods = formData.paymentMethods.map(method => {
      const cleaned: PaymentMethod = { ...method };
      
      // Garantir campos obrigatórios
      if (!cleaned.type) cleaned.type = 'dinheiro';
      cleaned.amount = safeNumber(cleaned.amount, 0);
      
      // Sanitize numeric fields
      if (cleaned.installments) cleaned.installments = safeNumber(cleaned.installments, 1);
      if (cleaned.installmentValue) cleaned.installmentValue = safeNumber(cleaned.installmentValue, 0);
      if (cleaned.installmentInterval) cleaned.installmentInterval = safeNumber(cleaned.installmentInterval, 30);
      
      // Limpar campos opcionais vazios
      if (safeNumber(cleaned.installments, 1) === 1) {
        delete cleaned.installments;
        delete cleaned.installmentValue;
        delete cleaned.installmentInterval;
        delete cleaned.startDate;
        delete cleaned.firstInstallmentDate;
      }
      
      // Limpar campos específicos de cheques se não for cheque
      if (cleaned.type !== 'cheque') {
        delete cleaned.isOwnCheck;
        delete cleaned.isThirdPartyCheck;
        delete cleaned.thirdPartyDetails;
      }
      
      // Limpar strings vazias
      Object.keys(cleaned).forEach(key => {
        const value = cleaned[key as keyof PaymentMethod];
        if (typeof value === 'string' && value.trim() === '') {
          delete cleaned[key as keyof PaymentMethod];
        }
        // Limpar arrays vazios
        if (Array.isArray(value) && value.length === 0) {
          delete cleaned[key as keyof PaymentMethod];
        }
      });
      
      return cleaned;
    });
    
    // Validar que os dados limpos ainda são válidos
    if (cleanedPaymentMethods.length === 0) {
      alert('Erro na validação dos métodos de pagamento.');
      return;
    }
    
    // Limpar deliveryDate - converter string vazia para null
    const deliveryDate = !formData.deliveryDate || formData.deliveryDate.trim() === '' ? null : formData.deliveryDate;
    
    // Limpar observations - converter string vazia para null
    const cleanedObservations = !finalObservations || finalObservations.trim() === '' ? null : finalObservations.trim();
    
    // Limpar products - garantir que seja string ou null
    const cleanedProducts = !formData.products || (typeof formData.products === 'string' && formData.products.trim() === '') 
      ? null 
      : (typeof formData.products === 'string' ? formData.products.trim() : 'Produtos vendidos');
    
    const saleToSubmit = {
      ...formData,
      date: parseInputDate(formData.date),
      totalValue: safeNumber(formData.totalValue, 0),
      sellerId: sellerId,
      deliveryDate: deliveryDate,
      paymentMethods: cleanedPaymentMethods,
      observations: cleanedObservations,
      products: cleanedProducts,
      paymentDescription: !formData.paymentDescription || formData.paymentDescription.trim() === '' ? null : formData.paymentDescription.trim(),
      paymentObservations: !formData.paymentObservations || formData.paymentObservations.trim() === '' ? null : formData.paymentObservations.trim(),
      ...amounts
    };
    
    logMonetaryValues(saleToSubmit, 'Sale Form Submit');
    
    // Validação final antes do envio
    if (!saleToSubmit.client || safeNumber(saleToSubmit.totalValue, 0) <= 0 || !saleToSubmit.paymentMethods) {
      alert('Dados da venda incompletos. Verifique todos os campos obrigatórios.');
      return;
    }
    
    console.log('📝 Enviando venda:', saleToSubmit);
    onSubmit(saleToSubmit as Omit<Sale, 'id' | 'createdAt'>);
  };

  // Auto-update payment method amount when total value changes
  useEffect(() => {
    if (formData.paymentMethods.length === 1 && safeNumber(formData.paymentMethods[0].amount, 0) === 0) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: [{
          ...prev.paymentMethods[0],
          amount: safeNumber(prev.totalValue, 0)
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
                  value={safeNumber(formData.totalValue, 0)}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalValue: safeNumber(e.target.value, 0) }))}
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
                          value={safeNumber(method.amount, 0)}
                          onChange={(e) => updatePaymentMethod(index, 'amount', safeNumber(e.target.value, 0))}
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
                              value={safeNumber(method.installments, 1)}
                              onChange={(e) => updatePaymentMethod(index, 'installments', safeNumber(e.target.value, 1))}
                              className="input-field"
                            />
                          </div>

                          {safeNumber(method.installments, 1) > 1 && (
                            <>
                              <div className="md:col-span-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={method.useCustomValues || false}
                                    onChange={(e) => updatePaymentMethod(index, 'useCustomValues', e.target.checked)}
                                    className="rounded"
                                  />
                                  <span className="form-label mb-0">Valores personalizados?</span>
                                </label>
                                <p className="text-xs text-blue-600 mt-1">
                                  Marque para definir valores diferentes para cada parcela
                                </p>
                              </div>

                              {!method.useCustomValues && safeNumber(method.installments, 1) > 1 && (
                                <div>
                                  <label className="form-label">Valor por Parcela</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={safeNumber(method.installmentValue, 0)}
                                    onChange={(e) => updatePaymentMethod(index, 'installmentValue', safeNumber(e.target.value, 0))}
                                    className="input-field"
                                    placeholder="0,00"
                                    readOnly
                                  />
                                  <p className="text-xs text-blue-600 mt-1 font-bold">
                                    ✓ Calculado automaticamente: R$ {safeNumber(method.amount, 0) && safeNumber(method.installments, 1) ? (safeNumber(method.amount, 0) / safeNumber(method.installments, 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'} por parcela
                                  </p>
                                </div>
                              )}

                              {method.useCustomValues && method.customInstallmentValues && (
                                <div className="md:col-span-2">
                                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <h4 className="font-semibold text-blue-900 mb-3">
                                      Valores de Cada Parcela
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {method.customInstallmentValues.map((value, installmentIndex) => (
                                        <div key={installmentIndex}>
                                          <label className="text-xs font-medium text-blue-700">
                                            Parcela {installmentIndex + 1}
                                          </label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={safeNumber(value, 0)}
                                            onChange={(e) => updateCustomInstallmentValue(index, installmentIndex, safeNumber(e.target.value, 0))}
                                            className="input-field text-sm"
                                            placeholder="0,00"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-xs text-blue-600 mt-3 font-bold">
                                      Total das parcelas: R$ {method.customInstallmentValues.reduce((sum, val) => sum + safeNumber(val, 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="form-label">Intervalo (dias)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={safeNumber(method.installmentInterval, 30)}
                                  onChange={(e) => updatePaymentMethod(index, 'installmentInterval', safeNumber(e.target.value, 30))}
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
                          {(method.type === 'cheque' || method.type === 'boleto') && safeNumber(method.installments, 1) === 1 && (
                            <div>
                              <label className="form-label">Data de Vencimento/Pagamento *</label>
                              <input
                                type="date"
                                value={method.firstInstallmentDate || getCurrentDateString()}
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

                      {method.type === 'acerto' && (
                        <div className="md:col-span-2">
                             <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-300 shadow-lg">
                               <div className="flex items-center gap-3 mb-4">
                                 <div className="p-2 bg-blue-600 rounded-lg">
                                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                   </svg>
                                 </div>
                                 <div>
                                   <h4 className="font-bold text-blue-900 text-lg">
                                     Acerto (Pagamento Mensal)
                                   </h4>
                                   <p className="text-sm text-blue-700">Selecione o grupo de acerto deste cliente</p>
                                 </div>
                               </div>

                               {clientesComAcerto.length > 0 ? (
                                 <div className="space-y-3">
                                   <div>
                                     <label className="form-label text-blue-800 font-semibold mb-2">Selecione o Grupo de Acerto *</label>
                                     <select
                                       value={method.acertoClientName || ''}
                                       onChange={(e) => {
                                         updatePaymentMethod(index, 'acertoClientName', e.target.value);
                                         // Sincronizar o nome do cliente principal se estiver vazio
                                         if (!formData.client || formData.client.trim() === '') {
                                           setFormData(prev => ({ ...prev, client: e.target.value }));
                                         }
                                       }}
                                       className="input-field bg-white border-2 border-blue-300 focus:border-blue-500 text-lg font-medium"
                                       required
                                     >
                                       <option value="">🔍 Selecione um cliente com acerto...</option>
                                       {clientesComAcerto.map(cliente => (
                                         <option key={cliente} value={cliente}>
                                           👤 {cliente}
                                         </option>
                                       ))}
                                       <option value="__novo__">➕ Novo Cliente (usar o nome informado acima)</option>
                                     </select>
                                   </div>

                                   {method.acertoClientName && method.acertoClientName !== '__novo__' && (
                                     <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 shadow-md">
                                       <div className="flex items-start gap-3">
                                         <div className="p-2 bg-green-600 rounded-full mt-0.5">
                                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                           </svg>
                                         </div>
                                         <div className="flex-1">
                                           <p className="text-base text-green-900 font-bold">
                                             Venda será adicionada ao acerto do cliente "{method.acertoClientName}"
                                           </p>
                                           <p className="text-sm text-green-700 mt-1">
                                             💰 Valor de R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será adicionado ao saldo pendente
                                           </p>
                                           <p className="text-xs text-green-600 mt-2">
                                             📋 O cliente pagará este valor junto com outras vendas na aba "Acertos"
                                           </p>
                                         </div>
                                       </div>
                                     </div>
                                   )}

                                   {method.acertoClientName === '__novo__' && (
                                     <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 shadow-md">
                                       <div className="flex items-start gap-3">
                                         <div className="p-2 bg-amber-600 rounded-full mt-0.5">
                                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                           </svg>
                                         </div>
                                         <div className="flex-1">
                                           <p className="text-base text-amber-900 font-bold">
                                             Novo grupo de acerto será criado para "{formData.client}"
                                           </p>
                                           <p className="text-sm text-amber-700 mt-1">
                                             💰 Valor inicial: R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                           </p>
                                           <p className="text-xs text-amber-600 mt-2">
                                             ⚠️ Certifique-se de que o nome do cliente "{formData.client}" está correto
                                           </p>
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               ) : (
                                 <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 shadow-md">
                                   <div className="flex items-start gap-3">
                                     <div className="p-2 bg-amber-600 rounded-full mt-0.5">
                                       <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                       </svg>
                                     </div>
                                     <div className="flex-1">
                                       <p className="text-base text-amber-900 font-bold">
                                         Primeiro acerto será criado para o cliente "{formData.client}"
                                       </p>
                                       <p className="text-sm text-amber-700 mt-1">
                                         💰 Valor inicial: R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </p>
                                       <p className="text-xs text-amber-600 mt-2">
                                         ⚠️ Este é o primeiro acerto. Certifique-se de que o nome do cliente está correto.
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         )}
                          
                          {method.type === 'permuta' && (
                            <div className="md:col-span-2">
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-100 rounded-xl border-2 border-purple-300 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-purple-600 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-purple-900 text-lg">
                                      Permuta (Troca de Veículo)
                                    </h4>
                                    <p className="text-sm text-purple-700">Selecione o veículo com crédito disponível</p>
                                  </div>
                                </div>

                                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-blue-900">📄 Total de permutas:</span>
                                    <span className="font-bold text-blue-700">{permutas.length}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="font-semibold text-green-900">✅ Com crédito disponível:</span>
                                    <span className="font-bold text-green-700">{availablePermutas.length}</span>
                                  </div>
                                </div>

                                {availablePermutas.length > 0 ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="form-label text-purple-800 font-semibold mb-2">Selecione o Veículo *</label>
                                      <select
                                        value={method.vehicleId || ''}
                                        onChange={(e) => updatePaymentMethod(index, 'vehicleId', e.target.value)}
                                        className="input-field bg-white border-2 border-purple-300 focus:border-purple-500 text-lg font-medium"
                                        required
                                      >
                                        <option value="">🚗 Selecione um veículo com crédito...</option>
                                        {availablePermutas.map(permuta => (
                                          <option key={permuta.id} value={permuta.id}>
                                            🚙 {permuta.vehicleMake} {permuta.vehicleModel} {permuta.vehicleYear} ({permuta.vehiclePlate}) -
                                            Disponível: R$ {permuta.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {method.vehicleId && (
                                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 shadow-md">
                                        {(() => {
                                          const selectedVehicle = availablePermutas.find(p => p.id === method.vehicleId);
                                          if (!selectedVehicle) return null;

                                          const percentUsed = (method.amount / selectedVehicle.remainingValue) * 100;
                                          const isExceeding = method.amount > selectedVehicle.remainingValue;

                                          return (
                                            <div>
                                              <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 bg-purple-600 rounded">
                                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                </div>
                                                <p className="font-bold text-purple-900 text-lg">
                                                  {selectedVehicle.vehicleMake} {selectedVehicle.vehicleModel} {selectedVehicle.vehicleYear}
                                                </p>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div className="p-2 bg-white rounded border border-purple-100">
                                                  <span className="text-xs text-purple-600 block">Placa</span>
                                                  <span className="font-bold text-purple-900">{selectedVehicle.vehiclePlate}</span>
                                                </div>
                                                <div className="p-2 bg-white rounded border border-purple-100">
                                                  <span className="text-xs text-purple-600 block">Cliente</span>
                                                  <span className="font-bold text-purple-900">{selectedVehicle.clientName}</span>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                                                <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                                                  <span className="text-xs text-blue-600 block mb-1">Valor Total</span>
                                                  <span className="font-bold text-blue-900">R$ {selectedVehicle.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                                                  <span className="text-xs text-orange-600 block mb-1">Já Usado</span>
                                                  <span className="font-bold text-orange-900">R$ {selectedVehicle.consumedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                                                  <span className="text-xs text-green-600 block mb-1">Disponível</span>
                                                  <span className="font-bold text-green-900">R$ {selectedVehicle.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                              </div>

                                              {!isExceeding && method.amount > 0 && (
                                                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded border-2 border-green-300">
                                                  <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-green-800">Usando desta permuta:</span>
                                                    <span className="text-lg font-bold text-green-900">R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-xs">
                                                    <span className="text-green-700">Restará após esta venda:</span>
                                                    <span className="font-bold text-green-800">R$ {(selectedVehicle.remainingValue - method.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                  </div>
                                                  <div className="mt-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, percentUsed)}%` }}></div>
                                                    </div>
                                                    <p className="text-xs text-center text-green-700 mt-1">{percentUsed.toFixed(1)}% do crédito disponível</p>
                                                  </div>
                                                </div>
                                              )}

                                              {isExceeding && (
                                                <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 rounded border-2 border-red-300">
                                                  <div className="flex items-start gap-2">
                                                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                      <p className="text-sm text-red-900 font-bold">
                                                        Valor excede o crédito disponível!
                                                      </p>
                                                      <p className="text-xs text-red-700 mt-1">
                                                        Você está tentando usar R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, mas o veículo tem apenas R$ {selectedVehicle.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponível.
                                                      </p>
                                                      <p className="text-xs text-red-600 mt-1 font-semibold">
                                                        Excesso: R$ {(method.amount - selectedVehicle.remainingValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-300 shadow-md">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 bg-yellow-600 rounded-full mt-0.5">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-base text-yellow-900 font-bold">
                                          Nenhum veículo disponível para permuta
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-2">
                                          Para usar permuta como pagamento, você precisa:
                                        </p>
                                        <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal space-y-1">
                                          <li>Ir na aba "Permutas"</li>
                                          <li>Registrar um veículo recebido em troca</li>
                                          <li>Garantir que o veículo tenha crédito disponível</li>
                                        </ol>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
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
                                    Dados dos Cheques de Terceiros ({safeNumber(method.installments, 1)} cheques)
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
                                      ⚠️ Você precisa adicionar {safeNumber(method.installments, 1) - (method.thirdPartyDetails?.length || 0)} cheque(s) de terceiros
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
                      R$ {safeNumber(formData.totalValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Recebido:</span>
                    <p className="text-2xl font-black text-green-600">
                      R$ {safeNumber(calculateAmounts().receivedAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-green-600 font-semibold block mb-1">Pendente:</span>
                    <p className="text-2xl font-black text-orange-600">
                      R$ {safeNumber(calculateAmounts().pendingAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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