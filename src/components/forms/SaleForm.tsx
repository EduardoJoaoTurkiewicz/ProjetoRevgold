import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
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
    products: sale?.products || [{ name: '', quantity: 0, unitPrice: 0, totalPrice: 0 }],
    observations: sale?.observations || '',
    totalValue: sale?.totalValue || 0,
    paymentMethods: sale?.paymentMethods || [{ type: 'dinheiro' as const, amount: 0 }],
    paymentDescription: sale?.paymentDescription || ''
  });

  // Filtrar apenas vendedores ativos
  const sellers = state.employees.filter(emp => emp.isActive && emp.isSeller);

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 0, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => {
        if (i === index) {
          const updatedProduct = { ...product, [field]: value };
          
          // Calculate total price when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            updatedProduct.totalPrice = Math.max(0, (updatedProduct.quantity || 0) * (updatedProduct.unitPrice || 0));
          }
          
          return updatedProduct;
        }
        return product;
      })
    }));
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
      paymentMethods: prev.paymentMethods.map((method, i) => {
        if (i === index) {
          const updatedMethod = { ...method, [field]: value };
          
          // Calculate installment value when installments change
          if (field === 'installments' && value > 1) {
            updatedMethod.installmentValue = method.amount / value;
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
    
    onSubmit({
      ...formData,
      ...amounts
    } as Omit<Sale, 'id' | 'createdAt'>);
  };

  // Auto-calculate total when payment methods change
  useEffect(() => {
    const totalFromProducts = formData.products.reduce((sum, product) => sum + (product.totalPrice || 0), 0);
    if (totalFromProducts > 0) {
      setFormData(prev => ({ ...prev, totalValue: totalFromProducts }));
    }
  }, [formData.products]);

  // Auto-calculate total value and update payment methods when products change
  useEffect(() => {
    const calculatedTotal = formData.products.reduce((sum, product) => {
      return sum + (product.totalPrice || 0);
    }, 0);
    
    if (calculatedTotal > 0) {
      setFormData(prev => {
        // Update total value
        const newFormData = { ...prev, totalValue: calculatedTotal };
        
        // If there's only one payment method and it has no amount set, auto-fill it
        if (prev.paymentMethods.length === 1 && prev.paymentMethods[0].amount === 0) {
          newFormData.paymentMethods = [{
            ...prev.paymentMethods[0],
            amount: calculatedTotal
          }];
        }
        
        return newFormData;
      });
    }
  }, [formData.products]);

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
                <p className="text-xs text-gray-500 mt-1">
                  Selecione o vendedor responsável por esta venda. Comissão de 5% será calculada automaticamente.
                </p>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Produtos Vendidos
                </h3>
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
                {formData.products.map((product, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Produto {index + 1}</h4>
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">Nome do Produto *</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="input-field"
                          placeholder="Ex: Tinta Branca 18L"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Quantidade *</label>
                        <input
                          type="number"
                          min="0"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Preço Unitário</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.unitPrice || ''}
                          onChange={(e) => updateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="input-field"
                          placeholder="0,00"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-green-800">
                            {product.quantity}x {product.name || 'Produto'} 
                            {product.unitPrice ? ` @ R$ ${product.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                          </span>
                          <span className="font-bold text-green-900">
                            Total: R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total Geral dos Produtos */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 blur-2xl"></div>
                  <div className="relative p-8 bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 rounded-3xl border-2 border-green-300 shadow-2xl"
                       style={{ 
                         boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)' 
                       }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-green-800 mb-2 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                        Total Geral dos Produtos
                      </h3>
                      <p className="text-green-600 font-bold">
                        {formData.products.length} produto(s) • 
                        {formData.products.reduce((sum, p) => sum + (p.quantity || 0), 0)} unidade(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-green-700 mb-1">
                        R$ {formData.products.reduce((sum, product) => {
                          return sum + ((product.quantity || 0) * (product.unitPrice || 0));
                        }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600 font-bold">✓ Calculado automaticamente</p>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="form-group">
                <label className="form-label">Valor Total *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                  className="input-field bg-green-50 border-green-200 font-bold text-green-700"
                  placeholder="0,00"
                  required
                  readOnly
                />
                <p className="text-sm text-green-600 mt-2 font-bold bg-green-50 p-3 rounded-xl border border-green-200">
                  ✓ Valor calculado automaticamente: R$ {formData.products.reduce((sum, product) => {
                    return sum + ((product.quantity || 0) * (product.unitPrice || 0));
                  }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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