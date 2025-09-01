import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, User, Package, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SaleForm } from './forms/SaleForm';
import type { Sale, Employee } from '../types';

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadSales();
    loadEmployees();
  }, []);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          date,
          delivery_date,
          client,
          seller_id,
          products,
          observations,
          total_value,
          payment_methods,
          received_amount,
          pending_amount,
          status,
          payment_description,
          payment_observations,
          custom_commission_rate,
          created_at,
          updated_at,
          seller:employees(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_seller', true)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleSaleSubmit = async (saleData: Partial<Sale>) => {
    try {
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

      await loadSales();
      setShowForm(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'parcial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Produtos
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Total
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(sale.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.client}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {Array.isArray(sale.products) && sale.products.length > 0
                        ? sale.products.map((p: any) => p.name).join(', ')
                        : 'Sem produtos'
                      }
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(sale.total_value)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(sale as any).seller?.name || 'Sem vendedor'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma venda encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando uma nova venda.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SaleForm
          sale={editingSale}
          employees={employees}
          onSubmit={handleSaleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSale(null);
          }}
        />
      )}
    </div>
  );
}