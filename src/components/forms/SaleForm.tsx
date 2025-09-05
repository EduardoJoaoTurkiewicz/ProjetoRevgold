import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, DollarSign, User, Package, FileText, CreditCard, AlertCircle, Calculator, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Sale, PaymentMethod, ThirdPartyCheckDetails } from '../../types';
import { CreateSalePayload, SaleBoleto, SaleCheque, sanitizePayload, isValidUUID } from '../../lib/supabaseServices';
import { SalesDebugger } from '../../lib/debugUtils';

interface SaleFormProps {
  sale?: Sale | null;
  onSubmit: (sale: CreateSalePayload | Partial<Sale>) => void;
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

export default function SaleForm({ sale, onSubmit, onCancel }: SaleFormProps) {
  const { employees } = useAppContext();
  
  const [formData, setFormData] = useState({
    date: sale?.date || new Date().toISOString().split('T')[0],
    deliveryDate: sale?.deliveryDate || '',
    client: sale?.client || '',
    sellerId: sale?.sellerId || null,
    products: sale?.products || '',
    observations: sale?.observations || '',
    totalValue: sale?.totalValue || 0,
    paymentMethods: sale?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    paymentDescription: sale?.paymentDescription || '',
    paymentObservations: sale?.paymentObservations || '',
    custom_commission_rate: sale?.custom_commission_rate || 5.00,
    // New fields for boletos and cheques
    boletos: [] as SaleBoleto[],
    cheques: [] as SaleCheque[]
  });

  const activeEmployees = employees.filter(emp => emp.isActive);
  const sellers = activeEmployees.filter(emp => emp.isSeller);

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

  const addThirdPartyCheckDetail = (methodIndex: number) => {
    const method = formData.paymentMethods[methodIndex];
    const newDetail: ThirdPartyCheckDetails = {
      bank: '',
      agency: '',
      account: '',
      checkNumber: '',
      issuer: '',
      cpfCnpj: '',
      observations: ''
    };
    
    updatePaymentMethod(methodIndex, 'thirdPartyDetails', [
      ...(method.thirdPartyDetails || []),
      newDetail
    ]);
  };

  const updateThirdPartyCheckDetail = (methodIndex: number, detailIndex: number, field: string, value: string) => {
    const method = formData.paymentMethods[methodIndex];
    const updatedDetails = [...(method.thirdPartyDetails || [])];
    updatedDetails[detailIndex] = { ...updatedDetails[detailIndex], [field]: value };
    updatePaymentMethod(methodIndex, 'thirdPartyDetails', updatedDetails);
  };

  const removeThirdPartyCheckDetail = (methodIndex: number, detailIndex: number) => {
    const method = formData.paymentMethods[methodIndex];
    const updatedDetails = (method.thirdPartyDetails || []).filter((_, i) => i !== detailIndex);
    updatePaymentMethod(methodIndex, 'thirdPartyDetails', updatedDetails);
  };

  const calculateAmounts = () => {
    const totalPayments = formData.paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
    const receivedAmount = formData.paymentMethods.reduce((sum, method) => {
      // Immediate payment methods
      if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
          (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
        return sum + method.amount;
      }
      return sum;
    }, 0);
    
    const pendingAmount = Math.max(0, formData.totalValue - receivedAmount);
    
    let status: Sale['status'] = 'pendente';
    if (receivedAmount >= formData.totalValue) {
      status = 'pago';
    } else if (receivedAmount > 0) {
      status = 'parcial';
    }
    
    return {
      receivedAmount,
      pendingAmount,
      status,
      totalPayments
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 SaleForm.handleSubmit called');
    
    // Log the attempt for debugging
    SalesDebugger.logSaleCreationAttempt(formData, 'SaleForm.handleSubmit');
    
    // Enhanced client validation
    if (!formData.client || !formData.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    // Check if client looks like a UUID (common mistake)
    if (formData.client.length === 36 && isValidUUID(formData.client)) {
      alert('Erro: O campo cliente deve conter o NOME do cliente, não um ID. Por favor, digite o nome do cliente.');
      return;
    }
    
    // Enhanced total value validation
    if (!formData.totalValue || formData.totalValue <= 0) {
      alert('O valor total da venda deve ser maior que zero.');
      return;
    }
    
    // Enhanced payment methods validation
    if (!formData.paymentMethods || formData.paymentMethods.length === 0) {
      alert('Por favor, adicione pelo menos um método de pagamento.');
      return;
    }
    
    // Validate each payment method
    for (let i = 0; i < formData.paymentMethods.length; i++) {
      const method = formData.paymentMethods[i];
      if (!method.type || typeof method.type !== 'string') {
        alert(`Método de pagamento ${i + 1}: Tipo é obrigatório.`);
        return;
      }
      if (typeof method.amount !== 'number' || method.amount <= 0) {
        alert(`Método de pagamento ${i + 1}: Valor deve ser maior que zero.`);
        return;
      }
    }
    
    const amounts = calculateAmounts();
    
    if (amounts.totalPayments === 0) {
      alert('Por favor, informe pelo menos um método de pagamento com valor maior que zero.');
      return;
    }
    
    if (amounts.totalPayments > formData.totalValue) {
      alert('O total dos métodos de pagamento não pode ser maior que o valor total da venda.');
      return;
    }
    
    // Enhanced third party check validation
    for (const method of formData.paymentMethods) {
      if (method.type === 'cheque' && method.isThirdPartyCheck && method.thirdPartyDetails) {
        for (const detail of method.thirdPartyDetails) {
          if (!detail.issuer || !detail.cpfCnpj || !detail.bank || !detail.agency || !detail.account || !detail.checkNumber) {
            alert('Por favor, preencha todos os campos obrigatórios dos cheques de terceiros.');
            return;
          }
          
          // Validate CPF/CNPJ format (basic)
          const cpfCnpj = detail.cpfCnpj.replace(/\D/g, '');
          if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
            alert('CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.');
            return;
          }
        }
      }
    }
    
    // Enhanced payment methods cleaning and validation
    const cleanedPaymentMethods = formData.paymentMethods
      .filter(method => method.amount > 0) // Remove methods with zero amount
      .map(method => {
        const cleaned: any = { ...method };
        
        // Ensure required fields are properly typed
        if (!cleaned.type || typeof cleaned.type !== 'string') {
          cleaned.type = 'dinheiro';
        }
        
        if (typeof cleaned.amount !== 'number' || cleaned.amount <= 0) {
          return null; // Will be filtered out
        }
        
        // Clean optional fields - remove empty values
        Object.keys(cleaned).forEach(key => {
          const value = cleaned[key];
          if (value === undefined || value === '' || value === null ||
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === 'string' && value.trim() === '')) {
            cleaned[key] = null;
          }
        });
        
        // Handle installment fields properly
        if (cleaned.installments === 1 || !cleaned.installments) {
          delete cleaned.installments;
          delete cleaned.installmentValue;
          delete cleaned.installmentInterval;
          delete cleaned.firstInstallmentDate;
          delete cleaned.startDate;
        }
        
        // Validate installment data if present
        if (cleaned.installments && cleaned.installments > 1) {
          if (!cleaned.installmentValue || cleaned.installmentValue <= 0) {
            cleaned.installmentValue = cleaned.amount / cleaned.installments;
          }
          if (!cleaned.installmentInterval || cleaned.installmentInterval <= 0) {
            cleaned.installmentInterval = 30; // Default to 30 days
          }
        }
        
        return cleaned;
      })
      .filter(method => method !== null); // Remove null methods
    
    if (cleanedPaymentMethods.length === 0) {
      alert('Pelo menos um método de pagamento deve ter valor maior que zero.');
      return;
    }
    
    console.log('✅ Cleaned payment methods:', cleanedPaymentMethods);
      
    // Enhanced seller ID cleaning with UUID validation
    let cleanSellerId = null;
    if (formData.sellerId && formData.sellerId.trim() !== '') {
      if (isValidUUID(formData.sellerId)) {
        cleanSellerId = formData.sellerId;
      } else {
        console.warn('⚠️ Invalid seller UUID, setting to null:', formData.sellerId);
        cleanSellerId = null;
      }
    }
    
    // Enhanced delivery date cleaning
    const cleanDeliveryDate = formData.deliveryDate && formData.deliveryDate.trim() !== '' ? formData.deliveryDate : null;
    
    // Recalculate amounts with cleaned data
    const recalculatedAmounts = (() => {
      const totalPayments = cleanedPaymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
      const receivedAmount = cleanedPaymentMethods.reduce((sum, method) => {
        // Immediate payment methods
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          return sum + method.amount;
        }
        return sum;
      }, 0);
      
      const pendingAmount = Math.max(0, formData.totalValue - receivedAmount);
      
      let status: Sale['status'] = 'pendente';
      if (receivedAmount >= formData.totalValue) {
        status = 'pago';
      } else if (receivedAmount > 0) {
        status = 'parcial';
      }
      
      return {
        receivedAmount,
        pendingAmount,
        status,
        totalPayments
      };
    })();
    
    // Create enhanced payload with comprehensive validation
    const saleToSubmit = {
      date: formData.date,
      deliveryDate: cleanDeliveryDate,
      client: formData.client.trim(),
      sellerId: cleanSellerId,
      customCommissionRate: formData.custom_commission_rate || 5.00,
      products: typeof formData.products === 'string' ? [{ name: formData.products }] : formData.products,
      observations: formData.observations?.trim() || null,
      totalValue: formData.totalValue,
      paymentMethods: cleanedPaymentMethods,
      paymentDescription: formData.paymentDescription?.trim() || null,
      paymentObservations: formData.paymentObservations?.trim() || null,
      receivedAmount: recalculatedAmounts.receivedAmount,
      pendingAmount: recalculatedAmounts.pendingAmount,
      status: recalculatedAmounts.status,
    };
    
    // Final comprehensive validation
    if (!saleToSubmit.client || saleToSubmit.client.trim() === '') {
      alert('Nome do cliente é obrigatório e não pode estar vazio.');
      return;
    }
    
    if (saleToSubmit.sellerId === '' || (saleToSubmit.sellerId && !isValidUUID(saleToSubmit.sellerId))) {
      console.warn('⚠️ Invalid seller ID detected, converting to null:', saleToSubmit.sellerId);
      saleToSubmit.sellerId = null;
    }
    
    if (saleToSubmit.totalValue <= 0) {
      alert('Valor total deve ser maior que zero.');
      return;
    }
    
    if (!saleToSubmit.paymentMethods || saleToSubmit.paymentMethods.length === 0) {
      alert('Pelo menos um método de pagamento é obrigatório.');
      return;
    }
    
    // Apply final sanitization
    const finalPayload = sanitizePayload(saleToSubmit);
    
    // Use debugger for final validation
    const validation = SalesDebugger.validateSalePayload(finalPayload);
    if (!validation.isValid) {
      console.error('❌ Payload validation failed:', validation.errors);
      alert('Erro de validação:\n' + validation.errors.join('\n'));
      return;
    }
    
    console.log('📤 Final validated payload for submission:', finalPayload);
    
    // Additional logging for debugging
    console.log('🔍 Payload validation summary:', {
      hasClient: !!finalPayload.client,
      clientLength: finalPayload.client?.length,
      hasSellerId: !!finalPayload.sellerId,
      sellerIdValid: finalPayload.sellerId ? isValidUUID(finalPayload.sellerId) : 'null',
      totalValue: finalPayload.totalValue,
      paymentMethodsCount: finalPayload.paymentMethods?.length,
      receivedAmount: finalPayload.receivedAmount,
      pendingAmount: finalPayload.pendingAmount,
      status: finalPayload.status
    });
    
    // Final debug log before submission
    SalesDebugger.logSaleCreationAttempt(finalPayload, 'Final Submission');
    
    onSubmit(finalPayload);
  };

  const amounts = calculateAmounts();

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
                <h2 className="text-3xl font-bold text-slate-900">
                  {sale ? 'Editar Venda' : 'Nova Venda'}
                </h2>
                <p className="text-slate-600">Registre uma nova venda no sistema</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900">Informações Básicas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="form-label">Data da Venda *</label>
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vendedor</label>
                  <select
                    value={formData.sellerId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        sellerId: value === '' ? null : value 
                      }));
                    }}
                    className="input-field"
                  >
                    <option value="">Sem vendedor</option>
                    {sellers.map(seller => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name} - {seller.position}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1 font-semibold">
                    💡 Deixe em branco se a venda não tem vendedor específico
                  </p>
                </div>

                <div className="form-group md:col-span-2">
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
              </div>
            </div>

            {/* Produtos (Opcional) */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">Produtos Vendidos</h3>
                  <p className="text-green-700 text-sm">Campo opcional - descreva os produtos vendidos</p>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Descrição dos Produtos (Opcional)</label>
                <textarea
                  value={formData.products}
                  onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Ex: 2x Produto A, 1x Produto B, Serviço de instalação..."
                />
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  💡 Este campo é opcional. Você pode deixar em branco se preferir.
                </p>
              </div>
            </div>

            {/* Comissão do Vendedor */}
            {formData.sellerId && (
              <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-purple-600">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">Comissão do Vendedor</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Taxa de Comissão (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.custom_commission_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_commission_rate: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                      placeholder="5.00"
                    />
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-purple-600 font-semibold">Valor da Comissão</p>
                        <p className="text-2xl font-black text-purple-700">
                          R$ {((formData.totalValue * (formData.custom_commission_rate || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Métodos de Pagamento */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-600">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900">Métodos de Pagamento</h3>
                </div>
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Método
                </button>
              </div>

              <div className="space-y-6">
                {formData.paymentMethods.map((method, index) => (
                  <div key={index} className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-lg font-bold text-green-900">Método {index + 1}</h4>
                      {formData.paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label className="form-label">Tipo de Pagamento *</label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          className="input-field"
                          required
                        >
                          {PAYMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Valor *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={method.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>

                    {/* Parcelamento */}
                    {['cartao_credito', 'cheque', 'boleto'].includes(method.type) && (
                      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                        <h5 className="font-bold text-green-800 mb-4">Configurações de Parcelamento</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="form-group">
                            <label className="form-label">Número de Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              value={method.installments || 1}
                              onChange={(e) => {
                                const installments = parseInt(e.target.value) || 1;
                                const installmentValue = method.amount / installments;
                                updatePaymentMethod(index, 'installments', installments);
                                updatePaymentMethod(index, 'installmentValue', installmentValue);
                              }}
                              className="input-field"
                              placeholder="1"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Valor por Parcela</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={method.installmentValue || 0}
                              onChange={(e) => updatePaymentMethod(index, 'installmentValue', parseFloat(e.target.value) || 0)}
                              className="input-field bg-gray-50"
                              readOnly
                            />
                          </div>

                          <div className="form-group">
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

                          {(method.installments || 1) > 1 && (
                            <div className="form-group md:col-span-3">
                              <label className="form-label">Data da Primeira Parcela</label>
                              <input
                                type="date"
                                value={method.firstInstallmentDate || formData.date}
                                onChange={(e) => updatePaymentMethod(index, 'firstInstallmentDate', e.target.value)}
                                className="input-field"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Configurações de Cheque */}
                    {method.type === 'cheque' && (
                      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <h5 className="font-bold text-yellow-800 mb-4">Configurações do Cheque</h5>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={method.isOwnCheck || false}
                                onChange={(e) => updatePaymentMethod(index, 'isOwnCheck', e.target.checked)}
                                className="rounded"
                              />
                              <span className="form-label mb-0">Cheque Próprio</span>
                            </label>
                            
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={method.isThirdPartyCheck || false}
                                onChange={(e) => {
                                  updatePaymentMethod(index, 'isThirdPartyCheck', e.target.checked);
                                  if (e.target.checked && !method.thirdPartyDetails) {
                                    updatePaymentMethod(index, 'thirdPartyDetails', []);
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="form-label mb-0">Cheque de Terceiros</span>
                            </label>
                          </div>

                          {/* Detalhes de Cheques de Terceiros */}
                          {method.isThirdPartyCheck && (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h6 className="font-bold text-yellow-800">Detalhes dos Cheques de Terceiros</h6>
                                <button
                                  type="button"
                                  onClick={() => addThirdPartyCheckDetail(index)}
                                  className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-bold"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Adicionar Cheque
                                </button>
                              </div>
                              
                              {(method.thirdPartyDetails || []).map((detail, detailIndex) => (
                                <div key={detailIndex} className="p-4 bg-white rounded-xl border border-yellow-100">
                                  <div className="flex justify-between items-center mb-4">
                                    <h6 className="font-bold text-yellow-900">Cheque {detailIndex + 1}</h6>
                                    <button
                                      type="button"
                                      onClick={() => removeThirdPartyCheckDetail(index, detailIndex)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="form-group">
                                      <label className="form-label">Emissor *</label>
                                      <input
                                        type="text"
                                        value={detail.issuer}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'issuer', e.target.value)}
                                        className="input-field"
                                        placeholder="Nome do emissor"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group">
                                      <label className="form-label">CPF/CNPJ *</label>
                                      <input
                                        type="text"
                                        value={detail.cpfCnpj}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'cpfCnpj', e.target.value)}
                                        className="input-field"
                                        placeholder="000.000.000-00"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group">
                                      <label className="form-label">Banco *</label>
                                      <input
                                        type="text"
                                        value={detail.bank}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'bank', e.target.value)}
                                        className="input-field"
                                        placeholder="Nome do banco"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group">
                                      <label className="form-label">Agência *</label>
                                      <input
                                        type="text"
                                        value={detail.agency}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'agency', e.target.value)}
                                        className="input-field"
                                        placeholder="0000"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group">
                                      <label className="form-label">Conta *</label>
                                      <input
                                        type="text"
                                        value={detail.account}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'account', e.target.value)}
                                        className="input-field"
                                        placeholder="00000-0"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group">
                                      <label className="form-label">Nº do Cheque *</label>
                                      <input
                                        type="text"
                                        value={detail.checkNumber}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'checkNumber', e.target.value)}
                                        className="input-field"
                                        placeholder="000000"
                                        required
                                      />
                                    </div>
                                    
                                    <div className="form-group md:col-span-3">
                                      <label className="form-label">Observações</label>
                                      <textarea
                                        value={detail.observations}
                                        onChange={(e) => updateThirdPartyCheckDetail(index, detailIndex, 'observations', e.target.value || null)}
                                        className="input-field"
                                        rows={2}
                                        placeholder="Observações sobre este cheque..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-green-600">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900">Observações</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Observações da Venda</label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="Informações gerais sobre a venda..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações do Pagamento</label>
                  <textarea
                    value={formData.paymentObservations}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentObservations: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="Informações específicas sobre o pagamento..."
                  />
                </div>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="p-8 bg-gradient-to-br from-green-100 via-emerald-100 to-green-100 rounded-3xl border-2 border-green-300 modern-shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-900">Resumo Financeiro</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-white rounded-2xl border border-green-200 modern-shadow-lg">
                  <div className="p-3 rounded-xl bg-blue-600 w-fit mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 mb-2">Valor Total</h4>
                  <p className="text-3xl font-black text-blue-600">
                    R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-2xl border border-green-200 modern-shadow-lg">
                  <div className="p-3 rounded-xl bg-green-600 w-fit mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 mb-2">Valor Recebido</h4>
                  <p className="text-3xl font-black text-green-600">
                    R$ {amounts.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    Pagamento imediato
                  </p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-2xl border border-green-200 modern-shadow-lg">
                  <div className="p-3 rounded-xl bg-orange-600 w-fit mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 mb-2">Valor Pendente</h4>
                  <p className="text-3xl font-black text-orange-600">
                    R$ {amounts.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-orange-600 font-semibold mt-1">
                    A receber
                  </p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-2xl border border-green-200 modern-shadow-lg">
                  <div className="p-3 rounded-xl bg-purple-600 w-fit mx-auto mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 mb-2">Status</h4>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                    amounts.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                    amounts.status === 'parcial' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {amounts.status === 'pago' ? 'PAGO' :
                     amounts.status === 'parcial' ? 'PARCIAL' : 'PENDENTE'}
                  </span>
                </div>
              </div>
              
              {/* Breakdown dos Pagamentos */}
              <div className="mt-8 p-6 bg-white rounded-2xl border border-green-200">
                <h4 className="font-bold text-green-900 mb-4">Breakdown dos Pagamentos</h4>
                <div className="space-y-3">
                  {formData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          method.type === 'dinheiro' ? 'bg-green-100 text-green-800' :
                          method.type === 'pix' ? 'bg-blue-100 text-blue-800' :
                          method.type === 'cartao_credito' ? 'bg-purple-100 text-purple-800' :
                          method.type === 'cartao_debito' ? 'bg-indigo-100 text-indigo-800' :
                          method.type === 'cheque' ? 'bg-yellow-100 text-yellow-800' :
                          method.type === 'boleto' ? 'bg-cyan-100 text-cyan-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {method.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {method.installments && method.installments > 1 && (
                          <span className="text-xs text-green-600 font-semibold">
                            {method.installments}x de R$ {(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-black text-green-600">
                        R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-xl border-t-2 border-green-300">
                    <span className="font-bold text-green-800">TOTAL DOS PAGAMENTOS:</span>
                    <span className="text-2xl font-black text-green-700">
                      R$ {amounts.totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Alertas */}
              {amounts.totalPayments > formData.totalValue && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-red-800 font-bold">Atenção!</p>
                      <p className="text-red-700 text-sm">
                        O total dos pagamentos (R$ {amounts.totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) 
                        é maior que o valor da venda (R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {amounts.totalPayments < formData.totalValue && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-blue-800 font-bold">Informação</p>
                      <p className="text-blue-700 text-sm">
                        Restam R$ {amounts.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                        a receber. Esta venda ficará com status "{amounts.status.toUpperCase()}".
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={amounts.totalPayments > formData.totalValue}
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