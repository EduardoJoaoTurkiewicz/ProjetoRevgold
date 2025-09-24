import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, ShoppingCart, DollarSign, Calendar, AlertTriangle, X, User, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Sale } from '../types';
import { SaleForm } from './forms/SaleForm';
import { DebugPanel } from './DebugPanel';
import { TestSaleCreation } from './TestSaleCreation';
import { OfflineDataViewer } from './OfflineDataViewer';
import { DeduplicationService } from '../lib/deduplicationService';
import { UUIDManager } from '../lib/uuidManager';

export default function Sales() {
  const { sales, employees, isLoading, error, createSale, updateSale, deleteSale } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showOfflineViewer, setShowOfflineViewer] = useState(false);

  // Ensure sales data is deduplicated in the UI
  const deduplicatedSales = React.useMemo(() => {
    return DeduplicationService.removeDuplicatesById(sales || []);
  }, [sales]);

  const handleAddSale = (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando nova venda:', sale);
    
    // Clean UUID fields before submission
    const cleanedSale = UUIDManager.cleanObjectUUIDs(sale);
    
    // Validate sale data before submitting
    if (!cleanedSale.client || !cleanedSale.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (cleanedSale.totalValue <= 0) {
      alert('O valor total da venda deve ser maior que zero.');
      return;
    }
    
    // Validar estrutura dos métodos de pagamento
    if (cleanedSale.paymentMethods && cleanedSale.paymentMethods.length > 0) {
      for (const method of cleanedSale.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          alert('Todos os métodos de pagamento devem ter um tipo válido.');
          return;
        }
        if (typeof method.amount !== 'number' || method.amount < 0) {
          alert('Todos os métodos de pagamento devem ter um valor válido.');
          return;
        }
      }
    }
    
    createSale(cleanedSale).then(() => {
      console.log('✅ Venda adicionada com sucesso');
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar venda:', error);
      let errorMessage = 'Erro ao criar venda';
      
      if (error?.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('já existe')) {
          errorMessage = 'Esta venda já existe no sistema. O sistema previne duplicatas automaticamente.';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou duplicados. Verifique as informações inseridas.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Formato de dados inválido. Verifique os valores inseridos.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Campos obrigatórios não preenchidos. Verifique todos os campos.';
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
      updateSale(updatedSale).then(() => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl floating-animation">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Vendas</h1>
            <p className="text-slate-600 text-lg">Controle completo de vendas e recebimentos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOfflineViewer(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Dados Offline
          </button>
          <button
            onClick={() => setShowTestPanel(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Testes
          </button>
          <button
            onClick={() => setShowDebugPanel(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Debug Logs
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
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="space-y-6">
        {deduplicatedSales.length > 0 ? (
          deduplicatedSales.map((sale) => {
            // Additional safety check for duplicates in render
            if (!sale.id || !UUIDManager.isValidUUID(sale.id)) {
              console.warn('⚠️ Invalid sale ID detected in render:', sale.id);
              return null;
            }
            
            return (
              <div key={sale.id} className="card modern-shadow-xl">
                {/* Sale Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-600">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{sale.client}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </span>
                        {sale.sellerId && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {employees.find(e => e.id === sale.sellerId)?.name || 'Vendedor'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-black text-green-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                      sale.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' : 
                      sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {sale.status === 'pago' ? 'Pago' : 
                       sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-2">Produtos</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700">
                      {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                    </p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Métodos de Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(sale.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            method.type === 'dinheiro' ? 'bg-green-100 text-green-800 border-green-200' :
                            method.type === 'pix' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            method.type === 'cartao_credito' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            method.type === 'cartao_debito' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            method.type === 'cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            method.type === 'boleto' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xl font-black text-green-600">
                            R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Parcelas:</span>
                              <span className="font-bold text-green-800">
                                {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {method.installmentInterval && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Intervalo:</span>
                                <span className="font-bold text-green-800">{method.installmentInterval} dias</span>
                              </div>
                            )}
                            {method.firstInstallmentDate && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Primeira parcela:</span>
                                <span className="font-bold text-green-800">
                                  {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-600 font-semibold">Total</p>
                      <p className="text-2xl font-black text-green-700">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-emerald-600 font-semibold">Recebido</p>
                      <p className="text-2xl font-black text-emerald-700">
                        R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-orange-600 font-semibold">Pendente</p>
                      <p className="text-2xl font-black text-orange-700">
                        R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {sale.paymentDescription && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações do Pagamento</h4>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-700">{sale.paymentDescription}</p>
                    </div>
                  </div>
                )}

                {sale.paymentObservations && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações da Venda</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <p className="text-slate-700">{sale.paymentObservations}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setViewingSale(sale)}
                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-modern"
                    title="Visualizar Detalhes Completos"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingSale(sale)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <ShoppingCart className="w-12 h-12 text-green-600" />
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
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Detalhes Completos da Venda</h2>
                    <p className="text-slate-600">{viewingSale.client}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSale(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Cliente:</strong> {viewingSale.client}</p>
                      <p><strong>Data:</strong> {new Date(viewingSale.date).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${
                          viewingSale.status === 'pago' ? 'bg-green-100 text-green-800 border-green-200' : 
                          viewingSale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {viewingSale.status === 'pago' ? 'Pago' : 
                           viewingSale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </p>
                      {viewingSale.sellerId && (
                        <p><strong>Vendedor:</strong> {employees.find(e => e.id === viewingSale.sellerId)?.name || 'Vendedor'}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Valores</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total:</strong> R$ {viewingSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p><strong>Recebido:</strong> <span className="text-green-600 font-bold">R$ {viewingSale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      <p><strong>Pendente:</strong> <span className="text-orange-600 font-bold">R$ {viewingSale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>ID:</strong> <span className="font-mono text-xs">{viewingSale.id}</span></p>
                      <p><strong>Criado:</strong> {new Date(viewingSale.createdAt).toLocaleString('pt-BR')}</p>
                      {viewingSale.updatedAt && (
                        <p><strong>Atualizado:</strong> {new Date(viewingSale.updatedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4">Produtos da Venda</h4>
                  <p className="text-slate-700 text-lg">
                    {typeof viewingSale.products === 'string' ? viewingSale.products : 'Produtos vendidos'}
                  </p>
                </div>

                {/* Payment Methods Detailed */}
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                  <h4 className="font-bold text-green-900 mb-4">Métodos de Pagamento Detalhados</h4>
                  <div className="space-y-4">
                    {(viewingSale.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                            method.type === 'dinheiro' ? 'bg-green-100 text-green-800 border-green-200' :
                            method.type === 'pix' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            method.type === 'cartao_credito' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            method.type === 'cartao_debito' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            method.type === 'cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            method.type === 'boleto' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                            'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-2xl font-black text-green-600">
                            R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p><strong className="text-green-800">Parcelas:</strong> {method.installments}x</p>
                              <p><strong className="text-green-800">Valor por parcela:</strong> R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <p><strong className="text-green-800">Intervalo:</strong> {method.installmentInterval} dias</p>
                              {method.firstInstallmentDate && (
                                <p><strong className="text-green-800">Primeira parcela:</strong> {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Observations */}
                {(viewingSale.paymentDescription || viewingSale.paymentObservations || viewingSale.observations) && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Todas as Observações</h4>
                    <div className="space-y-4">
                      {viewingSale.observations && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Observações Gerais:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.observations}</p>
                        </div>
                      )}
                      {viewingSale.paymentDescription && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Descrição do Pagamento:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.paymentDescription}</p>
                        </div>
                      )}
                      {viewingSale.paymentObservations && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Observações do Pagamento:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.paymentObservations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
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

      {/* Offline Data Viewer */}
      <OfflineDataViewer 
        isOpen={showOfflineViewer} 
        onClose={() => setShowOfflineViewer(false)} 
      />
    </div>
  );
}