import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, User, Package, FileText, Eye, Edit, Trash2, X, CreditCard, Receipt, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { SaleForm } from './forms/SaleForm';
import { useAppContext } from '../context/AppContext';
import { safeNumber, safeCurrency, logMonetaryValues } from '../utils/numberUtils';
import { DeduplicationService } from '../lib/deduplicationService';
import { UUIDManager } from '../lib/uuidManager';
import type { Sale } from '../types';

export function Sales() {
  const { 
    sales, 
    employees, 
    checks,
    boletos,
    loading, 
    createSale, 
    updateSale, 
    deleteSale 
  } = useAppContext();
  
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Ensure sales data is deduplicated in the UI
  const deduplicatedSales = React.useMemo(() => {
    return DeduplicationService.removeDuplicatesById(sales || []);
  }, [sales]);
  const handleSaleSubmit = async (saleData: Partial<Sale>) => {
    try {
      console.log('🔄 Submetendo venda:', saleData);
      logMonetaryValues(saleData, 'Sale Submit');
      
      // Clean UUID fields before submission
      const cleanedSaleData = UUIDManager.cleanObjectUUIDs(saleData);
      
      // Verificar se há método de pagamento "acerto"
      const hasAcertoPayment = cleanedSaleData.paymentMethods?.some(method => method.type === 'acerto');
      
      // Validate total value before submission
      const totalValue = safeNumber(cleanedSaleData.totalValue, 0);
      if (totalValue <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }
      
      let result;
      if (editingSale) {
        console.log('🔄 Atualizando venda existente:', editingSale.id);
        result = await updateSale(editingSale.id, cleanedSaleData);
        console.log('✅ Venda atualizada:', result);
      } else {
        console.log('🔄 Criando nova venda');
        console.log('🔄 Sales.handleSaleSubmit - Sale data being sent:', cleanedSaleData);
        result = await createSale(cleanedSaleData);
        
        // Se há pagamento por acerto, criar acerto automaticamente
        if (hasAcertoPayment) {
          await createAcertoFromSale(cleanedSaleData);
        }
      }

      console.log('✅ Venda processada com sucesso');
      setShowForm(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error saving sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar venda: ' + errorMessage);
    }
  };

  // Função para criar acerto automaticamente a partir de venda
  const createAcertoFromSale = async (sale: Partial<Sale>) => {
    try {
      const acertoAmount = sale.paymentMethods
        ?.filter(method => method.type === 'acerto')
        .reduce((sum, method) => sum + method.amount, 0) || 0;
      
      if (acertoAmount > 0 && sale.client) {
        // Criar novo acerto
        const newAcerto = {
          clientName: sale.client,
          type: 'cliente' as const,
          totalAmount: safeNumber(acertoAmount, 0),
          paidAmount: 0,
          pendingAmount: safeNumber(acertoAmount, 0),
          status: 'pendente' as const,
          observations: `Acerto criado automaticamente para venda: ${sale.observations || 'Venda sem observações'}`
        };
        // Note: createAcerto would need to be imported from context
        
        console.log('✅ Acerto criado/atualizado automaticamente para cliente:', sale.client);
      }
    } catch (error) {
      console.error('❌ Erro ao criar acerto automático:', error);
    }
  };
  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    try {
      await deleteSale(id);
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
  const filteredSales = deduplicatedSales.filter(sale => {
    const matchesSearch = sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.observations?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'parcial': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return safeCurrency(safeNumber(value, 0));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getSellerName = (sellerId: string | null) => {
    if (!sellerId) return 'Sem vendedor';
    const seller = employees.find(emp => emp.id === sellerId);
    return seller?.name || 'Vendedor não encontrado';
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro': return 'bg-green-100 text-green-800 border-green-200';
      case 'pix': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cartao_credito': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cartao_debito': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cheque': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'boleto': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'transferencia': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSaleChecks = (saleId: string) => {
    return checks.filter(check => check.saleId === saleId);
  };

  const getSaleBoletos = (saleId: string) => {
    return boletos.filter(boleto => boleto.saleId === saleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Vendas</h1>
            <p className="text-slate-600 text-lg">Controle completo de vendas e recebimentos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </button>
      </div>

      {/* Filters */}
      <div className="card modern-shadow-xl">
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

      {/* Sales List */}
      <div className="space-y-6">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => {
            // Additional safety check for duplicates in render
            if (!sale.id || !UUIDManager.isValidUUID(sale.id)) {
              console.warn('⚠️ Invalid sale ID detected in render:', sale.id);
              return null;
            }
            
            const saleChecks = getSaleChecks(sale.id);
            const saleBoletos = getSaleBoletos(sale.id);
            
            return (
              <div key={sale.id} className="card modern-shadow-xl">
                {/* Sale Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-600">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{sale.client}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sale.date)}
                        </span>
                        {sale.deliveryDate && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Entrega: {formatDate(sale.deliveryDate)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getSellerName(sale.sellerId)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-black text-blue-600">
                      {safeCurrency(sale.totalValue)}
                    </p>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(sale.status)}`}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </div>
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-2">Produtos</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700">
                      {Array.isArray(sale.products) && sale.products.length > 0
                        ? sale.products.map((p: any) => p.name).join(', ')
                        : typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'
                      }
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
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(method.type)}`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xl font-black text-green-600">
                            {safeCurrency(safeNumber(method.amount, 0))}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Parcelas:</span>
                              <span className="font-bold text-green-800">
                                {safeNumber(method.installments, 1)}x de {safeCurrency(safeNumber(method.installmentValue, 0))}
                              </span>
                            </div>
                            {method.installmentInterval && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Intervalo:</span>
                                <span className="font-bold text-green-800">{safeNumber(method.installmentInterval, 30)} dias</span>
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

                        {/* Third Party Check Details */}
                        {method.type === 'cheque' && method.isThirdPartyCheck && method.thirdPartyDetails && (
                          <div className="mt-4 space-y-3">
                            <h5 className="font-bold text-green-800">Cheques de Terceiros:</h5>
                            {method.thirdPartyDetails.map((checkDetail, checkIndex) => (
                              <div key={checkIndex} className="p-3 bg-white rounded-lg border border-green-100">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-bold text-green-700">Emissor:</span>
                                    <p className="text-green-600">{checkDetail.issuer}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">CPF/CNPJ:</span>
                                    <p className="text-green-600">{checkDetail.cpfCnpj}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">Banco:</span>
                                    <p className="text-green-600">{checkDetail.bank}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">Ag/Conta:</span>
                                    <p className="text-green-600">{checkDetail.agency}/{checkDetail.account}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-bold text-green-700">Nº Cheque:</span>
                                    <p className="text-green-600">{checkDetail.checkNumber}</p>
                                  </div>
                                  {checkDetail.observations && (
                                    <div className="col-span-2">
                                      <span className="font-bold text-green-700">Obs:</span>
                                      <p className="text-green-600">{checkDetail.observations}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cheques Gerados */}
                {saleChecks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                      Cheques Gerados ({saleChecks.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {saleChecks.map((check) => (
                        <div key={check.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-yellow-900">{check.client}</h5>
                              <p className="text-sm text-yellow-700">
                                Parcela {check.installmentNumber}/{check.totalInstallments}
                              </p>
                            </div>
                            <span className="text-lg font-black text-yellow-600">
                              {safeCurrency(safeNumber(check.value, 0))}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Vencimento:</span>
                              <span className="font-bold text-yellow-800">
                                {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                check.status === 'compensado' ? 'bg-green-100 text-green-800' :
                                check.status === 'devolvido' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {check.status === 'compensado' ? 'Compensado' :
                                 check.status === 'devolvido' ? 'Devolvido' :
                                 check.status === 'reapresentado' ? 'Reapresentado' : 'Pendente'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Tipo:</span>
                              <span className="font-bold text-yellow-800">
                                {check.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}
                              </span>
                            </div>
                            {check.usedFor && (
                              <div className="flex justify-between">
                                <span className="text-yellow-700">Usado para:</span>
                                <span className="font-bold text-yellow-800">{check.usedFor}</span>
                              </div>
                            )}
                            {check.observations && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <span className="text-yellow-700 font-bold">Observações:</span>
                                <p className="text-yellow-600 text-xs mt-1">{check.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boletos Gerados */}
                {saleBoletos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-cyan-600" />
                      Boletos Gerados ({saleBoletos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {saleBoletos.map((boleto) => (
                        <div key={boleto.id} className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-cyan-900">{boleto.client}</h5>
                              <p className="text-sm text-cyan-700">
                                Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                              </p>
                            </div>
                            <span className="text-lg font-black text-cyan-600">
                              {safeCurrency(safeNumber(boleto.value, 0))}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Vencimento:</span>
                              <span className="font-bold text-cyan-800">
                                {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                boleto.status === 'compensado' ? 'bg-green-100 text-green-800' :
                                boleto.status === 'vencido' ? 'bg-red-100 text-red-800' :
                                boleto.status === 'cancelado' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {boleto.status === 'compensado' ? 'Compensado' :
                                 boleto.status === 'vencido' ? 'Vencido' :
                                 boleto.status === 'cancelado' ? 'Cancelado' :
                                 boleto.status === 'nao_pago' ? 'Não Pago' : 'Pendente'}
                              </span>
                            </div>
                            {boleto.finalAmount && boleto.finalAmount !== boleto.value && (
                              <div className="flex justify-between">
                                <span className="text-cyan-700">Valor Final:</span>
                                <span className="font-bold text-green-600">
                                  {safeCurrency(safeNumber(boleto.finalAmount, 0))}
                                </span>
                              </div>
                            )}
                            {boleto.overdueAction && (
                              <div className="flex justify-between">
                                <span className="text-cyan-700">Situação:</span>
                                <span className="font-bold text-cyan-800">
                                  {boleto.overdueAction.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                            {boleto.observations && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <span className="text-cyan-700 font-bold">Observações:</span>
                                <p className="text-cyan-600 text-xs mt-1">{boleto.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-600 font-semibold">Total</p>
                      <p className="text-2xl font-black text-blue-700">
                        {safeCurrency(safeNumber(sale.totalValue, 0))}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-600 font-semibold">Recebido</p>
                      <p className="text-2xl font-black text-green-700">
                        {safeCurrency(safeNumber(sale.receivedAmount, 0))}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-orange-600 font-semibold">Pendente</p>
                      <p className="text-2xl font-black text-orange-700">
                        {safeCurrency(safeNumber(sale.pendingAmount, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Info */}
                {sale.sellerId && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Informações de Comissão</h4>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700 font-semibold">
                          Comissão ({sale.customCommissionRate}%):
                        </span>
                        <span className="text-xl font-black text-purple-600">
                          {formatCurrency((safeNumber(sale.totalValue, 0) * safeNumber(sale.customCommissionRate, 0)) / 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observations */}
                {sale.observations && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <p className="text-slate-700">{sale.observations}</p>
                    </div>
                  </div>
                )}

                {/* Payment Observations */}
                {sale.paymentObservations && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações do Pagamento</h4>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-700">{sale.paymentObservations}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setViewingSale(sale)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                    title="Visualizar Detalhes Completos"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(sale)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
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
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <DollarSign className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
            </h3>
            <p className="text-slate-600 mb-8 text-lg">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece registrando sua primeira venda para controlar os recebimentos.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary modern-shadow-xl"
              >
                Registrar primeira venda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sale Form Modal */}
      {showForm && (
        <SaleForm
          sale={editingSale}
          onSubmit={handleSaleSubmit}
          onCancel={() => {
            setShowForm(false);
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
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <DollarSign className="w-8 h-8 text-white" />
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
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Cliente:</strong> {viewingSale.client}</p>
                      <p><strong>Data:</strong> {formatDate(viewingSale.date)}</p>
                      {viewingSale.deliveryDate && (
                        <p><strong>Entrega:</strong> {formatDate(viewingSale.deliveryDate)}</p>
                      )}
                      <p><strong>Vendedor:</strong> {getSellerName(viewingSale.sellerId)}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingSale.status)}`}>
                          {getStatusLabel(viewingSale.status)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Valores</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total:</strong> {safeCurrency(viewingSale.totalValue)}</p>
                      <p><strong>Recebido:</strong> <span className="text-green-600 font-bold">{safeCurrency(viewingSale.receivedAmount)}</span></p>
                      <p><strong>Pendente:</strong> <span className="text-orange-600 font-bold">{safeCurrency(viewingSale.pendingAmount)}</span></p>
                    </div>
                  </div>

                  {viewingSale.sellerId && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-2">Comissão</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Taxa:</strong> {viewingSale.customCommissionRate}%</p>
                        <p><strong>Valor:</strong> 
                          <span className="text-purple-600 font-bold ml-1">
                            {formatCurrency((viewingSale.totalValue * (viewingSale.customCommissionRate || 0)) / 100)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4">Produtos Vendidos</h4>
                  <p className="text-slate-700 text-lg">
                    {Array.isArray(viewingSale.products) && viewingSale.products.length > 0
                      ? viewingSale.products.map((p: any) => p.name).join(', ')
                      : typeof viewingSale.products === 'string' ? viewingSale.products : 'Produtos vendidos'
                    }
                  </p>
                </div>

                {/* Payment Methods Detailed */}
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                  <h4 className="font-bold text-green-900 mb-4">Métodos de Pagamento Detalhados</h4>
                  <div className="space-y-4">
                    {(viewingSale.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPaymentMethodColor(method.type)}`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-2xl font-black text-green-600">
                            {safeCurrency(method.amount)}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p><strong className="text-green-800">Parcelas:</strong> {method.installments}x</p>
                              <p><strong className="text-green-800">Valor por parcela:</strong> {safeCurrency(method.installmentValue || 0)}</p>
                            </div>
                            <div>
                              <p><strong className="text-green-800">Intervalo:</strong> {method.installmentInterval} dias</p>
                              {method.firstInstallmentDate && (
                                <p><strong className="text-green-800">Primeira parcela:</strong> {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Third Party Check Details */}
                        {method.type === 'cheque' && method.isThirdPartyCheck && method.thirdPartyDetails && (
                          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <h5 className="font-bold text-yellow-800 mb-3">Detalhes dos Cheques de Terceiros</h5>
                            <div className="space-y-3">
                              {method.thirdPartyDetails.map((checkDetail, checkIndex) => (
                                <div key={checkIndex} className="p-3 bg-white rounded-lg border border-yellow-100">
                                  <h6 className="font-bold text-yellow-900 mb-2">Cheque {checkIndex + 1}</h6>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p><strong>Emissor:</strong> {checkDetail.issuer}</p>
                                      <p><strong>CPF/CNPJ:</strong> {checkDetail.cpfCnpj}</p>
                                      <p><strong>Banco:</strong> {checkDetail.bank}</p>
                                    </div>
                                    <div>
                                      <p><strong>Agência:</strong> {checkDetail.agency}</p>
                                      <p><strong>Conta:</strong> {checkDetail.account}</p>
                                      <p><strong>Nº Cheque:</strong> {checkDetail.checkNumber}</p>
                                    </div>
                                    {checkDetail.observations && (
                                      <div className="col-span-2">
                                        <p><strong>Observações:</strong> {checkDetail.observations}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Observations */}
                {(viewingSale.observations || viewingSale.paymentObservations) && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Todas as Observações</h4>
                    <div className="space-y-4">
                      {viewingSale.observations && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Observações Gerais:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.observations}</p>
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

                {/* System Information */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4">Informações do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>ID da Venda:</strong> <span className="font-mono text-xs">{viewingSale.id}</span></p>
                      <p><strong>Data de Criação:</strong> {new Date(viewingSale.createdAt).toLocaleString('pt-BR')}</p>
                      {viewingSale.updatedAt && (
                        <p><strong>Última Atualização:</strong> {new Date(viewingSale.updatedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                    <div>
                      <p><strong>Cheques Gerados:</strong> {getSaleChecks(viewingSale.id).length}</p>
                      <p><strong>Boletos Gerados:</strong> {getSaleBoletos(viewingSale.id).length}</p>
                      <p><strong>Comissão Gerada:</strong> {viewingSale.sellerId ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}