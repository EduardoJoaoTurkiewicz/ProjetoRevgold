import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Sale, PaymentMethod } from '../types';
import { SaleForm } from './forms/SaleForm';

export function Sales() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const handleAddSale = (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_SALE', payload: newSale });
    
    // Create installments if needed
    sale.paymentMethods.forEach(method => {
      if (method.installments && method.installments > 1) {
        for (let i = 0; i < method.installments; i++) {
          const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          
          const installment = {
            id: `${newSale.id}-${i}`,
            saleId: newSale.id,
            amount: method.installmentValue || 0,
            dueDate: dueDate.toISOString().split('T')[0],
            isPaid: i === 0, // First installment is considered paid
            type: 'venda' as const,
            description: `${sale.client} - Parcela ${i + 1}/${method.installments}`
          };
          
          dispatch({ type: 'ADD_INSTALLMENT', payload: installment });
          
          // Create checks for each installment if payment method is check
          if (method.type === 'cheque') {
            const check = {
              id: `${newSale.id}-check-${i}`,
              saleId: newSale.id,
              client: sale.client,
              value: method.installmentValue || 0,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pendente' as const,
              isOwnCheck: false,
              installmentNumber: i + 1,
              totalInstallments: method.installments,
              usedFor: `Venda - ${sale.client} - Parcela ${i + 1}/${method.installments}`,
              observations: `Cheque gerado automaticamente para parcela ${i + 1} de ${method.installments}`,
              createdAt: new Date().toISOString()
            };
            
            dispatch({ type: 'ADD_CHECK', payload: check });
          } else if (method.type === 'boleto') {
            // Create boletos for each installment if payment method is boleto
            const boleto = {
              id: `${newSale.id}-boleto-${i}`,
              saleId: newSale.id,
              client: sale.client,
              value: method.installmentValue || 0,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pendente' as const,
              installmentNumber: i + 1,
              totalInstallments: method.installments,
              observations: `Boleto gerado automaticamente para parcela ${i + 1} de ${method.installments}`,
              createdAt: new Date().toISOString()
            };
            
            dispatch({ type: 'ADD_BOLETO', payload: boleto });
          }
        }
      } else if (method.type === 'cheque') {
        // Single check payment
        const check = {
          id: `${newSale.id}-check-single`,
          saleId: newSale.id,
          client: sale.client,
          value: method.amount,
          dueDate: method.firstInstallmentDate || sale.date,
          status: 'pendente' as const,
          isOwnCheck: false,
          installmentNumber: 1,
          totalInstallments: 1,
          usedFor: `Venda - ${sale.client}`,
          observations: `Cheque gerado automaticamente para venda`,
          createdAt: new Date().toISOString()
        };
        
        dispatch({ type: 'ADD_CHECK', payload: check });
      } else if (method.type === 'boleto') {
        // Single boleto payment
        const boleto = {
          id: `${newSale.id}-boleto-single`,
          saleId: newSale.id,
          client: sale.client,
          value: method.amount,
          dueDate: method.firstInstallmentDate || sale.date,
          status: 'pendente' as const,
          installmentNumber: 1,
          totalInstallments: 1,
          observations: `Boleto gerado automaticamente para venda`,
          createdAt: new Date().toISOString()
        };
        
        dispatch({ type: 'ADD_BOLETO', payload: boleto });
      }
    });
    
    setIsFormOpen(false);
  };

  const handleEditSale = (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    if (editingSale) {
      const updatedSale: Sale = {
        ...sale,
        id: editingSale.id,
        createdAt: editingSale.createdAt
      };
      dispatch({ type: 'UPDATE_SALE', payload: updatedSale });
      setEditingSale(null);
    }
  };

  const handleDeleteSale = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      dispatch({ type: 'DELETE_SALE', payload: id });
    }
  };

  const canEdit = true; // Todos os usuários têm os mesmos poderes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary group flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* Sales List */}
      <div className="card">
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Produtos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Valor Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Recebido</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pendente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.map(sale => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm">{sale.client}</td>
                    <td className="py-3 px-4 text-sm">
                      {Array.isArray(sale.products) 
                        ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                        : sale.products}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600">
                      R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-orange-600">
                      R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.status === 'pago' ? 'bg-green-100 text-green-700' :
                        sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sale.status === 'pago' ? 'Pago' :
                         sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="text-green-600 hover:text-green-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhuma venda registrada ainda.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Detalhes da Venda</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingSale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-gray-900">{viewingSale.client}</p>
                </div>
                <div>
                  <label className="form-label">Vendedor</label>
                  <p className="text-sm text-gray-900">
                    {viewingSale.sellerId ? (
                      (() => {
                        const seller = state.employees.find(e => e.id === viewingSale.sellerId);
                        return seller ? seller.name : 'Funcionário não encontrado';
                      })()
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Produtos</label>
                  <div className="text-sm text-gray-900">
                    {Array.isArray(viewingSale.products) ? (
                      <div className="space-y-2">
                        {viewingSale.products.map((product, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <span className="font-medium">{product.quantity}x {product.name}</span>
                            {product.unitPrice && (
                              <span className="text-gray-600 ml-2">
                                @ R$ {product.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = 
                                R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{viewingSale.products}</p>
                    )}
                  </div>
                </div>
                {viewingSale.observations && (
                  <div className="md:col-span-2">
                    <label className="form-label">Observações</label>
                    <p className="text-sm text-gray-900">{viewingSale.observations}</p>
                  </div>
                )}
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-sm text-gray-900">
                    R$ {viewingSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    viewingSale.status === 'pago' ? 'bg-green-100 text-green-700' :
                    viewingSale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {viewingSale.status === 'pago' ? 'Pago' :
                     viewingSale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Métodos de Pagamento</h3>
                <div className="space-y-2">
                  {viewingSale.paymentMethods.map((method, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                        <span>R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {method.installments && method.installments > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {method.installmentInterval && ` a cada ${method.installmentInterval} dias`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
    </div>
  );
}