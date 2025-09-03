import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, User, DollarSign, FileText, CreditCard } from 'lucide-react';
import { Employee, Sale, PaymentMethod } from '../../types';
import { supabase } from '../../lib/supabase';

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => void;
  sale?: Sale;
  employees: Employee[];
}

interface Product {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function SaleForm({ isOpen, onClose, onSubmit, sale, employees }: SaleFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    client: '',
    seller_id: '',
    observations: '',
    total_value: 0,
    received_amount: 0,
    pending_amount: 0,
    status: 'pendente' as const,
    payment_description: '',
    payment_observations: '',
    custom_commission_rate: 5.00
  });

  const [products, setProducts] = useState<Product[]>([
    { name: '', quantity: 1, price: 0, total: 0 }
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { method: 'dinheiro', amount: 0, installments: 1 }
  ]);

  const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);
  const [showThirdPartyCheckDetails, setShowThirdPartyCheckDetails] = useState(false);

  useEffect(() => {
    if (sale) {
      setFormData({
        date: sale.date,
        delivery_date: sale.delivery_date || '',
        client: sale.client,
        seller_id: sale.seller_id || '',
        observations: sale.observations || '',
        total_value: sale.total_value,
        received_amount: sale.received_amount,
        pending_amount: sale.pending_amount,
        status: sale.status,
        payment_description: sale.payment_description || '',
        payment_observations: sale.payment_observations || '',
        custom_commission_rate: sale.custom_commission_rate || 5.00
      });
      
      if (sale.products && Array.isArray(sale.products)) {
        setProducts(sale.products as Product[]);
      }
      
      if (sale.payment_methods && Array.isArray(sale.payment_methods)) {
        setPaymentMethods(sale.payment_methods as PaymentMethod[]);
      }
    }
  }, [sale]);

  const addProduct = () => {
    setProducts([...products, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      updatedProducts[index].total = updatedProducts[index].quantity * updatedProducts[index].price;
    }
    
    setProducts(updatedProducts);
    updateTotalValue(updatedProducts);
  };

  const updateTotalValue = (currentProducts: Product[]) => {
    const total = currentProducts.reduce((sum, product) => sum + product.total, 0);
    setFormData(prev => ({ ...prev, total_value: total }));
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'dinheiro', amount: 0, installments: 1 }]);
  };

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    setPaymentMethods(updatedMethods);
    
    const totalReceived = updatedMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
    setFormData(prev => ({
      ...prev,
      received_amount: totalReceived,
      pending_amount: prev.total_value - totalReceived
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saleData = {
      ...formData,
      products,
      payment_methods: paymentMethods
    };
    
    onSubmit(saleData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {sale ? 'Editar Venda' : 'Nova Venda'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data da Venda
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data de Entrega
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Cliente
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Vendedor
              </label>
              <select
                value={formData.seller_id}
                onChange={(e) => setFormData(prev => ({ ...prev, seller_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um vendedor</option>
                {employees.filter(emp => emp.is_seller).map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Produtos</h3>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Produto
              </button>
            </div>

            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      placeholder="Nome do produto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="Qtd"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Preço"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      R$ {product.total.toFixed(2)}
                    </span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Formas de Pagamento</h3>
              <button
                type="button"
                onClick={addPaymentMethod}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Forma
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <select
                        value={method.method}
                        onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência</option>
                        <option value="cartao_debito">Cartão Débito</option>
                        <option value="cartao_credito">Cartão Crédito</option>
                        <option value="cheque">Cheque</option>
                        <option value="cheque_terceiro">Cheque de Terceiro</option>
                        <option value="boleto">Boleto</option>
                        <option value="parcelado">Parcelado</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Valor"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {(method.method === 'parcelado' || method.method === 'boleto' || method.method === 'cheque' || method.method === 'cheque_terceiro') && (
                      <div>
                        <input
                          type="number"
                          value={method.installments || 1}
                          onChange={(e) => updatePaymentMethod(index, 'installments', parseInt(e.target.value) || 1)}
                          placeholder="Parcelas"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {method.method === 'cheque_terceiro' && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes do Cheque de Terceiro</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Banco"
                          value={method.thirdPartyDetails?.bank || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            bank: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Agência"
                          value={method.thirdPartyDetails?.agency || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            agency: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Conta"
                          value={method.thirdPartyDetails?.account || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            account: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Número do Cheque"
                          value={method.thirdPartyDetails?.checkNumber || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            checkNumber: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Emitente"
                          value={method.thirdPartyDetails?.issuer || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            issuer: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="CPF/CNPJ"
                          value={method.thirdPartyDetails?.cpfCnpj || ''}
                          onChange={(e) => updatePaymentMethod(index, 'thirdPartyDetails', {
                            ...method.thirdPartyDetails,
                            cpfCnpj: e.target.value
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                <div className="text-lg font-semibold text-blue-600">
                  R$ {formData.total_value.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Recebido</label>
                <div className="text-lg font-semibold text-green-600">
                  R$ {formData.received_amount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Pendente</label>
                <div className="text-lg font-semibold text-orange-600">
                  R$ {formData.pending_amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Commission Rate */}
          {formData.seller_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Taxa de Comissão (%)
              </label>
              <input
                type="number"
                value={formData.custom_commission_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_commission_rate: parseFloat(e.target.value) || 5.00 }))}
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Observações da Venda
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações sobre a venda..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Observações do Pagamento
              </label>
              <textarea
                value={formData.payment_observations}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_observations: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações sobre o pagamento..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {sale ? 'Atualizar' : 'Criar'} Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}