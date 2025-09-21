import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, User, DollarSign, FileText, CreditCard } from 'lucide-react';
import { Sale, PaymentMethod } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface Product {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

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
  { value: 'acerto', label: 'Acerto (Pagamento Mensal)' }
];

export default function SaleForm({ sale, onSubmit, onCancel }: SaleFormProps) {
  const { employees } = useAppContext();
  
  const [formData, setFormData] = useState({
    date: sale?.date || new Date().toISOString().split('T')[0],
    deliveryDate: sale?.deliveryDate || '',
    client: sale?.client || '',
    sellerId: sale?.sellerId || '',
    observations: sale?.observations || '',
    paymentDescription: sale?.paymentDescription || '',
    paymentObservations: sale?.paymentObservations || '',
    customCommissionRate: sale?.custom_commission_rate || 5.00
  });

  const [products, setProducts] = useState<Product[]>(
    sale?.products && Array.isArray(sale.products) && sale.products.length > 0
      ? sale.products
      : sale?.products && typeof sale.products === 'string' 
        ? [{ name: sale.products, quantity: 1, price: sale.totalValue, total: sale.totalValue }]
        : [{ name: '', quantity: 1, price: 0, total: 0 }]
  );

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    sale?.paymentMethods || [{ type: 'dinheiro', amount: 0 }]
  );

  const activeEmployees = employees.filter(emp => emp.isActive && emp.isSeller);

  const addProduct = () => {
    console.log('➕ Adding new product');
    setProducts([...products, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeProduct = (index: number) => {
    console.log('➖ Removing product at index:', index);
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    console.log('📝 Updating product:', { index, field, value });
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      updatedProducts[index].total = updatedProducts[index].quantity * updatedProducts[index].price;
    }
    
    setProducts(updatedProducts);
  };

  const addPaymentMethod = () => {
    console.log('➕ Adding new payment method');
    setPaymentMethods([...paymentMethods, { type: 'dinheiro', amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    console.log('➖ Removing payment method at index:', index);
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    console.log('📝 Updating payment method:', { index, field, value });
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    setPaymentMethods(updatedMethods);
  };

  const calculateAmounts = () => {
    const totalValue = products.reduce((sum, product) => sum + product.total, 0);
    const totalPaymentAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    
    // Calculate received amount (instant payments)
    const receivedAmount = paymentMethods.reduce((sum, method) => {
      if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
          (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
        return sum + method.amount;
      }
      return sum;
    }, 0);
    
    const pendingAmount = Math.max(0, totalValue - receivedAmount);
    
    // Determine status
    let status: 'pago' | 'pendente' | 'parcial' = 'pendente';
    if (receivedAmount >= totalValue) {
      status = 'pago';
    } else if (receivedAmount > 0) {
      status = 'parcial';
    }
    
    return {
      totalValue,
      receivedAmount,
      pendingAmount,
      status
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 handleSaleSubmit called');
    console.log('📝 Form data:', formData);
    console.log('📝 Products:', products);
    console.log('📝 Payment methods:', paymentMethods);
    
    try {
      // Validate form data
      if (!formData.client || !formData.client.trim()) {
      // Build sale object first
      const saleToSubmit = {
        date: formData.date,
        deliveryDate: formData.deliveryDate || null,
        client: formData.client.trim(),
        sellerId: formData.sellerId || null,
        products: validProducts,
        observations: formData.observations || null,
        totalValue: amounts.totalValue,
        paymentMethods: validPaymentMethods,
        receivedAmount: amounts.receivedAmount,
        pendingAmount: amounts.pendingAmount,
        status: amounts.status,
        paymentDescription: formData.paymentDescription || null,
        paymentObservations: formData.paymentObservations || null,
        updatedAt: null,
        custom_commission_rate: formData.customCommissionRate
      };
      
      // Clean UUID fields
      const cleanedSale = cleanUUIDFields(saleToSubmit);
      console.log('🧹 Cleaned sale data:', cleanedSale);
        return;
      }
      
      // Validate products
      const validProducts = products.filter(p => p.name.trim() && p.quantity > 0 && p.price > 0);
      if (validProducts.length === 0) {
        console.error('❌ Validation failed: No valid products');
        alert('Por favor, adicione pelo menos um produto válido.');
        return;
      }
      
      // Validate payment methods
      const validPaymentMethods = paymentMethods.filter(m => m.amount > 0);
      if (validPaymentMethods.length === 0) {
        console.error('❌ Validation failed: No valid payment methods');
        alert('Por favor, adicione pelo menos um método de pagamento com valor maior que zero.');
        return;
      }
      
      const amounts = calculateAmounts();
      console.log('💰 Calculated amounts:', amounts);
      
      // Build sale object
      const saleToSubmit: Omit<Sale, 'id' | 'createdAt'> = {
        date: formData.date,
        deliveryDate: formData.deliveryDate || null,
        client: formData.client.trim(),
        sellerId: formData.sellerId || null,
        products: validProducts,
        observations: formData.observations || null,
        totalValue: amounts.totalValue,
        paymentMethods: validPaymentMethods,
        receivedAmount: amounts.receivedAmount,
        pendingAmount: amounts.pendingAmount,
        status: amounts.status,
        paymentDescription: formData.paymentDescription || null,
        paymentObservations: formData.paymentObservations || null,
        updatedAt: null,
        custom_commission_rate: formData.customCommissionRate
      };
      
      console.log('📦 Final sale object to submit:', JSON.stringify(saleToSubmit, null, 2));
      console.log('🚀 Calling onSubmit with sale data...');
      
      onSubmit(saleToSubmit);
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      console.error('❌ Error stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ Sale data that failed:', JSON.stringify(cleanedSale, null, 2));
    }
  };

  const { totalValue, receivedAmount, pendingAmount } = calculateAmounts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {sale ? 'Editar Venda' : 'Nova Venda'}
                </h2>
                <p className="text-slate-600">Registre uma nova venda no sistema</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => {
                console.log('❌ Cancel button clicked');
                onCancel();
              }}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Calendar className="w-6 h-6 text-white" />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, sellerId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Selecionar vendedor...</option>
                    {activeEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
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
                    placeholder="5.00"
                  />
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-600">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900">Produtos</h3>
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </button>
              </div>

              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">Nome do Produto</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="input-field"
                          placeholder="Nome do produto"
                        />
                      </div>
                      <div>
                        <label className="form-label">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="input-field"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Preço Unitário</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.price}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0,00"
                        />
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <label className="form-label">Total</label>
                          <p className="text-lg font-bold text-green-600">
                            R$ {product.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remover produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métodos de Pagamento */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-600">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">Métodos de Pagamento</h3>
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

              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-purple-900">Método {index + 1}</h4>
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Remover método"
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

                      {method.type === 'cartao_credito' && (
                        <>
                          <div>
                            <label className="form-label">Parcelas</label>
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
                          <div>
                            <label className="form-label">Valor da Parcela</label>
                            <input
                              type="number"
                              step="0.01"
                              value={method.installmentValue || 0}
                              className="input-field bg-gray-50"
                              readOnly
                            />
                          </div>
                        </>
                      )}

                      {(method.type === 'cheque' || method.type === 'boleto') && (
                        <>
                          <div>
                            <label className="form-label">Parcelas</label>
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
                          <div>
                            <label className="form-label">Valor da Parcela</label>
                            <input
                              type="number"
                              step="0.01"
                              value={method.installmentValue || 0}
                              className="input-field bg-gray-50"
                              readOnly
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo da Venda */}
            {(() => {
              const amounts = calculateAmounts();
              return (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl">
                  <h3 className="text-xl font-black text-green-800 mb-4">Resumo da Venda</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <span className="text-green-600 font-semibold block mb-1">Total:</span>
                      <p className="text-3xl font-black text-green-800">
                        R$ {amounts.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-green-600 font-semibold block mb-1">Recebido:</span>
                      <p className="text-3xl font-black text-emerald-600">
                        R$ {amounts.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-green-600 font-semibold block mb-1">Pendente:</span>
                      <p className="text-3xl font-black text-orange-600">
                        R$ {amounts.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                      amounts.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                      amounts.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      Status: {amounts.status === 'pago' ? 'Pago' :
                               amounts.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  className="input-field"
                  rows={4}
                  placeholder="Observações sobre a venda..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição do Pagamento</label>
                <textarea
                  value={formData.paymentDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDescription: e.target.value }))}
                  className="input-field"
                  rows={4}
                  placeholder="Detalhes sobre o pagamento..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  console.log('❌ Cancel button clicked');
                  onCancel();
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary group"
                onClick={() => console.log('💾 Submit button clicked')}
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