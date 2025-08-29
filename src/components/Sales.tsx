import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, X, FileText, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Sale, PaymentMethod, EmployeeCommission } from '../types';
import { SaleForm } from './forms/SaleForm';

export function Sales() {
  const { loading, error, sales, employees, employeeCommissions, addSale, updateSale, deleteSale } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [viewingObservations, setViewingObservations] = useState<Sale | null>(null);

  const handleAddSale = (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando nova venda:', sale);
    
    // Validate sale data before submitting
    if (!sale.client || !sale.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (sale.totalValue <= 0) {
      alert('O valor total da venda deve ser maior que zero.');
      return;
    }
    
    if (!sale.paymentMethods || sale.paymentMethods.length === 0) {
      alert('Por favor, adicione pelo menos um método de pagamento.');
      return;
    }
    
    const totalPaymentAmount = sale.paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    if (totalPaymentAmount === 0) {
      alert('O valor total dos métodos de pagamento deve ser maior que zero.');
      return;
    }
    
    if (totalPaymentAmount > sale.totalValue) {
      alert('O total dos métodos de pagamento não pode ser maior que o valor total da venda.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    for (const method of sale.paymentMethods) {
      if (!method.type || typeof method.type !== 'string') {
        alert('Todos os métodos de pagamento devem ter um tipo válido.');
        return;
      }
      if (typeof method.amount !== 'number' || method.amount < 0) {
        alert('Todos os métodos de pagamento devem ter um valor válido.');
        return;
      }
    }
    
    addSale(sale).then(() => {
      console.log('✅ Venda adicionada com sucesso');
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar venda:', error);
      let errorMessage = 'Erro desconhecido ao criar venda';
      
      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('já existe')) {
          errorMessage = 'Uma venda com os mesmos dados já existe. Verifique se não há duplicação.';
        } else if (error.message.includes('payment_method') || error.message.includes('field')) {
          errorMessage = 'Erro na estrutura dos métodos de pagamento. Verifique os dados inseridos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert('Erro ao criar venda: ' + errorMessage);
    });
  };

  const handleEditSale = (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    if (editingSale) {
      const updatedSale: Sale = {
        ...sale,
        id: editingSale.id,
        createdAt: editingSale.createdAt
      };
      updateSale(editingSale.id, sale).then(() => {
        setEditingSale(null);
      }).catch(error => {
        alert('Erro ao atualizar venda: ' + error.message);
      });
    }
  };

  const handleDeleteSale = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      deleteSale(id).catch(error => {
        alert('Erro ao excluir venda: ' + error.message);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSign className="w-8 h-8 text-white" />
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl floating-animation">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Vendas</h1>
            <p className="text-slate-600 text-lg">Controle completo das suas vendas</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary group flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </button>
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
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Entrega</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Vendedor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Produtos</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Valor Total</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Recebido</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Pendente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {sale.deliveryDate ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                          {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{sale.client}</td>
                    <td className="py-4 px-6 text-sm">
                      {sale.sellerId ? (
                        (() => {
                          const seller = employees.find(e => e.id === sale.sellerId);
                          return seller ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                              {seller.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Vendedor não encontrado</span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      <div className="max-w-32 truncate">
                        {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-green-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-emerald-600">
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
                          onClick={() => setViewingObservations(sale)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300 modern-shadow"
                          title="Ver Todas as Informações"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="p-2 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-300 modern-shadow"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="p-2 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all duration-300 modern-shadow"
                          title="Editar Venda"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-2 rounded-lg text-green-700 hover:text-green-900 hover:bg-green-100 transition-all duration-300 modern-shadow"
                          title="Excluir Venda"
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
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhuma venda registrada</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando sua primeira venda para acompanhar o desempenho.</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <DollarSign className="w-8 h-8 text-white" />
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
                  <p className="text-base text-green-700 font-semibold">
                    {new Date(viewingSale.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {viewingSale.deliveryDate && (
                  <div>
                    <label className="form-label">Data de Entrega</label>
                    <p className="text-base text-blue-700 font-semibold">
                      {new Date(viewingSale.deliveryDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-base text-green-700 font-bold">{viewingSale.client}</p>
                </div>
                <div>
                  <label className="form-label">Vendedor</label>
                  <p className="text-base text-green-700 font-semibold">
                    {viewingSale.sellerId ? (
                      (() => {
                        const seller = employees.find(e => e.id === viewingSale.sellerId);
                        return seller ? seller.name : 'Funcionário não encontrado';
                      })()
                    ) : (
                      <span className="text-slate-500">Não informado</span>
                    )}
                  </p>
                  {viewingSale.sellerId && (() => {
                    const seller = employees.find(e => e.id === viewingSale.sellerId);
                    const commission = employeeCommissions.find(c => c.saleId === viewingSale.id);
                    return seller && seller.isSeller && commission ? (
                      <p className="text-sm text-green-600 font-bold mt-1">
                        Comissão: R$ {commission.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({commission.commissionRate}%)
                      </p>
                    ) : null;
                  })()}
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Produtos</label>
                  <div className="text-base text-green-700">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <p className="font-semibold text-green-800">
                        {typeof viewingSale.products === 'string' ? viewingSale.products : 'Produtos vendidos'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Valor Total</label>
                  <p className="text-2xl font-black text-green-600">
                    R$ {viewingSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                    viewingSale.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' :
                    viewingSale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {viewingSale.status === 'pago' ? 'Pago' :
                     viewingSale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </span>
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
              
              <div className="flex justify-end gap-4">
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

      {/* Observations Modal */}
      {viewingObservations && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Todas as Informações da Venda</h2>
                </div>
                <button
                  onClick={() => setViewingObservations(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong className="text-green-800">ID da Venda:</strong> <span className="text-green-700 font-mono">{viewingObservations.id}</span></p>
                    <p><strong className="text-green-800">Data:</strong> <span className="text-green-700">{new Date(viewingObservations.date).toLocaleDateString('pt-BR')}</span></p>
                    <p><strong className="text-green-800">Cliente:</strong> <span className="text-green-700 font-bold">{viewingObservations.client}</span></p>
                    <p><strong className="text-green-800">Valor Total:</strong> <span className="text-green-700 font-bold">R$ {viewingObservations.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Valor Recebido:</strong> <span className="text-emerald-600 font-bold">R$ {viewingObservations.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Valor Pendente:</strong> <span className="text-orange-600 font-bold">R$ {viewingObservations.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    <p><strong className="text-green-800">Status:</strong> <span className="text-green-700 font-bold capitalize">{viewingObservations.status}</span></p>
                    <p><strong className="text-green-800">Data de Criação:</strong> <span className="text-green-700">{new Date(viewingObservations.createdAt).toLocaleString('pt-BR')}</span></p>
                    {viewingObservations.deliveryDate && (
                      <p><strong className="text-green-800">Data de Entrega:</strong> <span className="text-green-700">{new Date(viewingObservations.deliveryDate).toLocaleDateString('pt-BR')}</span></p>
                    )}
                  </div>
                </div>

                {/* Seller Information */}
                {viewingObservations.sellerId && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                    <h3 className="text-xl font-bold text-green-900 mb-4">Informações do Vendedor</h3>
                    {(() => {
                      const seller = employees.find(e => e.id === viewingObservations.sellerId);
                      const commission = employeeCommissions.find(c => c.saleId === viewingObservations.id);
                      return seller ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <p><strong className="text-green-800">Nome:</strong> <span className="text-green-700 font-bold">{seller.name}</span></p>
                          <p><strong className="text-green-800">Cargo:</strong> <span className="text-green-700">{seller.position}</span></p>
                          {commission && (
                            <>
                              <p><strong className="text-green-800">Taxa de Comissão:</strong> <span className="text-green-700 font-bold">{commission.commissionRate}%</span></p>
                              <p><strong className="text-green-800">Valor da Comissão:</strong> <span className="text-green-700 font-bold">R$ {commission.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                              <p><strong className="text-green-800">Status da Comissão:</strong> <span className="text-green-700 font-bold capitalize">{commission.status}</span></p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-green-700">Vendedor não encontrado</p>
                      );
                    })()}
                  </div>
                )}

                {/* Products */}
                <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-300">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Produtos</h3>
                  <p className="text-green-800 font-semibold">
                    {typeof viewingObservations.products === 'string' ? viewingObservations.products : 'Produtos vendidos'}
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Métodos de Pagamento</h3>
                  <div className="space-y-4">
                    {viewingObservations.paymentMethods.map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-green-800 capitalize text-lg">
                            {method.type.replace('_', ' ')}
                          </span>
                          <span className="font-black text-green-600 text-xl">
                            R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {method.installments && method.installments > 1 && (
                          <div className="text-sm text-green-600 font-semibold space-y-1">
                            <p>Parcelas: {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            {method.installmentInterval && <p>Intervalo: {method.installmentInterval} dias</p>}
                            {method.firstInstallmentDate && <p>Primeira parcela: {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Observations */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Todas as Observações e Informações</h3>
                  <div className="space-y-4">
                    {viewingObservations.observations && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Observações Gerais:</h4>
                        <p className="text-slate-700 font-medium p-4 bg-white rounded-xl border">{viewingObservations.observations}</p>
                      </div>
                    )}
                    {viewingObservations.paymentDescription && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Descrição do Pagamento:</h4>
                        <p className="text-slate-700 font-medium p-4 bg-white rounded-xl border">{viewingObservations.paymentDescription}</p>
                      </div>
                    )}
                    {viewingObservations.paymentObservations && (
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Observações do Pagamento:</h4>
                        <p className="text-slate-700 font-medium p-4 bg-white rounded-xl border">{viewingObservations.paymentObservations}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Informações do Sistema:</h4>
                      <div className="text-sm text-slate-600 space-y-2 p-4 bg-white rounded-xl border">
                        <p><strong>ID da Venda:</strong> <span className="font-mono">{viewingObservations.id}</span></p>
                        <p><strong>Data de Criação:</strong> {new Date(viewingObservations.createdAt).toLocaleString('pt-BR')}</p>
                        <p><strong>Valor Recebido:</strong> R$ {viewingObservations.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Valor Pendente:</strong> R$ {viewingObservations.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setViewingObservations(null)}
                  className="btn-success"
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