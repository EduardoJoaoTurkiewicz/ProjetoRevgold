import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, X } from 'lucide-react';
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

  const canEdit = true;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl revgold-animate-floating">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-green-800">Gestão de Vendas</h1>
            <p className="text-green-600 text-lg font-semibold">Controle completo das suas vendas</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="revgold-btn-primary group flex items-center gap-2 shadow-xl hover:shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </button>
      </div>

      {/* Sales List */}
      <div className="revgold-card-premium">
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto revgold-scrollbar">
            <table className="revgold-table">
              <thead>
                <tr className="border-b">
                  <th className="revgold-table-header">Data</th>
                  <th className="revgold-table-header">Cliente</th>
                  <th className="revgold-table-header">Produtos</th>
                  <th className="revgold-table-header">Valor Total</th>
                  <th className="revgold-table-header">Recebido</th>
                  <th className="revgold-table-header">Pendente</th>
                  <th className="revgold-table-header">Status</th>
                  <th className="revgold-table-header">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.map(sale => (
                  <tr key={sale.id} className="revgold-table-row">
                    <td className="revgold-table-cell">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="revgold-table-cell font-bold text-green-700">{sale.client}</td>
                    <td className="revgold-table-cell">
                      {Array.isArray(sale.products) 
                        ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                        : sale.products}
                    </td>
                    <td className="revgold-table-cell font-bold text-green-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="revgold-table-cell font-bold text-emerald-600">
                      R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="revgold-table-cell font-bold text-orange-600">
                      R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="revgold-table-cell">
                      <span className={`revgold-badge ${
                        sale.status === 'pago' ? 'revgold-badge-success' :
                        sale.status === 'parcial' ? 'revgold-badge-warning' :
                        'revgold-badge-error'
                      }`}>
                        {sale.status === 'pago' ? 'Pago' :
                         sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="revgold-table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300"
                          title="Visualizar"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-2 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-300"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 revgold-animate-floating">
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-4">Nenhuma venda registrada</h3>
            <p className="text-green-600 mb-8 text-lg">Comece registrando sua primeira venda para acompanhar o desempenho.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="revgold-btn-primary"
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
        <div className="revgold-modal">
          <div className="revgold-modal-content max-w-4xl">
            <div className="p-6">
              <>
              <div className="revgold-modal-header">
                <h2 className="revgold-modal-title">Detalhes da Venda</h2>
                <button
                  onClick={() => setViewingSale(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="revgold-modal-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="revgold-form-label">Data</label>
                  <p className="text-base text-green-700 font-semibold">
                    {new Date(viewingSale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="revgold-form-label">Cliente</label>
                  <p className="text-base text-green-700 font-bold">{viewingSale.client}</p>
                </div>
                <div>
                  <label className="revgold-form-label">Vendedor</label>
                  <p className="text-base text-green-700 font-semibold">
                    {viewingSale.sellerId ? (
                      (() => {
                        const seller = state.employees.find(e => e.id === viewingSale.sellerId);
                        return seller ? seller.name : 'Funcionário não encontrado';
                      })()
                    ) : (
                      <span className="text-gray-500">Não informado</span>
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="revgold-form-label">Produtos</label>
                  <div className="text-base text-green-700">
                    {Array.isArray(viewingSale.products) ? (
                      <div className="space-y-3">
                        {viewingSale.products.map((product, index) => (
                          <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <span className="font-bold text-green-800">{product.quantity}x {product.name}</span>
                            {product.unitPrice && (
                              <span className="text-green-600 ml-2 font-semibold">
                                @ R$ {product.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = 
                                R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-semibold">{viewingSale.products}</p>
                    )}
                  </div>
                </div>
                {viewingSale.observations && (
                  <div className="md:col-span-2">
                    <label className="revgold-form-label">Observações</label>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-base text-blue-700 font-medium">{viewingSale.observations}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="revgold-form-label">Valor Total</label>
                  <p className="text-xl font-black text-green-600">
                    R$ {viewingSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="revgold-form-label">Status</label>
                  <span className={`revgold-badge ${
                    viewingSale.status === 'pago' ? 'revgold-badge-success' :
                    viewingSale.status === 'parcial' ? 'revgold-badge-warning' :
                    'revgold-badge-error'
                  }`}>
                    {viewingSale.status === 'pago' ? 'Pago' :
                     viewingSale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </span>
                </div>
                </div>
              </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Métodos de Pagamento</h3>
                  <div className="space-y-3">
                  {viewingSale.paymentMethods.map((method, index) => (
                    <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-800 capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-green-600">R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {method.installments && method.installments > 1 && (
                        <div className="text-sm text-green-600 mt-2 font-semibold">
                          {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {method.installmentInterval && ` a cada ${method.installmentInterval} dias`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>
                
                <div className="revgold-modal-footer">
                  <button
                    onClick={() => setViewingSale(null)}
                    className="revgold-btn-secondary"
                  >
                    Fechar
                  </button>
                </div>
              </>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}