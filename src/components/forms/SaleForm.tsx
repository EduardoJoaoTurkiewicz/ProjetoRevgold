import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, User, DollarSign, FileText, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, parseCurrency } from '../../utils/format';

interface Product {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
}

interface Employee {
  id: string;
  name: string;
  is_seller: boolean;
}

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
  editingSale?: any;
}

export default function SaleForm({ isOpen, onClose, onSaleCreated, editingSale }: SaleFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    client: '',
    seller_id: '',
    observations: '',
    payment_description: '',
    payment_observations: '',
    custom_commission_rate: 5.00,
    status: 'pendente' as 'pendente' | 'pago' | 'parcial'
  });

  const [products, setProducts] = useState<Product[]>([
    { name: '', quantity: 1, price: 0, total: 0 }
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { method: 'dinheiro', amount: 0 }
  ]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      if (editingSale) {
        populateForm(editingSale);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingSale]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, is_seller')
        .eq('is_active', true)
        .eq('is_seller', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const populateForm = (sale: any) => {
    setFormData({
      date: sale.date,
      delivery_date: sale.delivery_date || '',
      client: sale.client,
      seller_id: sale.seller_id || '',
      observations: sale.observations || '',
      payment_description: sale.payment_description || '',
      payment_observations: sale.payment_observations || '',
      custom_commission_rate: sale.custom_commission_rate || 5.00,
      status: sale.status
    });

    setProducts(sale.products || [{ name: '', quantity: 1, price: 0, total: 0 }]);
    setPaymentMethods(sale.payment_methods || [{ method: 'dinheiro', amount: 0 }]);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      client: '',
      seller_id: '',
      observations: '',
      payment_description: '',
      payment_observations: '',
      custom_commission_rate: 5.00,
      status: 'pendente'
    });
    setProducts([{ name: '', quantity: 1, price: 0, total: 0 }]);
    setPaymentMethods([{ method: 'dinheiro', amount: 0 }]);
    setError('');
  };

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
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'dinheiro', amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: string | number) => {
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: value };
    setPaymentMethods(updatedMethods);
  };

  const calculateTotals = () => {
    const totalValue = products.reduce((sum, product) => sum + product.total, 0);
    const receivedAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    const pendingAmount = Math.max(0, totalValue - receivedAmount);
    
    return { totalValue, receivedAmount, pendingAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { totalValue, receivedAmount, pendingAmount } = calculateTotals();

      if (!formData.client.trim()) {
        throw new Error('Cliente é obrigatório');
      }

      if (products.some(p => !p.name.trim())) {
        throw new Error('Todos os produtos devem ter nome');
      }

      if (totalValue <= 0) {
        throw new Error('O valor total deve ser maior que zero');
      }

      const saleData = {
        ...formData,
        products: products.filter(p => p.name.trim()),
        payment_methods: paymentMethods.filter(m => m.amount > 0),
        total_value: totalValue,
        received_amount: receivedAmount,
        pending_amount: pendingAmount,
        status: pendingAmount > 0 ? 'parcial' : receivedAmount > 0 ? 'pago' : 'pendente'
      };

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales')
          .insert([saleData]);

        if (error) throw error;
      }

      onSaleCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar venda');
    } finally {
      setLoading(false);
    }
  };

  const { totalValue, receivedAmount, pendingAmount } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSale ? 'Editar Venda' : 'Nova Venda'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data da Venda
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Cliente
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Vendedor
              </label>
              <select
                value={formData.seller_id}
                onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um vendedor</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Produtos</h3>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Qtd"
                      min="1"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Preço"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(product.total)}
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

          {/* Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Formas de Pagamento</h3>
              <button
                type="button"
                onClick={addPaymentMethod}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Pagamento
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((payment, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <select
                      value={payment.method}
                      onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="transferencia">Transferência</option>
                      <option value="cheque">Cheque</option>
                      <option value="boleto">Boleto</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Valor"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center justify-end">
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
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total da Venda</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Recebido</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(receivedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Pendente</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Observações
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observações sobre a venda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Taxa de Comissão (%)
              </label>
              <input
                type="number"
                value={formData.custom_commission_rate}
                onChange={(e) => setFormData({ ...formData, custom_commission_rate: parseFloat(e.target.value) || 5.00 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="100"
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : editingSale ? 'Atualizar' : 'Criar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}