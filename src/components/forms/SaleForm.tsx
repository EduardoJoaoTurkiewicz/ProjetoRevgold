import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Sale, PaymentMethod } from '../../types';

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

export function SaleForm({ sale, onSubmit, onCancel }: SaleFormProps) {
  const { employees } = useAppContext();
  
  const [formData, setFormData] = useState({
    date: sale?.date || new Date().toISOString().split('T')[0],
    deliveryDate: sale?.deliveryDate || '',
    client: sale?.client || '',
    sellerId: sale?.sellerId || '',
    products: sale?.products || '',
    observations: sale?.observations || '',
    totalValue: sale?.totalValue || 0,
    paymentMethods: sale?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    paymentDescription: sale?.paymentDescription || '',
    paymentObservations: sale?.paymentObservations || '',
    customCommissionRate: sale?.custom_commission_rate || 5.00
  });

  // Enhanced UUID validation function
  const isValidUUID = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  // Enhanced UUID field cleaning function
  const cleanUUIDField = (value: any): string | null => {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    
    // Check if it's a valid UUID
    if (!isValidUUID(trimmed)) {
      console.warn('⚠️ Invalid UUID detected:', trimmed, '- converting to null');
      return null;
    }
    
    return trimmed;
  };

  // Enhanced payment method cleaning
  const cleanPaymentMethods = (methods: PaymentMethod[]): PaymentMethod[] => {
    return methods.map(method => {
      const cleaned: PaymentMethod = { ...method };
      
      // Clean all potential UUID fields in payment methods
      const uuidFields = ['id', 'customerId', 'productId', 'paymentMethodId', 'saleId', 'relatedId'];
      uuidFields.forEach(field => {
        if (cleaned.hasOwnProperty(field)) {
          cleaned[field as keyof PaymentMethod] = cleanUUIDField(cleaned[field as keyof PaymentMethod]);
        }
      });
      
      // Ensure required fields are valid
      if (!cleaned.type || typeof cleaned.type !== 'string') {
        cleaned.type = 'dinheiro';
      }
      
      if (typeof cleaned.amount !== 'number' || cleaned.amount < 0) {
        cleaned.amount = 0;
      }
      
      // Clean optional fields
      if (cleaned.installments === 1) {
        delete cleaned.installments;
        delete cleaned.installmentValue;
        delete cleaned.installmentInterval;
      }
      
      return cleaned;
    });
  };

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
    const totalReceived = formData.paymentMethods.reduce((sum, method) => {
      if (method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') {
        return sum + method.amount;
      }
      if (method.type === 'cartao_credito' && (!method.installments || method.installments === 1)) {
        return sum + method.amount;
      }
      return sum;
    }, 0);
    
    const pending = formData.totalValue - totalReceived;
    
    return {
      receivedAmount: totalReceived,
      pendingAmount: Math.max(0, pending),
      status: pending <= 0 ? 'pago' as const : (totalReceived > 0 ? 'parcial' as const : 'pendente' as const)
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.client || !formData.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (!formData.totalValue || formData.totalValue <= 0) {
      alert('O valor total da venda deve ser maior que zero.');
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
      alert('O total dos métodos de pagamento não pode ser maior que o valor total da venda.');
      return;
    }
    
    // Enhanced data cleaning with comprehensive UUID validation
    const cleanedPaymentMethods = cleanPaymentMethods(formData.paymentMethods);
    const amounts = calculateAmounts();
    
    // Clean all UUID fields in the main form data
    const cleanedSellerId = cleanUUIDField(formData.sellerId);
    
    // Validate seller ID if provided
    if (formData.sellerId && formData.sellerId.trim() !== '' && !cleanedSellerId) {
      alert('ID do vendedor inválido. Por favor, selecione um vendedor válido ou deixe em branco.');
      return;
    }
    
    // Prepare final sale data with comprehensive cleaning
    const saleToSubmit = {
      date: formData.date,
      deliveryDate: !formData.deliveryDate || formData.deliveryDate.trim() === '' ? null : formData.deliveryDate,
      client: formData.client.trim(),
      sellerId: cleanedSellerId,
      products: !formData.products || formData.products.trim() === '' ? null : formData.products.trim(),
      observations: !formData.observations || formData.observations.trim() === '' ? null : formData.observations.trim(),
      totalValue: formData.totalValue,
      paymentMethods: cleanedPaymentMethods,
      paymentDescription: !formData.paymentDescription || formData.paymentDescription.trim() === '' ? null : formData.paymentDescription.trim(),
      paymentObservations: !formData.paymentObservations || formData.paymentObservations.trim() === '' ? null : formData.paymentObservations.trim(),
      custom_commission_rate: formData.customCommissionRate,
      ...amounts
    };
    
    console.log('📝 Enviando venda com dados limpos:', saleToSubmit);
    
    // Final validation before submission
    if (saleToSubmit.sellerId && !isValidUUID(saleToSubmit.sellerId)) {
      console.error('❌ Invalid seller UUID after cleaning:', saleToSubmit.sellerId);
      alert('Erro interno: ID do vendedor inválido após limpeza. Tente novamente.');
      return;
    }
    
    // Validate payment methods one more time
    for (const method of saleToSubmit.paymentMethods) {
      if (!method.type || typeof method.type !== 'string') {
        alert('Erro interno: Método de pagamento inválido detectado.');
        return;
      }
      if (typeof method.amount !== 'number' || method.amount < 0) {
        alert('Erro interno: Valor de método de pagamento inválido detectado.');
        return;
      }
    }
    
    onSubmit(saleToSubmit as Omit<Sale, 'id' | 'createdAt'>);
  };

  const activeEmployees = employees.filter(emp => emp.isActive);
  const sellers = activeEmployees.filter(emp => emp.isSeller);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                <ShoppingCart className="w-8 h-8 text-white" />
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
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-600">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Informações da Venda</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label className="form-label">Vendedor</label>
                  <select
                    value={formData.sellerId}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Enhanced UUID validation on selection
                      const cleanedValue = cleanUUIDField(value);
                      setFormData(prev => ({ ...prev, sellerId: cleanedValue || '' }));
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
                  {formData.sellerId && !isValidUUID(formData.sellerId) && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">
                      ⚠️ ID do vendedor inválido - será convertido para null
                    </p>
                  )}
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

                <div className="form-group">
                  <label className="form-label">Taxa de Comissão (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.customCommissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCommissionRate: parseFloat(e.target.value) || 5.00 }))}
                    className="input-field"
                    placeholder="5,00"
                  />
                  <p className="text-xs text-blue-600 mt-1 font-semibold">
                    💡 Taxa padrão: 5%. Ajuste conforme necessário para esta venda.
                  </p>
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Produtos/Serviços</label>
                  <textarea
                    value={formData.products}
                    onChange={(e) => setFormData(prev => ({ ...prev, products: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Descreva os produtos ou serviços vendidos..."
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Observações</label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    className="input-field"
                    rows={2}
                    placeholder="Observações adicionais sobre a venda..."
                  />
                </div>
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-600">
                    <DollarSign className="w-6 h-6 text-white" />
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
                      <h4 className="font-bold text-green-900 text-lg">Método {index + 1}</h4>
                      {formData.paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
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

                      {(method.type === 'cartao_credito' || method.type === 'cheque' || method.type === 'boleto') && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Número de Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              max="24"
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
                            <label className="form-label">Valor da Parcela</label>
                            <input
                              type="number"
                              step="0.01"
                              value={method.installmentValue || method.amount}
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

                          <div className="form-group">
                            <label className="form-label">Data da Primeira Parcela</label>
                            <input
                              type="date"
                              value={method.startDate || formData.date}
                              onChange={(e) => updatePaymentMethod(index, 'startDate', e.target.value)}
                              className="input-field"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo da Venda */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-blue-800 mb-4">Resumo da Venda</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Total:</span>
                  <p className="text-2xl font-black text-blue-800">
                    R$ {formData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Recebido:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {calculateAmounts().receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-semibold block mb-1">Pendente:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {calculateAmounts().pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="text-blue-600 font-semibold block mb-2">Status da Venda:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                  calculateAmounts().status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                  calculateAmounts().status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {calculateAmounts().status === 'pago' ? 'PAGO' :
                   calculateAmounts().status === 'parcial' ? 'PARCIAL' : 'PENDENTE'}
                </span>
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

  // Helper functions (defined inside component to access state)
  function cleanUUIDField(value: any): string | null {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    
    // Check if it's a valid UUID
    if (!isValidUUID(trimmed)) {
      console.warn('⚠️ Invalid UUID detected:', trimmed, '- converting to null');
      return null;
    }
    
    return trimmed;
  }

  function isValidUUID(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}