import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, Package, FileText, CreditCard } from 'lucide-react';
import { Employee, Sale } from '../../types';
import { supabase } from '../../lib/supabase';

interface SaleFormProps {
  onSubmit: (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Sale;
}

export default function SaleForm({ onSubmit, onCancel, initialData }: SaleFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    delivery_date: initialData?.delivery_date || '',
    client: initialData?.client || '',
    seller_id: initialData?.seller_id || '',
    products: initialData?.products || [],
    observations: initialData?.observations || '',
    total_value: initialData?.total_value || 0,
    payment_methods: initialData?.payment_methods || [],
    received_amount: initialData?.received_amount || 0,
    pending_amount: initialData?.pending_amount || 0,
    status: initialData?.status || 'pendente',
    payment_description: initialData?.payment_description || '',
    payment_observations: initialData?.payment_observations || '',
    custom_commission_rate: initialData?.custom_commission_rate || 5.00
  });

  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  });

  const [currentPayment, setCurrentPayment] = useState({
    method: 'dinheiro',
    amount: 0,
    description: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const totalProducts = formData.products.reduce((sum: number, product: any) => sum + product.total_price, 0);
    const totalPayments = formData.payment_methods.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    
    setFormData(prev => ({
      ...prev,
      total_value: totalProducts,
      received_amount: totalPayments,
      pending_amount: totalProducts - totalPayments
    }));
  }, [formData.products, formData.payment_methods]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const addProduct = () => {
    if (currentProduct.name && currentProduct.quantity > 0 && currentProduct.unit_price > 0) {
      const totalPrice = currentProduct.quantity * currentProduct.unit_price;
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, { ...currentProduct, total_price: totalPrice }]
      }));
      setCurrentProduct({ name: '', quantity: 1, unit_price: 0, total_price: 0 });
    }
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_: any, i: number) => i !== index)
    }));
  };

  const addPayment = () => {
    if (currentPayment.amount > 0) {
      setFormData(prev => ({
        ...prev,
        payment_methods: [...prev.payment_methods, currentPayment]
      }));
      setCurrentPayment({ method: 'dinheiro', amount: 0, description: '' });
    }
  };

  const removePayment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update status based on payment
    let status = 'pendente';
    if (formData.received_amount >= formData.total_value) {
      status = 'pago';
    } else if (formData.received_amount > 0) {
      status = 'parcial';
    }

    onSubmit({
      ...formData,
      status,
      delivery_date: formData.delivery_date || null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Editar Venda' : 'Nova Venda'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Products Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Package className="w-5 h-5 inline mr-2" />
              Produtos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                placeholder="Nome do produto"
                value={currentProduct.name}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Quantidade"
                min="1"
                value={currentProduct.quantity}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Preço unitário"
                min="0"
                step="0.01"
                value={currentProduct.unit_price}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>

            {formData.products.length > 0 && (
              <div className="space-y-2">
                {formData.products.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex-1">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-gray-600 ml-2">
                        {product.quantity}x R$ {product.unit_price.toFixed(2)} = R$ {product.total_price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <CreditCard className="w-5 h-5 inline mr-2" />
              Formas de Pagamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <select
                value={currentPayment.method}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, method: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="boleto">Boleto</option>
              </select>
              <input
                type="number"
                placeholder="Valor"
                min="0"
                step="0.01"
                value={currentPayment.amount}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={currentPayment.description}
                onChange={(e) => setCurrentPayment(prev => ({ ...prev, description: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Adicionar
              </button>
            </div>

            {formData.payment_methods.length > 0 && (
              <div className="space-y-2">
                {formData.payment_methods.map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex-1">
                      <span className="font-medium capitalize">{payment.method.replace('_', ' ')}</span>
                      <span className="text-gray-600 ml-2">R$ {payment.amount.toFixed(2)}</span>
                      {payment.description && (
                        <span className="text-gray-500 ml-2">- {payment.description}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePayment(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission Rate */}
          {formData.seller_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Taxa de Comissão (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.custom_commission_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_commission_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Resumo</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Valor Total:</span>
                <span className="font-medium">R$ {formData.total_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Recebido:</span>
                <span className="font-medium text-green-600">R$ {formData.received_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor Pendente:</span>
                <span className={`font-medium ${formData.pending_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {formData.pending_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Observações da Venda
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observações sobre a venda..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Observações do Pagamento
              </label>
              <textarea
                value={formData.payment_observations}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_observations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observações sobre o pagamento..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formData.products.length === 0 || !formData.client}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {initialData ? 'Atualizar' : 'Criar'} Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}