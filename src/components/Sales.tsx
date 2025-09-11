import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, ShoppingCart, DollarSign, Calendar, AlertCircle, X, Bug, TestTube } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Sale } from '../types';
import SaleForm from './forms/SaleForm';
import { DebugPanel } from './DebugPanel';
import { TestSaleCreation } from './TestSaleCreation';

export function Sales() {
  const { sales, employees, isLoading, error, createSale, updateSale, deleteSale } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const handleAddSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    try {
      console.log('🔄 Adicionando nova venda:', sale);
      
      // Enhanced UUID validation and cleaning before submission
      const cleanedSale = cleanUUIDFields(sale);
      console.log('🧹 Cleaned sale data:', cleanedSale);
      
      // Validate required fields
      if (!cleanedSale.client || !cleanedSale.client.trim()) {
        alert('Por favor, informe o nome do cliente.');
        return;
      }
      
      if (cleanedSale.totalValue <= 0) {
        alert('O valor total da venda deve ser maior que zero.');
        return;
      }
      
      if (!cleanedSale.paymentMethods || cleanedSale.paymentMethods.length === 0) {
        alert('Por favor, adicione pelo menos um método de pagamento.');
        return;
      }
      
      // Validate payment methods structure
      for (const method of cleanedSale.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          alert('Todos os métodos de pagamento devem ter um tipo válido.');
          return;
        }
        if (typeof method.amount !== 'number' || method.amount <= 0) {
          alert('Todos os métodos de pagamento devem ter um valor maior que zero.');
          return;
        }
      }
      
      const saleId = await createSale(cleanedSale);
      console.log('✅ Venda adicionada com sucesso, ID:', saleId);
      setIsFormOpen(false);
      
    } catch (error) {
      console.error('❌ Erro ao adicionar venda:', error);
      let errorMessage = 'Erro ao criar venda';
      
      if (error instanceof Error) {
        if (error.message.includes('invalid input syntax for type uuid')) {
          errorMessage = 'Erro de UUID: Campos de identificação inválidos. Verifique se todos os campos estão preenchidos corretamente.';
        } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('já existe')) {
          errorMessage = 'Esta venda já existe no sistema. O sistema previne duplicatas automaticamente.';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou duplicados. Verifique as informações inseridas.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Campos obrigatórios não preenchidos. Verifique todos os campos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert('Erro ao criar venda: ' + errorMessage);
    }
  };

  const handleEditSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    if (editingSale) {
      try {
        const cleanedSale = cleanUUIDFields(sale);
        const updatedSale: Sale = {
          ...cleanedSale,
          id: editingSale.id,
          createdAt: editingSale.createdAt
        };
        await updateSale(updatedSale.id, updatedSale);
        setEditingSale(null);
      } catch (error) {
        console.error('❌ Erro ao atualizar venda:', error);
        alert('Erro ao atualizar venda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      try {
        await deleteSale(id);
      } catch (error) {
        console.error('❌ Erro ao excluir venda:', error);
        alert('Erro ao excluir venda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
    }
  };

  // Enhanced UUID cleaning function
  const cleanUUIDFields = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    const cleaned = { ...data };
    
    // List of all possible UUID fields in sales
    const uuidFields = [
      'id', 'sellerId', 'customerId', 'productId', 'paymentMethodId',
      'seller_id', 'customer_id', 'product_id', 'payment_method_id',
      'saleId', 'sale_id', 'relatedId', 'related_id'
    ];
    
    uuidFields.forEach(field => {
      if (cleaned.hasOwnProperty(field)) {
        const value = cleaned[field];
        if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
          cleaned[field] = null;
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
            cleaned[field] = null;
          } else if (!isValidUUID(trimmed)) {
            console.warn(`⚠️ Invalid UUID for ${field}:`, trimmed, '- converting to null');
            cleaned[field] = null;
          } else {
            cleaned[field] = trimmed;
          }
        }
      }
    });
    
    // Clean UUID fields in payment methods
    if (cleaned.paymentMethods && Array.isArray(cleaned.paymentMethods)) {
      cleaned.paymentMethods = cleaned.paymentMethods.map((method: any) => {
        const cleanedMethod = { ...method };
        uuidFields.forEach(field => {
          if (cleanedMethod.hasOwnProperty(field)) {
            const value = cleanedMethod[field];
            if (value === '' || value === 'null' || value === 'undefined' || value === undefined) {
              cleanedMethod[field] = null;
            } else if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
                cleanedMethod[field] = null;
              } else if (!isValidUUID(trimmed)) {
                console.warn(`⚠️ Invalid UUID in payment method for ${field}:`, trimmed, '- converting to null');
                cleanedMethod[field] = null;
              } else {
                cleanedMethod[field] = trimmed;
              }
            }
          }
        });
        return cleanedMethod;
      });
    }
    
    return cleaned;
  };

  // UUID validation function
  const isValidUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendas</h1>
            <p className="text-slate-600 text-lg">Gestão completa de vendas e recebimentos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDebugPanel(true)}
            className="btn-warning flex items-center gap-2"
            title="Debug Logs"
          >
            <Bug className="w-5 h-5" />
            Debug Logs
          </button>
          <button
            onClick={() => setShowTestPanel(true)}
            className="btn-info flex items-center gap-2"
            title="Executar Testes"
          >
            <TestTube className="w-5 h-5" />
            Testes
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="card modern-shadow-xl">
        {sales.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Vendedor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Valor Total</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Recebido</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Pendente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const seller = sale.sellerId ? employees.find(emp => emp.id === sale.sellerId) : null;
                  
                  return (
                    <tr key={sale.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{sale.client}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {seller ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            {seller.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sem vendedor</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-blue-600">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-green-600">
                        R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-orange-600">
                        R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          sale.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                          sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {sale.status === 'pago' ? 'Pago' :
                           sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingSale(sale)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSale(sale)}
                            className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <ShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhuma venda registrada</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando sua primeira venda para controlar as receitas.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeira venda
            </button>
          </div>
        )}
      </div>

      {/* Sale Form Modal */}
      {(isFormOpen || editingSale) && (
        <SaleForm
          sale={editingSale}
          onSubmit={editingSale ? handleEditSale : handleAddSale}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingSale(null);
          }}
        />
      )}

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes da Venda</h2>
                </div>
                <button
                  onClick={() => setViewingSale(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-slate-900 font-semibold">
                    {new Date(viewingSale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-bold">{viewingSale.client}</p>
                </div>
                <div>
                  <label className="form-label">Vendedor</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {viewingSale.sellerId ? 
                      employees.find(emp => emp.id === viewingSale.sellerId)?.name || 'Vendedor não encontrado' : 
                      'Sem vendedor'
                    }
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    viewingSale.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                    viewingSale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {viewingSale.status === 'pago' ? 'Pago' :
                     viewingSale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </span>
                </div>
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-xl font-black text-blue-600">
                    R$ {viewingSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Recebido</label>
                  <p className="text-sm font-bold text-green-600">
                    R$ {viewingSale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Valor Pendente</label>
                  <p className="text-sm font-bold text-orange-600">
                    R$ {viewingSale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {viewingSale.deliveryDate && (
                  <div>
                    <label className="form-label">Data de Entrega</label>
                    <p className="text-sm text-slate-900 font-medium">
                      {new Date(viewingSale.deliveryDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-blue-800 mb-4">Métodos de Pagamento</h3>
                <div className="space-y-3">
                  {(viewingSale.paymentMethods || []).map((method, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-800 capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-blue-600">R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {method.installments && method.installments > 1 && (
                        <div className="text-sm text-blue-600 mt-2 font-semibold">
                          {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {method.installmentInterval && ` a cada ${method.installmentInterval} dias`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewingSale.products && (
                <div className="mb-8">
                  <label className="form-label">Produtos</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {typeof viewingSale.products === 'string' ? viewingSale.products : JSON.stringify(viewingSale.products)}
                  </p>
                </div>
              )}

              {viewingSale.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingSale.observations}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingSale(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />

      {/* Test Panel */}
      <TestSaleCreation 
        isOpen={showTestPanel} 
        onClose={() => setShowTestPanel(false)} 
      />
    </div>
  );
}